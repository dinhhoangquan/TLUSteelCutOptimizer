import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'exceljs';

interface ExcelUploaderProps {
  onDataLoaded: (data: { length: number; quantity: number }[]) => void;
  language?: 'en' | 'vi';
}

// Translations
const translations = {
  excelFileImportedSuccess: {
    en: "Excel file imported successfully",
    vi: "Tệp Excel đã được nhập thành công"
  },
  loaded: {
    en: "Loaded",
    vi: "Đã tải"
  },
  itemsFromFile: {
    en: "items from the file.",
    vi: "mục từ tệp."
  },
  errorImportingExcel: {
    en: "Error importing Excel file",
    vi: "Lỗi khi nhập tệp Excel"
  },
  unknownError: {
    en: "Unknown error occurred",
    vi: "Đã xảy ra lỗi không xác định"
  },
  importing: {
    en: "Importing...",
    vi: "Đang nhập..."
  },
  uploadExcel: {
    en: "Upload Excel",
    vi: "Tải lên Excel"
  },
  uploadInstructions: {
    en: "Upload an Excel file with steel lengths in column A and quantities in column B. The first row should be the header row.",
    vi: "Tải lên tệp Excel với chiều dài thép ở cột A và số lượng ở cột B. Dòng đầu tiên nên là dòng tiêu đề."
  },
  noWorksheets: {
    en: "The Excel file contains no worksheets",
    vi: "Tệp Excel không chứa bảng tính nào"
  },
  noValidData: {
    en: "No valid data found in the Excel file",
    vi: "Không tìm thấy dữ liệu hợp lệ trong tệp Excel"
  }
};

export default function ExcelUploader({ onDataLoaded, language = 'en' }: ExcelUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Get the first worksheet
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error(translations.noWorksheets[language]);
      }
      
      const data: { length: number; quantity: number }[] = [];
      
      // Process rows (assuming first row is header)
      worksheet.eachRow((row, rowIndex) => {
        // Skip header row
        if (rowIndex > 1) {
          const length = Number(row.getCell(1).value);
          const quantity = Number(row.getCell(2).value);
          
          if (!isNaN(length) && !isNaN(quantity) && length > 0 && quantity > 0) {
            data.push({ length, quantity });
          }
        }
      });
      
      if (data.length === 0) {
        throw new Error(translations.noValidData[language]);
      }
      
      onDataLoaded(data);
      
      toast({
        title: translations.excelFileImportedSuccess[language],
        description: `${translations.loaded[language]} ${data.length} ${translations.itemsFromFile[language]}`,
      });
      
    } catch (error) {
      toast({
        title: translations.errorImportingExcel[language],
        description: error instanceof Error ? error.message : translations.unknownError[language],
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Clear the input
      e.target.value = '';
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          variant="outline"
          disabled={isLoading}
          className="inline-flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
        >
          <FileUp className="h-4 w-4" />
          {isLoading ? translations.importing[language] : translations.uploadExcel[language]}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {translations.uploadInstructions[language]}
      </p>
    </div>
  );
}