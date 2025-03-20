import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home, { LanguageContext, LanguageProvider } from "@/pages/Home";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [language, setLanguage] = useState<'en' | 'vi'>('en');

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageContext.Provider value={{ language, setLanguage }}>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header language={language} setLanguage={setLanguage} />
          <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </LanguageContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
