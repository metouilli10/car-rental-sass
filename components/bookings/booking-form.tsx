import { BookingFormData } from "@/lib/validations/booking";
import { ReservationCreatePage } from "@/components/bookings/reservation-create-page";
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
  onSubmit: (
    data: BookingFormData,
  ) => Promise<{ error: string } | { success: boolean; bookingId: string } | void>;
}

export function BookingForm(props: BookingFormProps) {
  return <ReservationCreatePage {...props} />;
}
