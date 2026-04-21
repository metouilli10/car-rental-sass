import webpush from "web-push";
import type { NotificationEventType, PushSubscription as StoredPushSubscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PushNotificationPayload } from "@/lib/push/payloads";

type PushEventTracking = {
  notificationId: string;
  eventType: NotificationEventType;
};

export type PushDeliveryResult = {
  subscriptionId: string;
  userId: string;
  endpoint: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  permanentFailure: boolean;
  deactivated: boolean;
};

let configured = false;

function getRequiredEnv(name: "VAPID_PRIVATE_KEY" | "VAPID_SUBJECT") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function isWebPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim(),
  );
}

function configureWebPush() {
  if (configured) {
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured");
  }

  webpush.setVapidDetails(
    getRequiredEnv("VAPID_SUBJECT"),
    publicKey,
    getRequiredEnv("VAPID_PRIVATE_KEY"),
  );
  configured = true;
}

function getErrorMetadata(error: unknown) {
  const maybeError = error as {
    body?: unknown;
    message?: unknown;
    statusCode?: unknown;
  } | null;

  const statusCode =
    typeof maybeError?.statusCode === "number" ? maybeError.statusCode : undefined;
  const body = typeof maybeError?.body === "string" ? maybeError.body : undefined;
  const message =
    typeof maybeError?.message === "string"
      ? maybeError.message
      : body ?? "PUSH_SEND_FAILED";

  return { statusCode, message };
}

function isPermanentFailure(statusCode: number | undefined, message: string) {
  if (statusCode === 404 || statusCode === 410) {
    return true;
  }

  return /expired|invalid|unsubscribe|gone|notregistered|no longer valid/i.test(message);
}

function toWebPushSubscription(subscription: StoredPushSubscription) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };
}

async function recordNotificationEvent(params: {
  tracking: PushEventTracking;
  subscription: StoredPushSubscription;
  status: "SENT" | "FAILED";
  error?: string;
}) {
  await prisma.notificationEvent.create({
    data: {
      notificationId: params.tracking.notificationId,
      userId: params.subscription.userId,
      pushSubscriptionId: params.subscription.id,
      channel: "PUSH",
      eventType: params.tracking.eventType,
      status: params.status,
      lastError: params.error ?? null,
    },
  });
}

export async function sendPushToSubscription(
  subscription: StoredPushSubscription,
  payload: PushNotificationPayload,
  tracking?: PushEventTracking,
): Promise<PushDeliveryResult> {
  configureWebPush();

  try {
    await webpush.sendNotification(
      toWebPushSubscription(subscription),
      JSON.stringify(payload),
    );

    if (tracking) {
      await recordNotificationEvent({
        tracking,
        subscription,
        status: "SENT",
      });
    }

    return {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      endpoint: subscription.endpoint,
      success: true,
      permanentFailure: false,
      deactivated: false,
    };
  } catch (error) {
    const { message, statusCode } = getErrorMetadata(error);
    const permanentFailure = isPermanentFailure(statusCode, message);
    let deactivated = false;

    if (permanentFailure) {
      await prisma.pushSubscription.updateMany({
        where: { id: subscription.id, isActive: true },
        data: { isActive: false },
      });
      deactivated = true;
    }

    if (tracking) {
      await recordNotificationEvent({
        tracking,
        subscription,
        status: "FAILED",
        error: message,
      });
    }

    return {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      endpoint: subscription.endpoint,
      success: false,
      statusCode,
      error: message,
      permanentFailure,
      deactivated,
    };
  }
}

export async function sendPushToMany(
  subscriptions: StoredPushSubscription[],
  payload: PushNotificationPayload,
  tracking?: PushEventTracking,
) {
  const results = await Promise.all(
    subscriptions.map((subscription) =>
      sendPushToSubscription(subscription, payload, tracking),
    ),
  );

  return {
    results,
    successCount: results.filter((result) => result.success).length,
    failureCount: results.filter((result) => !result.success).length,
    deactivatedCount: results.filter((result) => result.deactivated).length,
  };
}
