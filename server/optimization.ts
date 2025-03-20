import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { OptimizationResultData } from '@shared/schema';

// Function to write data to a temporary Excel file
async function writeDataToExcel(items: { length: number; quantity: number }[]): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp');
  
  // Create temp directory if it doesn't exist
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error('Error creating temp directory:', error);
  }
  
  // Create Python script to write Excel file
  const filePath = path.join(tempDir, 'data_cut_steel.xlsx');
  const pythonScript = `
import pandas as pd
import sys
import json

data = json.loads(sys.argv[1])
df = pd.DataFrame(data)
df.columns = ["Chiều dài thanh thép (mm)", "Số lượng thanh thép yêu cầu"]
df.to_excel("${filePath.replace(/\\/g, '\\\\')}", index=False)
print("Excel file created successfully")
`;

  const scriptPath = path.join(tempDir, 'create_excel.py');
  await fs.writeFile(scriptPath, pythonScript);
  
  // Convert the items array to the expected format
  const data = items.map(item => [item.length, item.quantity]);
  
  // Run Python script to create Excel file
  return new Promise<string>((resolve, reject) => {
    exec(`python ${scriptPath} '${JSON.stringify(data)}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Python script stderr: ${stderr}`);
      }
      console.log(`Python script stdout: ${stdout}`);
      resolve(filePath);
    });
  });
}

// Function to run the steel cutting optimization algorithm
async function runSteelCuttingOptimization(filePath: string): Promise<OptimizationResultData> {
  // Create Python script for optimization
  const tempDir = path.join(process.cwd(), 'temp');
  const optimizationScriptPath = path.join(tempDir, 'run_optimization.py');
  
  const pythonScript = `
from pulp import LpProblem, LpMinimize, LpVariable, lpSum, LpStatus, LpContinuous, LpInteger, PULP_CBC_CMD
import pandas as pd
import json
import sys
import colorsys

# Read data from Excel file
file_path = sys.argv[1]
data = pd.read_excel(file_path)
lengths = data["Chiều dài thanh thép (mm)"].tolist()
demands = data["Số lượng thanh thép yêu cầu"].tolist()
n_types = len(lengths)
L = 11700  # Standard bar length

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
    print(json.dumps({"error": "No optimal solution found"}))
    sys.exit(1)

# Tính toán kết quả
num_bars_used = sum(x_ilp[j].varValue for j in range(n_patterns))
production = [sum(patterns[j][i] * x_ilp[j].varValue for j in range(n_patterns)) for i in range(n_types)]
overproduction = [max(prod - dem, 0) for prod, dem in zip(production, demands)]
total_required = sum(d * l for d, l in zip(demands, lengths))
total_provided = num_bars_used * L
used_steel = sum(prod * l for prod, l in zip(production, lengths))
waste_from_overproduction = sum(over * l for over, l in zip(overproduction, lengths))
waste_from_bars = sum(pattern_wastes[j] * x_ilp[j].varValue for j in range(n_patterns))
overall_waste = waste_from_bars + waste_from_overproduction
efficiency = (total_required / total_provided) * 100 if total_provided > 0 else 0

# Prepare pattern data for output
pattern_results = []
for j in range(n_patterns):
    if x_ilp[j].varValue > 0:
        # Create cutting layout
        layout = []
        total_length = 0
        for i in range(n_types):
            for _ in range(int(patterns[j][i])):
                layout.append({
                    "length": lengths[i],
                    "type": ""
                })
                total_length += lengths[i]
        
        # Add waste if any
        waste_length = L - total_length
        if waste_length > 0:
            layout.append({
                "length": waste_length,
                "type": "waste"
            })
            
        pattern_results.append({
            "pattern": f"Pattern #{j+1}",
            "cuttingLayout": layout,
            "waste": {
                "amount": pattern_wastes[j],
                "percentage": (pattern_wastes[j] / L) * 100
            },
            "quantity": int(x_ilp[j].varValue)
        })

# Create final result object
result = {
    "patterns": pattern_results,
    "summary": {
        "totalMaterial": total_provided,
        "totalWaste": overall_waste,
        "efficiency": efficiency
    }
}

# Output as JSON
print(json.dumps(result))
`;

  await fs.writeFile(optimizationScriptPath, pythonScript);
  
  // Run the optimization script
  return new Promise<OptimizationResultData>((resolve, reject) => {
    exec(`python ${optimizationScriptPath} "${filePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing optimization script: ${error}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`Optimization script stderr: ${stderr}`);
      }
      
      try {
        // Parse the result
        const result = JSON.parse(stdout);
        
        if (result.error) {
          reject(new Error(result.error));
          return;
        }
        
        resolve(result as OptimizationResultData);
      } catch (parseError) {
        console.error(`Error parsing optimization result: ${parseError}`);
        console.error(`Raw output: ${stdout}`);
        reject(parseError);
      }
    });
  });
}

// Main optimization function
export async function optimizeSteelCutting(items: { length: number; quantity: number }[]): Promise<OptimizationResultData> {
  try {
    // Validate input
    if (!items || items.length === 0) {
      throw new Error('No items provided for optimization');
    }
    
    // Write data to Excel
    const filePath = await writeDataToExcel(items);
    
    // Run optimization
    const result = await runSteelCuttingOptimization(filePath);
    
    return result;
  } catch (error) {
    console.error('Error in steel cutting optimization:', error);
    throw error;
  }
}