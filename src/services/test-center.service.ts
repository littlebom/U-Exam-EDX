import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { buildPaginationMeta } from "@/types";
import type {
  CreateTestCenter,
  UpdateTestCenter,
  TestCenterFilter,
  CreateBuilding,
  UpdateBuilding,
  BuildingFilter,
  CreateRoom,
  UpdateRoom,
  RoomFilter,
} from "@/lib/validations/test-center";

// ═══════════════════════════════════════════════════════════════════
// Test Center CRUD
// ═══════════════════════════════════════════════════════════════════

export async function listTestCenters(tenantId: string, filters: TestCenterFilter) {
  const { status, search, page, perPage } = filters;

  const where = {
    tenantId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { address: { contains: search, mode: "insensitive" as const } },
        { province: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.testCenter.findMany({
      where,
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { rooms: true, buildings: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.testCenter.count({ where }),
  ]);

  // Batch capacity lookup — single query instead of N
  const centerIds = data.map((c) => c.id);
  const capacities = centerIds.length > 0
    ? await prisma.room.groupBy({
        by: ["testCenterId"],
        where: { testCenterId: { in: centerIds } },
        _sum: { capacity: true },
      })
    : [];
  const capacityMap = new Map(capacities.map((c) => [c.testCenterId, c._sum.capacity ?? 0]));

  const centersWithCapacity = data.map((center) => ({
    ...center,
    totalCapacity: capacityMap.get(center.id) ?? 0,
    roomsCount: center._count.rooms,
    buildingsCount: center._count.buildings,
  }));

  return {
    data: centersWithCapacity,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

export async function getTestCenter(tenantId: string, id: string) {
  const center = await prisma.testCenter.findFirst({
    where: { id, tenantId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      buildings: {
        include: { _count: { select: { rooms: true } } },
        orderBy: { name: "asc" },
      },
      rooms: {
        include: {
          building: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      },
      _count: { select: { rooms: true, buildings: true } },
    },
  });

  if (!center) throw errors.notFound("ไม่พบศูนย์สอบ");

  // Calculate capacity
  const capacity = await prisma.room.aggregate({
    where: { testCenterId: center.id },
    _sum: { capacity: true },
  });

  return {
    ...center,
    totalCapacity: capacity._sum.capacity ?? 0,
    roomsCount: center._count.rooms,
    buildingsCount: center._count.buildings,
  };
}

export async function createTestCenter(tenantId: string, data: CreateTestCenter) {
  return prisma.testCenter.create({
    data: {
      ...data,
      tenantId,
      email: data.email || null,
      imageUrl: data.imageUrl || null,
    },
  });
}

export async function updateTestCenter(tenantId: string, id: string, data: UpdateTestCenter) {
  const existing = await prisma.testCenter.findFirst({ where: { id, tenantId } });
  if (!existing) throw errors.notFound("ไม่พบศูนย์สอบ");

  return prisma.testCenter.update({
    where: { id },
    data: {
      ...data,
      email: data.email === "" ? null : data.email,
      imageUrl: data.imageUrl === "" ? null : data.imageUrl,
    },
  });
}

export async function deleteTestCenter(tenantId: string, id: string) {
  const existing = await prisma.testCenter.findFirst({ where: { id, tenantId } });
  if (!existing) throw errors.notFound("ไม่พบศูนย์สอบ");

  return prisma.testCenter.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════════════
// Building CRUD
// ═══════════════════════════════════════════════════════════════════

export async function listBuildings(tenantId: string, filters: BuildingFilter) {
  const { testCenterId, status, page, perPage } = filters;

  const where = {
    testCenter: { tenantId },
    ...(testCenterId && { testCenterId }),
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.building.findMany({
      where,
      include: {
        testCenter: { select: { id: true, name: true } },
        _count: { select: { rooms: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.building.count({ where }),
  ]);

  return {
    data: data.map((b) => ({ ...b, roomsCount: b._count.rooms })),
    meta: buildPaginationMeta(page, perPage, total),
  };
}

export async function getBuilding(tenantId: string, id: string) {
  const building = await prisma.building.findFirst({
    where: { id, testCenter: { tenantId } },
    include: {
      testCenter: { select: { id: true, name: true } },
      rooms: { orderBy: { name: "asc" } },
      _count: { select: { rooms: true } },
    },
  });

  if (!building) throw errors.notFound("ไม่พบอาคาร");
  return { ...building, roomsCount: building._count.rooms };
}

export async function createBuilding(tenantId: string, data: CreateBuilding) {
  // Verify test center belongs to tenant
  const center = await prisma.testCenter.findFirst({
    where: { id: data.testCenterId, tenantId },
  });
  if (!center) throw errors.notFound("ไม่พบศูนย์สอบ");

  return prisma.building.create({ data });
}

export async function updateBuilding(tenantId: string, id: string, data: UpdateBuilding) {
  const existing = await prisma.building.findFirst({
    where: { id, testCenter: { tenantId } },
  });
  if (!existing) throw errors.notFound("ไม่พบอาคาร");

  return prisma.building.update({ where: { id }, data });
}

export async function deleteBuilding(tenantId: string, id: string) {
  const existing = await prisma.building.findFirst({
    where: { id, testCenter: { tenantId } },
  });
  if (!existing) throw errors.notFound("ไม่พบอาคาร");

  return prisma.building.delete({ where: { id } });
}

// ═══════════════════════════════════════════════════════════════════
// Room CRUD
// ═══════════════════════════════════════════════════════════════════

export async function listRooms(tenantId: string, filters: RoomFilter) {
  const { testCenterId, buildingId, status, page, perPage } = filters;

  const where = {
    testCenter: { tenantId },
    ...(testCenterId && { testCenterId }),
    ...(buildingId && { buildingId }),
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.room.findMany({
      where,
      include: {
        testCenter: { select: { id: true, name: true } },
        building: { select: { id: true, name: true } },
      },
      orderBy: [{ testCenter: { name: "asc" } }, { name: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.room.count({ where }),
  ]);

  return {
    data,
    meta: buildPaginationMeta(page, perPage, total),
  };
}

export async function getRoom(tenantId: string, id: string) {
  const room = await prisma.room.findFirst({
    where: { id, testCenter: { tenantId } },
    include: {
      testCenter: { select: { id: true, name: true } },
      building: { select: { id: true, name: true } },
    },
  });

  if (!room) throw errors.notFound("ไม่พบห้องสอบ");
  return room;
}

export async function createRoom(tenantId: string, data: CreateRoom) {
  // Verify test center belongs to tenant
  const center = await prisma.testCenter.findFirst({
    where: { id: data.testCenterId, tenantId },
  });
  if (!center) throw errors.notFound("ไม่พบศูนย์สอบ");

  // Verify building belongs to the center if provided
  if (data.buildingId) {
    const building = await prisma.building.findFirst({
      where: { id: data.buildingId, testCenterId: data.testCenterId },
    });
    if (!building) throw errors.notFound("ไม่พบอาคาร");
  }

  return prisma.room.create({ data });
}

export async function updateRoom(tenantId: string, id: string, data: UpdateRoom) {
  const existing = await prisma.room.findFirst({
    where: { id, testCenter: { tenantId } },
  });
  if (!existing) throw errors.notFound("ไม่พบห้องสอบ");

  // Verify building belongs to the center if changed
  if (data.buildingId) {
    const building = await prisma.building.findFirst({
      where: { id: data.buildingId, testCenterId: existing.testCenterId },
    });
    if (!building) throw errors.notFound("ไม่พบอาคาร");
  }

  return prisma.room.update({ where: { id }, data });
}

export async function deleteRoom(tenantId: string, id: string) {
  const existing = await prisma.room.findFirst({
    where: { id, testCenter: { tenantId } },
  });
  if (!existing) throw errors.notFound("ไม่พบห้องสอบ");

  return prisma.room.delete({ where: { id } });
}
