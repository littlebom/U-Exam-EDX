"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Facebook,
  MessageCircle,
  Send,
  Loader2,
  Building2,
  Clock,
  Instagram,
  Youtube,
  Music2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

interface BusinessHourEntry {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

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
  businessHours: BusinessHourEntry[] | string | null;
  googleMapUrl: string | null;
}

interface SocialLink {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function ContactPage() {
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Contact form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Fetch contact data from public API
  useEffect(() => {
    async function fetchContact() {
      try {
        const res = await fetch("/api/v1/public/contact");
        const json = await res.json();
        if (json.success && json.data) {
          setContactData(json.data);
        }
      } catch {
        // Silently fail — show placeholders
      } finally {
        setIsLoading(false);
      }
    }
    fetchContact();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const res = await fetch("/api/v1/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success("ส่งข้อความเรียบร้อยแล้ว! เราจะติดต่อกลับโดยเร็วที่สุด");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        toast.error(json.error?.message ?? "ไม่สามารถส่งข้อความได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSending(false);
    }
  };

  // Build contact info items from real data
  const contactItems = buildContactItems(contactData);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          ติดต่อเรา
        </h1>
        <p className="mt-2 text-muted-foreground">
          มีคำถามหรือต้องการความช่วยเหลือ?{" "}
          {contactData?.name
            ? `ติดต่อทีมงาน ${contactData.name} ได้ตลอดเวลา`
            : "ติดต่อทีมงานของเราได้ตลอดเวลา"}
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Contact Info */}
        <div className="space-y-6">
          {/* Organization Name */}
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : contactData?.name ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{contactData.name}</p>
                    <p className="text-xs text-muted-foreground">องค์กรผู้จัดสอบ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Contact Info Cards */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : contactItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {contactItems.map((item) => (
                <Card key={item.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-primary hover:underline break-all"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{item.value}</p>
                        )}
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-sm text-muted-foreground">
                  ยังไม่มีข้อมูลช่องทางติดต่อ กรุณาติดต่อผ่านแบบฟอร์มด้านขวา
                </p>
              </CardContent>
            </Card>
          )}

          {/* Business Hours — now shown inside contact items grid above */}

          {/* Social Media Icons */}
          {(() => {
            const socials = buildSocialLinks(contactData);
            if (socials.length === 0) return null;
            return (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium mb-3">ติดตามเรา</p>
                  <div className="flex flex-wrap gap-3">
                    {socials.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={s.label}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <s.icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

        </div>

        {/* Right: Map + Contact Form */}
        <div className="space-y-6">
          {/* Google Map */}
          {contactData?.googleMapUrl ? (
            <Card className="overflow-hidden p-0">
              <div className="aspect-video">
                <iframe
                  src={contactData.googleMapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Map"
                />
              </div>
            </Card>
          ) : contactData?.address ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm font-medium">แผนที่</p>
                    <p className="mx-auto max-w-xs text-xs">
                      {contactData.address}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Contact Form */}
          <Card>
          <CardHeader>
            <CardTitle className="text-lg">ส่งข้อความถึงเรา</CardTitle>
            <CardDescription>
              กรอกแบบฟอร์มด้านล่าง เราจะติดต่อกลับโดยเร็วที่สุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                  <Input
                    id="name"
                    placeholder="ชื่อของคุณ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">หัวข้อ</Label>
                <Input
                  id="subject"
                  placeholder="หัวข้อที่ต้องการสอบถาม"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">ข้อความ</Label>
                <Textarea
                  id="message"
                  placeholder="รายละเอียดที่ต้องการแจ้ง..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    ส่งข้อความ
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

interface ContactItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description?: string;
  href?: string;
}

function buildContactItems(data: ContactData | null): ContactItem[] {
  if (!data) return [];

  const items: ContactItem[] = [];

  if (data.email) {
    items.push({
      icon: Mail,
      label: "อีเมล",
      value: data.email,
      href: `mailto:${data.email}`,
      description: "ตอบกลับภายใน 24 ชั่วโมง",
    });
  }

  if (data.phone) {
    items.push({
      icon: Phone,
      label: "โทรศัพท์",
      value: data.phone,
      href: `tel:${data.phone.replace(/[^+\d]/g, "")}`,
      description: "จันทร์ - ศุกร์ 9:00 - 17:00 น.",
    });
  }

  if (data.address) {
    items.push({
      icon: MapPin,
      label: "ที่อยู่",
      value: data.address,
    });
  }

  // Business hours as contact item (after address)
  if (data.businessHours) {
    if (Array.isArray(data.businessHours)) {
      const openDays = data.businessHours.filter((d) => !d.closed);
      const closedDays = data.businessHours.filter((d) => d.closed);

      // Group consecutive days with same hours
      // e.g. จันทร์-ศุกร์ 08:30-16:30
      const groups: { from: string; to: string; open: string; close: string }[] = [];
      for (const d of openDays) {
        const last = groups[groups.length - 1];
        if (last && last.open === d.open && last.close === d.close) {
          last.to = d.day;
        } else {
          groups.push({ from: d.day, to: d.day, open: d.open, close: d.close });
        }
      }

      const lines = groups.map((g) =>
        g.from === g.to
          ? `${g.from} ${g.open}-${g.close} น.`
          : `${g.from}-${g.to} ${g.open}-${g.close} น.`
      );

      items.push({
        icon: Clock,
        label: "เวลาทำการ",
        value: lines.join("\n"),
        description: closedDays.length > 0
          ? `ปิด: ${closedDays.map((d) => d.day).join(", ")}`
          : undefined,
      });
    } else {
      items.push({
        icon: Clock,
        label: "เวลาทำการ",
        value: data.businessHours,
      });
    }
  }

  return items;
}

function buildSocialLinks(data: ContactData | null): SocialLink[] {
  if (!data) return [];
  const links: SocialLink[] = [];

  if (data.facebook) links.push({ icon: Facebook, label: "Facebook", href: data.facebook });
  if (data.line) {
    const href = data.line.startsWith("http") ? data.line : `https://line.me/R/ti/p/${data.line}`;
    links.push({ icon: MessageCircle, label: "LINE", href });
  }
  if (data.instagram) links.push({ icon: Instagram, label: "Instagram", href: data.instagram });
  if (data.twitter) links.push({ icon: Globe, label: "X (Twitter)", href: data.twitter });
  if (data.youtube) links.push({ icon: Youtube, label: "YouTube", href: data.youtube });
  if (data.tiktok) links.push({ icon: Music2, label: "TikTok", href: data.tiktok });
  if (data.website) links.push({ icon: Globe, label: "เว็บไซต์", href: data.website });

  return links;
}
