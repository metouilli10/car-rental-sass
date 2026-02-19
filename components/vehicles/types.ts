export interface ActiveVehicleBooking {
  id?: string;
  startDate: Date | string;
  endDate: Date | string;
  customer: { id: string; name: string };
}

export interface VehicleListItem {
  id: string;
  make: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  gearbox: string;
  pricePerDay: number;
  status: string;
  bookings?: ActiveVehicleBooking[];
}
