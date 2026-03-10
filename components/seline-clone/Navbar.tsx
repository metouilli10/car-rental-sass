import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Seline
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">About us</Link>
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Blog</Link>
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Docs</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link href="#" className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600">
              Start for free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
