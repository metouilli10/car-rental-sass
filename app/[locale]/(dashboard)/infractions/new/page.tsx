import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { InfractionForm } from "@/components/infractions/infraction-form";
import { requireLocaleParam } from "@/lib/i18n/server-params";
import { getMessages } from "@/lib/i18n/messages";

export default async function NewInfractionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await requireLocaleParam(params);
  const ui = getMessages(locale);
  const inc = ui.pageChrome.infractionNew;
  const session = await getSession();
  if (!session) redirect("/login");

  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId: session.user.agencyId },
    select: { id: true, plate: true, make: true, model: true },
    orderBy: { plate: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title={inc.title} description={inc.description} />
      <InfractionForm vehicles={vehicles} />
    </div>
  );
}
