import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-4">RentCar SaaS</h1>
          <p className="text-muted-foreground text-lg">
            Système de gestion de location de voitures
          </p>
        </div>
        <div className="pt-4">
          <Link href="/login">
            <Button size="lg" className="text-base px-8">
              Se connecter
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
