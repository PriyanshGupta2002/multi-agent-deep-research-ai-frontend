"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  Clock3,
  LayoutDashboard,
  MessageSquareText,
  Plus,
  ScrollText,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/features/auth/hooks/use-auth";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "Research history", icon: Clock3 },
  { href: "/chat", label: "Workspace Chat", icon: MessageSquareText },
  { href: "/saved-reports", label: "Saved reports", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

type AppSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
};

export function AppSidebar({
  collapsed,
  mobileOpen,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { data: user } = useAuthUser();
  const newResearchActive = pathname === "/new-research";
  const initials =
    user?.full_name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "DR";

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-dvh w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[transform,width] duration-200 ease-out lg:sticky lg:top-0 lg:translate-x-0",
        collapsed && "lg:w-[76px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <BookOpenCheck className="size-[17px]" />
        </div>
        <div className={cn("min-w-0", collapsed && "lg:hidden")}>
          <p className="truncate text-sm font-semibold tracking-tight">
            DeepResearch AI
          </p>
          <p className="text-[11px] text-muted-foreground">Research workspace</p>
        </div>
      </div>

      <div className="px-3 pt-6">
        <Link
          aria-current={newResearchActive ? "page" : undefined}
          aria-label="Start new research"
          className={cn(
            "mb-5 flex h-10 items-center justify-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors",
            newResearchActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              : "border border-sidebar-border bg-background text-foreground hover:bg-sidebar-accent",
            collapsed && "lg:mx-auto lg:size-10 lg:px-0",
          )}
          href="/new-research"
          onClick={onNavigate}
          title={collapsed ? "New research" : undefined}
        >
          <Plus className="size-4 shrink-0" />
          <span className={cn(collapsed && "lg:hidden")}>New research</span>
        </Link>
        <p
          className={cn(
            "mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
            collapsed && "lg:hidden",
          )}
        >
          Workspace
        </p>
        <nav aria-label="Workspace" className="space-y-1">
          {navigationItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground",
                )}
                href={href}
                key={href}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
              >
                <Icon className="size-[17px] shrink-0" />
                <span className={cn("truncate", collapsed && "lg:hidden")}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-md px-2 py-2",
            collapsed && "lg:justify-center lg:px-0",
          )}
        >
          <div
            aria-label={user?.full_name ?? "User profile"}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground"
            role="img"
          >
            {initials}
          </div>
          <div className={cn("min-w-0", collapsed && "lg:hidden")}>
            <p className="truncate text-xs font-medium">{user?.full_name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
