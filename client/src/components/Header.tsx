import { Button } from "@/components/ui/button";

interface HeaderProps {
  language: 'en' | 'vi';
  setLanguage: (lang: 'en' | 'vi') => void;
}

export default function Header({ language, setLanguage }: HeaderProps) {
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <header className="bg-primary shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0">
              <img 
                src="/tlu-logo.svg" 
                alt="Thuy Loi University Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-yellow-300">
              {language === 'en' ? 'TLU Steel Cutting Optimization' : 'Tối ưu hóa cắt thép TLU'}
            </h1>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="text-black border-yellow-300 bg-yellow-300 hover:bg-yellow-200"
            >
              {language === 'en' ? 'Login' : 'Đăng nhập'}
            </Button>
            <Button 
              className="bg-yellow-300 hover:bg-yellow-400 text-black font-medium"
            >
              {language === 'en' ? 'Register' : 'Đăng ký'}
            </Button>
            <Button
              variant="outline"
              className="relative w-10 h-10 p-0 overflow-hidden border-yellow-300"
              onClick={toggleLanguage}
            >
              <img 
                src={language === 'en' 
                  ? "/vietnam-flag.svg" 
                  : "/uk-flag.svg"} 
                alt={language === 'en' ? "Vietnamese Flag" : "UK Flag"}
                className="h-full w-full object-cover"
              />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
