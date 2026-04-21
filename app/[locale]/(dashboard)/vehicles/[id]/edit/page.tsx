import { notFound, redirect } from "next/navigation";
import { canManageVehicles } from "@/lib/permissions";
import { getCurrentUserAccessForPage } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { updateVehicle } from "@/lib/actions/vehicles";
import { VehicleFormData } from "@/lib/validations/vehicle";
import { getVehicleFuelType } from "@/lib/vehicle-fuel-type";
import { isValidLocale, type AppLocale, withLocalePath } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default async function EditVehiclePage({
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
  const pv = ui.pageChrome.vehicles;

  if (!canManageVehicles(currentUser.role, currentUser.permissions)) {
    redirect(withLocalePath(locale, "/vehicles"));
  }

  const [vehicle, fuelType] = await Promise.all([
    prisma.vehicle.findFirst({
      where: { id, agencyId: currentUser.agencyId },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        plate: true,
        color: true,
        pricePerDay: true,
        depositAmount: true,
        gearbox: true,
        mileage: true,
        currentKm: true,
        status: true,
        photoUrl: true,
        publishedToWebsite: true,
      },
    }),
    getVehicleFuelType(id),
  ]);

  if (!vehicle) {
    notFound();
  }

  const handleUpdate = async (data: VehicleFormData) => {
    "use server";
    return updateVehicle(id, data);
  };

  return (
    <div className="space-y-6 min-h-screen">
      <PageHeader
        title={pv.editTitle}
        description={`${vehicle.make} ${vehicle.model} - ${vehicle.plate}`}
      />

      <VehicleForm
        defaultValues={{
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          plate: vehicle.plate,
          color: vehicle.color,
          pricePerDay: vehicle.pricePerDay,
          depositAmount: vehicle.depositAmount,
          gearbox: vehicle.gearbox,
          fuelType,
          mileage: vehicle.mileage ?? undefined,
          currentKm: vehicle.currentKm ?? undefined,
          status: vehicle.status,
          photoUrl: vehicle.photoUrl ?? undefined,
          publishedToWebsite: vehicle.publishedToWebsite,
        }}
        onSubmit={handleUpdate}
        submitLabel={pv.editSubmit}
      />
    </div>
  );
}
