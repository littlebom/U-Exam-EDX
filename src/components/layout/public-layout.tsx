"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  GraduationCap,
  Menu,
  X,
  User,
  FileText,
  Award,
  Wallet,
  Settings,
  LogOut,
  LayoutDashboard,
  Sun,
  Moon,
  Bell,
  ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/layout/footer";

const navLinks = [
  { href: "/", label: "หน้าแรก" },
  { href: "/catalog", label: "ตารางสอบ" },
  { href: "/news", label: "ข่าวสาร" },
  { href: "/contact", label: "ติดต่อเรา" },
];

// Avatar dropdown menu links (same as candidate layout)
const avatarMenuLinks = [
  { href: "/profile", label: "โปรไฟล์", icon: User },
  { href: "/profile/certificates", label: "Certificate", icon: Award },
  { href: "/profile/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile/settings", label: "ตั้งค่า", icon: Settings },
];

/** Roles that should NOT see the admin dashboard link */
const CANDIDATE_ROLES = ["CANDIDATE"];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role, isAuthenticated, isLoading } = useAppSession();
  const { theme, setTheme } = useTheme();

  // Notification count (only when logged in)
  const { data: notifData } = useQuery({
    queryKey: ["unread-notifications-count"],
    queryFn: async () => {
      const res = await fetch("/api/v1/notifications?perPage=1&unreadOnly=true");
      if (!res.ok) return { meta: { total: 0 } };
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });
  const unreadCount = notifData?.meta?.total ?? 0;

  const isCandidate = CANDIDATE_ROLES.includes(role?.name ?? "");

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          {/* Logo — fixed width left */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">U-Exam</span>
          </Link>

          {/* Desktop Nav — centered */}
          <nav className="hidden items-center justify-center gap-1 md:flex flex-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Theme + Notification + Avatar (Desktop + Mobile) */}
          <div className="flex items-center gap-1 shrink-0">
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

            {/* Notification bell */}
            {isAuthenticated && (
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link href="/profile/notifications">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 text-[10px] flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            )}

            {/* Avatar Dropdown */}
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      {user?.image && (
                        <AvatarImage src={user.image} alt={user.name ?? ""} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden lg:inline">
                      {user?.name ?? ""}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name ?? ""}</p>
                      <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {avatarMenuLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href} className="flex items-center gap-2">
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {!isCandidate && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="h-4 w-4" />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button size="sm">เข้าสู่ระบบ</Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div
          className={cn(
            "border-t md:hidden",
            mobileMenuOpen ? "block" : "hidden"
          )}
        >
          <nav className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Divider + Avatar menu items (mobile) */}
            {isAuthenticated && (
              <div className="mt-2 border-t pt-2">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Avatar className="h-6 w-6">
                    {user?.image && (
                      <AvatarImage src={user.image} alt={user.name ?? ""} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {user?.name ?? ""}
                  </span>
                </div>
                {avatarMenuLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                {!isCandidate && (
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="h-4 w-4" />
                  ออกจากระบบ
                </button>
              </div>
            )}

            {!isAuthenticated && !isLoading && (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="mt-2 w-full">
                  เข้าสู่ระบบ
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
