"use client";

import { useRef, useEffect } from "react";
import { Menu, User, LogOut, Settings, Sun, Moon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { useAppSession } from "@/hooks/use-session";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, tenant, role, isAuthenticated } = useAppSession();

  const prevCountRef = useRef<number>(0);

  const { data: unreadData } = useQuery<{ data: { count: number } }>({
    queryKey: ["notification-unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/v1/notifications/unread-count");
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const unreadCount = unreadData?.data?.count ?? 0;

  // Toast when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevCountRef.current && prevCountRef.current > 0) {
      const newCount = unreadCount - prevCountRef.current;
      toast.info(
        `คุณมีแจ้งเตือนใหม่ ${newCount} รายการ`,
        { action: { label: "ดู", onClick: () => window.location.href = "/admin/notifications" } }
      );
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Tenant name */}
        {tenant?.name && (
          <span className="hidden text-sm text-muted-foreground lg:block">
            {tenant.name}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Role badge */}
          {role?.name && (
            <Badge variant="outline" className="hidden text-xs md:inline-flex">
              {role.name}
            </Badge>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/admin/notifications">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 text-[10px] flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-7 w-7">
                  {user?.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm md:block">
                  {user?.name ?? "Loading..."}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/admin/settings">
                  <User className="mr-2 h-4 w-4" />
                  โปรไฟล์
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  ตั้งค่า
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={onToggleSidebar}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>
    </>
  );
}
