"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Loader2,
  Save,
  Mail,
  KeyRound,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "male", label: "ชาย" },
  { value: "female", label: "หญิง" },
  { value: "unspecified", label: "ไม่ระบุ" },
] as const;

const EDUCATION_LEVELS = [
  { value: "secondary", label: "มัธยมศึกษา" },
  { value: "vocational_cert", label: "ประกาศนียบัตรวิชาชีพ (ปวช.)" },
  { value: "high_vocational", label: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)" },
  { value: "bachelor", label: "ปริญญาตรี" },
  { value: "master", label: "ปริญญาโท" },
  { value: "doctorate", label: "ปริญญาเอก" },
] as const;

const THAI_MONTHS = [
  { value: "01", label: "มกราคม" },
  { value: "02", label: "กุมภาพันธ์" },
  { value: "03", label: "มีนาคม" },
  { value: "04", label: "เมษายน" },
  { value: "05", label: "พฤษภาคม" },
  { value: "06", label: "มิถุนายน" },
  { value: "07", label: "กรกฎาคม" },
  { value: "08", label: "สิงหาคม" },
  { value: "09", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
] as const;

/** Convert ค.ศ. (CE) year to พ.ศ. (BE) */
const toBuddhistYear = (ceYear: number) => ceYear + 543;
/** Convert พ.ศ. (BE) year to ค.ศ. (CE) */
const toChristianYear = (beYear: number) => beYear - 543;

// ─── Schema ──────────────────────────────────────────────────────────

const currentBEYear = toBuddhistYear(new Date().getFullYear());

const educationItemSchema = z.object({
  id: z.string().optional(),
  educationLevel: z.string().min(1, "กรุณาเลือกระดับการศึกษา"),
  institution: z.string().min(1, "กรุณากรอกสถาบันการศึกษา").max(255),
  faculty: z.string().max(255).optional().or(z.literal("")),
  major: z.string().max(255).optional().or(z.literal("")),
  graduationYear: z.string().optional().or(z.literal("")).refine(
    (val) => !val || (/^\d{4}$/.test(val) && Number(val) >= 2493 && Number(val) <= currentBEYear + 10),
    { message: `ปี พ.ศ. ต้องอยู่ระหว่าง 2493-${currentBEYear + 10}` }
  ),
});

const editProfileSchema = z.object({
  // Basic
  displayName: z.string().min(1, "กรุณากรอกชื่อที่แสดง").max(255),
  phone: z.string().max(20).optional().or(z.literal("")),
  // Date of birth as separate fields (พ.ศ.)
  dobDay: z.string().optional().or(z.literal("")),
  dobMonth: z.string().optional().or(z.literal("")),
  dobYear: z.string().optional().or(z.literal("")).refine(
    (val) => !val || (/^\d{4}$/.test(val) && Number(val) >= 2430 && Number(val) <= currentBEYear),
    { message: `ปี พ.ศ. ต้องอยู่ระหว่าง 2430-${currentBEYear}` }
  ),
  gender: z.string().optional().or(z.literal("")),
  nationalId: z.string().max(20).optional().or(z.literal("")),
  address: z.string().max(1000).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  // Education (multiple records)
  educations: z.array(educationItemSchema).max(10),
  // Public Profile
  publicProfileUrl: z
    .string()
    .min(3, "อย่างน้อย 3 ตัวอักษร")
    .max(100)
    .regex(/^[a-z0-9_-]+$/, "ใช้ได้เฉพาะ a-z, 0-9, _ และ -")
    .optional()
    .or(z.literal("")),
  isPublic: z.boolean(),
});

type EditProfileValues = z.infer<typeof editProfileSchema>;

const emailChangeSchema = z.object({
  newEmail: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

// ─── Types ───────────────────────────────────────────────────────────

interface EducationRecord {
  id: string;
  educationLevel: string;
  institution: string;
  faculty: string | null;
  major: string | null;
  graduationYear: number | null;
  sortOrder: number;
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    imageUrl: string | null;
    provider: string;
  };
  profile: {
    displayName: string | null;
    institution: string | null;
    bio: string | null;
    publicProfileUrl: string | null;
    isPublic: boolean;
    dateOfBirth: string | null;
    gender: string | null;
    nationalId: string | null;
    address: string | null;
    // Legacy flat fields (backward compat)
    educationLevel: string | null;
    faculty: string | null;
    major: string | null;
    graduationYear: number | string | null;
    // New multi-record
    educations: EducationRecord[];
  } | null;
}

// ─── Helpers: parse loaded data into form defaults ───────────────────

function buildDefaults(data: ProfileData): EditProfileValues {
  const { user, profile } = data;

  // Parse dateOfBirth (ISO "YYYY-MM-DD") → separate day/month/year(พ.ศ.)
  let dobDay = "", dobMonth = "", dobYear = "";
  if (profile?.dateOfBirth) {
    const parts = profile.dateOfBirth.split("-"); // ["YYYY","MM","DD"]
    if (parts.length === 3) {
      dobDay = String(parseInt(parts[2], 10)); // remove leading zero
      dobMonth = parts[1];
      dobYear = String(toBuddhistYear(parseInt(parts[0], 10)));
    }
  }

  // Build educations array from API data, with CE→BE year conversion
  let educations: EditProfileValues["educations"] = [];
  if (profile?.educations && profile.educations.length > 0) {
    educations = profile.educations.map((edu) => ({
      id: edu.id,
      educationLevel: edu.educationLevel,
      institution: edu.institution,
      faculty: edu.faculty || "",
      major: edu.major || "",
      graduationYear: edu.graduationYear
        ? String(toBuddhistYear(edu.graduationYear))
        : "",
    }));
  } else if (profile?.educationLevel) {
    // Fallback: legacy flat fields → single education entry
    educations = [{
      educationLevel: profile.educationLevel,
      institution: profile.institution || "",
      faculty: profile.faculty || "",
      major: profile.major || "",
      graduationYear: profile.graduationYear
        ? String(toBuddhistYear(Number(profile.graduationYear)))
        : "",
    }];
  }

  return {
    displayName: profile?.displayName || user.name || "",
    phone: user.phone || "",
    dobDay,
    dobMonth,
    dobYear,
    gender: profile?.gender || "",
    nationalId: "", // Don't pre-fill masked nationalId
    address: profile?.address || "",
    bio: profile?.bio || "",
    educations,
    publicProfileUrl: profile?.publicProfileUrl || "",
    isPublic: profile?.isPublic ?? false,
  };
}

// ─── Outer Component (handles loading) ──────────────────────────────

export default function ProfileEditPage() {
  const { data: profileData, isLoading } = useQuery<{ data: ProfileData }>({
    queryKey: ["profile-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/v1/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  if (isLoading || !profileData?.data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <ProfileEditForm data={profileData.data} />;
}

// ─── Inner Form Component (mounts only when data is ready) ──────────

function ProfileEditForm({ data }: { data: ProfileData }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: "", password: "" });

  const form = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: buildDefaults(data),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "educations",
  });

  const updateMutation = useMutation({
    mutationFn: async (values: EditProfileValues) => {
      // Clean up empty strings to undefined
      const payload: Record<string, unknown> = {
        displayName: values.displayName,
        isPublic: values.isPublic,
      };

      // Only include non-empty values
      if (values.phone) payload.phone = values.phone;

      // Construct dateOfBirth ISO string from day/month/year(พ.ศ.)
      if (values.dobDay && values.dobMonth && values.dobYear) {
        const ceYear = toChristianYear(Number(values.dobYear));
        const day = values.dobDay.padStart(2, "0");
        payload.dateOfBirth = `${ceYear}-${values.dobMonth}-${day}`;
      }

      if (values.gender) payload.gender = values.gender;
      if (values.nationalId) payload.nationalId = values.nationalId;
      if (values.address) payload.address = values.address;
      if (values.bio) payload.bio = values.bio;

      // Convert educations array: graduationYear พ.ศ. → ค.ศ., add sortOrder
      payload.educations = values.educations.map((edu, i) => ({
        ...(edu.id ? { id: edu.id } : {}),
        educationLevel: edu.educationLevel,
        institution: edu.institution,
        faculty: edu.faculty || undefined,
        major: edu.major || undefined,
        graduationYear: edu.graduationYear
          ? toChristianYear(Number(edu.graduationYear))
          : undefined,
        sortOrder: i,
      }));

      if (values.publicProfileUrl) payload.publicProfileUrl = values.publicProfileUrl;

      const res = await fetch("/api/v1/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "บันทึกไม่สำเร็จ");
      }
      return res.json();
    },
  });

  const emailChangeMutation = useMutation({
    mutationFn: async (emailData: { newEmail: string; password: string }) => {
      const res = await fetch("/api/v1/profile/email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "ส่งคำขอไม่สำเร็จ");
      }
      return res.json();
    },
  });

  const onSubmit = async (values: EditProfileValues) => {
    try {
      await updateMutation.mutateAsync(values);
      toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
      if (values.displayName) {
        await updateSession({ name: values.displayName });
      }
      queryClient.invalidateQueries({ queryKey: ["profile-dashboard"] });
      router.push("/profile");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    }
  };

  const handleEmailChange = async () => {
    const parsed = emailChangeSchema.safeParse(emailForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      await emailChangeMutation.mutateAsync(parsed.data);
      toast.success("ส่งลิงก์ยืนยันไปที่อีเมลใหม่แล้ว กรุณาตรวจสอบอีเมล");
      setEmailDialogOpen(false);
      setEmailForm({ newEmail: "", password: "" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ส่งคำขอไม่สำเร็จ"
      );
    }
  };

  const userData = data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">แก้ไขข้อมูล</h1>
          <p className="text-sm text-muted-foreground">
            อัปเดตข้อมูลส่วนตัวของคุณ
          </p>
        </div>
      </div>

      {/* Card 1: Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลบัญชี</CardTitle>
          <CardDescription>
            อีเมลและวิธีการเข้าสู่ระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {userData?.user.email ?? ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  เข้าสู่ระบบผ่าน {userData?.user.provider === "google" ? "Google" : "อีเมล"}
                </p>
              </div>
            </div>
            {userData?.user.provider === "credentials" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEmailDialogOpen(true)}
              >
                <KeyRound className="h-4 w-4" />
                เปลี่ยนอีเมล
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Card 2: Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ข้อมูลพื้นฐาน</CardTitle>
              <CardDescription>
                ข้อมูลส่วนตัวของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อ-นามสกุล *</FormLabel>
                    <FormControl>
                      <Input placeholder="ชื่อ-นามสกุล" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์โทรศัพท์</FormLabel>
                      <FormControl>
                        <Input placeholder="08x-xxx-xxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>วันเกิด (พ.ศ.)</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Day */}
                    <FormField
                      control={form.control}
                      name="dobDay"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="วัน" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <SelectItem key={d} value={String(d)}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {/* Month */}
                    <FormField
                      control={form.control}
                      name="dobMonth"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เดือน" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {THAI_MONTHS.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {/* Year (พ.ศ.) */}
                    <FormField
                      control={form.control}
                      name="dobYear"
                      render={({ field }) => (
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="พ.ศ."
                            {...field}
                          />
                        </FormControl>
                      )}
                    />
                  </div>
                  {form.formState.errors.dobYear && (
                    <p className="text-xs text-destructive mt-1">
                      {form.formState.errors.dobYear.message}
                    </p>
                  )}
                </FormItem>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เพศ</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกเพศ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENDER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เลขบัตรประชาชน/Passport</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            userData?.profile?.nationalId
                              ? `ปัจจุบัน: ${userData.profile.nationalId}`
                              : "x-xxxx-xxxxx-xx-x"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        ข้อมูลจะถูกเก็บอย่างปลอดภัย
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ที่อยู่</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ที่อยู่ปัจจุบัน..."
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>แนะนำตัว</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="เขียนแนะนำตัวเองสั้นๆ..."
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      สูงสุด 1,000 ตัวอักษร ({field.value?.length || 0}/1,000)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card 3: Education (Multiple Records) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">ข้อมูลการศึกษา</CardTitle>
                  <CardDescription>
                    ประวัติการศึกษาของคุณ (สูงสุด 10 รายการ)
                  </CardDescription>
                </div>
                {fields.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      append({
                        educationLevel: "",
                        institution: "",
                        faculty: "",
                        major: "",
                        graduationYear: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่ม
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    ยังไม่มีข้อมูลการศึกษา
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 gap-1.5"
                    onClick={() =>
                      append({
                        educationLevel: "",
                        institution: "",
                        faculty: "",
                        major: "",
                        graduationYear: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มประวัติการศึกษา
                  </Button>
                </div>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border p-4 space-y-4"
                >
                  {/* Education Card Header */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      รายการที่ {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Education Level */}
                  <FormField
                    control={form.control}
                    name={`educations.${index}.educationLevel`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>ระดับการศึกษา *</FormLabel>
                        <Select
                          onValueChange={f.onChange}
                          value={f.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกระดับการศึกษา" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EDUCATION_LEVELS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Institution */}
                  <FormField
                    control={form.control}
                    name={`educations.${index}.institution`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>สถาบันการศึกษา *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="เช่น มหาวิทยาลัยเกษตรศาสตร์"
                            {...f}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Faculty & Major */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`educations.${index}.faculty`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>คณะ</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="เช่น วิศวกรรมศาสตร์"
                              {...f}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`educations.${index}.major`}
                      render={({ field: f }) => (
                        <FormItem>
                          <FormLabel>สาขาวิชา</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="เช่น วิทยาการคอมพิวเตอร์"
                              {...f}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Graduation Year (พ.ศ.) */}
                  <FormField
                    control={form.control}
                    name={`educations.${index}.graduationYear`}
                    render={({ field: f }) => (
                      <FormItem className="sm:max-w-[200px]">
                        <FormLabel>ปีที่จบการศึกษา (พ.ศ.)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={`เช่น ${currentBEYear}`}
                            {...f}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Card 4: Public Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">โปรไฟล์สาธารณะ</CardTitle>
              <CardDescription>
                ตั้งค่าโปรไฟล์ที่ผู้อื่นสามารถเข้าชมได้
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        เปิดโปรไฟล์สาธารณะ
                      </FormLabel>
                      <FormDescription>
                        อนุญาตให้ผู้อื่นเข้าชมโปรไฟล์ของคุณผ่าน URL
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publicProfileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL โปรไฟล์</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-0">
                        <span className="flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                          /profile/
                        </span>
                        <Input
                          placeholder="my-username"
                          className="rounded-l-none"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      ใช้ตัวอักษร a-z, ตัวเลข 0-9, _ และ - เท่านั้น
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/profile">
              <Button type="button" variant="outline">
                ยกเลิก
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              บันทึก
            </Button>
          </div>
        </form>
      </Form>

      {/* Email Change Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              เปลี่ยนอีเมล
            </DialogTitle>
            <DialogDescription>
              ระบบจะส่งลิงก์ยืนยันไปที่อีเมลใหม่ อีเมลจะเปลี่ยนหลังจากยืนยันแล้ว
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">อีเมลปัจจุบัน</label>
              <Input
                value={userData?.user.email ?? ""}
                disabled
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium">อีเมลใหม่</label>
              <Input
                type="email"
                placeholder="newemail@example.com"
                value={emailForm.newEmail}
                onChange={(e) =>
                  setEmailForm((f) => ({ ...f, newEmail: e.target.value }))
                }
                className="mt-1.5"
              />
            </div>

            <div>
              <label className="text-sm font-medium">รหัสผ่านปัจจุบัน</label>
              <Input
                type="password"
                placeholder="กรอกรหัสผ่านเพื่อยืนยัน"
                value={emailForm.password}
                onChange={(e) =>
                  setEmailForm((f) => ({ ...f, password: e.target.value }))
                }
                className="mt-1.5"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleEmailChange}
                disabled={emailChangeMutation.isPending}
                className="gap-2"
              >
                {emailChangeMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                ส่งลิงก์ยืนยัน
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
