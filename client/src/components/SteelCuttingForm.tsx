import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calculator, Trash2, FileDown } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { OptimizationResultData, SteelItemsSchema } from "@shared/schema";
import { exportToExcel } from "@/lib/excelExport";
import ExcelUploader from "./ExcelUploader";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SteelCuttingFormProps {
  onOptimizationResult: (result: OptimizationResultData) => void;
  language?: 'en' | 'vi';
}

type SteelItem = {
  length: number;
  quantity: number;
};

// Translations
const translations = {
  uploadFromExcel: {
    en: "Upload from Excel",
    vi: "Tải lên từ Excel"
  },
  manualDataEntry: {
    en: "Manual Data Entry",
    vi: "Nhập dữ liệu thủ công"
  },
  number: {
    en: "No.",
    vi: "STT"
  },
  steelLength: {
    en: "Steel Length (mm)",
    vi: "Chiều dài thép (mm)"
  },
  quantity: {
    en: "Quantity",
    vi: "Số lượng"
  },
  action: {
    en: "Action",
    vi: "Hành động"
  },
  addRow: {
    en: "Add Row",
    vi: "Thêm dòng"
  },
  calculate: {
    en: "Calculate",
    vi: "Tính toán"
  },
  export: {
    en: "Export",
    vi: "Xuất"
  },
  cannotDeleteLastRow: {
    en: "Cannot delete last row",
    vi: "Không thể xóa dòng cuối cùng"
  },
  needAtLeastOneRow: {
    en: "You need at least one row for data entry.",
    vi: "Bạn cần ít nhất một dòng để nhập dữ liệu."
  },
  invalidData: {
    en: "Invalid data",
    vi: "Dữ liệu không hợp lệ"
  },
  enterAtLeastOneValidRow: {
    en: "Please enter at least one valid row with positive length and quantity.",
    vi: "Vui lòng nhập ít nhất một dòng hợp lệ với chiều dài và số lượng dương."
  },
  ensureAllEntriesValid: {
    en: "Please ensure all entries have valid lengths and quantities.",
    vi: "Hãy đảm bảo tất cả các mục nhập có chiều dài và số lượng hợp lệ."
  },
  validationError: {
    en: "Validation error",
    vi: "Lỗi xác thực"
  },
  unknownValidationError: {
    en: "Unknown validation error",
    vi: "Lỗi xác thực không xác định"
  },
  optimizationComplete: {
    en: "Optimization complete",
    vi: "Tối ưu hóa hoàn tất"
  },
  efficiency: {
    en: "Efficiency",
    vi: "Hiệu suất"
  },
  optimizationFailed: {
    en: "Optimization failed",
    vi: "Tối ưu hóa thất bại"
  },
  unknownError: {
    en: "Unknown error occurred",
    vi: "Đã xảy ra lỗi không xác định"
  },
  noDataToExport: {
    en: "No data to export",
    vi: "Không có dữ liệu để xuất"
  },
  calculateFirst: {
    en: "Please calculate optimization results first.",
    vi: "Vui lòng tính toán kết quả tối ưu hóa trước."
  },
  exportSuccessful: {
    en: "Export successful",
    vi: "Xuất thành công"
  },
  resultsExported: {
    en: "Results have been exported to Excel.",
    vi: "Kết quả đã được xuất ra Excel."
  },
  exportFailed: {
    en: "Export failed",
    vi: "Xuất thất bại"
  }
};

export default function SteelCuttingForm({ onOptimizationResult, language = 'en' }: SteelCuttingFormProps) {
  const [rows, setRows] = useState<SteelItem[]>([{ length: 0, quantity: 0 }]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResultData | null>(null);
  const { toast } = useToast();

  const addRow = () => {
    setRows([...rows, { length: 0, quantity: 0 }]);
  };

  const updateRow = (index: number, field: keyof SteelItem, value: string) => {
    const newRows = [...rows];
    const parsedValue = parseInt(value) || 0;
    newRows[index] = { ...newRows[index], [field]: parsedValue };
    setRows(newRows);
  };

  const deleteRow = (index: number) => {
    if (rows.length === 1) {
      toast({
        title: translations.cannotDeleteLastRow[language],
        description: translations.needAtLeastOneRow[language],
        variant: "destructive",
      });
      return;
    }
    
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const validateData = () => {
    try {
      // Filter out any rows with zero values
      const filteredRows = rows.filter(row => row.length > 0 && row.quantity > 0);
      
      if (filteredRows.length === 0) {
        toast({
          title: translations.invalidData[language],
          description: translations.enterAtLeastOneValidRow[language],
          variant: "destructive",
        });
        return null;
      }
      
      // Validate with Zod schema
      const result = SteelItemsSchema.safeParse(filteredRows);
      
      if (!result.success) {
        toast({
          title: translations.invalidData[language],
          description: translations.ensureAllEntriesValid[language],
          variant: "destructive",
        });
        return null;
      }
      
      return filteredRows;
    } catch (error) {
      toast({
        title: translations.validationError[language],
        description: error instanceof Error ? error.message : translations.unknownValidationError[language],
        variant: "destructive",
      });
      return null;
    }
  };

  const handleCalculate = async () => {
    const validData = validateData();
    if (!validData) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/optimize', validData);
      const data: OptimizationResultData = await response.json();
      
      setResult(data);
      onOptimizationResult(data);
      
      toast({
        title: translations.optimizationComplete[language],
        description: `${translations.efficiency[language]}: ${data.summary.efficiency.toFixed(1)}%`,
      });
    } catch (error) {
      toast({
        title: translations.optimizationFailed[language],
        description: error instanceof Error ? error.message : translations.unknownError[language],
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) {
      toast({
        title: translations.noDataToExport[language],
        description: translations.calculateFirst[language],
        variant: "destructive",
      });
      return;
    }
    
    try {
      exportToExcel(rows, result);
      toast({
        title: translations.exportSuccessful[language],
        description: translations.resultsExported[language],
      });
    } catch (error) {
      toast({
        title: translations.exportFailed[language],
        description: error instanceof Error ? error.message : translations.unknownError[language],
        variant: "destructive",
      });
    }
  };

  const handleExcelDataLoaded = (excelData: SteelItem[]) => {
    setRows(excelData);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* Excel Upload Section */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-green-800">
            {translations.uploadFromExcel[language]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExcelUploader onDataLoaded={handleExcelDataLoaded} language={language} />
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <h3 className="text-base font-medium mb-3">
        {translations.manualDataEntry[language]}
      </h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{translations.number[language]}</TableHead>
              <TableHead>{translations.steelLength[language]}</TableHead>
              <TableHead>{translations.quantity[language]}</TableHead>
              <TableHead className="w-16">{translations.action[language]}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    placeholder={language === 'en' ? "Length" : "Chiều dài"}
                    value={row.length || ""}
                    onChange={(e) => updateRow(index, "length", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    placeholder={language === 'en' ? "Quantity" : "Số lượng"}
                    value={row.quantity || ""}
                    onChange={(e) => updateRow(index, "quantity", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteRow(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={addRow}
          className="inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> {translations.addRow[language]}
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={handleCalculate}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
        >
          <Calculator className="h-4 w-4" /> {translations.calculate[language]}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          disabled={!result}
          className="inline-flex items-center gap-2 text-yellow-600 hover:text-yellow-700 border-yellow-600 hover:bg-yellow-50"
        >
          <FileDown className="h-4 w-4" /> {translations.export[language]}
        </Button>
      </div>
    </form>
  );
}