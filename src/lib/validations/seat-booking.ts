import { z } from "zod";

// ─── Seat Availability ──────────────────────────────────────────────

export const seatAvailabilityFilterSchema = z.object({
  examScheduleId: z.string().uuid("รอบสอบจำเป็น"),
  testCenterId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
});

// ─── Seat Booking ───────────────────────────────────────────────────

export const bookSeatSchema = z.object({
  registrationId: z.string().uuid("การสมัครสอบจำเป็น"),
  seatId: z.string().uuid("ที่นั่งจำเป็น"),
});

export const releaseSeatSchema = z.object({
  registrationId: z.string().uuid("การสมัครสอบจำเป็น"),
});

export const swapSeatsSchema = z.object({
  registrationId1: z.string().uuid("การสมัครสอบ 1 จำเป็น"),
  registrationId2: z.string().uuid("การสมัครสอบ 2 จำเป็น"),
});

export const autoAssignSeatsSchema = z.object({
  examScheduleId: z.string().uuid("รอบสอบจำเป็น"),
  roomId: z.string().uuid("ห้องสอบจำเป็น"),
});

// ─── Types ──────────────────────────────────────────────────────────

export type SeatAvailabilityFilter = z.infer<typeof seatAvailabilityFilterSchema>;
export type BookSeat = z.infer<typeof bookSeatSchema>;
export type ReleaseSeat = z.infer<typeof releaseSeatSchema>;
export type SwapSeats = z.infer<typeof swapSeatsSchema>;
export type AutoAssignSeats = z.infer<typeof autoAssignSeatsSchema>;
