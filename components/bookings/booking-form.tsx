import { BookingFormData } from "@/lib/validations/booking";
import { ReservationWizardPage } from "@/components/bookings/reservation-wizard-page";
import type {
  ActiveBookingSlot,
  BookingCustomerOption,
  BookingVehicleOption,
} from "@/components/bookings/types";

interface BookingFormProps {
  customers: BookingCustomerOption[];
  vehicles: BookingVehicleOption[];
  locationOptions: string[];
  activeBookings: ActiveBookingSlot[];
  prefilledVehicleId?: string;
  prefilledCustomerId?: string;
  prefilledStartAt?: string;
  prefilledEndAt?: string;
  onSubmit: (
    data: BookingFormData,
  ) => Promise<{ error: string } | { success: boolean; bookingId: string } | void>;
}

export function BookingForm(props: BookingFormProps) {
  return <ReservationWizardPage {...props} />;
}
