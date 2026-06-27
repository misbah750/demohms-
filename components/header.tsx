"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Bell, LogOut, User, ChevronDown, Search } from "lucide-react";
import { useState } from "react";

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  patients: "Patients",
  appointments: "Appointments",
  invoices: "Invoices",
  inventory: "Inventory",
  packages: "Packages",
  analytics: "Analytics",
  revenue: "Revenue",
  performance: "Performance",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: breadcrumbMap[seg] ?? seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-300">/</span>}
            {crumb.isLast ? (
              <span className="text-slate-900 font-semibold">{crumb.label}</span>
            ) : (
              <a href={crumb.href} className="text-slate-500 hover:text-slate-700 transition-colors">
                {crumb.label}
              </a>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-sky-500 rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
          >
            <div className="w-6 h-6 bg-sky-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <span className="text-sm text-slate-700 font-medium hidden sm:block">Admin</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <a
                  href="/dashboard/settings"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Profile
                </a>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
