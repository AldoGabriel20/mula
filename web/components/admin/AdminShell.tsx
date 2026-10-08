"use client";

import "./admin.css";
import { authSans, authSerif } from "@/lib/fonts/prototype";
import { useAdmin } from "./AdminProvider";
import { SidebarView } from "./views/Sidebar";
import { TopbarView } from "./views/Topbar";
import { LoadingView } from "./views/Loading";
import { OverlaysView } from "./views/Overlays";
import { PrintRootView } from "./views/PrintRoot";
import { ToastView } from "./views/Toast";

// Frame from the prototype: sidebar, sticky top bar, the page, mobile bar and every overlay.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { v } = useAdmin();
  return (
    <div className={`adm ${authSerif.variable} ${authSans.variable}`}>
      <SidebarView v={v} />
      <div className={v.flipCls}>
        <TopbarView v={v} />
        <LoadingView v={v} />
        {children}
      </div>
      <OverlaysView v={v} />
      <PrintRootView v={v} />
      <ToastView v={v} />
    </div>
  );
}
