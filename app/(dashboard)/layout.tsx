import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { NavLink } from "@/components/shared/nav-link";
import { SignOutButton } from "@/components/shared/sign-out-button";
import Image from "next/image";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/30" suppressHydrationWarning>
      {/* Sidebar - suppressHydrationWarning on nodes avoids mismatch when extensions (e.g. Bitdefender) inject bis_skin_checked */}
      <aside className="w-64 border-r border-border bg-card flex flex-col" suppressHydrationWarning>
        <div className="p-6 border-b border-border" suppressHydrationWarning>
          <div className="flex items-center mb-4" suppressHydrationWarning>
            <div className="relative w-40 h-12 overflow-hidden" suppressHydrationWarning>
              <Image 
                src="/assets/locapro-logo.png" 
                alt="Locapro Logo" 
                fill
                className="object-contain object-left"
                priority
              />
            </div>
            <div suppressHydrationWarning>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1" suppressHydrationWarning>
          <div className="mb-4" suppressHydrationWarning>
            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Menu Principal
            </p>
          </div>
          <NavLink href="/dashboard" iconName="LayoutDashboard" label="Tableau de bord" />
          <NavLink href="/vehicles" iconName="Car" label="Véhicules" />
          <NavLink href="/catalogue" iconName="BookOpen" label="Catalogue" />
          <NavLink href="/customers" iconName="Users" label="Clients" />
          <NavLink href="/bookings" iconName="Calendar" label="Réservations" />
          <NavLink href="/calendrier" iconName="CalendarRange" label="Calendrier" />
          <NavLink href="/payments" iconName="CreditCard" label="Paiements" />
          <NavLink href="/damage-reports" iconName="AlertTriangle" label="Rapports" />
        </nav>

        <div className="p-4 border-t border-border" suppressHydrationWarning>
          <div className="p-4 rounded-lg bg-muted" suppressHydrationWarning>
            <div className="flex items-center gap-3 mb-3" suppressHydrationWarning>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm" suppressHydrationWarning>
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0" suppressHydrationWarning>
                <p className="text-sm font-medium truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main Content - suppressHydrationWarning avoids mismatch when extensions (e.g. Bitdefender) inject bis_skin_checked */}
      <main className="flex-1 overflow-auto" suppressHydrationWarning>
        <div className="min-h-full" suppressHydrationWarning>
          <div className="max-w-7xl mx-auto p-8" suppressHydrationWarning>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
