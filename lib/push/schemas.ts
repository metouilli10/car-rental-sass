import { z } from "zod";

const pushKeysSchema = z.object({
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

const webPushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: pushKeysSchema,
});

export const pushSubscribeRequestSchema = z.object({
  subscription: webPushSubscriptionSchema,
  deviceLabel: z.string().trim().max(120).optional().nullable(),
  platform: z.string().trim().max(120).optional().nullable(),
});

export const pushUnsubscribeRequestSchema = z.object({
  endpoint: z.string().url(),
});

export type PushSubscribeRequest = z.infer<typeof pushSubscribeRequestSchema>;
export type PushUnsubscribeRequest = z.infer<typeof pushUnsubscribeRequestSchema>;
