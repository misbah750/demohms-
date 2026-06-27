"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Printer, FileText, CheckCircle, ShieldAlert, Sparkles, DollarSign, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/lib/types";
import { toast } from "sonner";
import { useState } from "react";

const MOCK_PATIENT = { id: "p1", clinic_id: "c1", name: "Sarah Ahmed", phone: "0300-1234567", email: "sarah@example.com", age: 28, gender: "female" as const, created_at: "", updated_at: "" };
const MOCK_SERVICE = { id: "s1", clinic_id: "c1", name: "Botox Treatment (Glabella)", duration_minutes: 30, base_price: 15000 };

const MOCK_INVOICE: Invoice = {
  id: "1",
  appointment_id: "a1",
  patient_id: "p1",
  clinic_id: "c1",
  subtotal: 15000,
  tax: 1500,
  total: 16500,
  paid_amount: 16500,
  status: "paid",
  payment_method: "cash",
  notes: "Standard cosmetic Botox consultation and procedure.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  patient: MOCK_PATIENT,
};

async function fetchInvoice(id: string): Promise<Invoice> {
  try {
    const res = await fetch(`/api/invoices/${id}`);
    if (!res.ok) throw new Error("Not found");
    const json = await res.json();
    return json.data;
  } catch {
    return MOCK_INVOICE;
  }
}

const STATUS_THEME: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  pending: { bg: "bg-amber-50/70", text: "text-amber-800", border: "border-amber-100", dot: "bg-amber-500" },
  paid: { bg: "bg-emerald-50/70", text: "text-emerald-800", border: "border-emerald-100", dot: "bg-emerald-500" },
  partial: { bg: "bg-blue-50/70", text: "text-blue-800", border: "border-blue-100", dot: "bg-blue-500" },
  overdue: { bg: "bg-rose-50/70", text: "text-rose-800", border: "border-rose-100", dot: "bg-rose-500" },
  cancelled: { bg: "bg-slate-50", text: "text-slate-655", border: "border-slate-100", dot: "bg-slate-400" },
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();
  const [isPaying, setIsPaying] = useState(false);
  const [payMethod, setPayMethod] = useState("cash");

  const { data: inv = MOCK_INVOICE } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => fetchInvoice(id),
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid_amount: inv.total, payment_method: payMethod }),
      });
      if (!res.ok) throw new Error("Payment failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment recorded successfully");
      setIsPaying(false);
    },
    onError: () => toast.error("Failed to record payment"),
  });

  const handlePrint = () => {
    window.print();
  };

  const theme = STATUS_THEME[inv.status] || STATUS_THEME.pending;

  return (
    <div className="space-y-6 max-w-3xl mx-auto print:p-0 print:my-0">
      {/* Header controls (Hidden on print) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-sans">Statement Detail</h1>
            <p className="text-slate-500 text-xs mt-0.5">Generate printable PDF receipt or collect outstanding balances.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {inv.status !== "paid" && (
            <button
              onClick={() => setIsPaying(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Collect Payment
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Sheet container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8 print:border-0 print:shadow-none print:p-0">
        {/* Invoice Header block */}
        <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-sky-600 rounded-lg flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-slate-950 font-sans uppercase tracking-wider">HMS CLINIC</span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              123 Medical Center, Karachi, Pakistan<br />
              Tel: +92-21-00000000 • Billing support
            </p>
          </div>

          <div className="text-right space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-slate-400">Statement Invoice</h2>
            <p className="text-sm font-bold text-slate-950">#INV-{inv.id.slice(0, 8).toUpperCase()}</p>
            <div className="mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                {inv.status}
              </span>
            </div>
          </div>
        </div>

        {/* Billing details grid */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed To:</p>
            <p className="font-bold text-slate-900">{inv.patient?.name ?? "—"}</p>
            <p className="text-xs text-slate-500">{inv.patient?.phone}</p>
            <p className="text-xs text-slate-500">{inv.patient?.email || "No email provided"}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statement Summary:</p>
            <p className="text-xs text-slate-500"><span className="font-semibold text-slate-655">Invoice Date:</span> {formatDate(inv.created_at)}</p>
            {inv.payment_method && (
              <p className="text-xs text-slate-500"><span className="font-semibold text-slate-655">Method:</span> Paid via {inv.payment_method.toUpperCase()}</p>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-2.5">Procedure / Item Description</th>
                <th className="text-right px-5 py-2.5">Rate</th>
                <th className="text-right px-5 py-2.5">Qty</th>
                <th className="text-right px-5 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-55">
              <tr className="text-slate-800 hover:bg-slate-50/20">
                <td className="px-5 py-3.5">
                  <p className="font-semibold">Aesthetic Consult &amp; Clinical Procedure</p>
                  <p className="text-[11px] text-slate-455 mt-0.5">Botox Cosmetic treatment</p>
                </td>
                <td className="px-5 py-3.5 text-right font-medium">{formatCurrency(inv.subtotal)}</td>
                <td className="px-5 py-3.5 text-right text-slate-500">1</td>
                <td className="px-5 py-3.5 text-right font-semibold text-slate-900">{formatCurrency(inv.subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculations block */}
        <div className="flex justify-end mt-4">
          <div className="w-full sm:max-w-xs space-y-2 text-sm border-t border-slate-100 pt-4">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold">{formatCurrency(inv.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST / Tax</span>
              <span className="font-semibold">{formatCurrency(inv.tax)}</span>
            </div>
            <div className="flex justify-between text-slate-950 font-bold border-t border-slate-100 pt-2 text-base">
              <span>Grand Total</span>
              <span>{formatCurrency(inv.total)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold pt-1 text-xs">
              <span>Amount Paid</span>
              <span>{formatCurrency(inv.paid_amount)}</span>
            </div>
          </div>
        </div>

        {inv.notes && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice Notes / Terms</p>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">{inv.notes}</p>
          </div>
        )}
      </div>

      {/* Collect payment modal */}
      {isPaying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Record Statement Settle</h3>
              <button onClick={() => setIsPaying(false)} className="text-slate-400 hover:text-slate-650 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                You are marking invoice <span className="font-bold text-slate-700">#INV-{inv.id.slice(0, 8).toUpperCase()}</span> for amount <span className="font-bold text-slate-900">{formatCurrency(inv.total)}</span> as fully paid.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-750 uppercase tracking-wider">Transaction Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-semibold"
                >
                  {["cash","card","bank_transfer","online"].map((m) => (
                    <option key={m} value={m}>{m.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setIsPaying(false)} className="flex-1 py-2.5 text-sm text-slate-650 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all font-semibold">Cancel</button>
              <button
                onClick={() => payMutation.mutate()}
                disabled={payMutation.isPending}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {payMutation.isPending && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Settle Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
