import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\s/g, " ") + " MAD";
}

/** Format amount with DH suffix (matches PDF contract style) */
export function formatCurrencyDH(amount: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\s/g, " ") + " DH";
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: fr });
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: fr });
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "HH:mm", { locale: fr });
}

export function formatPhoneForCall(phone?: string | null): string | null {
  const cleanPhone = phone?.replace(/\D/g, "") ?? "";
  if (!cleanPhone) return null;

  return cleanPhone.startsWith("212")
    ? `+${cleanPhone}`
    : `+212${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}`;
}

/** Build wa.me link for Morocco (212) with optional prefilled message */
export function formatWhatsAppLink(
  phone?: string | null,
  message?: string
): string | null {
  const cleanPhone = phone?.replace(/\D/g, "") ?? "";
  if (!cleanPhone) return null;

  const fullPhone = cleanPhone.startsWith("212")
    ? cleanPhone
    : `212${cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone}`;
  const query = message
    ? `?text=${encodeURIComponent(message)}`
    : "";
  return `https://wa.me/${fullPhone}${query}`;
}
