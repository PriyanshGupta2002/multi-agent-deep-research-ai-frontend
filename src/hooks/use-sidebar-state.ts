import { useState } from "react";

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return {
    collapsed,
    mobileOpen,
    closeMobileSidebar: () => setMobileOpen(false),
    toggleCollapsed: () => setCollapsed((value) => !value),
    toggleMobileSidebar: () => setMobileOpen((value) => !value),
  };
}
