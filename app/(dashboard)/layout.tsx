import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { TopNavBar } from "@/components/shared/top-nav-bar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { MobileFAB } from "@/components/shared/mobile-fab";
import { Toaster } from "sonner";

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
    <div className="flex min-h-screen bg-background" suppressHydrationWarning>
      {/* Collapsible Sidebar */}
      <DashboardSidebar agencyName={session.user.agencyName ?? "Agence"} />

      <Toaster richColors position="top-right" />

      {/* Right side — TopNav + Content */}
      <div className="flex-1 flex flex-col min-w-0" suppressHydrationWarning>
        <TopNavBar
          userName={session.user.name || "Utilisateur"}
          userEmail={session.user.email || ""}
          agencyName={session.user.agencyName || "Agence"}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto" suppressHydrationWarning>
          <div className="min-h-full" suppressHydrationWarning>
            <div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-24 sm:px-6 sm:py-6 lg:px-8" suppressHydrationWarning>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* Mobile FAB — speed-dial for quick actions */}
      <MobileFAB />
    </div>
  );
}
