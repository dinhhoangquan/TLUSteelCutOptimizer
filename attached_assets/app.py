from flask import Flask, render_template, request, redirect, url_for, send_file
import os
import pandas as pd
from pulp import LpProblem, LpMinimize, LpVariable, lpSum, LpStatus, LpContinuous, LpInteger, PULP_CBC_CMD
import matplotlib
matplotlib.use('Agg')  # Chuyển sang backend không tương tác
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import colorsys  # Import colorsys ở đầu file

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Tạo thư mục static nếu chưa tồn tại
if not os.path.exists('static'):
    os.makedirs('static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'Không có file tải lên'
    file = request.files['file']
    if file.filename == '':
        return 'Chưa chọn file'
    if file:
        filename = 'data_cut_steel.xlsx'
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        return redirect(url_for('run_program'))
    return 'Lỗi khi tải file'

def run_cutting_stock(file_path):
    # Đọc dữ liệu từ file Excel
    data = pd.read_excel(file_path)
    lengths = data["Chiều dài thanh thép (mm)"].tolist()
    demands = data["Số lượng thanh thép yêu cầu"].tolist()
    n_types = len(lengths)
    L = 11700

    # Tạo danh sách màu theo hue cho các loại thép (chỉ tạo một lần)
    colors = [colorsys.hsv_to_rgb(i / n_types, 1.0, 1.0) for i in range(n_types)]

    # Khởi tạo các mẫu ban đầu
    patterns = []
    pattern_wastes = []
    for i in range(n_types):
        count = L // lengths[i]
        pattern = [0] * n_types
        pattern[i] = count
        patterns.append(pattern)
        pattern_waste = L - count * lengths[i]
        pattern_wastes.append(pattern_waste)

    # Hàm tạo master LP
    def create_master_lp(patterns):
        master = LpProblem("CuttingStockMaster", LpMinimize)
        n_patterns = len(patterns)
        x = [LpVariable(f"x_{j}", lowBound=0, cat=LpContinuous) for j in range(n_patterns)]
        for i in range(n_types):
            master += lpSum(patterns[j][i] * x[j] for j in range(n_patterns)) >= demands[i], f"Demand_{i}"
        master += lpSum(x[j] for j in range(n_patterns))
        return master, x

    # Pricing Problem
    def solve_pricing(duals):
        capacity = L
        dp = [0] * (capacity + 1)
        choice = [None] * (capacity + 1)
        for cap in range(1, capacity + 1):
            for i in range(n_types):
                if lengths[i] <= cap:
                    candidate = dp[cap - lengths[i]] + duals[i]
                    if candidate > dp[cap]:
                        dp[cap] = candidate
                        choice[cap] = i
        max_profit = dp[capacity]
        if max_profit <= 1 + 1e-5:
            return None
        cap = capacity
        new_pattern = [0] * n_types
        total_cut = 0
        while cap > 0 and choice[cap] is not None:
            i = choice[cap]
            new_pattern[i] += 1
            total_cut += lengths[i]
            cap -= lengths[i]
        new_pattern_waste = L - total_cut
        return new_pattern, new_pattern_waste, max_profit

    # Column Generation Loop
    iteration = 0
    max_iterations = 20
    while iteration < max_iterations:
        master, x_vars = create_master_lp(patterns)
        master.solve(PULP_CBC_CMD(msg=0))
        duals = [master.constraints[f"Demand_{i}"].pi for i in range(n_types)]
        pricing_result = solve_pricing(duals)
        if pricing_result is None:
            break
        new_pattern, new_pattern_waste, _ = pricing_result
        patterns.append(new_pattern)
        pattern_wastes.append(new_pattern_waste)
        iteration += 1

    # Giải ILP
    master_ilp = LpProblem("CuttingStock_ILP", LpMinimize)
    n_patterns = len(patterns)
    x_ilp = [LpVariable(f"x_{j}", lowBound=0, cat=LpInteger) for j in range(n_patterns)]
    for i in range(n_types):
        master_ilp += lpSum(patterns[j][i] * x_ilp[j] for j in range(n_patterns)) >= demands[i], f"Demand_{i}"
    master_ilp += lpSum(x_ilp[j] for j in range(n_patterns))
    master_ilp.solve(PULP_CBC_CMD(msg=0))

    if LpStatus[master_ilp.status] != "Optimal":
        return None

    # Tính toán kết quả
    num_bars_used = sum(x_ilp[j].varValue for j in range(n_patterns))
    production = [sum(patterns[j][i] * x_ilp[j].varValue for j in range(n_patterns)) for i in range(n_types)]
    overproduction = [max(prod - dem, 0) for prod, dem in zip(production, demands)]
    total_required = sum(d * l for d, l in zip(demands, lengths))
    total_provided = num_bars_used * L
    used_steel = sum(prod * l for prod, l in zip(production, lengths))
    overall_waste = total_provided - used_steel + sum(over * l for over, l in zip(overproduction, lengths))
    waste_percent = overall_waste / total_required * 100 if total_required > 0 else 0

    # Chuẩn bị dữ liệu bảng
    table_data = [{"Chiều dài (mm)": lengths[i], "Số lượng yêu cầu": demands[i], 
                   "Số thanh cắt ra": production[i], "Số thanh cắt thừa": overproduction[i]} 
                  for i in range(n_types)]
    pattern_data = [{"Mã mẫu": j, "Phương án cắt": patterns[j], "Số lần sử dụng": x_ilp[j].varValue, 
                     "Bar waste (mm)": pattern_wastes[j]} 
                    for j in range(n_patterns) if x_ilp[j].varValue > 0]

    # Vẽ hình ảnh minh họa
    for idx, pattern in enumerate(pattern_data):
        fig, ax = plt.subplots(figsize=(12, 2))  # Tăng kích thước hình để dễ nhìn
        current_x = 0
        bar_height = 0.5  # Tăng chiều cao thanh thép để có chỗ cho văn bản
        for i, count in enumerate(pattern["Phương án cắt"]):
            if count > 0:
                # Sử dụng màu từ danh sách colors
                color = colors[i]
                for _ in range(int(count)):
                    # Vẽ hình chữ nhật với viền đen
                    rect = patches.Rectangle((current_x, 0), lengths[i], bar_height, 
                                             facecolor=color, edgecolor="black", linewidth=1.5)
                    ax.add_patch(rect)
                    # Thêm văn bản chiều dài ở giữa
                    text_x = current_x + lengths[i] / 2
                    text_y = bar_height / 2
                    ax.text(text_x, text_y, f"{lengths[i]} mm", ha='center', va='center', 
                            color='black', fontsize=8, fontweight='bold')
                    current_x += lengths[i]
        waste = pattern["Bar waste (mm)"]
        if waste > 0:
            # Vẽ phần thép dư với nhãn "Waste"
            rect = patches.Rectangle((current_x, 0), waste, bar_height, 
                                     facecolor="gray", edgecolor="black", linewidth=1.5)
            ax.add_patch(rect)
            ax.text(current_x + waste / 2, bar_height / 2, "Waste", ha='center', va='center', 
                    color='black', fontsize=8, fontweight='bold')
        ax.set_xlim(0, L)
        ax.set_ylim(0, bar_height)
        ax.set_yticks([])  # Ẩn trục y
        ax.set_xticks(range(0, L+1, 1000))  # Thêm mốc trên trục x (cách nhau 1000 mm)
        ax.set_xlabel("Chiều dài thanh thép (mm)")  # Thêm nhãn trục x
        plt.savefig(f'static/pattern_{idx}.png', bbox_inches='tight')
        plt.close(fig)

    return {
        "num_bars_used": num_bars_used, "total_provided": total_provided, "total_required": total_required,
        "overall_waste": overall_waste, "waste_percent": waste_percent, "table_data": table_data,
        "pattern_data": pattern_data, "n_patterns": len([p for p in pattern_data if p["Số lần sử dụng"] > 0])
    }

@app.route('/run_program')
def run_program():
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'data_cut_steel.xlsx')
    result = run_cutting_stock(file_path)
    if result is None:
        return "Không tìm được giải pháp tối ưu"
    return render_template('result.html', result=result)

@app.route('/download')
def download_file():
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'data_cut_steel.xlsx')
    result = run_cutting_stock(file_path)
    if result is None:
        return "Không có kết quả để tải"
    df_table = pd.DataFrame(result["table_data"])
    df_pattern = pd.DataFrame(result["pattern_data"])
    output_file = 'ket_qua_cat_thep.xlsx'
    with pd.ExcelWriter(output_file) as writer:
        df_table.to_excel(writer, sheet_name='Kết quả theo loại', index=False)
        df_pattern.to_excel(writer, sheet_name='Phương án cắt', index=False)
    return send_file(output_file, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, threaded=False)  # Chạy single-threaded