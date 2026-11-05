"use client";

import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useSidebarState } from "@/hooks/use-sidebar-state";

export function AppShell({ children }: { children: ReactNode }) {
  const {
    collapsed,
    mobileOpen,
    closeMobileSidebar,
    toggleCollapsed,
    toggleMobileSidebar,
  } = useSidebarState();

  return (
    <div className="min-h-dvh bg-background">
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
          onClick={closeMobileSidebar}
          type="button"
        />
      )}
      <div className="flex min-h-dvh">
        <Suspense
          fallback={
            <aside
              aria-hidden="true"
              className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar lg:block"
            />
          }
        >
          <AppSidebar
            collapsed={collapsed}
            mobileOpen={mobileOpen}
            onNavigate={closeMobileSidebar}
          />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={<div aria-hidden="true" className="h-16 border-b" />}>
            <AppHeader
              collapsed={collapsed}
              onCollapseToggle={toggleCollapsed}
              onMenuClick={toggleMobileSidebar}
            />
          </Suspense>
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
