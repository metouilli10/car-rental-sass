import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

function getDbClient(db?: DbClient) {
  return db ?? prisma;
}

export function buildBookingRequestNotificationDedupeKey(bookingRequestId: string) {
  return `booking-request:${bookingRequestId}:BOOKING_REQUEST_CREATED`;
}

export function getBookingRequestNotificationHref(bookingRequestId: string) {
  return `/booking-requests?requestId=${bookingRequestId}#request-${bookingRequestId}`;
}

async function markBookingRequestNotificationDone(params: {
  agencyId: string;
  bookingRequestId: string;
  db?: DbClient;
}) {
  const db = getDbClient(params.db);

  await db.notification.updateMany({
    where: {
      agencyId: params.agencyId,
      dedupeKey: buildBookingRequestNotificationDedupeKey(params.bookingRequestId),
      type: "BOOKING_REQUEST_CREATED",
      status: "OPEN",
    },
    data: {
      status: "DONE",
      snoozedUntil: null,
    },
  });
}

export async function createBookingRequestNotification(params: {
  agencyId: string;
  bookingRequestId: string;
  customerName: string;
  vehicleLabel: string;
  db?: DbClient;
}) {
  const db = getDbClient(params.db);
  const dedupeKey = buildBookingRequestNotificationDedupeKey(params.bookingRequestId);

  return db.notification.upsert({
    where: {
      agencyId_dedupeKey: {
        agencyId: params.agencyId,
        dedupeKey,
      },
    },
    update: {
      type: "BOOKING_REQUEST_CREATED",
      title: "Nouvelle demande de réservation",
      body: `${params.customerName} a envoyé une demande pour ${params.vehicleLabel}`,
      severity: "INFO",
      actionUrl: getBookingRequestNotificationHref(params.bookingRequestId),
      status: "OPEN",
      snoozedUntil: null,
      dueAt: null,
      dueMileageKm: null,
      vehicleId: null,
      bookingId: null,
      lastEvaluatedAt: new Date(),
    },
    create: {
      agencyId: params.agencyId,
      type: "BOOKING_REQUEST_CREATED",
      dedupeKey,
      title: "Nouvelle demande de réservation",
      body: `${params.customerName} a envoyé une demande pour ${params.vehicleLabel}`,
      severity: "INFO",
      actionUrl: getBookingRequestNotificationHref(params.bookingRequestId),
      status: "OPEN",
      lastEvaluatedAt: new Date(),
    },
  });
}

export async function getUnreadBookingRequestCount(agencyId: string) {
  return prisma.bookingRequest.count({
    where: {
      agencyId,
      isRead: false,
    },
  });
}

export async function markBookingRequestAsRead(
  requestId: string,
  agencyId: string,
  db?: DbClient,
) {
  const client = getDbClient(db);

  const updateResult = await client.bookingRequest.updateMany({
    where: {
      id: requestId,
      agencyId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  if (updateResult.count > 0) {
    await markBookingRequestNotificationDone({
      agencyId,
      bookingRequestId: requestId,
      db: client,
    });
  }

  return updateResult.count > 0;
}
