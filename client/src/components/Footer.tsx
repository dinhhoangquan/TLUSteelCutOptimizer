import { Button } from "@/components/ui/button";
import { useContext } from "react";
import { LanguageContext } from "@/pages/Home";

export default function Footer() {
  const { language } = useContext(LanguageContext);

  const translations = {
    en: {
      university: "Thuy Loi University",
      address1: "175 Tay Son, Dong Da",
      address2: "Hanoi, Vietnam",
      founded: "Founded: 1959",
      contact: "Contact",
      email: "Email: info@tlu.edu.vn",
      phone: "Phone: (+84) 24 3852 2201",
      fax: "Fax: (+84) 24 3563 3351",
      team: "Development Team",
      faculty: "IT Faculty",
      department: "Programming Department",
      copyright: `© ${new Date().getFullYear()} TLU Steel Optimization`
    },
    vi: {
      university: "Đại học Thủy Lợi",
      address1: "175 Tây Sơn, Đống Đa",
      address2: "Hà Nội, Việt Nam",
      founded: "Thành lập: 1959",
      contact: "Liên hệ",
      email: "Email: info@tlu.edu.vn",
      phone: "Điện thoại: (+84) 24 3852 2201",
      fax: "Fax: (+84) 24 3563 3351",
      team: "Đội ngũ phát triển",
      faculty: "Khoa Công nghệ thông tin",
      department: "Bộ môn Lập trình",
      copyright: `© ${new Date().getFullYear()} Tối ưu hóa Thép TLU`
    }
  };

  const text = language === 'en' ? translations.en : translations.vi;

  return (
    <footer className="bg-primary text-yellow-300 py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">{text.university}</h3>
            <p className="mb-2">{text.address1}</p>
            <p className="mb-2">{text.address2}</p>
            <p>{text.founded}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">{text.contact}</h3>
            <p className="mb-2">{text.email}</p>
            <p className="mb-2">{text.phone}</p>
            <p>{text.fax}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">{text.team}</h3>
            <p className="mb-2">{text.faculty}</p>
            <p className="mb-2">{text.department}</p>
            <p>{text.copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}