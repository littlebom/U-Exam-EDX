"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TenantThemeProvider } from "@/components/providers/tenant-theme-provider";

// Routes ที่ซ่อน Sidebar (mobile check-in) — เฉพาะ /admin/exams/check-in/[scheduleId]
// Exclude: หน้า dashboard + logs (แสดง sidebar ปกติ)
const HIDE_SIDEBAR_ROUTES = ["/admin/exams/check-in/"];
const HIDE_SIDEBAR_EXCLUDE = ["/admin/exams/check-in/logs"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const hideSidebar =
    HIDE_SIDEBAR_ROUTES.some((p) => pathname.startsWith(p)) &&
    !HIDE_SIDEBAR_EXCLUDE.some((p) => pathname.startsWith(p));

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect candidates (no tenant) to their profile page
  useEffect(() => {
    if (status === "authenticated" && session && !session.tenant?.id) {
      router.replace("/profile");
    }
  }, [status, session, router]);

  if (!mounted || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render dashboard for candidates
  if (status === "authenticated" && !session?.tenant?.id) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TenantThemeProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar — ซ่อนในหน้าที่ใช้บน Mobile เช่น Check-in */}
        {!hideSidebar && (
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {!hideSidebar && (
            <Header
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
          )}
          <main className={`flex-1 overflow-y-auto ${hideSidebar ? "p-2" : "p-4 lg:p-6"}`}>
            {children}
          </main>
        </div>
      </div>
    </TenantThemeProvider>
  );
}
