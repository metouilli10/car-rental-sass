import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Builds a WhatsApp link for sharing a vehicle offer.
 */
export function buildOfferWhatsAppLink(params: {
  vehicleName: string;
  plate: string;
  pricePerDay: number;
  depositAmount: number;
  startDate: Date;
  endDate: Date;
  phone?: string;
}) {
  const { vehicleName, plate, pricePerDay, depositAmount, startDate, endDate, phone } = params;
  
  const startStr = format(startDate, "dd/MM/yyyy");
  const endStr = format(endDate, "dd/MM/yyyy");
  
  const message = `Bonjour, voici une option disponible du ${startStr} au ${endStr} :
${vehicleName} (${plate}) — ${pricePerDay} MAD/jour — Caution ${depositAmount} MAD.
Souhaitez-vous réserver ?`;

  const encodedMessage = encodeURIComponent(message);
  const baseUrl = phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : `https://wa.me/`;
  
  return `${baseUrl}?text=${encodedMessage}`;
}

/**
 * Builds a WhatsApp link for booking confirmation.
 */
export function buildConfirmationWhatsAppLink(params: {
  vehicleName: string;
  plate: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  depositAmount: number;
  phone: string;
}) {
  const { vehicleName, plate, startDate, endDate, totalPrice, depositAmount, phone } = params;
  
  const startStr = format(startDate, "dd/MM/yyyy");
  const endStr = format(endDate, "dd/MM/yyyy");
  
  const message = `Votre réservation est confirmée ✅
Véhicule: ${vehicleName} (${plate})
Dates: ${startStr} → ${endStr}
Prix: ${totalPrice} MAD
Caution: ${depositAmount} MAD
Merci.`;

  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phone.replace(/\D/g, '');
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
