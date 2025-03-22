import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { OptimizationResultData } from "@shared/schema";

// Function to directly run the optimization with JSON input
async function runOptimization(
  items: { length: number; quantity: number }[]
): Promise<OptimizationResultData> {
  // Create temp directory if it doesn't exist
  const tempDir = path.join(process.cwd(), "temp");
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error("Error creating temp directory:", error);
    throw error;
  }

  // Create Python script for optimization
  const scriptPath = path.join(tempDir, "run_optimization.py");
  const inputFilePath = path.join(tempDir, "input_data.json");

  const pythonScript = `
import sys
import json
from pulp import LpProblem, LpMinimize, LpVariable, lpSum, LpStatus, LpContinuous, LpInteger, PULP_CBC_CMD

# Read input data from file
input_file_path = sys.argv[1]
try:
    with open(input_file_path, 'r') as f:
        input_data = json.load(f)
except Exception as e:
    print(json.dumps({"error": f"Failed to read or parse input file: {str(e)}"}))
    sys.exit(1)

lengths = [item["length"] for item in input_data]
demands = [item["quantity"] for item in input_data]
n_types = len(lengths)
L = 11700  # Standard bar length

# Initialize patterns
patterns = []
pattern_wastes = []
for i in range(n_types):
    count = L // lengths[i]
    pattern = [0] * n_types
    pattern[i] = count
    patterns.append(pattern)
    pattern_waste = L - count * lengths[i]
    pattern_wastes.append(pattern_waste)

# Create master LP
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

# Solve ILP
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

# Calculate results
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

  // Write the Python script
  await fs.writeFile(scriptPath, pythonScript);

  // Write the input data to a temporary JSON file
  await fs.writeFile(inputFilePath, JSON.stringify(items));

  // Run the optimization script
  return new Promise<OptimizationResultData>((resolve, reject) => {
    exec(
      `python "${scriptPath}" "${inputFilePath}"`,
      (error, stdout, stderr) => {
        // Clean up temporary files
        fs.unlink(scriptPath).catch((err) =>
          console.error("Error deleting script file:", err)
        );
        fs.unlink(inputFilePath).catch((err) =>
          console.error("Error deleting input file:", err)
        );

        if (error) {
          console.error(`Error executing optimization script: ${error.message}`);
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
      }
    );
  });
}

// Main optimization function
export async function optimizeSteelCutting(
  items: { length: number; quantity: number }[]
): Promise<OptimizationResultData> {
  try {
    // Validate input
    if (!items || items.length === 0) {
      throw new Error("No items provided for optimization");
    }

    // Run optimization directly with JSON
    const result = await runOptimization(items);

    return result;
  } catch (error) {
    console.error("Error in steel cutting optimization:", error);
    throw error;
  }
}