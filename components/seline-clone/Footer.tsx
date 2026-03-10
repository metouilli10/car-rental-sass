import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-lg font-bold text-gray-900">
            Seline
          </Link>
          <div className="flex gap-8 text-sm text-gray-600">
            <Link href="#" className="hover:text-gray-900">Privacy</Link>
            <Link href="#" className="hover:text-gray-900">Terms</Link>
            <Link href="#" className="hover:text-gray-900">Cookies</Link>
          </div>
        </div>
        <p className="mt-6 text-center md:text-left text-sm text-gray-500">
          © {new Date().getFullYear()} Seline. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
