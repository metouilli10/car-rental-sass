/**
 * Notification delivery channel service interfaces.
 *
 * Email and WhatsApp channels are architecture placeholders.
 * They log intent and create NotificationEvent records for auditability,
 * but do NOT send actual messages yet.
 *
 * To implement a real channel, replace the body of the relevant function
 * with provider SDK code (e.g. Resend, Twilio, WhatsApp Cloud API).
 */

import { prisma } from "@/lib/prisma";

export interface NotificationDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Email (placeholder) ────────────────────────────────────────────────────

export async function sendEmailNotification(
  notificationId: string
): Promise<NotificationDeliveryResult> {
  // Log intent for observability
  console.log(
    `[channels] Email notification requested for notificationId=${notificationId} — NOT_IMPLEMENTED`
  );

  // Create an audit event record
  await prisma.notificationEvent.create({
    data: {
      notificationId,
      channel: "EMAIL",
      status: "PENDING",
      lastError: "Email delivery not implemented yet",
    },
  });

  return { success: false, error: "NOT_IMPLEMENTED" };
}

// ─── WhatsApp (placeholder) ────────────────────────────────────────────────

export async function sendWhatsAppNotification(
  notificationId: string
): Promise<NotificationDeliveryResult> {
  console.log(
    `[channels] WhatsApp notification requested for notificationId=${notificationId} — NOT_IMPLEMENTED`
  );

  await prisma.notificationEvent.create({
    data: {
      notificationId,
      channel: "WHATSAPP",
      status: "PENDING",
      lastError: "WhatsApp delivery not implemented yet",
    },
  });

  return { success: false, error: "NOT_IMPLEMENTED" };
}
