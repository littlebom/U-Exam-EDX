"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Save, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Slider } from "@/components/ui/slider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Framework {
  id: string;
  name: string;
  areas: Array<{ id: string; name: string; color: string | null; order: number }>;
}

interface ExistingMap {
  competencyAreaId: string;
  frameworkId: string;
  weight: number;
}

interface Props {
  subjectId: string;
}

export function SubjectCompetencySettings({ subjectId }: Props) {
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const initRef = useRef<string>("");
  const queryClient = useQueryClient();

  // Load frameworks
  const { data: frameworks = [] } = useQuery<Framework[]>({
    queryKey: ["competency-frameworks-list"],
    queryFn: async () => {
      const res = await fetch("/api/v1/competency-frameworks");
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data ?? []).map((fw: Framework & { areas?: Framework["areas"] }) => ({
        ...fw,
        areas: (fw.areas ?? []).sort((a: { order: number }, b: { order: number }) => a.order - b.order),
      }));
    },
  });

  // Load existing mappings
  const { data: existingMaps = [] } = useQuery<ExistingMap[]>({
    queryKey: ["subject-competency", subjectId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/subjects/${subjectId}/competency`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    },
  });

  // Auto-select framework + init weights (run once when data arrives)
  const dataKey = `${frameworks.map(f => f.id).join(",")}_${existingMaps.map(m => m.competencyAreaId).join(",")}`;
  useEffect(() => {
    if (initRef.current === dataKey) return;

    let fwId = selectedFrameworkId;
    if (!fwId && existingMaps.length > 0) {
      fwId = existingMaps[0].frameworkId;
      setSelectedFrameworkId(fwId);
    } else if (!fwId && frameworks.length > 0) {
      fwId = frameworks[0].id;
      setSelectedFrameworkId(fwId);
    }
    if (!fwId) return;

    const fw = frameworks.find((f) => f.id === fwId);
    if (!fw) return;

    const newWeights: Record<string, number> = {};
    for (const area of fw.areas) {
      const existing = existingMaps.find((m) => m.competencyAreaId === area.id);
      newWeights[area.id] = existing ? existing.weight : 0;
    }
    setWeights(newWeights);
    initRef.current = dataKey;
  }, [dataKey, frameworks, existingMaps, selectedFrameworkId]);

  // Re-init weights when user switches framework manually
  const handleFrameworkChange = (fwId: string) => {
    setSelectedFrameworkId(fwId);
    const fw = frameworks.find((f) => f.id === fwId);
    if (!fw) return;
    const newWeights: Record<string, number> = {};
    for (const area of fw.areas) {
      const existing = existingMaps.find((m) => m.competencyAreaId === area.id);
      newWeights[area.id] = existing ? existing.weight : 0;
    }
    setWeights(newWeights);
  };

  const selectedFramework = frameworks.find((f) => f.id === selectedFrameworkId);

  const handleSave = async () => {
    if (!selectedFrameworkId) return;
    setIsSaving(true);
    try {
      const mappings = Object.entries(weights).map(([competencyAreaId, weight]) => ({
        competencyAreaId,
        weight,
      }));

      const payload = { frameworkId: selectedFrameworkId, mappings };
      const res = await fetch(`/api/v1/subjects/${subjectId}/competency`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("บันทึกสมรรถนะสำเร็จ");
        queryClient.invalidateQueries({ queryKey: ["subject-competency", subjectId] });
      } else {
        toast.error(json.error?.message || "เกิดข้อผิดพลาด");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  if (frameworks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            สมรรถนะ (Competency)
          </CardTitle>
          <CardDescription>
            ยังไม่มีกรอบสมรรถนะ —{" "}
            <a href="/admin/settings/competency" className="text-primary underline">
              สร้างกรอบสมรรถนะ
            </a>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              สมรรถนะ (Competency)
            </CardTitle>
            <CardDescription>
              กำหนดน้ำหนักสมรรถนะที่วิชานี้วัดได้
            </CardDescription>
          </div>
          <Select value={selectedFrameworkId} onValueChange={handleFrameworkChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="เลือกกรอบ" />
            </SelectTrigger>
            <SelectContent>
              {frameworks.map((fw) => (
                <SelectItem key={fw.id} value={fw.id}>
                  {fw.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedFramework?.areas.map((area) => {
          const w = weights[area.id] ?? 0;
          const pct = Math.round(w * 100);
          return (
            <div key={area.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: area.color || "hsl(var(--primary))" }}
                  />
                  <span className="text-sm font-medium">{area.name}</span>
                </div>
                <span className="text-sm font-bold tabular-nums w-12 text-right">
                  {pct}%
                </span>
              </div>
              <Slider
                value={[pct]}
                min={0}
                max={100}
                step={5}
                onValueChange={([val]) =>
                  setWeights((prev) => ({ ...prev, [area.id]: val / 100 }))
                }
              />
            </div>
          );
        })}

        {/* Save */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            แต่ละด้านกำหนดได้อิสระ 0-100% (ไม่ต้องรวมเป็น 100%)
          </p>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            บันทึก
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
