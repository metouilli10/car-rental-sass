export const INFRACTION_TYPE_LABELS: Record<string, string> = {
  SPEEDING: "Excès de vitesse",
  PARKING: "Stationnement",
  RED_LIGHT: "Feu rouge",
  TOLL: "Péage",
  OTHER: "Autre",
};

export const INFRACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ASSIGNED: "Assignée",
  PAID: "Payée",
  CONTESTED: "Contestée",
};

export const INFRACTION_TYPE_OPTIONS = [
  { value: "SPEEDING", label: "Excès de vitesse" },
  { value: "PARKING", label: "Stationnement" },
  { value: "RED_LIGHT", label: "Feu rouge" },
  { value: "TOLL", label: "Péage" },
  { value: "OTHER", label: "Autre" },
] as const;

export const INFRACTION_STATUS_OPTIONS = [
  { value: "PENDING", label: "En attente" },
  { value: "ASSIGNED", label: "Assignée" },
  { value: "PAID", label: "Payée" },
  { value: "CONTESTED", label: "Contestée" },
] as const;
