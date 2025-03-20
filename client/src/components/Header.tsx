import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// Define translation type
type Translations = {
  [key: string]: {
    en: string;
    vi: string;
  };
};

export default function Header() {
  const [language, setLanguage] = useState<'en' | 'vi'>('en');

  // Initialize translations (these would be expanded in a real application)
  const translations: Translations = {
    title: {
      en: "TLU Steel Cutting Optimization",
      vi: "Tối ưu hóa cắt thép TLU"
    },
    login: {
      en: "Login",
      vi: "Đăng nhập"
    },
    register: {
      en: "Register",
      vi: "Đăng ký"
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  // Set the language in application-wide context when it changes
  useEffect(() => {
    // This would normally update a context provider or language state management
    document.documentElement.lang = language;
    
    // For demonstration, we're setting a data attribute that could be used in CSS
    document.documentElement.setAttribute('data-language', language);
  }, [language]);

  return (
    <header className="bg-primary shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-yellow-300">
              {translations.title[language]}
            </h1>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="text-black border-yellow-300 bg-yellow-300 hover:bg-yellow-400"
            >
              {translations.login[language]}
            </Button>
            <Button 
              className="bg-yellow-300 hover:bg-yellow-400 text-black font-medium"
            >
              {translations.register[language]}
            </Button>
            <Button
              variant="outline"
              className="text-yellow-300 border-yellow-300 hover:bg-primary/80 hover:text-yellow-200"
              onClick={toggleLanguage}
              aria-label={language === 'en' ? 'Switch to Vietnamese' : 'Switch to English'}
            >
              {language === 'en' ? (
                <span className="flex items-center justify-center w-6 h-4">🇻🇳</span>
              ) : (
                <span className="flex items-center justify-center w-6 h-4">🇬🇧</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
