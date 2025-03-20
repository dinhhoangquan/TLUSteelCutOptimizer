import SteelCuttingForm from "@/components/SteelCuttingForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import { useState, useContext, createContext } from "react";
import { OptimizationResultData } from "@shared/schema";

// Create a context for language
export const LanguageContext = createContext<{
  language: 'en' | 'vi';
  setLanguage: (lang: 'en' | 'vi') => void;
}>({
  language: 'en',
  setLanguage: () => {},
});

// Language provider component
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export default function Home() {
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResultData | null>(null);
  const { language } = useContext(LanguageContext);

  const translations = {
    en: {
      title: "Steel Cutting Optimization Tool",
      description: "Enter steel bar lengths and quantities below to optimize cutting patterns and minimize waste. You can also upload your data using an Excel file."
    },
    vi: {
      title: "Công cụ tối ưu hóa cắt thép",
      description: "Nhập chiều dài thanh thép và số lượng bên dưới để tối ưu hóa các mẫu cắt và giảm thiểu lãng phí. Bạn cũng có thể tải lên dữ liệu của mình bằng tệp Excel."
    }
  };

  const text = language === 'en' ? translations.en : translations.vi;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-6">{text.title}</h2>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            {text.description}
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
