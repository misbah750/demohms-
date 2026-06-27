"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X, DollarSign, Clock, FileText, ArrowUpRight, Percent, Calendar, Check, Database } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/lib/types";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";

const MOCK_INVOICES: Invoice[] = [
  { id: "i1",  appointment_id: "a1",  patient_id: "p1", clinic_id: "c1", subtotal: 15000, tax: 0,    total: 15000, paid_amount: 15000, status: "paid",      payment_method: "cash",          notes: "Settled in full at front desk.",            created_at: new Date().toISOString(),                        updated_at: new Date().toISOString(), patient: { id:"p1", clinic_id:"c1", name:"Sarah Ahmed",     phone:"0300-1234567", email:"sarah@example.com",  age:28, created_at:"", updated_at:"" } },
  { id: "i2",  appointment_id: "a2",  patient_id: "p2", clinic_id: "c1", subtotal: 25000, tax: 2500, total: 27500, paid_amount: 0,     status: "pending",    payment_method: undefined,       notes: "Awaiting insurance verification.",          created_at: new Date(Date.now()-1*86400000).toISOString(),   updated_at: new Date().toISOString(), patient: { id:"p2", clinic_id:"c1", name:"Zara Khan",        phone:"0321-7654321", email:"zara@example.com",   age:35, created_at:"", updated_at:"" } },
  { id: "i3",  appointment_id: "a3",  patient_id: "p3", clinic_id: "c1", subtotal: 18000, tax: 0,    total: 18000, paid_amount: 10000, status: "partial",    payment_method: "card",          notes: "Balance due at next session.",             created_at: new Date(Date.now()-2*86400000).toISOString(),   updated_at: new Date().toISOString(), patient: { id:"p3", clinic_id:"c1", name:"Amna Siddiqui",   phone:"0333-1112223", email:"amna@example.com",   age:42, created_at:"", updated_at:"" } },
  { id: "i4",  appointment_id: "a4",  patient_id: "p4", clinic_id: "c1", subtotal: 22000, tax: 0,    total: 22000, paid_amount: 0,     status: "overdue",    payment_method: undefined,       notes: "Follow-up call scheduled.",                created_at: new Date(Date.now()-10*86400000).toISOString(),  updated_at: new Date().toISOString(), patient: { id:"p4", clinic_id:"c1", name:"Hina Baig",        phone:"0345-4445556", email:"hina@example.com",   age:31, created_at:"", updated_at:"" } },
  { id: "i5",  appointment_id: "a5",  patient_id: "p5", clinic_id: "c1", subtotal: 35000, tax: 3500, total: 38500, paid_amount: 38500, status: "paid",      payment_method: "bank_transfer", notes: "Annual wellness package — full payment.",  created_at: new Date(Date.now()-3*86400000).toISOString(),   updated_at: new Date().toISOString(), patient: { id:"p5", clinic_id:"c1", name:"Ali Hassan",       phone:"0311-9998887", email:"ali@example.com",    age:45, created_at:"", updated_at:"" } },
  { id: "i6",  appointment_id: "a6",  patient_id: "p6", clinic_id: "c1", subtotal: 9500,  tax: 950,  total: 10450, paid_amount: 0,     status: "pending",    payment_method: undefined,       notes: "Botox top-up — waiting on approval.",     created_at: new Date(Date.now()-4*86400000).toISOString(),   updated_at: new Date().toISOString(), patient: { id:"p6", clinic_id:"c1", name:"Usman Farooq",    phone:"0322-5556664", email:"usman@example.com",  age:38, created_at:"", updated_at:"" } },
  { id: "i7",  appointment_id: "a7",  patient_id: "p1", clinic_id: "c1", subtotal: 12000, tax: 0,    total: 12000, paid_amount: 12000, status: "paid",      payment_method: "online",        notes: "Physiotherapy — 4th session.",            created_at: new Date(Date.now()-5*86400000).toISOString(),   updated_at: new Date().toISOString(), patient: { id:"p1", clinic_id:"c1", name:"Sarah Ahmed",     phone:"0300-1234567", email:"sarah@example.com",  age:28, created_at:"", updated_at:"" } },
  { id: "i8",  appointment_id: "a8",  patient_id: "p7", clinic_id: "c1", subtotal: 48000, tax: 4800, total: 52800, paid_amount: 25000, status: "partial",    payment_method: "cash",          notes: "Skin laser — 3 sessions paid upfront.",   created_at: new Date(Date.now()-7*86400000).toISOString(),   updated_at: new Date().toISOString(), patient: { id:"p7", clinic_id:"c1", name:"Nadia Malik",      phone:"0312-3334445", email:"nadia@example.com",  age:29, created_at:"", updated_at:"" } },
  { id: "i9",  appointment_id: "a9",  patient_id: "p8", clinic_id: "c1", subtotal: 6500,  tax: 0,    total: 6500,  paid_amount: 0,     status: "overdue",    payment_method: undefined,       notes: "PRP hair treatment — overdue 15 days.",   created_at: new Date(Date.now()-20*86400000).toISOString(),  updated_at: new Date().toISOString(), patient: { id:"p8", clinic_id:"c1", name:"Bilal Sheikh",    phone:"0345-1231230", email:"bilal@example.com",  age:33, created_at:"", updated_at:"" } },
  { id: "i10", appointment_id: "a10", patient_id: "p5", clinic_id: "c1", subtotal: 19500, tax: 1950, total: 21450, paid_amount: 21450, status: "paid",      payment_method: "card",          notes: "Dental deep cleaning + X-rays.",          created_at: new Date(Date.now()-8*86400000).toISOString(),   updated_at: new Date().toISOString(), patient: { id:"p5", clinic_id:"c1", name:"Ali Hassan",       phone:"0311-9998887", email:"ali@example.com",    age:45, created_at:"", updated_at:"" } },
  { id: "i11", appointment_id: "a11", patient_id: "p9", clinic_id: "c1", subtotal: 8000,  tax: 800,  total: 8800,  paid_amount: 0,     status: "cancelled",  payment_method: undefined,       notes: "Patient cancelled appointment.",          created_at: new Date(Date.now()-12*86400000).toISOString(),  updated_at: new Date().toISOString(), patient: { id:"p9", clinic_id:"c1", name:"Farah Naz",        phone:"0301-7778889", email:"farah@example.com",  age:27, created_at:"", updated_at:"" } },
  { id: "i12", appointment_id: "a12", patient_id: "p6", clinic_id: "c1", subtotal: 32000, tax: 0,    total: 32000, paid_amount: 32000, status: "paid",      payment_method: "insurance",     notes: "Insurance claim processed successfully.", created_at: new Date(Date.now()-6*86400000).toISOString(),   updated_at: new Date().toISOString(), patient: { id:"p6", clinic_id:"c1", name:"Usman Farooq",    phone:"0322-5556664", email:"usman@example.com",  age:38, created_at:"", updated_at:"" } },
];

const STATUS_TABS = ["all", "pending", "paid", "partial", "overdue"];

// Highly professional status configuration with pill themes and matching dots
const STATUS_THEME: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  pending: {
    bg: "bg-amber-50/70",
    text: "text-amber-800",
    border: "border-amber-100",
    dot: "bg-amber-500",
  },
  paid: {
    bg: "bg-emerald-50/70",
    text: "text-emerald-800",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
  },
  partial: {
    bg: "bg-blue-50/70",
    text: "text-blue-800",
    border: "border-blue-100",
    dot: "bg-blue-500",
  },
  overdue: {
    bg: "bg-rose-50/70",
    text: "text-rose-800",
    border: "border-rose-100",
    dot: "bg-rose-500",
  },
  cancelled: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-100",
    dot: "bg-slate-400",
  },
};

// Check if a real Supabase configuration is loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const isDemoMode = !supabaseUrl || supabaseUrl.includes("your-project-id");

async function fetchInvoices(status: string) {
  try {
    const q = status !== "all" ? `?status=${status}` : "";
    const res = await fetch(`/api/invoices${q}`);
    if (!res.ok) throw new Error();
    const json = await res.json();
    return json.data ?? [];
  } catch {
    // Fallback to mock invoices only if offline/demo
    return isDemoMode ? MOCK_INVOICES : [];
  }
}

export default function InvoicesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [seeding, setSeeding] = useState(false);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", status],
    queryFn: () => fetchInvoices(status),
  });

  const payMutation = useMutation({
    mutationFn: async ({ id, amount, method }: { id: string; amount: number; method: string }) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid_amount: amount, payment_method: method }),
      });
      if (!res.ok) throw new Error("Payment failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment recorded successfully");
      setPayingId(null);
      setPayAmount("");
    },
    onError: () => toast.error("Failed to record payment"),
  });

  async function handleSeedData() {
    setSeeding(true);
    try {
      const clientSupabase = createClient();
      
      // 1. Get current user's profile and clinic
      const { data: { user } } = await clientSupabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to seed data");
        setSeeding(false);
        return;
      }
      
      const { data: profile } = await clientSupabase
        .from("profiles")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();
      
      const clinicId = profile?.clinic_id;
      if (!clinicId) {
        toast.error("No clinic found. Please create a clinic or profile first.");
        setSeeding(false);
        return;
      }

      // 2. Check if we have patients. If not, insert mock patients.
      let { data: patients } = await clientSupabase
        .from("patients")
        .select("id, name")
        .eq("clinic_id", clinicId);

      if (!patients || patients.length === 0) {
        const mockPatients = [
          { name: "Sarah Ahmed", phone: "0300-1234567", email: "sarah@example.com", age: 28, gender: "female", clinic_id: clinicId },
          { name: "Zara Khan", phone: "0321-7654321", email: "zara@example.com", age: 35, gender: "female", clinic_id: clinicId },
          { name: "Amna Siddiqui", phone: "0333-1112223", email: "amna@example.com", age: 42, gender: "female", clinic_id: clinicId },
          { name: "Hina Baig", phone: "0345-4445556", email: "hina@example.com", age: 31, gender: "female", clinic_id: clinicId },
          { name: "Ali Hassan", phone: "0311-9998887", email: "ali@example.com", age: 45, gender: "male", clinic_id: clinicId },
          { name: "Usman Farooq", phone: "0322-5556664", email: "usman@example.com", age: 38, gender: "male", clinic_id: clinicId },
          { name: "Nadia Malik", phone: "0312-3334445", email: "nadia@example.com", age: 29, gender: "female", clinic_id: clinicId },
          { name: "Bilal Sheikh", phone: "0345-1231230", email: "bilal@example.com", age: 33, gender: "male", clinic_id: clinicId },
          { name: "Farah Naz", phone: "0301-7778889", email: "farah@example.com", age: 27, gender: "female", clinic_id: clinicId }
        ];

        const { data: insertedPatients, error: patientErr } = await clientSupabase
          .from("patients")
          .insert(mockPatients)
          .select("id, name");

        if (patientErr) throw patientErr;
        patients = insertedPatients;
      }

      if (!patients || patients.length === 0) {
        throw new Error("Failed to prepare patients for seeding");
      }

      // Ensure we have enough patients returned/present
      const p = (name: string) => patients!.find(x => x.name === name)?.id || patients![0].id;

      // 3. Create mock invoices with different statuses
      const mockInvoices = [
        { clinic_id: clinicId, patient_id: p("Sarah Ahmed"), subtotal: 15000, tax: 0, total: 15000, paid_amount: 15000, status: "paid", payment_method: "cash", notes: "Settled in full at front desk." },
        { clinic_id: clinicId, patient_id: p("Zara Khan"), subtotal: 25000, tax: 2500, total: 27500, paid_amount: 0, status: "pending", notes: "Awaiting insurance verification." },
        { clinic_id: clinicId, patient_id: p("Amna Siddiqui"), subtotal: 18000, tax: 0, total: 18000, paid_amount: 10000, status: "partial", payment_method: "card", notes: "Balance due at next session." },
        { clinic_id: clinicId, patient_id: p("Hina Baig"), subtotal: 22000, tax: 0, total: 22000, paid_amount: 0, status: "overdue", notes: "Follow-up call scheduled." },
        { clinic_id: clinicId, patient_id: p("Ali Hassan"), subtotal: 35000, tax: 3500, total: 38500, paid_amount: 38500, status: "paid", payment_method: "bank_transfer", notes: "Annual wellness package — full payment." },
        { clinic_id: clinicId, patient_id: p("Usman Farooq"), subtotal: 9500, tax: 950, total: 10450, paid_amount: 0, status: "pending", notes: "Botox top-up — waiting on approval." },
        { clinic_id: clinicId, patient_id: p("Sarah Ahmed"), subtotal: 12000, tax: 0, total: 12000, paid_amount: 12000, status: "paid", payment_method: "online", notes: "Physiotherapy — 4th session." },
        { clinic_id: clinicId, patient_id: p("Nadia Malik"), subtotal: 48000, tax: 4800, total: 52800, paid_amount: 25000, status: "partial", payment_method: "cash", notes: "Skin laser — 3 sessions paid upfront." },
        { clinic_id: clinicId, patient_id: p("Bilal Sheikh"), subtotal: 6500, tax: 0, total: 6500, paid_amount: 0, status: "overdue", notes: "PRP hair treatment — overdue 15 days." },
        { clinic_id: clinicId, patient_id: p("Ali Hassan"), subtotal: 19500, tax: 1950, total: 21450, paid_amount: 21450, status: "paid", payment_method: "card", notes: "Dental deep cleaning + X-rays." },
        { clinic_id: clinicId, patient_id: p("Farah Naz"), subtotal: 8000, tax: 800, total: 8800, paid_amount: 0, status: "cancelled", notes: "Patient cancelled appointment." },
        { clinic_id: clinicId, patient_id: p("Usman Farooq"), subtotal: 32000, tax: 0, total: 32000, paid_amount: 32000, status: "paid", payment_method: "insurance", notes: "Insurance claim processed successfully." }
      ];

      const { error: invoiceErr } = await clientSupabase
        .from("invoices")
        .insert(mockInvoices);

      if (invoiceErr) throw invoiceErr;

      toast.success("Demo invoices and patients seeded successfully!");
      qc.invalidateQueries({ queryKey: ["invoices"] });
    } catch (err: any) {
      toast.error(`Seeding failed: ${err.message || String(err)}`);
    } finally {
      setSeeding(false);
    }
  }

  const filtered = (invoices as Invoice[]).filter((inv) =>
    search ? (inv.patient?.name ?? "").toLowerCase().includes(search.toLowerCase()) : true
  );

  // Compute metrics dynamically from the active invoices list (rather than static MOCK_INVOICES)
  const totalRevenue = (invoices as Invoice[])
    .filter(i => i.status === "paid" || i.status === "partial")
    .reduce((s, i) => s + Number(i.paid_amount), 0);

  const totalPending = (invoices as Invoice[])
    .filter(i => i.status === "pending" || i.status === "partial" || i.status === "overdue")
    .reduce((s, i) => s + (Number(i.total) - Number(i.paid_amount)), 0);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Top Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Billing & Invoices</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage invoices, collect payments, and track clinic revenue flow.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/appointments/new")}
          className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-150 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      {/* KPI Cards (Professional layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Total Collected */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue Collected</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> All settled client payments
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalPending)}</h3>
            <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
              <Clock className="w-3.5 h-3.5" /> Awaiting pending settlements
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Unified Toolbar (Search + Filter Tabs aligned beautifully) */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient statements..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${status === s ? "bg-sky-600 border-sky-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-655 hover:bg-slate-50"}`}
            >
              {s === "all" ? "All Statements" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Clean Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="text-left px-6 py-3.5">Patient Details</th>
                <th className="text-left px-6 py-3.5 hidden sm:table-cell">Invoice Date</th>
                <th className="text-right px-6 py-3.5">Total Amount</th>
                <th className="text-right px-6 py-3.5 hidden md:table-cell">Paid Amount</th>
                <th className="text-left px-6 py-3.5">Settlement Status</th>
                <th className="text-right px-6 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-medium bg-slate-50/20">
                    <FileText className="w-10 h-10 mx-auto mb-2.5 opacity-25 text-slate-400" />
                    <p className="mb-3">No statements match the selection.</p>
                    
                    {!isDemoMode && (
                      <button
                        onClick={handleSeedData}
                        disabled={seeding}
                        className="inline-flex items-center gap-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold px-4 py-2 rounded-lg text-xs transition-all duration-150 shadow-sm"
                      >
                        <Database className="w-3.5 h-3.5" />
                        {seeding ? "Seeding Invoices..." : "Seed Demo Invoices"}
                      </button>
                    )}
                  </td>
                </tr>
              ) : filtered.map((inv) => {
                const theme = STATUS_THEME[inv.status] || STATUS_THEME.pending;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Patient Details */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{inv.patient?.name ?? "—"}</p>
                      <p className="text-[10px] text-slate-400 sm:hidden mt-0.5">{formatDate(inv.created_at)}</p>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 hidden sm:table-cell text-slate-600 text-xs font-semibold">
                      {formatDate(inv.created_at)}
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {formatCurrency(inv.total)}
                    </td>

                    {/* Paid amount */}
                    <td className="px-6 py-4 text-right hidden md:table-cell font-semibold">
                      <span className={inv.paid_amount >= inv.total ? "text-emerald-600" : "text-amber-600"}>
                        {formatCurrency(inv.paid_amount)}
                      </span>
                    </td>

                    {/* Settlement Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {(inv.status === "pending" || inv.status === "partial" || inv.status === "overdue") && (
                          <button
                            onClick={() => { setPayingId(inv.id); setPayAmount(String(inv.total - inv.paid_amount)); }}
                            className="text-xs px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-100 font-semibold shadow-xs"
                          >
                            Record Payment
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                          className="text-xs px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors border border-slate-200 font-semibold shadow-xs"
                        >
                          View details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment record dialog modal */}
      {payingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Record Client Payment</h3>
              <button onClick={() => setPayingId(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-750 uppercase tracking-wider">Settlement Amount (PKR)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-750 uppercase tracking-wider">Transaction Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-semibold"
                >
                  {["cash","card","bank_transfer","online","insurance"].map((m) => (
                    <option key={m} value={m}>{m.replace("_"," ")}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setPayingId(null)} className="flex-1 py-2.5 text-sm text-slate-650 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all font-semibold">Cancel</button>
              <button
                onClick={() => payMutation.mutate({ id: payingId, amount: parseFloat(payAmount), method: payMethod })}
                disabled={payMutation.isPending || !payAmount}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {payMutation.isPending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
