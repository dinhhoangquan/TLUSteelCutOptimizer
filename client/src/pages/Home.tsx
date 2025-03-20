import SteelCuttingForm from "@/components/SteelCuttingForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import { useState } from "react";
import { OptimizationResultData } from "@shared/schema";

export default function Home() {
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResultData | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-6">Steel Cutting Optimization Tool</h2>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Enter steel bar lengths and quantities below to optimize cutting patterns and minimize waste.
            You can also upload your data using an Excel file.
          </p>
        </div>
        
        <SteelCuttingForm onOptimizationResult={setOptimizationResult} />
      </div>
      
      {optimizationResult && (
        <ResultsDisplay result={optimizationResult} />
      )}
    </div>
  );
}
