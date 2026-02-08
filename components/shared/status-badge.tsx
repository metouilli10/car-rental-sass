import { Badge } from "@/components/ui/badge";

type VehicleStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE" | "UNAVAILABLE";
type BookingStatus = "DRAFT" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELED";
type PaymentStatus = "PENDING" | "PAID" | "REFUNDED";
type DepositStatus = "HELD" | "PARTIAL_RETURNED" | "RETURNED" | "FORFEITED";

type Status = VehicleStatus | BookingStatus | PaymentStatus | DepositStatus;

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<
  Status,
  { label: string; variant: "default" | "success" | "warning" | "destructive" | "info" | "secondary" }
> = {
  // Vehicle statuses
  AVAILABLE: { label: "Disponible", variant: "success" },
  RENTED: { label: "Loué", variant: "info" },
  MAINTENANCE: { label: "Maintenance", variant: "warning" },
  UNAVAILABLE: { label: "Indisponible", variant: "destructive" },

  // Booking statuses
  DRAFT: { label: "Brouillon", variant: "secondary" },
  CONFIRMED: { label: "Confirmé", variant: "info" },
  ACTIVE: { label: "Actif", variant: "success" },
  COMPLETED: { label: "Terminé", variant: "secondary" },
  CANCELED: { label: "Annulé", variant: "destructive" },

  // Payment statuses
  PENDING: { label: "En attente", variant: "warning" },
  PAID: { label: "Payé", variant: "success" },
  REFUNDED: { label: "Remboursé", variant: "secondary" },

  // Deposit statuses
  HELD: { label: "Retenue", variant: "warning" },
  PARTIAL_RETURNED: { label: "Partiel", variant: "info" },
  RETURNED: { label: "Retournée", variant: "success" },
  FORFEITED: { label: "Confisquée", variant: "destructive" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    return <Badge variant="secondary">{status}</Badge>;
  }

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
