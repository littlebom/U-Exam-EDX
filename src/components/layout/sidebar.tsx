"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarNav, type NavItem } from "./sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

function NavItemComponent({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some(
      (child) => pathname === child.href || pathname.startsWith(child.href + "/")
    );
  });

  const isActive =
    pathname === item.href ||
    (item.children &&
      item.children.some(
        (child) => pathname === child.href || pathname.startsWith(child.href + "/")
      ));

  const Icon = item.icon;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
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
              "h-4 w-4 shrink-0 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
        {open && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-3">
            {item.children.map((child) => (
              <NavItemComponent key={child.href} item={child} />
            ))}
          </div>
        )}
      </div>
    );
  }

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

export function Sidebar({ className }: { className?: string }) {
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
          {sidebarNav.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
