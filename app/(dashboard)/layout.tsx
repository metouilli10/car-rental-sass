import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { TopNavBar } from "@/components/shared/top-nav-bar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { MobileFAB } from "@/components/shared/mobile-fab";
import { Toaster } from "sonner";
import { getNotificationsSummary } from "@/lib/notifications/queries";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions } from "@/lib/permissions";

export const runtime = "nodejs";
export const preferredRegion = ["fra1"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const agencyId = session.user.agencyId ?? "";
  let displayAgencyName = session.user.agencyName || "Agence";
  const dashboardChrome =
    agencyId
      ? await Promise.all([
          prisma.agency.findUnique({
            where: { id: agencyId },
            select: { setupCompletedAt: true, name: true, logoUrl: true },
          }),
          getNotificationsSummary(agencyId).catch(() => ({ count: 0, items: [] })),
        ])
      : null;
  const agency = dashboardChrome?.[0] ?? null;
  const notifSummary = dashboardChrome?.[1] ?? { count: 0, items: [] };

  if (agencyId) {
    if (!agency?.setupCompletedAt) {
      redirect("/setup");
    }

    displayAgencyName = agency.name;
  }

  const currentUser = agencyId
    ? await prisma.user.findFirst({
        where: {
          id: session.user.id,
          agencyId,
        },
        select: {
          permissionOverrides: true,
        },
      })
    : null;
  const permissions = getEffectivePermissions(
    session.user.role,
    currentUser?.permissionOverrides ?? null,
  );

  return (
    <div className="flex min-h-screen bg-background" suppressHydrationWarning>
      {/* Collapsible Sidebar */}
      <Sidebar agencyName={displayAgencyName} role={session.user.role} permissions={permissions} />

      <Toaster richColors position="top-right" />

      {/* Right side — TopNav + Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/40" suppressHydrationWarning>
        <TopNavBar
          userName={session.user.name || "Utilisateur"}
          userEmail={session.user.email || ""}
          agencyName={displayAgencyName}
          agencyLogoUrl={agency?.logoUrl ?? undefined}
          notifCount={notifSummary.count}
          topNotifs={notifSummary.items}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-muted/40" suppressHydrationWarning>
          <div className="min-h-full" suppressHydrationWarning>
            <div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-24 sm:px-6 sm:py-6 lg:px-8" suppressHydrationWarning>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav role={session.user.role} permissions={permissions} />

      {/* Mobile FAB — speed-dial for quick actions */}
      <MobileFAB />
    </div>
  );
}
