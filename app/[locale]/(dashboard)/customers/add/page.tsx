import { redirect } from "next/navigation";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomer } from "@/lib/actions/customers";
import { canManageCustomers } from "@/lib/permissions";
import { requireLocaleParam } from "@/lib/i18n/server-params";
import { withLocalePath } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function AddCustomerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await requireLocaleParam(params);
  const ui = getMessages(locale);
  const pc = ui.pageChrome.customers;
  const currentUser = await getCurrentUserAccessForPage();

  if (!canManageCustomers(currentUser.role, currentUser.permissions)) {
    redirect(withLocalePath(locale, "/customers"));
  }

  return (
    <div className="space-y-6">
      <PageHeader title={pc.addTitle} description={pc.addDescription} />

      <CustomerForm onSubmit={createCustomer} submitLabel={pc.addSubmit} />
    </div>
  );
}
