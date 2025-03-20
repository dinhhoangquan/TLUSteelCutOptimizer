import { Button } from "@/components/ui/button";
import { useContext } from "react";

export default function Footer() {
  return (
    <footer className="bg-primary text-yellow-300 py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Thuy Loi University</h3>
            <p className="mb-2">175 Tay Son, Dong Da</p>
            <p className="mb-2">Hanoi, Vietnam</p>
            <p>Founded: 1959</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <p className="mb-2">Email: info@tlu.edu.vn</p>
            <p className="mb-2">Phone: (+84) 24 3852 2201</p>
            <p>Fax: (+84) 24 3563 3351</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Development Team</h3>
            <p className="mb-2">IT Faculty</p>
            <p className="mb-2">Programming Department</p>
            <p>© {new Date().getFullYear()} TLU Steel Optimization</p>
          </div>
        </div>
      </div>
    </footer>
  );
}