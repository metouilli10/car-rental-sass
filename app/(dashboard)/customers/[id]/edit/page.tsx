import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
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
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer || customer.agencyId !== session.user.agencyId) {
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
          name: customer.name,
          email: customer.email || "",
          phone: customer.phone,
          passportOrCIN: customer.passportOrCIN,
        }}
        onSubmit={handleUpdate}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  );
}
