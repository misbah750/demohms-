"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Package } from "lucide-react";

const REVENUE_DATA = [
  { month: "Jan", revenue: 320000, expenses: 120000 },
  { month: "Feb", revenue: 410000, expenses: 140000 },
  { month: "Mar", revenue: 380000, expenses: 130000 },
  { month: "Apr", revenue: 520000, expenses: 170000 },
  { month: "May", revenue: 460000, expenses: 150000 },
  { month: "Jun", revenue: 485000, expenses: 160000 },
  { month: "Jul", revenue: 530000, expenses: 175000 },
];

const PROCEDURE_DATA = [
  { name: "Botox", revenue: 210000, count: 14 },
  { name: "Filler", revenue: 175000, count: 7 },
  { name: "Laser", revenue: 144000, count: 8 },
  { name: "PRP", revenue: 110000, count: 5 },
  { name: "Chem Peel", revenue: 84000, count: 7 },
];

const PAYMENT_DIST = [
  { name: "Cash", value: 45 },
  { name: "Card", value: 30 },
  { name: "Bank Transfer", value: 15 },
  { name: "Online", value: 10 },
];

const PIE_COLORS = ["#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc"];

const KPIS = [
  { label: "Total Revenue (Jul)", value: formatCurrency(530000), change: "+9.3%", up: true, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
  { label: "New Patients (Jul)", value: "28", change: "+15%", up: true, icon: Users, color: "bg-sky-50 text-sky-600" },
  { label: "Total Appointments", value: "94", change: "+7.4%", up: true, icon: Calendar, color: "bg-violet-50 text-violet-600" },
  { label: "Avg Invoice Value", value: formatCurrency(17500), change: "-2.1%", up: false, icon: Package, color: "bg-amber-50 text-amber-600" },
];

export default function RevenueAnalyticsPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Revenue Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5 font-medium">Financial performance and analysis overview</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map(({ label, value, change, up, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5 ${up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {change}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-slate-500 text-xs mt-1.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue vs Expenses */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-5">Revenue vs Expenses (7 Months)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={REVENUE_DATA}>
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₨${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)" }}
              labelStyle={{ color: "#64748b" }}
              formatter={(v: any) => [formatCurrency(v)]}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Area type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={2} fill="url(#grad1)" name="Revenue" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#grad2)" name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top procedures */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-5">Revenue by Procedure</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PROCEDURE_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₨${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)" }}
                labelStyle={{ color: "#64748b" }}
                formatter={(v: any) => [formatCurrency(v), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#bae6fd" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-5">Payment Methods Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={PAYMENT_DIST}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {PAYMENT_DIST.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)" }}
                labelStyle={{ color: "#64748b" }}
                formatter={(v: any) => [`${v}%`]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Procedure breakdown table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Procedure Performance Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Procedure</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"># Sessions</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg/Session</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PROCEDURE_DATA.map((p) => (
              <tr key={p.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-slate-900">{p.name}</td>
                <td className="px-5 py-3.5 text-right text-slate-650">{p.count}</td>
                <td className="px-5 py-3.5 text-right font-bold text-sky-700">{formatCurrency(p.revenue)}</td>
                <td className="px-5 py-3.5 text-right text-slate-700 font-semibold">{formatCurrency(Math.round(p.revenue / p.count))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
