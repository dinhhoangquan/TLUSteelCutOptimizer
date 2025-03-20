import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-primary">TLU Steel Cutting Optimization</h1>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="text-primary border-primary hover:bg-blue-50">
              Login
            </Button>
            <Button className="bg-primary hover:bg-secondary text-white">
              Register
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
