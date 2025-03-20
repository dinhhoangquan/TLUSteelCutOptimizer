import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Header() {
  const [language, setLanguage] = useState<'en' | 'vi'>('en');

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <header className="bg-primary shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-yellow-300">TLU Steel Cutting Optimization</h1>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="text-yellow-300 border-yellow-300 hover:bg-primary/80 hover:text-yellow-200"
            >
              Login
            </Button>
            <Button 
              className="bg-yellow-300 hover:bg-yellow-400 text-primary font-medium"
            >
              Register
            </Button>
            <Button
              variant="outline"
              className="text-yellow-300 border-yellow-300 hover:bg-primary/80 hover:text-yellow-200"
              onClick={toggleLanguage}
            >
              {language === 'en' ? 'Tiếng Việt' : 'English'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
