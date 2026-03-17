// Mock Test Centers Data for U-Exam Platform
// Includes test centers, rooms, and equipment

export type CenterStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

export type RoomStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE";

export type EquipmentStatus = "WORKING" | "MAINTENANCE" | "BROKEN";

export type MockRoom = {
  id: string;
  centerId: string;
  name: string;
  floor: number;
  capacity: number;
  status: RoomStatus;
  hasProjector: boolean;
  hasAC: boolean;
  hasWebcam: boolean;
  notes: string | null;
};

export type MockEquipment = {
  id: string;
  centerId: string;
  roomId: string | null;
  name: string;
  type: string;
  serialNumber: string;
  status: EquipmentStatus;
  lastMaintenanceDate: string;
  notes: string | null;
};

export type MockTestCenter = {
  id: string;
  name: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  managerId: string;
  managerName: string;
  roomsCount: number;
  totalCapacity: number;
  status: CenterStatus;
  facilities: string[];
  rating: number;
  latitude: number;
  longitude: number;
  operatingHours: string;
  tenantId: string;
  createdAt: string;
};

export const MOCK_TEST_CENTERS: MockTestCenter[] = [
  {
    id: "center_001",
    name: "ศูนย์สอบ U-Exam สยามสแควร์",
    address: "254 อาคาร Siam Tower ชั้น 15",
    district: "ปทุมวัน",
    province: "กรุงเทพมหานคร",
    postalCode: "10330",
    phone: "02-123-4567",
    email: "siam@uexam-center.co.th",
    managerId: "usr_009",
    managerName: "กิตติ เจริญสุข",
    roomsCount: 5,
    totalCapacity: 200,
    status: "ACTIVE",
    facilities: [
      "ที่จอดรถ",
      "Wi-Fi ความเร็วสูง",
      "ห้องน้ำ",
      "จุดพักรอ",
      "ตู้ล็อคเกอร์",
      "ร้านกาแฟ",
      "ลิฟท์",
      "ทางลาดสำหรับผู้พิการ",
    ],
    rating: 4.7,
    latitude: 13.7456,
    longitude: 100.5341,
    operatingHours: "จันทร์-เสาร์ 08:00-18:00",
    tenantId: "tenant_002",
    createdAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "center_002",
    name: "ศูนย์สอบ U-Exam เชียงใหม่",
    address: "89 ถ.นิมมานเหมินท์ ซอย 9",
    district: "สุเทพ",
    province: "เชียงใหม่",
    postalCode: "50200",
    phone: "053-456-789",
    email: "chiangmai@uexam-center.co.th",
    managerId: "usr_009",
    managerName: "กิตติ เจริญสุข",
    roomsCount: 3,
    totalCapacity: 120,
    status: "ACTIVE",
    facilities: [
      "ที่จอดรถ",
      "Wi-Fi ความเร็วสูง",
      "ห้องน้ำ",
      "จุดพักรอ",
      "ตู้ล็อคเกอร์",
      "ลิฟท์",
    ],
    rating: 4.5,
    latitude: 18.7953,
    longitude: 98.9687,
    operatingHours: "จันทร์-ศุกร์ 08:30-17:30",
    tenantId: "tenant_002",
    createdAt: "2025-03-01T10:00:00.000Z",
  },
  {
    id: "center_003",
    name: "ศูนย์สอบ U-Exam ขอนแก่น",
    address: "123 ถ.มิตรภาพ ตำบลในเมือง",
    district: "เมืองขอนแก่น",
    province: "ขอนแก่น",
    postalCode: "40000",
    phone: "043-234-567",
    email: "khonkaen@uexam-center.co.th",
    managerId: "usr_009",
    managerName: "กิตติ เจริญสุข",
    roomsCount: 2,
    totalCapacity: 80,
    status: "ACTIVE",
    facilities: [
      "ที่จอดรถ",
      "Wi-Fi ความเร็วสูง",
      "ห้องน้ำ",
      "จุดพักรอ",
      "ตู้ล็อคเกอร์",
    ],
    rating: 4.3,
    latitude: 16.4419,
    longitude: 102.8360,
    operatingHours: "จันทร์-ศุกร์ 09:00-17:00",
    tenantId: "tenant_002",
    createdAt: "2025-05-01T10:00:00.000Z",
  },
  {
    id: "center_004",
    name: "ศูนย์สอบ U-Exam หาดใหญ่",
    address: "456 ถ.เพชรเกษม ตำบลหาดใหญ่",
    district: "หาดใหญ่",
    province: "สงขลา",
    postalCode: "90110",
    phone: "074-345-678",
    email: "hatyai@uexam-center.co.th",
    managerId: "usr_009",
    managerName: "กิตติ เจริญสุข",
    roomsCount: 2,
    totalCapacity: 60,
    status: "MAINTENANCE",
    facilities: [
      "ที่จอดรถ",
      "Wi-Fi ความเร็วสูง",
      "ห้องน้ำ",
      "จุดพักรอ",
    ],
    rating: 4.1,
    latitude: 7.0040,
    longitude: 100.4747,
    operatingHours: "จันทร์-ศุกร์ 09:00-17:00",
    tenantId: "tenant_002",
    createdAt: "2025-06-15T10:00:00.000Z",
  },
  {
    id: "center_005",
    name: "ศูนย์สอบ U-Exam บางนา",
    address: "789 อาคาร BITEC บางนา ชั้น 8",
    district: "บางนา",
    province: "กรุงเทพมหานคร",
    postalCode: "10260",
    phone: "02-987-6543",
    email: "bangna@uexam-center.co.th",
    managerId: "usr_009",
    managerName: "กิตติ เจริญสุข",
    roomsCount: 4,
    totalCapacity: 160,
    status: "ACTIVE",
    facilities: [
      "ที่จอดรถ",
      "Wi-Fi ความเร็วสูง",
      "ห้องน้ำ",
      "จุดพักรอ",
      "ตู้ล็อคเกอร์",
      "ร้านอาหาร",
      "ลิฟท์",
      "ทางลาดสำหรับผู้พิการ",
      "ห้องปฐมพยาบาล",
    ],
    rating: 4.8,
    latitude: 13.6667,
    longitude: 100.6167,
    operatingHours: "จันทร์-อาทิตย์ 07:30-19:00",
    tenantId: "tenant_002",
    createdAt: "2025-08-01T10:00:00.000Z",
  },
];

export const MOCK_ROOMS: MockRoom[] = [
  // --- Center 001 (สยามสแควร์ - 5 rooms) ---
  {
    id: "room_001",
    centerId: "center_001",
    name: "ห้องสอบ A1",
    floor: 15,
    capacity: 50,
    status: "AVAILABLE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: true,
    notes: null,
  },
  {
    id: "room_002",
    centerId: "center_001",
    name: "ห้องสอบ A2",
    floor: 15,
    capacity: 50,
    status: "IN_USE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: true,
    notes: "กำลังใช้สอบ IT Fundamentals",
  },
  {
    id: "room_003",
    centerId: "center_001",
    name: "ห้องสอบ B1",
    floor: 16,
    capacity: 40,
    status: "AVAILABLE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: false,
    notes: null,
  },
  {
    id: "room_004",
    centerId: "center_001",
    name: "ห้องสอบ B2",
    floor: 16,
    capacity: 40,
    status: "MAINTENANCE",
    hasProjector: false,
    hasAC: true,
    hasWebcam: false,
    notes: "ซ่อมบำรุงโปรเจกเตอร์ วันที่ 15 มี.ค. 2026",
  },
  {
    id: "room_005",
    centerId: "center_001",
    name: "ห้องสอบ VIP",
    floor: 17,
    capacity: 20,
    status: "AVAILABLE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: true,
    notes: "ห้องสอบพิเศษ สำหรับสอบที่ต้องการ Proctoring",
  },

  // --- Center 002 (เชียงใหม่ - 3 rooms) ---
  {
    id: "room_006",
    centerId: "center_002",
    name: "ห้องสอบ C1",
    floor: 3,
    capacity: 50,
    status: "AVAILABLE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: true,
    notes: null,
  },
  {
    id: "room_007",
    centerId: "center_002",
    name: "ห้องสอบ C2",
    floor: 3,
    capacity: 40,
    status: "AVAILABLE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: false,
    notes: null,
  },
  {
    id: "room_008",
    centerId: "center_002",
    name: "ห้องสอบ C3",
    floor: 4,
    capacity: 30,
    status: "IN_USE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: true,
    notes: "กำลังใช้สอบ Onboarding",
  },

  // --- Center 003 (ขอนแก่น - 2 rooms) ---
  {
    id: "room_009",
    centerId: "center_003",
    name: "ห้องสอบ D1",
    floor: 2,
    capacity: 40,
    status: "AVAILABLE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: false,
    notes: null,
  },
  {
    id: "room_010",
    centerId: "center_003",
    name: "ห้องสอบ D2",
    floor: 2,
    capacity: 40,
    status: "AVAILABLE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: true,
    notes: null,
  },

  // --- Center 005 (บางนา - 4 rooms) ---
  {
    id: "room_011",
    centerId: "center_005",
    name: "ห้องสอบ E1",
    floor: 8,
    capacity: 50,
    status: "AVAILABLE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: true,
    notes: null,
  },
  {
    id: "room_012",
    centerId: "center_005",
    name: "ห้องสอบ E2",
    floor: 8,
    capacity: 50,
    status: "AVAILABLE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: true,
    notes: null,
  },
  {
    id: "room_013",
    centerId: "center_005",
    name: "ห้องสอบ E3",
    floor: 9,
    capacity: 40,
    status: "IN_USE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: true,
    notes: "กำลังใช้สอบ Q1 Assessment",
  },
  {
    id: "room_014",
    centerId: "center_005",
    name: "ห้องสอบ VIP Plus",
    floor: 9,
    capacity: 20,
    status: "AVAILABLE",
    hasProjector: true,
    hasAC: true,
    hasWebcam: true,
    notes: "ห้องสอบ VIP พร้อมระบบ Proctoring เต็มรูปแบบ",
  },
];

export const MOCK_EQUIPMENT: MockEquipment[] = [
  {
    id: "equip_001",
    centerId: "center_001",
    roomId: "room_001",
    name: "คอมพิวเตอร์ตั้งโต๊ะ Dell OptiPlex 7010",
    type: "COMPUTER",
    serialNumber: "DELL-7010-001",
    status: "WORKING",
    lastMaintenanceDate: "2026-02-15T10:00:00.000Z",
    notes: null,
  },
  {
    id: "equip_002",
    centerId: "center_001",
    roomId: "room_001",
    name: "จอมอนิเตอร์ Dell 24 นิ้ว",
    type: "MONITOR",
    serialNumber: "DELL-MON-001",
    status: "WORKING",
    lastMaintenanceDate: "2026-02-15T10:00:00.000Z",
    notes: null,
  },
  {
    id: "equip_003",
    centerId: "center_001",
    roomId: "room_002",
    name: "โปรเจกเตอร์ Epson EB-X51",
    type: "PROJECTOR",
    serialNumber: "EPS-X51-001",
    status: "WORKING",
    lastMaintenanceDate: "2026-01-20T10:00:00.000Z",
    notes: null,
  },
  {
    id: "equip_004",
    centerId: "center_001",
    roomId: "room_004",
    name: "โปรเจกเตอร์ Epson EB-X51",
    type: "PROJECTOR",
    serialNumber: "EPS-X51-002",
    status: "MAINTENANCE",
    lastMaintenanceDate: "2026-03-01T10:00:00.000Z",
    notes: "หลอดไฟเสื่อม รอเปลี่ยนหลอดใหม่",
  },
  {
    id: "equip_005",
    centerId: "center_001",
    roomId: "room_005",
    name: "กล้อง Webcam Logitech C920",
    type: "WEBCAM",
    serialNumber: "LOG-C920-001",
    status: "WORKING",
    lastMaintenanceDate: "2026-02-01T10:00:00.000Z",
    notes: "สำหรับ Proctoring",
  },
  {
    id: "equip_006",
    centerId: "center_001",
    roomId: null,
    name: "เราเตอร์ Wi-Fi Cisco Meraki MR46",
    type: "NETWORK",
    serialNumber: "CSC-MR46-001",
    status: "WORKING",
    lastMaintenanceDate: "2026-01-10T10:00:00.000Z",
    notes: "ติดตั้งที่ชั้น 15 ครอบคลุมห้อง A1-A2",
  },
  {
    id: "equip_007",
    centerId: "center_002",
    roomId: "room_006",
    name: "คอมพิวเตอร์ตั้งโต๊ะ HP ProDesk 400 G7",
    type: "COMPUTER",
    serialNumber: "HP-400G7-001",
    status: "WORKING",
    lastMaintenanceDate: "2026-02-20T10:00:00.000Z",
    notes: null,
  },
  {
    id: "equip_008",
    centerId: "center_005",
    roomId: "room_014",
    name: "กล้อง Webcam Logitech Brio 4K",
    type: "WEBCAM",
    serialNumber: "LOG-BRIO-001",
    status: "WORKING",
    lastMaintenanceDate: "2026-02-28T10:00:00.000Z",
    notes: "กล้อง 4K สำหรับ VIP Proctoring",
  },
  {
    id: "equip_009",
    centerId: "center_005",
    roomId: "room_011",
    name: "UPS APC Smart-UPS 1500VA",
    type: "UPS",
    serialNumber: "APC-1500-001",
    status: "WORKING",
    lastMaintenanceDate: "2026-01-15T10:00:00.000Z",
    notes: "รองรับไฟสำรอง 30 นาที",
  },
  {
    id: "equip_010",
    centerId: "center_003",
    roomId: "room_009",
    name: "เครื่องพิมพ์ HP LaserJet Pro M404n",
    type: "PRINTER",
    serialNumber: "HP-M404-001",
    status: "BROKEN",
    lastMaintenanceDate: "2025-12-10T10:00:00.000Z",
    notes: "กลไกดึงกระดาษเสีย รอเปลี่ยนอะไหล่",
  },
];
