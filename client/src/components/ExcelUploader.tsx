import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'exceljs';

interface ExcelUploaderProps {
  onDataLoaded: (data: { length: number; quantity: number }[]) => void;
}

export default function ExcelUploader({ onDataLoaded }: ExcelUploaderProps) {
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
        throw new Error("The Excel file contains no worksheets");
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
        throw new Error("No valid data found in the Excel file");
      }
      
      onDataLoaded(data);
      
      toast({
        title: "Excel file imported successfully",
        description: `Loaded ${data.length} items from the file.`,
      });
      
    } catch (error) {
      toast({
        title: "Error importing Excel file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
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
          {isLoading ? "Importing..." : "Upload Excel"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Upload an Excel file with steel lengths in column A and quantities in column B.
        The first row should be the header row.
      </p>
    </div>
  );
}