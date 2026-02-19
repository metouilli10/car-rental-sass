"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CalendarBooking } from "@/lib/actions/calendar";
import {
  addDaysLocal,
  buildReservationsByVehicle,
  dayKeyToLocalDate,
  toDayKeyLocal,
  validateCandidateInterval,
} from "./conflict";

export type Interaction =
  | { type: "idle" }
  | {
      type: "drag";
      reservationId: string;
      originX: number;
      originDay: number;
      initial: { start: Date; end: Date; vehicleId: string };
      next: { start: Date; end: Date; vehicleId: string };
      deltaDays: number;
      valid: boolean;
      reason?: string;
    }
  | {
      type: "resize";
      reservationId: string;
      edge: "start" | "end";
      originX: number;
      originDay: number;
      initial: { start: Date; end: Date; vehicleId: string };
      next: { start: Date; end: Date; vehicleId: string };
      deltaDays: number;
      valid: boolean;
      reason?: string;
    }
  | {
      type: "create";
      vehicleId: string;
      originX: number;
      startDay: number;
      endDay: number;
      start: Date;
      end: Date;
      valid: boolean;
      reason?: string;
    };

type Measure = {
  rowLeft: number;
  colWidth: number;
};

type CommitResult = {
  id: string;
  startDate: string;
  endDate: string;
  updatedAt?: string;
};

export function getDayIndexFromClientX(
  clientX: number,
  rowLeft: number,
  colWidth: number,
  scrollLeft: number,
): number {
  const relativeX = clientX + scrollLeft - rowLeft;
  const day = Math.round(relativeX / colWidth);
  return Math.max(0, Math.min(6, day));
}

type UseCalendarInteractionsArgs = {
  weekStart: Date;
  bookings: CalendarBooking[];
  canEdit: boolean;
  setBookings: React.Dispatch<React.SetStateAction<CalendarBooking[]>>;
  onCommitDates: (payload: {
    bookingId: string;
    startDate: Date;
    endDate: Date;
    updatedAt?: Date;
  }) => Promise<CommitResult>;
  onCreateFromRange: (payload: {
    vehicleId: string;
    startDate: Date;
    endDate: Date;
  }) => void;
  onError: (message: string) => void;
};

export function useCalendarInteractions({
  weekStart,
  bookings,
  canEdit,
  setBookings,
  onCommitDates,
  onCreateFromRange,
  onError,
}: UseCalendarInteractionsArgs) {
  const [interaction, setInteraction] = useState<Interaction>({ type: "idle" });
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});

  const byVehicle = useMemo(
    () => buildReservationsByVehicle(bookings),
    [bookings],
  );

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const rowElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const rowMeasuresRef = useRef<Map<string, Measure>>(new Map());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pointerRef = useRef<{
    pointerId: number;
    clientX: number;
    targetVehicleId: string;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const interactionRef = useRef<Interaction>({ type: "idle" });
  const bookingsRef = useRef<CalendarBooking[]>(bookings);

  const calculateMeasure = useCallback((element: HTMLDivElement): Measure => {
    const rect = element.getBoundingClientRect();
    return {
      rowLeft: rect.left,
      colWidth: rect.width / 7,
    };
  }, []);

  useEffect(() => {
    interactionRef.current = interaction;
  }, [interaction]);

  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  useEffect(() => {
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLDivElement;
        const vehicleId = el.dataset.vehicleId;
        if (!vehicleId) continue;
        rowMeasuresRef.current.set(vehicleId, calculateMeasure(el));
      }
    });
    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [calculateMeasure]);

  const registerRowRef = useCallback(
    (vehicleId: string) => (node: HTMLDivElement | null) => {
      const existing = rowElementsRef.current.get(vehicleId);
      if (existing && (!node || existing !== node)) {
        resizeObserverRef.current?.unobserve(existing);
        rowElementsRef.current.delete(vehicleId);
        rowMeasuresRef.current.delete(vehicleId);
      }

      if (!node) return;
      node.dataset.vehicleId = vehicleId;
      rowElementsRef.current.set(vehicleId, node);
      rowMeasuresRef.current.set(vehicleId, calculateMeasure(node));
      resizeObserverRef.current?.observe(node);
    },
    [calculateMeasure],
  );

  const onPointerMove = useCallback((event: PointerEvent) => {
    if (!pointerRef.current || pointerRef.current.pointerId !== event.pointerId) {
      return;
    }

    pointerRef.current.clientX = event.clientX;
    if (rafRef.current !== null) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const pointer = pointerRef.current;
      if (!pointer) return;
      const measure = rowMeasuresRef.current.get(pointer.targetVehicleId);
      if (!measure) return;

      const scrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;
      const currentDay = getDayIndexFromClientX(
        pointer.clientX,
        measure.rowLeft,
        measure.colWidth,
        scrollLeft,
      );

      setInteraction((prev) => {
        if (prev.type === "idle") return prev;

        if (prev.type === "drag") {
          const deltaDays = currentDay - prev.originDay;
          const startBase = dayKeyToLocalDate(toDayKeyLocal(prev.initial.start));
          const endBase = dayKeyToLocalDate(toDayKeyLocal(prev.initial.end));
          const nextStart = addDaysLocal(startBase, deltaDays);
          const nextEnd = addDaysLocal(endBase, deltaDays);

          const validation = validateCandidateInterval({
            vehicleId: prev.initial.vehicleId,
            start: nextStart,
            endExclusive: nextEnd,
            byVehicle,
            excludeBookingId: prev.reservationId,
          });

          return {
            ...prev,
            deltaDays,
            next: {
              start: nextStart,
              end: nextEnd,
              vehicleId: prev.initial.vehicleId,
            },
            valid: validation.valid,
            reason: validation.reason,
          };
        }

        if (prev.type === "resize") {
          const deltaDays = currentDay - prev.originDay;
          const startBase = dayKeyToLocalDate(toDayKeyLocal(prev.initial.start));
          const endBase = dayKeyToLocalDate(toDayKeyLocal(prev.initial.end));

          let nextStart = startBase;
          let nextEnd = endBase;

          if (prev.edge === "start") {
            const maxStart = addDaysLocal(endBase, -1);
            const candidate = addDaysLocal(startBase, deltaDays);
            nextStart = candidate > maxStart ? maxStart : candidate;
          } else {
            const minEnd = addDaysLocal(startBase, 1);
            const candidate = addDaysLocal(endBase, deltaDays);
            nextEnd = candidate < minEnd ? minEnd : candidate;
          }

          const validation = validateCandidateInterval({
            vehicleId: prev.initial.vehicleId,
            start: nextStart,
            endExclusive: nextEnd,
            byVehicle,
            excludeBookingId: prev.reservationId,
          });

          return {
            ...prev,
            deltaDays,
            next: {
              start: nextStart,
              end: nextEnd,
              vehicleId: prev.initial.vehicleId,
            },
            valid: validation.valid,
            reason: validation.reason,
          };
        }

        if (prev.type === "create") {
          const startDay = Math.min(prev.startDay, currentDay);
          const endDay = Math.max(prev.startDay, currentDay);
          const start = addDaysLocal(
            dayKeyToLocalDate(toDayKeyLocal(weekStart)),
            startDay,
          );
          const end = addDaysLocal(
            dayKeyToLocalDate(toDayKeyLocal(weekStart)),
            endDay + 1,
          );

          const validation = validateCandidateInterval({
            vehicleId: prev.vehicleId,
            start,
            endExclusive: end,
            byVehicle,
          });

          return {
            ...prev,
            startDay,
            endDay,
            start,
            end,
            valid: validation.valid,
            reason: validation.reason,
          };
        }

        return prev;
      });
    });
  }, [byVehicle, weekStart]);

  const onPointerUp = useCallback(async (event: PointerEvent) => {
    if (!pointerRef.current || pointerRef.current.pointerId !== event.pointerId) {
      return;
    }

    const currentInteraction = interactionRef.current;
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pointerRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);

    if (currentInteraction.type === "drag" || currentInteraction.type === "resize") {
      if (!canEdit) {
        setInteraction({ type: "idle" });
        return;
      }

      if (!currentInteraction.valid) {
        onError(currentInteraction.reason ?? "Action impossible");
        setInteraction({ type: "idle" });
        return;
      }

      const previous = currentInteraction.initial;
      const next = currentInteraction.next;

      const targetBooking = bookingsRef.current.find(
        (booking) => booking.id === currentInteraction.reservationId,
      );

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === currentInteraction.reservationId
            ? {
                ...booking,
                startDate: new Date(next.start),
                endDate: new Date(next.end),
              }
            : booking,
        ),
      );
      setSavingIds((prev) => ({ ...prev, [currentInteraction.reservationId]: true }));
      setInteraction({ type: "idle" });

      try {
        const committed = await onCommitDates({
          bookingId: currentInteraction.reservationId,
          startDate: next.start,
          endDate: next.end,
          updatedAt: targetBooking?.updatedAt,
        });

        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === currentInteraction.reservationId
              ? {
                  ...booking,
                  startDate: new Date(committed.startDate),
                  endDate: new Date(committed.endDate),
                  updatedAt: committed.updatedAt
                    ? new Date(committed.updatedAt)
                    : booking.updatedAt,
                }
              : booking,
          ),
        );
      } catch (error) {
        console.error(error);
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === currentInteraction.reservationId
              ? {
                  ...booking,
                  startDate: new Date(previous.start),
                  endDate: new Date(previous.end),
                }
              : booking,
          ),
        );
        onError("Impossible de sauvegarder les dates");
      } finally {
        setSavingIds((prev) => {
          const nextSaving = { ...prev };
          delete nextSaving[currentInteraction.reservationId];
          return nextSaving;
        });
      }

      return;
    }

    if (currentInteraction.type === "create") {
      if (!currentInteraction.valid) {
        onError(currentInteraction.reason ?? "Conflit");
        setInteraction({ type: "idle" });
        return;
      }

      onCreateFromRange({
        vehicleId: currentInteraction.vehicleId,
        startDate: currentInteraction.start,
        endDate: currentInteraction.end,
      });
      setInteraction({ type: "idle" });
      return;
    }

    setInteraction({ type: "idle" });
  }, [
    canEdit,
    onCommitDates,
    onCreateFromRange,
    onError,
    onPointerMove,
    setBookings,
  ]);

  const beginTracking = useCallback((params: {
    pointerId: number;
    clientX: number;
    vehicleId: string;
    target: Element;
  }) => {
    params.target.setPointerCapture(params.pointerId);
    pointerRef.current = {
      pointerId: params.pointerId,
      clientX: params.clientX,
      targetVehicleId: params.vehicleId,
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
  }, [onPointerMove, onPointerUp]);

  const onDragPointerDown = useCallback(
    (
      event: React.PointerEvent<HTMLElement>,
      booking: CalendarBooking,
      vehicleId: string,
    ) => {
      if (!canEdit) return;
      const measure = rowMeasuresRef.current.get(vehicleId);
      if (!measure) return;
      const scrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;
      const originDay = getDayIndexFromClientX(
        event.clientX,
        measure.rowLeft,
        measure.colWidth,
        scrollLeft,
      );

      const start = dayKeyToLocalDate(toDayKeyLocal(new Date(booking.startDate)));
      const end = dayKeyToLocalDate(toDayKeyLocal(new Date(booking.endDate)));

      setInteraction({
        type: "drag",
        reservationId: booking.id,
        originX: event.clientX,
        originDay,
        initial: { start, end, vehicleId: booking.vehicleId },
        next: { start, end, vehicleId: booking.vehicleId },
        deltaDays: 0,
        valid: true,
      });

      beginTracking({
        pointerId: event.pointerId,
        clientX: event.clientX,
        vehicleId,
        target: event.currentTarget,
      });
    },
    [beginTracking, canEdit],
  );

  const onResizePointerDown = useCallback(
    (
      event: React.PointerEvent<HTMLElement>,
      booking: CalendarBooking,
      vehicleId: string,
      edge: "start" | "end",
    ) => {
      if (!canEdit) return;
      const measure = rowMeasuresRef.current.get(vehicleId);
      if (!measure) return;
      const scrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;
      const originDay = getDayIndexFromClientX(
        event.clientX,
        measure.rowLeft,
        measure.colWidth,
        scrollLeft,
      );

      const start = dayKeyToLocalDate(toDayKeyLocal(new Date(booking.startDate)));
      const end = dayKeyToLocalDate(toDayKeyLocal(new Date(booking.endDate)));

      setInteraction({
        type: "resize",
        reservationId: booking.id,
        edge,
        originX: event.clientX,
        originDay,
        initial: { start, end, vehicleId: booking.vehicleId },
        next: { start, end, vehicleId: booking.vehicleId },
        deltaDays: 0,
        valid: true,
      });

      beginTracking({
        pointerId: event.pointerId,
        clientX: event.clientX,
        vehicleId,
        target: event.currentTarget,
      });
    },
    [beginTracking, canEdit],
  );

  const onCreatePointerDown = useCallback(
    (
      event: React.PointerEvent<HTMLElement>,
      vehicleId: string,
      dayIndex: number,
    ) => {
      if (!canEdit) return;
      const base = dayKeyToLocalDate(toDayKeyLocal(weekStart));
      const start = addDaysLocal(base, dayIndex);
      const end = addDaysLocal(base, dayIndex + 1);

      const validation = validateCandidateInterval({
        vehicleId,
        start,
        endExclusive: end,
        byVehicle,
      });

      setInteraction({
        type: "create",
        vehicleId,
        originX: event.clientX,
        startDay: dayIndex,
        endDay: dayIndex,
        start,
        end,
        valid: validation.valid,
        reason: validation.reason,
      });

      beginTracking({
        pointerId: event.pointerId,
        clientX: event.clientX,
        vehicleId,
        target: event.currentTarget,
      });
    },
    [beginTracking, byVehicle, canEdit, weekStart],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pointerRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  return {
    interaction,
    savingIds,
    scrollContainerRef,
    registerRowRef,
    onDragPointerDown,
    onResizePointerDown,
    onCreatePointerDown,
  };
}
