/**
 * IP Address Utilities
 * รองรับ IPv4/IPv6 exact match และ CIDR notation
 */

/**
 * แปลง IPv4 address เป็น 32-bit number
 */
function ipv4ToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return -1;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * ตรวจสอบว่า IP อยู่ใน CIDR range หรือไม่ (IPv4)
 * เช่น isIpInCidr("192.168.1.100", "192.168.1.0/24") → true
 */
function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [network, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr, 10);

  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

  const ipNum = ipv4ToNumber(ip);
  const networkNum = ipv4ToNumber(network);

  if (ipNum === -1 || networkNum === -1) return false;

  // สร้าง mask จาก prefix length
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

  return (ipNum & mask) === (networkNum & mask);
}

/**
 * ตรวจสอบว่า IP ตรงกับ pattern หรือไม่
 * รองรับ: exact match, CIDR notation
 */
function isIpMatch(clientIp: string, pattern: string): boolean {
  const trimmedPattern = pattern.trim();
  const trimmedIp = clientIp.trim();

  // Exact match
  if (trimmedIp === trimmedPattern) return true;

  // CIDR match (IPv4)
  if (trimmedPattern.includes("/")) {
    return isIpv4InCidr(trimmedIp, trimmedPattern);
  }

  return false;
}

/**
 * ตรวจสอบว่า IP อยู่ในรายการ allowed IPs หรือไม่
 * @param clientIp - IP ของ client (จาก x-forwarded-for หรือ x-real-ip)
 * @param allowedIps - รายการ IP/CIDR ที่อนุญาต
 * @returns true ถ้า IP อยู่ในรายการ หรือ รายการว่าง (ไม่จำกัด)
 */
export function isIpAllowed(
  clientIp: string | null | undefined,
  allowedIps: string[] | null | undefined
): boolean {
  // ไม่มีรายการ IP → อนุญาตทั้งหมด
  if (!allowedIps || allowedIps.length === 0) return true;

  // ไม่มี client IP → ไม่อนุญาต (เมื่อมี allowedIps กำหนดอยู่)
  if (!clientIp) return false;

  // ถ้า client IP มี comma (x-forwarded-for อาจมีหลาย IP) — ใช้ตัวแรก
  const ip = clientIp.split(",")[0].trim();

  return allowedIps.some((pattern) => isIpMatch(ip, pattern));
}

/**
 * Validate ว่า string เป็น IP address หรือ CIDR ที่ถูกต้อง
 */
export function isValidIpOrCidr(value: string): boolean {
  const trimmed = value.trim();

  // IPv4 exact
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) {
    return ipv4ToNumber(trimmed) !== -1;
  }

  // IPv4 CIDR
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(trimmed)) {
    const [network, prefixStr] = trimmed.split("/");
    const prefix = parseInt(prefixStr, 10);
    return ipv4ToNumber(network) !== -1 && prefix >= 0 && prefix <= 32;
  }

  return false;
}

/**
 * ดึง client IP จาก request headers
 */
export function getClientIp(request: Request): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    undefined
  );
}
