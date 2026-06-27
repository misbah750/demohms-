"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useClinicStore } from "@/store/useClinicStore";
import {
  Activity,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",                      label: "Dashboard",    icon: LayoutDashboard },
  { href: "/dashboard/patients",             label: "Patients",     icon: Users },
  { href: "/dashboard/appointments",         label: "Appointments", icon: Calendar },
  { href: "/dashboard/invoices",             label: "Invoices",     icon: FileText },
  { href: "/dashboard/inventory",            label: "Inventory",    icon: Boxes },
  { href: "/dashboard/packages",             label: "Packages",     icon: Package },
  { href: "/dashboard/analytics/revenue",    label: "Analytics",    icon: BarChart3 },
  { href: "/dashboard/settings",             label: "Settings",     icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useClinicStore();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300 shadow-sm",
        sidebarCollapsed ? "w-[64px]" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 border-b border-slate-100 shrink-0",
        sidebarCollapsed ? "px-3 py-4 justify-center" : "px-5 py-4"
      )}>
        <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <p className="text-slate-900 font-bold text-sm tracking-wide leading-none">HMS</p>
            <p className="text-slate-400 text-[10px] mt-0.5 leading-none">Hospital Mgmt</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {!sidebarCollapsed && (
                <span className="truncate flex-1">{label}</span>
              )}
              {!sidebarCollapsed && isActive && (
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-2 border-t border-slate-100 shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all text-xs"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
