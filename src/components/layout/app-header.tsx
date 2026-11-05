"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getAuthErrorMessage } from "@/features/auth/auth-errors";
import { useAuthUser, useLogout } from "@/features/auth/hooks/use-auth";

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/new-research": "New research",
  "/history": "Research history",
  "/saved-reports": "Saved reports",
  "/settings": "Settings",
  "/research": "Research",
  "/research-report": "Report",
};

type AppHeaderProps = {
  collapsed: boolean;
  onCollapseToggle: () => void;
  onMenuClick: () => void;
};

export function AppHeader({
  collapsed,
  onCollapseToggle,
  onMenuClick,
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useAuthUser();
  const logout = useLogout();
  const initials =
    user?.full_name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "DR";

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm sm:px-7 lg:px-10">
      <div className="flex items-center gap-3">
        <Button
          aria-label="Open navigation"
          className="lg:hidden"
          onClick={onMenuClick}
          size="icon"
          variant="ghost"
        >
          <Menu />
        </Button>
        <Button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:inline-flex"
          onClick={onCollapseToggle}
          size="icon"
          variant="ghost"
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
        <div className="hidden text-sm font-medium sm:block">
          Research workspace
          <span className="ml-2 font-normal text-muted-foreground">
            /{" "}
            {pageTitles[
              pathname.endsWith("/report")
                ? "/research-report"
                : pathname.startsWith("/research/")
                  ? "/research"
                  : pathname
            ] ?? "Workspace"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <details className="group relative ml-1">
          <summary
            aria-label="Open profile menu"
            className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full border bg-card text-xs font-semibold text-muted-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
          >
            {initials}
          </summary>
          <div className="absolute right-0 top-11 z-50 w-60 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-md">
            <div className="border-b px-3 py-2.5">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <Link
              className="mt-1 flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              href="/settings"
            >
              Account settings
            </Link>
            {logout.isError && (
              <p className="px-3 py-2 text-xs leading-5 text-destructive" role="alert">
                {getAuthErrorMessage(logout.error, "Unable to sign out.")}
              </p>
            )}
            <button
              className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              disabled={logout.isPending}
              onClick={() =>
                logout.mutate(undefined, {
                  onSuccess: () => router.replace("/login"),
                })
              }
              type="button"
            >
              {logout.isPending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
