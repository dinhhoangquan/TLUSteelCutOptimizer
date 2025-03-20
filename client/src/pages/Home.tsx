import SteelCuttingForm from "@/components/SteelCuttingForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import { useState, useEffect } from "react";
import { OptimizationResultData } from "@shared/schema";

// Define translation type
type Translations = {
  [key: string]: {
    en: string;
    vi: string;
  };
};

export default function Home() {
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResultData | null>(null);
  const [language, setLanguage] = useState<'en' | 'vi'>('en');

  // Initialize translations
  const translations: Translations = {
    title: {
      en: "Steel Cutting Optimization Tool",
      vi: "Công cụ tối ưu hóa cắt thép"
    },
    description: {
      en: "Enter steel bar lengths and quantities below to optimize cutting patterns and minimize waste. You can also upload your data using an Excel file.",
      vi: "Nhập chiều dài và số lượng thanh thép bên dưới để tối ưu hóa mẫu cắt và giảm thiểu lãng phí. Bạn cũng có thể tải lên dữ liệu của mình bằng tệp Excel."
    }
  };

  // Check for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguage(document.documentElement.lang as 'en' | 'vi');
    };

    // Set up an observer to watch for language attribute changes
    const observer = new MutationObserver(handleLanguageChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });

    // Initial check
    handleLanguageChange();

    // Clean up
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-6">
          {translations.title[language]}
        </h2>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            {translations.description[language]}
          </p>
        </div>
        
        <SteelCuttingForm 
          onOptimizationResult={setOptimizationResult}
          language={language} 
        />
      </div>
      
      {optimizationResult && (
        <ResultsDisplay 
          result={optimizationResult}
          language={language} 
        />
      )}
    </div>
  );
}
