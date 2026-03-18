/**
 * Search-related constants and types.
 * Kept separate from lib/actions/search.ts because "use server" files
 * can only export async functions.
 */
export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Actif", color: "text-blue-600 bg-blue-50" },
  CONFIRMED: { label: "Confirmé", color: "text-emerald-600 bg-emerald-50" },
  COMPLETED: { label: "Terminé", color: "text-gray-500 bg-gray-100" },
  CANCELED: { label: "Annulé", color: "text-red-600 bg-red-50" },
  DRAFT: { label: "Brouillon", color: "text-amber-600 bg-amber-50" },
  PENDING: { label: "En attente", color: "text-amber-700 bg-amber-50" },
  ASSIGNED: { label: "Assignée", color: "text-blue-600 bg-blue-50" },
  PAID: { label: "Payée", color: "text-emerald-600 bg-emerald-50" },
  CONTESTED: { label: "Contestée", color: "text-red-600 bg-red-50" },
  AVAILABLE: { label: "Disponible", color: "text-emerald-600 bg-emerald-50" },
  RENTED: { label: "Loué", color: "text-blue-600 bg-blue-50" },
  MAINTENANCE: { label: "Maintenance", color: "text-amber-600 bg-amber-50" },
  UNAVAILABLE: { label: "Désactivé", color: "text-gray-500 bg-gray-100" },
};
