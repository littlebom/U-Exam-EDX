import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type {
  CreateSeat,
  UpdateSeat,
  BulkCreateSeats,
  SeatFilter,
  CreateEquipment,
  UpdateEquipment,
  EquipmentFilter,
} from "@/lib/validations/seat-equipment";

// ═══════════════════════════════════════════════════════════════════
// Seat CRUD
// ═══════════════════════════════════════════════════════════════════

export async function listSeats(tenantId: string, filters: SeatFilter) {
  const { roomId, status } = filters;

  // Verify room belongs to tenant
  const room = await prisma.room.findFirst({
    where: { id: roomId, testCenter: { tenantId } },
    select: { id: true, name: true, capacity: true },
  });
  if (!room) throw errors.notFound("ไม่พบห้องสอบ");

  const where = {
    roomId,
    ...(status && { status }),
  };

  const seats = await prisma.seat.findMany({
    where,
    orderBy: [{ row: "asc" }, { column: "asc" }],
  });

  // Calculate stats
  const total = seats.length;
  const available = seats.filter((s) => s.status === "AVAILABLE").length;
  const occupied = seats.filter((s) => s.status === "OCCUPIED").length;
  const reserved = seats.filter((s) => s.status === "RESERVED").length;
  const disabled = seats.filter((s) => s.status === "DISABLED").length;

  return {
    data: seats,
    room,
    stats: { total, available, occupied, reserved, disabled },
  };
}

export async function createSeat(tenantId: string, data: CreateSeat) {
  // Verify room belongs to tenant
  const room = await prisma.room.findFirst({
    where: { id: data.roomId, testCenter: { tenantId } },
  });
  if (!room) throw errors.notFound("ไม่พบห้องสอบ");

  return prisma.seat.create({ data });
}

export async function bulkCreateSeats(tenantId: string, data: BulkCreateSeats) {
  const { roomId, rows, columns } = data;

  // Verify room belongs to tenant
  const room = await prisma.room.findFirst({
    where: { id: roomId, testCenter: { tenantId } },
  });
  if (!room) throw errors.notFound("ไม่พบห้องสอบ");

  // Delete existing seats for this room
  await prisma.seat.deleteMany({ where: { roomId } });

  // Generate seats
  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const seatsData = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      seatsData.push({
        roomId,
        seatNumber: `${rowLabels[r]}-${c + 1}`,
        row: r,
        column: c,
        status: "AVAILABLE",
        type: "REGULAR",
      });
    }
  }

  await prisma.seat.createMany({ data: seatsData });

  // Update room capacity
  await prisma.room.update({
    where: { id: roomId },
    data: { capacity: rows * columns },
  });

  return { count: seatsData.length };
}

export async function updateSeat(tenantId: string, id: string, data: UpdateSeat) {
  const existing = await prisma.seat.findFirst({
    where: { id, room: { testCenter: { tenantId } } },
  });
  if (!existing) throw errors.notFound("ไม่พบที่นั่ง");

  return prisma.seat.update({ where: { id }, data });
}

export async function bulkUpdateSeatStatus(
  tenantId: string,
  roomId: string,
  seatIds: string[],
  status: string
) {
  // Verify room belongs to tenant
  const room = await prisma.room.findFirst({
    where: { id: roomId, testCenter: { tenantId } },
  });
  if (!room) throw errors.notFound("ไม่พบห้องสอบ");

  return prisma.seat.updateMany({
    where: { id: { in: seatIds }, roomId },
    data: { status },
  });
}

export async function deleteSeat(tenantId: string, id: string) {
  const existing = await prisma.seat.findFirst({
    where: { id, room: { testCenter: { tenantId } } },
  });
  if (!existing) throw errors.notFound("ไม่พบที่นั่ง");

  return prisma.seat.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════════════
// Equipment CRUD
// ═══════════════════════════════════════════════════════════════════

export async function listEquipment(tenantId: string, filters: EquipmentFilter) {
  const { testCenterId, roomId, type, status, page, perPage } = filters;

  const where = {
    testCenter: { tenantId },
    ...(testCenterId && { testCenterId }),
    ...(roomId && { roomId }),
    ...(type && { type }),
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.equipment.findMany({
      where,
      include: {
        testCenter: { select: { id: true, name: true } },
      },
      orderBy: [{ testCenter: { name: "asc" } }, { name: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.equipment.count({ where }),
  ]);

  return {
    data,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

export async function getEquipment(tenantId: string, id: string) {
  const equipment = await prisma.equipment.findFirst({
    where: { id, testCenter: { tenantId } },
    include: {
      testCenter: { select: { id: true, name: true } },
    },
  });

  if (!equipment) throw errors.notFound("ไม่พบอุปกรณ์");
  return equipment;
}

export async function createEquipment(tenantId: string, data: CreateEquipment) {
  // Verify test center belongs to tenant
  const center = await prisma.testCenter.findFirst({
    where: { id: data.testCenterId, tenantId },
  });
  if (!center) throw errors.notFound("ไม่พบศูนย์สอบ");

  return prisma.equipment.create({ data });
}

export async function updateEquipment(tenantId: string, id: string, data: UpdateEquipment) {
  const existing = await prisma.equipment.findFirst({
    where: { id, testCenter: { tenantId } },
  });
  if (!existing) throw errors.notFound("ไม่พบอุปกรณ์");

  return prisma.equipment.update({ where: { id }, data });
}

export async function deleteEquipment(tenantId: string, id: string) {
  const existing = await prisma.equipment.findFirst({
    where: { id, testCenter: { tenantId } },
  });
  if (!existing) throw errors.notFound("ไม่พบอุปกรณ์");

  return prisma.equipment.delete({ where: { id } });
}
