export interface BookingCustomerOption {
  id: string;
  name: string;
  phone: string;
  bookingCount: number;
  lastBookingAt: Date | null;
  unpaidCount: number;
  isVip: boolean;
  isBlacklisted: boolean;
}

export interface BookingVehicleOption {
  id: string;
  make: string;
  model: string;
  plate: string;
  pricePerDay: number;
  depositAmount: number;
  category: string;
  status: string;
}

export interface ActiveBookingSlot {
  id: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
}

export interface PricingDerived {
  durationText: string;
  billableDays: number;
  billableHours: number;
  basePrice: number;
  addonsTotal: number;
  discountAmount: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  remaining: number;
}
