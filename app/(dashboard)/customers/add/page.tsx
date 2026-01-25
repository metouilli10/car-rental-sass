import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { createCustomer } from "@/lib/actions/customers";

export default function AddCustomerPage() {
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
