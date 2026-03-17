"use client";

import { useState } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  CloudUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ImportExportPage() {
  const [exportFormat, setExportFormat] = useState<string>("");
  const [exportCategory, setExportCategory] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          นำเข้า / ส่งออก ข้อสอบ
        </h1>
        <p className="text-sm text-muted-foreground">
          นำเข้าข้อสอบจากไฟล์ภายนอกหรือส่งออกข้อสอบในระบบ
        </p>
      </div>

      {/* Import & Export Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Import Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Upload className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">นำเข้าข้อสอบ</CardTitle>
                <CardDescription>อัปโหลดไฟล์ข้อสอบเข้าสู่ระบบ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Area */}
            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
            >
              <CloudUpload className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                ลากไฟล์มาวางที่นี่
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                หรือคลิกเพื่อเลือกไฟล์
              </p>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                เลือกไฟล์
              </Button>
            </div>

            {/* Supported Formats */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                รูปแบบไฟล์ที่รองรับ
              </Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  Word (.docx)
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  Excel (.xlsx)
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <FileCode className="h-3 w-3" />
                  QTI (.xml)
                </Badge>
              </div>
            </div>

            {/* Import Guidelines */}
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">คำแนะนำ:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>ไฟล์ Word/Excel ต้องใช้ template ที่กำหนด</li>
                <li>รองรับ QTI 2.1 standard</li>
                <li>ขนาดไฟล์สูงสุด 10MB ต่อไฟล์</li>
                <li>นำเข้าได้สูงสุด 500 ข้อต่อครั้ง</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Export Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Download className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">ส่งออกข้อสอบ</CardTitle>
                <CardDescription>ดาวน์โหลดข้อสอบจากระบบ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Format */}
            <div className="space-y-2">
              <Label>รูปแบบไฟล์</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="เลือกรูปแบบไฟล์" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QTI">QTI 2.1 (.xml)</SelectItem>
                  <SelectItem value="PDF">PDF (.pdf)</SelectItem>
                  <SelectItem value="EXCEL">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Category */}
            <div className="space-y-2">
              <Label>กรองตามหมวดหมู่</Label>
              <Select value={exportCategory} onValueChange={setExportCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ทุกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกหมวดหมู่</SelectItem>
                  <SelectItem value="IT">เทคโนโลยีสารสนเทศ</SelectItem>
                  <SelectItem value="NETWORK">เครือข่ายคอมพิวเตอร์</SelectItem>
                  <SelectItem value="DATABASE">ฐานข้อมูล</SelectItem>
                  <SelectItem value="SECURITY">ความปลอดภัย</SelectItem>
                  <SelectItem value="FINANCE">การเงินและบัญชี</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Exam */}
            <div className="space-y-2">
              <Label>กรองตามชุดสอบ</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ทุกชุดสอบ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกชุดสอบ</SelectItem>
                  <SelectItem value="exam_001">
                    IT Fundamentals
                  </SelectItem>
                  <SelectItem value="exam_002">
                    Web Development Professional
                  </SelectItem>
                  <SelectItem value="exam_003">
                    Data Science & Analytics
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Button */}
            <Button className="w-full gap-1.5">
              <Download className="h-4 w-4" />
              ส่งออก
            </Button>

            {/* Export Info */}
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">หมายเหตุ:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>QTI รองรับนำเข้ากลับเข้าระบบได้</li>
                <li>PDF เหมาะสำหรับพิมพ์ข้อสอบกระดาษ</li>
                <li>Excel เหมาะสำหรับแก้ไขแล้วนำเข้ากลับ</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
