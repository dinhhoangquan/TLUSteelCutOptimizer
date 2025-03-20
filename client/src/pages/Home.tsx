import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SteelCuttingForm from "@/components/SteelCuttingForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import { useState } from "react";
import { OptimizationResultData } from "@shared/schema";

export default function Home() {
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResultData | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-200">
      <Header />
      <main className="flex-grow mt-16 mb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full py-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Steel Cutting Optimization Tool</h2>
          
          <div className="mb-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">Enter steel bar lengths and quantities to optimize cutting patterns and minimize waste.</p>
          </div>
          
          <SteelCuttingForm onOptimizationResult={setOptimizationResult} />
          
          {optimizationResult && (
            <ResultsDisplay result={optimizationResult} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
