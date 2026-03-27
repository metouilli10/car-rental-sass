import { redirect } from "next/navigation";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomer } from "@/lib/actions/customers";
import { canManageCustomers } from "@/lib/permissions";

export default async function AddCustomerPage() {
  const currentUser = await getCurrentUserAccessForPage();

  if (!canManageCustomers(currentUser.role, currentUser.permissions)) {
    redirect("/customers");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajouter un client"
        description="Enregistrer un nouveau client"
      />

      <CustomerForm onSubmit={createCustomer} submitLabel="Ajouter le client" />
    </div>
  );
}
