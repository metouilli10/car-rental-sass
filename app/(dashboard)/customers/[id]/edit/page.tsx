import { notFound, redirect } from "next/navigation";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { canManageCustomers } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { updateCustomer } from "@/lib/actions/customers";
import { CustomerFormData } from "@/lib/validations/customer";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUserAccessForPage();

  if (!canManageCustomers(currentUser.role, currentUser.permissions)) {
    redirect("/customers");
  }

  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, agencyId: currentUser.agencyId },
  });

  if (!customer) {
    notFound();
  }

  const handleUpdate = async (data: CustomerFormData) => {
    "use server";
    return updateCustomer(id, data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifier le client"
        description={customer.name}
      />

      <CustomerForm
        defaultValues={{
          customerType: customer.customerType,
          name: customer.name,
          email: customer.email || "",
          phone: customer.phone,
          passportOrCIN: customer.passportOrCIN || undefined,
          // @ts-expect-error - passportOrCINExpiry expects string (input type) not Date (output type)
          passportOrCINExpiry: customer.passportOrCINExpiry
            ? customer.passportOrCINExpiry.toISOString().slice(0, 10)
            : undefined,
          passportPhotoUrl: customer.passportPhotoUrl || undefined,
          licensePhotoUrl: customer.licensePhotoUrl || undefined,
          ice: customer.ice || undefined,
          rc: customer.rc || undefined,
          representativeName: customer.representativeName || undefined,
          address: customer.address || undefined,
        }}
        onSubmit={handleUpdate}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  );
}
