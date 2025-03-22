FROM node:22.14.0

# Cài đặt Python, pip và python3-venv (dành cho tính năng tối ưu hóa trong server/optimization.ts)
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv

# Tạo virtual environment và cài đặt pulp
RUN python3 -m venv /opt/venv
RUN /opt/venv/bin/pip install --upgrade pip
RUN /opt/venv/bin/pip install pulp

# Kích hoạt virtual environment trong các lệnh sau
ENV PATH="/opt/venv/bin:$PATH"

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package.json package-lock.json ./
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Build ứng dụng
RUN npm run build

# Mở port 3000 (khớp với server/index.ts)
EXPOSE 3000

# Lệnh khởi động
CMD ["npm", "start"]