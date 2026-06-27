"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Phone, Mail, AlertCircle, Calendar, FileText, Edit2,
  Stethoscope, Package, Clock, RefreshCw, Plus, CheckCircle, Image as ImageIcon, User
} from "lucide-react";
import { formatDate, formatCurrency, formatTime, getInitials } from "@/lib/utils";

const MOCK_PATIENT = {
  id: "1", clinic_id: "c1", name: "Sarah Ahmed", phone: "0300-1234567", email: "sarah@example.com",
  age: 28, gender: "female", medical_history: "No major conditions. Regular skin maintenance checkups.", allergies: "Penicillin",
  created_at: new Date(Date.now() - 864000000 * 5).toISOString(), updated_at: new Date().toISOString(),
};

const MOCK_APPOINTMENTS = [
  { id: "a1", service: { name: "Botox" }, doctor: { name: "Dr. Malik" }, appointment_date: new Date().toISOString().split("T")[0], time_slot: "10:00", status: "completed" },
  { id: "a2", service: { name: "Filler" }, doctor: { name: "Dr. Malik" }, appointment_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0], time_slot: "11:30", status: "scheduled" },
];

const MOCK_INVOICES = [
  { id: "i1", total: 15000, paid_amount: 15000, status: "paid", payment_method: "cash", created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "i2", total: 27500, paid_amount: 0, status: "pending", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
];

const MOCK_TREATMENTS = [
  {
    id: "t1",
    date: new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0],
    service: { name: "Botox" },
    materials_used: "Botox 100U Cosmetic",
    dosage: "24 Units (Glabella & Forehead)",
    notes: "Patient tolerated treatment well. Advised no lying down for 4 hours and no heavy exercise for 24 hours.",
    before_photo_url: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c",
    after_photo_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9"
  }
];

const MOCK_PACKAGES = [
  {
    id: "pp1",
    name: "Anti-Aging Glow Bundle",
    description: "Includes 3 Botox sessions and 2 Hydrafacials",
    remaining_credits: 3,
    total_credits: 5,
    expires_at: new Date(Date.now() + 86400000 * 180).toISOString().split("T")[0],
    status: "active"
  }
];

const MOCK_FOLLOWUPS = [
  {
    id: "f1",
    scheduled_date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    doctor: { name: "Dr. Malik" },
    type: "call",
    status: "pending",
    notes: "Check Botox results and general satisfaction (7-day post-procedure review)"
  }
];

async function fetchPatient(id: string) {
  try {
    const res = await fetch(`/api/patients/${id}`);
    const json = await res.json();
    return json.data ?? MOCK_PATIENT;
  } catch {
    return MOCK_PATIENT;
  }
}

const APPT_STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  confirmed: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  in_progress: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  cancelled: "bg-red-50 text-red-600 ring-1 ring-red-200",
  no_show: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

const INV_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  partial: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  overdue: "bg-red-50 text-red-600 ring-1 ring-red-200",
  cancelled: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

export default function PatientProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const { data: patient } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => fetchPatient(id),
    initialData: MOCK_PATIENT,
  });

  const tabItems = [
    { id: "overview", label: "Overview", icon: User },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "treatments", label: "Treatments", icon: Stethoscope },
    { id: "packages", label: "Packages & Credits", icon: Package },
    { id: "followups", label: "Follow-ups", icon: Clock },
    { id: "billing", label: "Billing & Invoices", icon: FileText },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Patient File</h1>
          <p className="text-slate-500 text-sm mt-0.5">UID: {id.slice(0, 8)} • Active Clinical Record</p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/patients/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all shadow-sm"
        >
          <Edit2 className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      {/* Patient Basic Profile Summary Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md shadow-sky-500/10">
              {getInitials(patient.name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
              <p className="text-slate-500 text-sm capitalize mt-0.5">{patient.gender} · {patient.age} Years Old · Joined {formatDate(patient.created_at)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            {patient.phone && (
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                <a href={`tel:${patient.phone}`} className="text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient.phone}
                </a>
              </div>
            )}
            {patient.email && (
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                <a href={`mailto:${patient.email}`} className="text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {patient.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all -mb-px ${isActive ? "border-sky-600 text-sky-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panel contents */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Medical Information */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2 border-slate-100">Clinical Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medical History</p>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      {patient.medical_history || "No medical history recorded."}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Known Allergies / Contraindications</p>
                    <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${patient.allergies && patient.allergies !== "None" ? "bg-amber-50 border-amber-250 text-amber-800" : "bg-slate-50 border-slate-100 text-slate-650"}`}>
                      {patient.allergies && patient.allergies !== "None" ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-amber-900">Active Allergy Warnings</p>
                            <p className="text-sm mt-0.5">{patient.allergies}</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm">No known allergies or contraindications reported.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Completed Appts", value: "1", sub: "1 upcoming scheduled", icon: Calendar, color: "text-sky-600 bg-sky-50" },
                  { label: "Total Invoiced", value: "₨42,500", sub: "₨15,000 paid", icon: FileText, color: "text-emerald-600 bg-emerald-50" },
                  { label: "Active Packages", value: "1 Package", sub: "3 credits left", icon: Package, color: "text-violet-600 bg-violet-50" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800">{stat.value}</p>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">{stat.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Emergency Contact or Quick Actions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push("/dashboard/appointments/new")}
                    className="w-full py-2 px-3 text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm transition-colors text-center block"
                  >
                    Book Appointment
                  </button>
                  <button
                    onClick={() => setActiveTab("treatments")}
                    className="w-full py-2 px-3 text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors text-center block"
                  >
                    View Treatment Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === "appointments" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Appointment History</h3>
              <button
                onClick={() => router.push("/dashboard/appointments/new")}
                className="text-xs font-bold text-sky-600 hover:text-sky-700"
              >
                + Schedule Appointment
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {MOCK_APPOINTMENTS.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 border border-sky-100">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{(a.service as { name: string }).name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Assigned Doctor: {(a.doctor as { name: string }).name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(a.time_slot)}</span>
                        <span>•</span>
                        <span>Date: {formatDate(a.appointment_date)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${APPT_STATUS_COLORS[a.status] ?? ""}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TREATMENTS TAB */}
        {activeTab === "treatments" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Procedure &amp; Treatment Records</h3>
            </div>
            {MOCK_TREATMENTS.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No treatment records registered yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-150">
                {MOCK_TREATMENTS.map((t) => (
                  <div key={t.id} className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded">{t.service.name} Record</span>
                        <p className="text-xs text-slate-400 mt-1">Conducted on {formatDate(t.date)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Materials Used</p>
                        <p className="text-sm text-slate-700 font-semibold">{t.materials_used}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dosage / Quantities</p>
                        <p className="text-sm text-slate-700 font-semibold">{t.dosage}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Procedure Notes</p>
                      <p className="text-sm text-slate-650 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">{t.notes}</p>
                    </div>

                    {/* Before/After photos (placeholder styling) */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Before &amp; After Photo Attachments</p>
                      <div className="grid grid-cols-2 gap-4 max-w-md">
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative aspect-video flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                          <ImageIcon className="w-6 h-6 mb-1 opacity-45" />
                          <span className="text-[11px] font-medium">Before Photo</span>
                        </div>
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative aspect-video flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                          <ImageIcon className="w-6 h-6 mb-1 opacity-45" />
                          <span className="text-[11px] font-medium">After Photo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PACKAGES TAB */}
        {activeTab === "packages" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Bundled Packages &amp; Service Credits</h3>
            </div>
            {MOCK_PACKAGES.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No active bundles or packages purchased.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {MOCK_PACKAGES.map((pkg) => (
                  <div key={pkg.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{pkg.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pkg.description}</p>
                      <p className="text-xs text-slate-455 mt-1">Expiry Date: {formatDate(pkg.expires_at)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500">Credits Remaining</p>
                        <p className="text-base font-bold text-sky-700">{pkg.remaining_credits} / {pkg.total_credits} Sessions</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-150 capitalize">
                        {pkg.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FOLLOWUPS TAB */}
        {activeTab === "followups" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Scheduled Follow-ups</h3>
            </div>
            {MOCK_FOLLOWUPS.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No follow-ups scheduled.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {MOCK_FOLLOWUPS.map((f) => (
                  <div key={f.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" /> {f.type} Review
                        </span>
                        <span className="text-xs font-bold text-slate-700">with {f.doctor.name}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed font-semibold">{f.notes}</p>
                      <p className="text-xs text-slate-400">Scheduled Date: {formatDate(f.scheduled_date)}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-150 capitalize">
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === "billing" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">Billing History</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {MOCK_INVOICES.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(inv.total)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Date: {formatDate(inv.created_at)}</p>
                    {inv.payment_method && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Paid via {inv.payment_method}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ring-1 ${INV_STATUS_COLORS[inv.status] ?? ""}`}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
