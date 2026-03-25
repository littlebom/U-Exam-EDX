"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  GraduationCap,
  Menu,
  X,
  User,
  FileText,
  Award,
  Monitor,
  LogOut,
  BookOpen,
  ClipboardList,
  Wallet,
  ChevronDown,
  Settings,
  LayoutDashboard,
  Sun,
  Moon,
  Bell,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { useAppSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/layout/footer";

// Main navbar links
const navLinks = [
  { href: "/profile/exam-catalog", label: "รายวิชาสอบ", icon: BookOpen },
  { href: "/profile/registrations", label: "การลงทะเบียน", icon: ClipboardList },
  { href: "/profile/my-exams", label: "การสอบของฉัน", icon: Monitor },
  { href: "/profile/results", label: "ผลสอบ", icon: FileText },
];

// Avatar dropdown menu links
const avatarMenuLinks = [
  { href: "/profile", label: "โปรไฟล์", icon: User },
  { href: "/profile/certificates", label: "Certificate", icon: Award },
  { href: "/profile/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile/settings", label: "ตั้งค่า", icon: Settings },
];

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, role, isAuthenticated, isLoading } = useAppSession();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification count
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

  const userInitials = user?.name
    ? user.name.slice(0, 2)
    : "ผส";

  // Prevent hydration mismatch — session is null on server, loaded on client
  const isSessionReady = !isLoading;

  /** Roles that have access to admin dashboard */
  const CANDIDATE_ROLES = ["CANDIDATE"];
  const canAccessAdmin = !CANDIDATE_ROLES.includes(role?.name ?? "CANDIDATE");

  const isNavActive = (href: string) =>
    pathname === href ||
    (href !== "/profile" && pathname.startsWith(href));

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/profile" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">U-Exam</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = isNavActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Theme + Notification + Avatar (Desktop) */}
          <div className="flex items-center gap-1">
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

            {isSessionReady && (
              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 px-2"
                    >
                      <Avatar className="h-8 w-8">
                        {user?.image && (
                          <AvatarImage src={user.image} alt={user.name ?? ""} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden lg:inline">
                        {user?.name ?? "ผู้สอบ"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {user?.name ?? "ผู้สอบ"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email ?? ""}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {avatarMenuLinks.map((link) => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link
                          href={link.href}
                          className="flex items-center gap-2"
                        >
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    {canAccessAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-2"
                          >
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
              </div>
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
              const isActive = isNavActive(link.href);
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
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Divider + Avatar menu items (mobile) */}
            <div className="mt-2 border-t pt-2">
              <div className="flex items-center gap-2 px-3 py-2">
                <Avatar className="h-6 w-6">
                  {user?.image && (
                    <AvatarImage src={user.image} alt={user.name ?? ""} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {user?.name ?? "ผู้สอบ"}
                </span>
              </div>
              {avatarMenuLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isNavActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              {canAccessAdmin && (
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
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
