"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { ChevronDown, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarNav, type NavItem } from "./sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Child Nav Item (leaf) ──────────────────────────────────────────

function NavLeaf({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        pathname === item.href
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground"
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span>{item.title}</span>
    </Link>
  );
}

// ─── Parent Nav Item (with children) ────────────────────────────────

function NavGroup({
  item,
  isOpen,
  onToggle,
}: {
  item: NavItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;

  const isActive =
    item.children &&
    item.children.some(
      (child) => pathname === child.href || pathname.startsWith(child.href + "/")
    );

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "text-foreground font-medium"
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l pl-3">
          {item.children!.map((child) => (
            <NavLeaf key={child.href} item={child} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  // Accordion: only one group open at a time
  // Initialize with the group that contains the active route
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    for (const item of sidebarNav) {
      if (item.children?.some(
        (child) => pathname === child.href || pathname.startsWith(child.href + "/")
      )) {
        return item.href;
      }
    }
    return null;
  });

  const handleToggle = useCallback((href: string) => {
    setOpenGroup((prev) => (prev === href ? null : href));
  }, []);

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r bg-sidebar",
        className
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">U-Exam</p>
          <p className="text-xs text-muted-foreground">Exam Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 overflow-hidden" type="always">
        <nav className="space-y-1 px-3 py-3">
          {sidebarNav.map((item) =>
            item.children ? (
              <NavGroup
                key={item.href}
                item={item}
                isOpen={openGroup === item.href}
                onToggle={() => handleToggle(item.href)}
              />
            ) : (
              <NavLeaf key={item.href} item={item} />
            )
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}
