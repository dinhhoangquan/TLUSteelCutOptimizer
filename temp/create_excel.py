
import pandas as pd
import sys
import json

data = json.loads(sys.argv[1])
df = pd.DataFrame(data)
df.columns = ["Chiều dài thanh thép (mm)", "Số lượng thanh thép yêu cầu"]
df.to_excel("/home/runner/workspace/temp/data_cut_steel.xlsx", index=False)
print("Excel file created successfully")
