"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Loader2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type IncidentItem = {
  id: string;
  type: string;
  description: string;
  action: string;
  candidateName: string;
  examTitle: string;
  createdBy: string;
  resolvedAt: string | null;
  resolution: string | null;
  createdAt: string;
};

function getActionBadge(action: string) {
  switch (action) {
    case "WARNING":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        >
          แจ้งเตือน
        </Badge>
      );
    case "PAUSE":
      return (
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
        >
          หยุดชั่วคราว
        </Badge>
      );
    case "TERMINATE":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        >
          บังคับส่ง
        </Badge>
      );
    default:
      return <Badge variant="outline">{action}</Badge>;
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProctoringIncidentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["proctoring-incidents"],
    queryFn: async () => {
      const res = await fetch("/api/v1/proctoring/incidents");
      const json = await res.json();
      return json;
    },
  });

  const incidents: IncidentItem[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          เหตุการณ์ระหว่างสอบ
        </h1>
        <p className="text-sm text-muted-foreground">
          บันทึกเหตุการณ์ที่ตรวจพบระหว่างการสอบ
        </p>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการเหตุการณ์</CardTitle>
          <CardDescription>
            ทั้งหมด {total} เหตุการณ์
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                ไม่มีเหตุการณ์
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เวลา</TableHead>
                  <TableHead>ผู้สอบ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                  <TableHead>ชุดสอบ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(incident.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{incident.candidateName}</div>
                      <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {incident.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{incident.type}</TableCell>
                    <TableCell>{getActionBadge(incident.action)}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                      {incident.examTitle}
                    </TableCell>
                    <TableCell>
                      {incident.resolvedAt ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          แก้ไขแล้ว
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        >
                          รอดำเนินการ
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            ดูรายละเอียด
                          </DropdownMenuItem>
                          {!incident.resolvedAt && (
                            <DropdownMenuItem>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              แก้ไขปัญหา
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
