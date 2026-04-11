import { notFound, redirect } from "next/navigation";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { supportsCustomerDocumentBacks } from "@/lib/customer-document-backs";
import { canManageCustomers } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { updateCustomer } from "@/lib/actions/customers";
import { CustomerFormData } from "@/lib/validations/customer";
import { isValidLocale, type AppLocale, withLocalePath } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const currentUser = await getCurrentUserAccessForPage();
  const { locale: localeParam, id } = await params;
  if (!isValidLocale(localeParam)) {
    notFound();
  }
  const locale: AppLocale = localeParam;
  const ui = getMessages(locale);
  const pc = ui.pageChrome.customers;

  if (!canManageCustomers(currentUser.role, currentUser.permissions)) {
    redirect(withLocalePath(locale, "/customers"));
  }
  const hasDocumentBacks = await supportsCustomerDocumentBacks();

  const customer = await prisma.customer.findFirst({
    where: { id, agencyId: currentUser.agencyId },
    select: {
      customerType: true,
      name: true,
      email: true,
      phone: true,
      nationality: true,
      passportOrCIN: true,
      passportOrCINExpiry: true,
      passportPhotoUrl: true,
      licensePhotoUrl: true,
      ice: true,
      rc: true,
      representativeName: true,
      address: true,
      ...(hasDocumentBacks
        ? {
            passportPhotoBackUrl: true,
            licensePhotoBackUrl: true,
          }
        : {}),
    },
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
      <PageHeader title={pc.editTitle} description={customer.name} />

      <CustomerForm
        defaultValues={{
          customerType: customer.customerType,
          name: customer.name,
          email: customer.email || "",
          phone: customer.phone,
          nationality: customer.nationality,
          passportOrCIN: customer.passportOrCIN || undefined,
          // @ts-expect-error - passportOrCINExpiry expects string (input type) not Date (output type)
          passportOrCINExpiry: customer.passportOrCINExpiry
            ? customer.passportOrCINExpiry.toISOString().slice(0, 10)
            : undefined,
          passportPhotoUrl: customer.passportPhotoUrl || undefined,
          passportPhotoBackUrl: hasDocumentBacks
            ? customer.passportPhotoBackUrl || undefined
            : undefined,
          licensePhotoUrl: customer.licensePhotoUrl || undefined,
          licensePhotoBackUrl: hasDocumentBacks
            ? customer.licensePhotoBackUrl || undefined
            : undefined,
          ice: customer.ice || undefined,
          rc: customer.rc || undefined,
          representativeName: customer.representativeName || undefined,
          address: customer.address || undefined,
        }}
        onSubmit={handleUpdate}
        submitLabel={pc.editSubmit}
      />
    </div>
  );
}
