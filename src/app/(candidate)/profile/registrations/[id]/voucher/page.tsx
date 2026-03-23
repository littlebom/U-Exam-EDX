"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, QrCode, Ticket, MapPin, Calendar, Armchair, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDetail } from "@/hooks/use-api";

interface RegistrationDetail {
  id: string;
  status: string;
  seatNumber: string | null;
  examSchedule: {
    startDate: string;
    endDate: string;
    location: string | null;
    exam: { title: string };
    testCenter: { name: string } | null;
    room: { name: string } | null;
  };
  vouchers: Array<{
    id: string;
    code: string;
    qrData: string | null;
    status: string;
    isUsed: boolean;
    usedAt: string | null;
  }>;
}

export default function VoucherPage() {
  const { id } = useParams<{ id: string }>();

  const { data: registration, isLoading } = useDetail<RegistrationDetail>(
    `registration-voucher-${id}`,
    `/api/v1/registrations/${id}`,
    !!id
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        ไม่พบข้อมูลการสมัครสอบ
      </div>
    );
  }

  const voucher = registration.vouchers?.[0];
  const schedule = registration.examSchedule;
  const qrValue = voucher?.qrData || voucher?.code || "";

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile/registrations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-bold">บัตรเข้าสอบ</h1>
          <p className="text-sm text-muted-foreground">{schedule.exam.title}</p>
        </div>
      </div>

      {/* Voucher Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/5 text-center pb-3">
          <CardTitle className="text-base flex items-center justify-center gap-2">
            <Ticket className="h-4 w-4" />
            Voucher
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* QR Code */}
          {voucher && qrValue ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl border-2 border-dashed">
                <QRCodeSVG
                  value={qrValue}
                  size={220}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Voucher Code */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">รหัส Voucher</p>
                <p className="font-mono text-xl font-bold tracking-wider">
                  {voucher.code}
                </p>
              </div>

              {/* Status */}
              <Badge
                variant={voucher.isUsed ? "secondary" : "default"}
                className="text-sm"
              >
                {voucher.isUsed ? "✅ เช็คอินแล้ว" : "พร้อมใช้งาน"}
              </Badge>

              {voucher.isUsed && voucher.usedAt && (
                <p className="text-xs text-muted-foreground">
                  เช็คอินเมื่อ {new Date(voucher.usedAt).toLocaleString("th-TH")}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">ยังไม่มี Voucher</p>
              <p className="text-xs">Voucher จะถูกสร้างหลังยืนยันการสมัครสอบ</p>
            </div>
          )}

          <Separator />

          {/* Exam Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">วันสอบ</p>
                <p className="text-muted-foreground">
                  {new Date(schedule.startDate).toLocaleDateString("th-TH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-muted-foreground">
                  เวลา {new Date(schedule.startDate).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  {" — "}
                  {new Date(schedule.endDate).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            {(schedule.testCenter || schedule.location) && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">สถานที่สอบ</p>
                  {schedule.testCenter && (
                    <p className="text-muted-foreground">{schedule.testCenter.name}</p>
                  )}
                  {schedule.room && (
                    <p className="text-muted-foreground">ห้อง: {schedule.room.name}</p>
                  )}
                  {schedule.location && (
                    <p className="text-muted-foreground">{schedule.location}</p>
                  )}
                </div>
              </div>
            )}

            {registration.seatNumber && (
              <div className="flex items-start gap-2">
                <Armchair className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">ที่นั่ง</p>
                  <p className="text-2xl font-bold text-primary">{registration.seatNumber}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            💡 แสดง QR Code หรือรหัส Voucher ให้เจ้าหน้าที่ก่อนเข้าห้องสอบ
            สามารถแคปจอหรือบันทึกหน้านี้ไว้ล่วงหน้าได้
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
