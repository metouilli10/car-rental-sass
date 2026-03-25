import { redirect } from "next/navigation";
import { TopNavBar } from "@/components/shared/top-nav-bar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";
import {
  getNotificationsSummary,
  type NotificationSummaryItem,
} from "@/lib/notifications/queries";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions } from "@/lib/permissions";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import {
  isAgencyEligibleForGuidedOnboarding,
} from "@/lib/onboarding/agency-onboarding";

export const runtime = "nodejs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUserAccessForPage();
  const agencyId = currentUser.agencyId;
  let displayAgencyName = currentUser.agencyName || "Agence";
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
    currentUser.role,
    currentUser.permissionOverrides,
  );

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]" suppressHydrationWarning>
      {/* Collapsible Sidebar */}
      <Sidebar
        agencyName={displayAgencyName}
        role={currentUser.role}
        permissions={permissions}
        onboarding={onboardingNav}
      />

      <Toaster richColors position="top-right" />

      {/* Right side — TopNav + Content */}
      <div className="flex min-w-0 flex-1 flex-col bg-transparent" suppressHydrationWarning>
        <TopNavBar
          userName={currentUser.name || "Utilisateur"}
          userEmail={currentUser.email}
          agencyName={displayAgencyName}
          role={currentUser.role}
          permissions={permissions}
          agencyLogoUrl={agency?.logoUrl ?? undefined}
          notifCount={notifSummary.count}
          topNotifs={notifSummary.items}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-transparent" suppressHydrationWarning>
          <div className="min-h-full" suppressHydrationWarning>
            <div className="mx-auto w-full max-w-[1440px] px-4 pb-8 pt-4 sm:px-6 sm:py-5 lg:px-8" suppressHydrationWarning>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
