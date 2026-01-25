import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { NavLink } from "@/components/shared/nav-link";
import { SignOutButton } from "@/components/shared/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50/40 p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold">RentCar SaaS</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {session.user.agencyName}
          </p>
        </div>

        <nav className="space-y-1">
          <NavLink href="/dashboard" iconName="LayoutDashboard" label="Tableau de bord" />
          <NavLink href="/vehicles" iconName="Car" label="Véhicules" />
          <NavLink href="/customers" iconName="Users" label="Clients" />
          <NavLink href="/bookings" iconName="Calendar" label="Réservations" />
          <NavLink href="/payments" iconName="CreditCard" label="Paiements" />
          <NavLink href="/damage-reports" iconName="AlertTriangle" label="Rapports" />
        </nav>

        <div className="mt-auto pt-8">
          <div className="border-t pt-4">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
            <div className="mt-3">
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
