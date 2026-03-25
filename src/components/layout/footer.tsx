"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Facebook,
  MessageCircle,
  Instagram,
  Youtube,
  Music2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ContactData {
  name: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  facebook: string | null;
  line: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
  businessHours: string | null;
  googleMapUrl: string | null;
}

interface BusinessHourEntry {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

const menuLinks = [
  { href: "/", label: "หน้าแรก" },
  { href: "/catalog", label: "ตารางสอบ" },
  { href: "/news", label: "ข่าวสาร" },
  { href: "/contact", label: "ติดต่อเรา" },
];

const DAY_ORDER = [
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
];

function formatBusinessHours(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const entries: BusinessHourEntry[] = JSON.parse(raw);
    if (!Array.isArray(entries) || entries.length === 0) return [];

    // Sort by day order
    const sorted = [...entries].sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    );

    // Group consecutive days with the same hours
    const groups: { days: string[]; label: string }[] = [];
    for (const entry of sorted) {
      const label = entry.closed
        ? "ปิด"
        : `${entry.open}-${entry.close} น.`;
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.days.push(entry.day);
      } else {
        groups.push({ days: [entry.day], label });
      }
    }

    return groups.map((g) => {
      const dayRange =
        g.days.length === 1
          ? g.days[0]
          : `${g.days[0]}-${g.days[g.days.length - 1]}`;

      if (g.label === "ปิด") {
        return `ปิด: ${g.days.join(", ")}`;
      }
      return `${dayRange} ${g.label}`;
    });
  } catch {
    return [];
  }
}

const socialLinks = [
  { key: "facebook" as const, icon: Facebook, label: "Facebook" },
  { key: "line" as const, icon: MessageCircle, label: "LINE" },
  { key: "instagram" as const, icon: Instagram, label: "Instagram" },
  { key: "youtube" as const, icon: Youtube, label: "YouTube" },
  { key: "tiktok" as const, icon: Music2, label: "TikTok" },
  { key: "twitter" as const, icon: ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, label: "X" },
] as const;

export function Footer() {
  const [contact, setContact] = useState<ContactData | null>(null);

  useEffect(() => {
    fetch("/api/v1/public/contact")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json.data) {
          setContact(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const orgName = contact?.name ?? "U-Exam";
  const year = new Date().getFullYear();
  const hours = formatBusinessHours(contact?.businessHours ?? null);

  const activeSocials = socialLinks.filter(
    (s) => contact && contact[s.key]
  );

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Column 1: Logo + Description + Social */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">U-Exam</span>
            </div>
            <p className="text-sm text-muted-foreground">
              ระบบบริหารจัดการสอบออนไลน์แบบครบวงจร
            </p>
            {activeSocials.length > 0 && (
              <div className="flex items-center gap-2">
                {activeSocials.map((s) => (
                  <a
                    key={s.key}
                    href={contact![s.key]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-colors hover:bg-primary/10"
                  >
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Menu (2 columns) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">เมนู</h4>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
              {menuLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">ติดต่อเรา</h4>
            <ul className="space-y-3">
              {contact?.email && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  <a
                    href={`mailto:${contact.email}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {contact.email}
                  </a>
                </li>
              )}
              {contact?.phone && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                  <a
                    href={`tel:${contact.phone}`}
                    className="transition-colors hover:text-foreground"
                  >
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.address && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{contact.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Business Hours — removed, shown on contact page only */}
        </div>

        {/* Bottom bar */}
        <Separator className="my-8" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {year} {orgName}. สงวนลิขสิทธิ์ทุกประการ
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              นโยบายความเป็นส่วนตัว
            </Link>
            <span>|</span>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              เงื่อนไขการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
