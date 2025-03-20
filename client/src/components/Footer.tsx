export default function Footer() {
  return (
    <footer className="bg-primary shadow-inner py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-base font-semibold text-yellow-300 mb-3">Student Scientific Research Group:</h3>
            <ol className="list-decimal ml-5 text-sm text-yellow-200 space-y-1">
              <li>Nguyen Van A</li>
              <li>Le Thi B</li>
              <li>Vuong Thu C</li>
            </ol>
            <p className="mt-3 text-sm text-yellow-300">Instructor: Dinh Hoang Quan</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-yellow-300 uppercase mb-3">Thuy Loi University</h3>
            <address className="not-italic text-sm text-yellow-200 space-y-1">
              <p>Address: 175 Tay Son, Dong Da, Hanoi</p>
              <p>Phone: (024) 38522201 - Fax: (024) 35633351</p>
              <p>Email: phonghcth@tlu.edu.vn</p>
            </address>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-green-700">
          <p className="text-center text-xs text-yellow-200">&copy; {new Date().getFullYear()} Thuy Loi University. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
