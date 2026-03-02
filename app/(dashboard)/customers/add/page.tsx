import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomer } from "@/lib/actions/customers";
import { prisma } from "@/lib/prisma";
import { canManageCustomers } from "@/lib/permissions";

export default async function AddCustomerPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findFirst({
    where: { id: session.user.id, agencyId: session.user.agencyId },
    select: { permissionOverrides: true },
  });

  if (!canManageCustomers(session.user.role, currentUser?.permissionOverrides ?? null)) {
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
