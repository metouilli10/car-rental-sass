import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { TopNavBar } from "@/components/shared/top-nav-bar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { Toaster } from "sonner";
import {
  getNotificationsSummary,
  type NotificationSummaryItem,
} from "@/lib/notifications/queries";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions } from "@/lib/permissions";
import {
  isAgencyEligibleForGuidedOnboarding,
} from "@/lib/onboarding/agency-onboarding";

export const runtime = "nodejs";

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
  if (!agencyId) {
    redirect("/setup");
  }
  let displayAgencyName = session.user.agencyName || "Agence";
  let agency: {
    setupCompletedAt: Date | null;
    name: string;
    logoUrl: string | null;
    createdAt: Date;
    onboardingVehicleAdded: boolean;
    onboardingReservationCreated: boolean;
    onboardingPaymentRecorded: boolean;
    onboardingDashboardExplored: boolean;
    onboardingCompleted: boolean;
  } | null = null;
  let notifSummary: { count: number; items: NotificationSummaryItem[] } = {
    count: 0,
    items: [],
  };
  let currentUser: { permissionOverrides: unknown } | null = null;
  let onboardingNav: {
    eligible: boolean;
    completed: boolean;
    completedCount: number;
    totalCount: number;
  } | undefined;

  try {
    const [agencyResult, notifResult] = await Promise.all([
      prisma.agency.findUnique({
        where: { id: agencyId },
        select: {
          setupCompletedAt: true,
          name: true,
          logoUrl: true,
          createdAt: true,
          onboardingVehicleAdded: true,
          onboardingReservationCreated: true,
          onboardingPaymentRecorded: true,
          onboardingDashboardExplored: true,
          onboardingCompleted: true,
        },
      }),
      getNotificationsSummary(agencyId).catch(
        (): { count: number; items: NotificationSummaryItem[] } => ({
          count: 0,
          items: [],
        })
      ),
    ]);
    agency = agencyResult;
    notifSummary = notifResult;

    if (agency?.setupCompletedAt == null) {
      redirect("/setup");
    }
    displayAgencyName = agency.name ?? displayAgencyName;

    currentUser = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        agencyId,
      },
      select: {
        permissionOverrides: true,
      },
    });

    if (agency && isAgencyEligibleForGuidedOnboarding(agency.createdAt)) {
      const completedCount = [
        agency.onboardingVehicleAdded,
        agency.onboardingReservationCreated,
        agency.onboardingPaymentRecorded,
        agency.onboardingDashboardExplored,
      ].filter(Boolean).length;

      onboardingNav = {
        eligible: true,
        completed: agency.onboardingCompleted,
        completedCount,
        totalCount: 4,
      };
    }
  } catch (err) {
    console.error("Dashboard layout error:", err);
    if (agencyId && agency == null) {
      redirect("/setup");
    }
  }

  if (agencyId && agency != null && !agency.setupCompletedAt) {
    redirect("/setup");
  }
  const permissions = getEffectivePermissions(
    session.user.role,
    currentUser?.permissionOverrides ?? null,
  );

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]" suppressHydrationWarning>
      {/* Collapsible Sidebar */}
      <Sidebar
        agencyName={displayAgencyName}
        role={session.user.role}
        permissions={permissions}
        onboarding={onboardingNav}
      />

      <Toaster richColors position="top-right" />

      {/* Right side — TopNav + Content */}
      <div className="flex min-w-0 flex-1 flex-col bg-transparent" suppressHydrationWarning>
        <TopNavBar
          userName={session.user.name || "Utilisateur"}
          userEmail={session.user.email || ""}
          agencyName={displayAgencyName}
          agencyLogoUrl={agency?.logoUrl ?? undefined}
          notifCount={notifSummary.count}
          topNotifs={notifSummary.items}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-transparent" suppressHydrationWarning>
          <div className="min-h-full" suppressHydrationWarning>
            <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-4 sm:px-6 sm:py-5 lg:px-8" suppressHydrationWarning>
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav permissions={permissions} />
    </div>
  );
}
