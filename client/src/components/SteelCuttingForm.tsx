import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calculator, Trash2, FileDown } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { OptimizationResultData, SteelItemsSchema } from "@shared/schema";
import { exportToExcel } from "@/lib/excelExport";
import { z } from "zod";
import ExcelUploader from "./ExcelUploader";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SteelCuttingFormProps {
  onOptimizationResult: (result: OptimizationResultData) => void;
}

type SteelItem = {
  length: number;
  quantity: number;
};

export default function SteelCuttingForm({ onOptimizationResult }: SteelCuttingFormProps) {
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
        title: "Cannot delete last row",
        description: "You need at least one row for data entry.",
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
          title: "Invalid data",
          description: "Please enter at least one valid row with positive length and quantity.",
          variant: "destructive",
        });
        return null;
      }
      
      // Validate with Zod schema
      const result = SteelItemsSchema.safeParse(filteredRows);
      
      if (!result.success) {
        toast({
          title: "Invalid data",
          description: "Please ensure all entries have valid lengths and quantities.",
          variant: "destructive",
        });
        return null;
      }
      
      return filteredRows;
    } catch (error) {
      toast({
        title: "Validation error",
        description: error instanceof Error ? error.message : "Unknown validation error",
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
        title: "Optimization complete",
        description: `Efficiency: ${data.summary.efficiency.toFixed(1)}%`,
      });
    } catch (error) {
      toast({
        title: "Optimization failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) {
      toast({
        title: "No data to export",
        description: "Please calculate optimization results first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      exportToExcel(rows, result);
      toast({
        title: "Export successful",
        description: "Results have been exported to Excel.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
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
          <CardTitle className="text-base font-medium text-green-800">Upload from Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <ExcelUploader onDataLoaded={handleExcelDataLoaded} />
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <h3 className="text-base font-medium mb-3">Manual Data Entry</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No.</TableHead>
              <TableHead>Steel Length (mm)</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="w-16">Action</TableHead>
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
                    placeholder="Length"
                    value={row.length || ""}
                    onChange={(e) => updateRow(index, "length", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Quantity"
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
          className="inline-flex items-center gap-2 text-black"
        >
          <Plus className="h-4 w-4" /> Add Row
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={handleCalculate}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-black"
        >
          <Calculator className="h-4 w-4" /> Calculate
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          disabled={!result}
          className="inline-flex items-center gap-2 text-black hover:text-black border-yellow-600 hover:bg-yellow-50"
        >
          <FileDown className="h-4 w-4" /> Export
        </Button>
      </div>
    </form>
  );
}
