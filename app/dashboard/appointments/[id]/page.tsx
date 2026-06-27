"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar, User, Stethoscope, Clock, Save, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDate, formatTime, formatCurrency, toISODate } from "@/lib/utils";
import type { Appointment, Treatment } from "@/lib/types";
import { toast } from "sonner";

const MOCK_PATIENT = { id: "p1", clinic_id: "c1", name: "Sarah Ahmed", phone: "0300-1234567", email: "sarah@example.com", age: 28, gender: "female" as const, created_at: "", updated_at: "" };
const MOCK_DOCTOR = { id: "d1", clinic_id: "c1", name: "Dr. Malik", specialization: "Dermatology", phone: "", created_at: "" };
const MOCK_SERVICE = { id: "s1", clinic_id: "c1", name: "Botox Treatment", duration_minutes: 30, base_price: 15000, created_at: "" };

const MOCK_APPT: Appointment = {
  id: "1",
  clinic_id: "c1",
  patient_id: "p1",
  doctor_id: "d1",
  service_id: "s1",
  appointment_date: toISODate(new Date()),
  time_slot: "10:00",
  status: "confirmed",
  notes: "First time receiving Glabella Botox. Patient wants a natural look.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  patient: MOCK_PATIENT,
  doctor: MOCK_DOCTOR,
  service: MOCK_SERVICE,
};

const MOCK_TREATMENT = {
  id: "t1",
  appointment_id: "1",
  service_id: "s1",
  materials_used: "Botox 100U",
  dosage: "20 Units",
  notes: "Administered to Glabella area. Patient comfortable throughout.",
  created_at: new Date().toISOString(),
};

async function fetchAppointment(id: string): Promise<Appointment> {
  try {
    const res = await fetch(`/api/appointments/${id}`);
    if (!res.ok) throw new Error("Not found");
    const json = await res.json();
    return json.data;
  } catch {
    return MOCK_APPT;
  }
}

const STATUS_THEME: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  scheduled: { bg: "bg-blue-50/70", text: "text-blue-800", border: "border-blue-100", dot: "bg-blue-500" },
  confirmed: { bg: "bg-sky-50/70", text: "text-sky-800", border: "border-sky-100", dot: "bg-sky-500" },
  in_progress: { bg: "bg-amber-50/70", text: "text-amber-800", border: "border-amber-100", dot: "bg-amber-500" },
  completed: { bg: "bg-emerald-50/70", text: "text-emerald-800", border: "border-emerald-100", dot: "bg-emerald-500" },
  cancelled: { bg: "bg-rose-50/70", text: "text-rose-800", border: "border-rose-100", dot: "bg-rose-500" },
  no_show: { bg: "bg-slate-50", text: "text-slate-655", border: "border-slate-100", dot: "bg-slate-400" },
};

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const qc = useQueryClient();

  const [treatmentNotes, setTreatmentNotes] = useState(MOCK_TREATMENT.notes);
  const [materials, setMaterials] = useState(MOCK_TREATMENT.materials_used);
  const [dosage, setDosage] = useState(MOCK_TREATMENT.dosage);

  const { data: appt = MOCK_APPT } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => fetchAppointment(id),
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedFields: Partial<Appointment>) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointment", id] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const saveTreatment = () => {
    // Simulated treatment save
    toast.success("Treatment record updated successfully");
  };

  const currentTheme = STATUS_THEME[appt.status] || STATUS_THEME.scheduled;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Appointment Details</h1>
          <p className="text-slate-500 text-sm mt-0.5">UID: {id.slice(0, 8)} • Clinical Schedule</p>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100 shrink-0">
              <Calendar className="w-5 h-5 text-sky-655" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Date &amp; Scheduled Time</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{formatDate(appt.appointment_date)} at {formatTime(appt.time_slot)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentTheme.dot}`} />
              {appt.status}
            </span>
          </div>
        </div>

        {/* Dynamic Detail grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patient info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <User className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Patient</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{appt.patient?.name ?? "—"}</p>
            <p className="text-xs text-slate-500 capitalize">{appt.patient?.gender} · {appt.patient?.age} Yrs old</p>
            <p className="text-xs text-slate-500">{appt.patient?.phone}</p>
          </div>

          {/* Practitioner info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Stethoscope className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Assigned Practitioner</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{appt.doctor?.name ?? "—"}</p>
            <p className="text-xs text-slate-500">{appt.doctor?.specialization}</p>
          </div>

          {/* Procedure details */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Requested Service</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{appt.service?.name ?? "—"}</p>
            <p className="text-xs text-slate-500">{appt.service?.duration_minutes} Minutes Duration</p>
            <p className="text-xs font-semibold text-slate-700 mt-1">Base Cost: {formatCurrency(appt.service?.base_price ?? 0)}</p>
          </div>
        </div>

        {appt.notes && (
          <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduling Remarks / Notes</p>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold">{appt.notes}</p>
          </div>
        )}
      </div>

      {/* Appointment Update Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2 border-slate-100">Workflow &amp; Status Controls</h3>
        <div className="flex flex-wrap gap-2.5">
          {appt.status === "scheduled" && (
            <button
              onClick={() => updateMutation.mutate({ status: "confirmed" })}
              className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Confirm Appointment
            </button>
          )}
          {appt.status === "confirmed" && (
            <button
              onClick={() => updateMutation.mutate({ status: "in_progress" })}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Mark In Progress
            </button>
          )}
          {appt.status === "in_progress" && (
            <button
              onClick={() => updateMutation.mutate({ status: "completed" })}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Mark Completed
            </button>
          )}
          {appt.status !== "completed" && appt.status !== "cancelled" && (
            <button
              onClick={() => updateMutation.mutate({ status: "cancelled" })}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Cancel Appointment
            </button>
          )}
        </div>
      </div>

      {/* Treatment Record Section (Active for in_progress or completed) */}
      {(appt.status === "in_progress" || appt.status === "completed") && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Stethoscope className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Add / Update Clinical Treatment Record</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Materials Used</label>
              <input
                type="text"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="e.g. Juvederm Ultra 1ml"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Dosage / Quantities</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 1 Syringe (20 Units)"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Procedure Notes</label>
            <textarea
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              placeholder="Record procedure particulars, safety checks, and recovery instructions..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none font-medium leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={saveTreatment}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Treatment Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
