import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900">Page introuvable</h1>
      <p className="text-gray-600 text-center max-w-md">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="px-4 py-2 bg-[#2c2cf2] text-white rounded-lg font-medium hover:bg-[#2c2cf2]/90 transition-colors"
        >
          Accueil
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Connexion
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Créer un compte
        </Link>
      </div>
    </div>
  );
}
