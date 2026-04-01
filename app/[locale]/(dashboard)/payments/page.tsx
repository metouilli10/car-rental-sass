import { redirect } from "next/navigation";
import { requireLocaleParam } from "@/lib/i18n/server-params";
import { withLocalePath } from "@/lib/i18n/config";

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await requireLocaleParam(params);
  redirect(withLocalePath(locale, "/finance"));
}
