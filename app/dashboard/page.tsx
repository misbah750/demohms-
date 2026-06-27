"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, Users, Calendar, TrendingUp, FileText, Clock } from "lucide-react";
import { formatCurrency, formatDate, formatTime, appointmentStatusColors } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

const MOCK_STATS: DashboardStats = {
  totalPatients: 284,
  todayAppointments: 12,
  monthlyRevenue: 485000,
  pendingInvoices: 7,
  appointmentsTrend: [
    { date: "Mon", count: 8 }, { date: "Tue", count: 12 }, { date: "Wed", count: 10 },
    { date: "Thu", count: 15 }, { date: "Fri", count: 9 }, { date: "Sat", count: 14 }, { date: "Sun", count: 6 },
  ],
  revenueTrend: [
    { month: "Jan", revenue: 320000 }, { month: "Feb", revenue: 410000 },
    { month: "Mar", revenue: 380000 }, { month: "Apr", revenue: 520000 },
    { month: "May", revenue: 460000 }, { month: "Jun", revenue: 485000 },
  ],
  recentAppointments: [],
};

const RECENT_MOCK = [
  { id: "1", patient: { name: "Sarah Ahmed" },   doctor: { name: "Dr. Malik" },  service: { name: "Botox",         base_price: 15000 }, appointment_date: new Date().toISOString().split("T")[0], time_slot: "10:00", status: "confirmed"   },
  { id: "2", patient: { name: "Zara Khan" },     doctor: { name: "Dr. Malik" },  service: { name: "Filler",        base_price: 25000 }, appointment_date: new Date().toISOString().split("T")[0], time_slot: "11:30", status: "completed"   },
  { id: "3", patient: { name: "Amna Siddiqui" }, doctor: { name: "Dr. Fatima" }, service: { name: "Laser",         base_price: 18000 }, appointment_date: new Date().toISOString().split("T")[0], time_slot: "14:00", status: "scheduled"   },
  { id: "4", patient: { name: "Hina Baig" },     doctor: { name: "Dr. Fatima" }, service: { name: "PRP",           base_price: 22000 }, appointment_date: new Date().toISOString().split("T")[0], time_slot: "15:30", status: "in_progress" },
  { id: "5", patient: { name: "Maryam Riaz" },   doctor: { name: "Dr. Malik" },  service: { name: "Chemical Peel", base_price: 12000 }, appointment_date: new Date().toISOString().split("T")[0], time_slot: "16:00", status: "cancelled"   },
];

async function fetchStats(): Promise<DashboardStats> {
  try {
    const res = await fetch("/api/dashboard/stats");
    const json = await res.json();
    if (json.data) return { ...MOCK_STATS, ...json.data };
  } catch {}
  return MOCK_STATS;
}

interface KpiCardProps {
  title: string; value: string; subtitle: string;
  icon: React.ElementType; trend?: string; trendUp?: boolean;
  color: string;
}

function KpiCard({ title, value, subtitle, icon: Icon, trend, trendUp, color }: KpiCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
            {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-0.5">{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <p className="text-sm font-medium text-slate-700 mt-1">{title}</p>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  scheduled:   "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  confirmed:   "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  in_progress: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  completed:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  cancelled:   "bg-red-50 text-red-600 ring-1 ring-red-200",
  no_show:     "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
    initialData: MOCK_STATS,
  });

  const kpis = [
    { title: "Total Patients",        value: stats.totalPatients.toLocaleString(), subtitle: "Registered patients",    icon: Users,      trend: "+12%", trendUp: true,  color: "bg-sky-50 text-sky-600"     },
    { title: "Today's Appointments",  value: stats.todayAppointments.toString(),   subtitle: "Scheduled for today",    icon: Calendar,   trend: "+3",   trendUp: true,  color: "bg-violet-50 text-violet-600" },
    { title: "Monthly Revenue",       value: formatCurrency(stats.monthlyRevenue), subtitle: "This month earnings",    icon: TrendingUp, trend: "+8.2%",trendUp: true,  color: "bg-emerald-50 text-emerald-600"},
    { title: "Pending Invoices",      value: stats.pendingInvoices.toString(),     subtitle: "Awaiting payment",       icon: FileText,   trend: "−2",   trendUp: false, color: "bg-amber-50 text-amber-600"  },
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">{formatDate(new Date())} — Overview of clinic activity</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.revenueTrend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0284c7" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)" }}
                labelStyle={{ color: "#64748b" }}
                itemStyle={{ color: "#0284c7" }}
                formatter={(v: number) => [formatCurrency(v), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Appointments */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Weekly Appointments</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.appointmentsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)" }}
                labelStyle={{ color: "#64748b" }}
                itemStyle={{ color: "#0ea5e9" }}
              />
              <Bar dataKey="count" fill="#bae6fd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's appointments table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Today&apos;s Appointments</h2>
          <a href="/dashboard/appointments" className="text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors">View all →</a>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Service · Doctor</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {RECENT_MOCK.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sky-700 font-semibold text-xs">
                        {(a.patient as { name: string }).name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <span className="font-medium text-slate-900">{(a.patient as { name: string }).name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell text-slate-600 text-sm">
                  {(a.service as { name: string }).name}
                  <span className="text-slate-400"> · </span>
                  {(a.doctor as { name: string }).name}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm">{formatTime(a.time_slot)}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[a.status] ?? ""}`}>
                    {a.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right hidden sm:table-cell font-semibold text-slate-800">
                  {formatCurrency((a.service as { base_price: number }).base_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
