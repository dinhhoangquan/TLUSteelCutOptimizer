import { OptimizationResultData } from "@shared/schema";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportToExcel(
  inputData: { length: number; quantity: number }[],
  results: OptimizationResultData
) {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  
  // Add worksheets
  const inputSheet = workbook.addWorksheet('Input Data');
  const resultSheet = workbook.addWorksheet('Optimization Results');
  const patternsSheet = workbook.addWorksheet('Cutting Patterns');
  
  // Style for headers
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '1D4ED8' } } as ExcelJS.FillPattern,
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };
  
  // Style for data cells
  const dataCellStyle = {
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };
  
  // Input Sheet
  inputSheet.columns = [
    { header: 'No.', key: 'no', width: 10 },
    { header: 'Steel Length (mm)', key: 'length', width: 20 },
    { header: 'Quantity', key: 'quantity', width: 15 }
  ];
  
  // Apply header style
  inputSheet.getRow(1).eachCell(cell => {
    Object.assign(cell, headerStyle);
  });
  
  // Add input data
  inputData.forEach((item, index) => {
    const row = {
      no: index + 1,
      length: item.length,
      quantity: item.quantity
    };
    
    const excelRow = inputSheet.addRow(row);
    excelRow.eachCell(cell => {
      Object.assign(cell, dataCellStyle);
    });
  });
  
  // Result Sheet
  resultSheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 25 }
  ];
  
  // Apply header style
  resultSheet.getRow(1).eachCell(cell => {
    Object.assign(cell, headerStyle);
  });
  
  // Add summary data
  const summaryData = [
    { metric: 'Total Material Used', value: `${results.summary.totalMaterial.toLocaleString()} mm` },
    { metric: 'Total Waste', value: `${results.summary.totalWaste.toLocaleString()} mm` },
    { metric: 'Efficiency', value: `${results.summary.efficiency.toFixed(2)}%` }
  ];
  
  summaryData.forEach(item => {
    const excelRow = resultSheet.addRow(item);
    excelRow.eachCell(cell => {
      Object.assign(cell, dataCellStyle);
    });
  });
  
  // Patterns Sheet
  patternsSheet.columns = [
    { header: 'Pattern', key: 'pattern', width: 15 },
    { header: 'Cutting Layout', key: 'layout', width: 40 },
    { header: 'Waste Amount', key: 'wasteAmount', width: 15 },
    { header: 'Waste Percentage', key: 'wastePercentage', width: 20 },
    { header: 'Quantity', key: 'quantity', width: 15 }
  ];
  
  // Apply header style
  patternsSheet.getRow(1).eachCell(cell => {
    Object.assign(cell, headerStyle);
  });
  
  // Add patterns data
  results.patterns.forEach(pattern => {
    // Create a text representation of the cutting layout
    const layout = pattern.cuttingLayout
      .map(piece => 
        `${piece.length}mm${piece.type === 'waste' ? ' (waste)' : ''}`
      )
      .join(' + ');
    
    const row = {
      pattern: pattern.pattern,
      layout,
      wasteAmount: `${pattern.waste.amount.toLocaleString()} mm`,
      wastePercentage: `${pattern.waste.percentage.toFixed(2)}%`,
      quantity: pattern.quantity
    };
    
    const excelRow = patternsSheet.addRow(row);
    excelRow.eachCell(cell => {
      Object.assign(cell, dataCellStyle);
    });
  });
  
  // Generate binary
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Create a blob and save
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `TLU_Steel_Cutting_Optimization_${new Date().toISOString().split('T')[0]}.xlsx`);
}
