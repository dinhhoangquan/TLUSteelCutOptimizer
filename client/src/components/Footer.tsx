import { useState, useEffect } from "react";

// Define translation type
type Translations = {
  [key: string]: {
    en: string;
    vi: string;
  };
};

// Define translations for Footer
const translations: Translations = {
  researchGroupTitle: {
    en: "Student Scientific Research Group:",
    vi: "Nhóm Nghiên cứu Khoa học Sinh viên:",
  },
  member1: {
    en: "Tran Thi Duyen - 65QLXD2",
    vi: "Trần Thị Duyên - 65QLXD2",
  },
  member2: {
    en: "Phung Thi Tien - 65QLXD2",
    vi: "Phùng Thị Tiên - 65QLXD2",
  },
  member3: {
    en: "Nguyen Duc Anh - 65QLXD2",
    vi: "Nguyễn Đức Anh - 65QLXD2",
  },
  instructor: {
    en: "Instructor: Dinh Hoang Quan",
    vi: "Giảng viên hướng dẫn: Đinh Hoàng Quân",
  },
  department: {
    en: "Department of Construction Technology and Management",
    vi: "Bộ môn Công nghệ và Quản lý Xây dựng",
  },
  universityTitle: {
    en: "Thuy Loi University",
    vi: "Trường Đại học Thủy Lợi",
  },
  address: {
    en: "Address: 175 Tay Son, Dong Da, Hanoi",
    vi: "Địa chỉ: 175 Tây Sơn, Đống Đa, Hà Nội",
  },
  phone: {
    en: "Phone: (024) 38522201 - Fax: (024) 35633351",
    vi: "Điện thoại: (024) 38522201 - Fax: (024) 35633351",
  },
  email: {
    en: "Email: phonghcth@tlu.edu.vn",
    vi: "Email: phonghcth@tlu.edu.vn",
  },
  copyright: {
    en: "© {year} Thuy Loi University. All rights reserved.",
    vi: "© {year} Trường Đại học Thủy Lợi. Mọi quyền được bảo lưu.",
  },
};

export default function Footer() {
  // Lấy ngôn ngữ từ data-language attribute
  const [language, setLanguage] = useState<'en' | 'vi'>(
    (document.documentElement.getAttribute('data-language') as 'en' | 'vi') || 'en'
  );

  // Theo dõi thay đổi ngôn ngữ
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newLanguage = document.documentElement.getAttribute('data-language') as 'en' | 'vi';
      if (newLanguage && newLanguage !== language) {
        setLanguage(newLanguage);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-language'],
    });

    return () => observer.disconnect();
  }, [language]);

  // Lấy năm hiện tại
  const currentYear = new Date().getFullYear();
  // Thay thế {year} trong copyright bằng năm hiện tại
  const copyrightText = translations.copyright[language].replace("{year}", currentYear.toString());

  return (
    <footer className="bg-primary shadow-inner py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-base font-semibold text-yellow-300 mb-3">
              {translations.researchGroupTitle[language]}
            </h3>
            <ol className="list-decimal ml-5 text-sm text-yellow-200 space-y-1">
              <li>{translations.member1[language]}</li>
              <li>{translations.member2[language]}</li>
              <li>{translations.member3[language]}</li>
            </ol>
            <p className="mt-3 text-sm text-yellow-300">
              {translations.instructor[language]}
            </p>
            <p className="mt-3 text-sm text-yellow-300">
              {translations.department[language]}
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-yellow-300 uppercase mb-3">
              {translations.universityTitle[language]}
            </h3>
            <address className="not-italic text-sm text-yellow-200 space-y-1">
              <p>{translations.address[language]}</p>
              <p>{translations.phone[language]}</p>
              <p>{translations.email[language]}</p>
            </address>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-green-700">
          <p className="text-center text-xs text-yellow-200">{copyrightText}</p>
        </div>
      </div>
    </footer>
  );
}