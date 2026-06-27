"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Clock, Search, ChevronLeft, ChevronRight, User, Stethoscope } from "lucide-react";
import { formatDate, formatTime, toISODate } from "@/lib/utils";
import type { Appointment } from "@/lib/types";
import { toast } from "sonner";

const MOCK: Appointment[] = [
  { id: "1", clinic_id: "c1", patient_id: "p1", doctor_id: "d1", service_id: "s1", appointment_date: toISODate(new Date()), time_slot: "09:00", status: "confirmed", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), patient: { id:"p1", clinic_id:"c1", name: "Sarah Ahmed", phone:"0300-1234567", email:"", age:28, created_at:"", updated_at:"" }, doctor: { id:"d1", clinic_id:"c1", name: "Dr. Malik", specialization:"Dermatology", phone:"", created_at:"" }, service: { id:"s1", clinic_id:"c1", name: "Botox", duration_minutes:30, base_price:15000, created_at:"" } },
  { id: "2", clinic_id: "c1", patient_id: "p2", doctor_id: "d1", service_id: "s2", appointment_date: toISODate(new Date()), time_slot: "11:00", status: "completed", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), patient: { id:"p2", clinic_id:"c1", name: "Zara Khan", phone:"0311-9876543", email:"", age:35, created_at:"", updated_at:"" }, doctor: { id:"d1", clinic_id:"c1", name: "Dr. Malik", specialization:"Dermatology", phone:"", created_at:"" }, service: { id:"s2", clinic_id:"c1", name: "Filler", duration_minutes:45, base_price:25000, created_at:"" } },
  { id: "3", clinic_id: "c1", patient_id: "p3", doctor_id: "d2", service_id: "s3", appointment_date: toISODate(new Date()), time_slot: "14:00", status: "scheduled", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), patient: { id:"p3", clinic_id:"c1", name: "Amna Siddiqui", phone:"", email:"", age:42, created_at:"", updated_at:"" }, doctor: { id:"d2", clinic_id:"c1", name: "Dr. Fatima", specialization:"Aesthetics", phone:"", created_at:"" }, service: { id:"s3", clinic_id:"c1", name: "Laser", duration_minutes:60, base_price:18000, created_at:"" } },
  { id: "4", clinic_id: "c1", patient_id: "p4", doctor_id: "d2", service_id: "s4", appointment_date: toISODate(new Date(Date.now() + 86400000)), time_slot: "10:30", status: "scheduled", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), patient: { id:"p4", clinic_id:"c1", name: "Hina Baig", phone:"", email:"", age:31, created_at:"", updated_at:"" }, doctor: { id:"d2", clinic_id:"c1", name: "Dr. Fatima", specialization:"Aesthetics", phone:"", created_at:"" }, service: { id:"s4", clinic_id:"c1", name: "PRP", duration_minutes:45, base_price:22000, created_at:"" } },
];

const STATUS_OPTIONS = ["all", "scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"];

// Consistent premium status theme configurations with indicator dots
const STATUS_THEME: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  scheduled: {
    bg: "bg-blue-50/70",
    text: "text-blue-800",
    border: "border-blue-100",
    dot: "bg-blue-500",
  },
  confirmed: {
    bg: "bg-sky-50/70",
    text: "text-sky-800",
    border: "border-sky-100",
    dot: "bg-sky-500",
  },
  in_progress: {
    bg: "bg-amber-50/70",
    text: "text-amber-800",
    border: "border-amber-100",
    dot: "bg-amber-500",
  },
  completed: {
    bg: "bg-emerald-50/70",
    text: "text-emerald-800",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
  },
  cancelled: {
    bg: "bg-rose-50/70",
    text: "text-rose-800",
    border: "border-rose-100",
    dot: "bg-rose-500",
  },
  no_show: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-100",
    dot: "bg-slate-400",
  },
};

async function fetchAppointments(status: string) {
  try {
    const q = status !== "all" ? `?status=${status}` : "";
    const res = await fetch(`/api/appointments${q}`);
    const json = await res.json();
    return json.data ?? MOCK;
  } catch {
    return MOCK;
  }
}

export default function AppointmentsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const { data: appointments = MOCK, isLoading } = useQuery({
    queryKey: ["appointments", status],
    queryFn: () => fetchAppointments(status),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const filtered = (appointments as Appointment[]).filter((a) => {
    if (search) {
      const term = search.toLowerCase();
      const match = (a.patient?.name ?? "").toLowerCase().includes(term) ||
                    (a.doctor?.name ?? "").toLowerCase().includes(term);
      if (!match) return false;
    }
    if (status !== "all" && a.status !== status) return false;
    return true;
  });

  const nextStatus: Record<string, string> = {
    scheduled: "confirmed",
    confirmed: "in_progress",
    in_progress: "completed",
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Appointments Schedule</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage practitioner timetables, coordinate patient checkins, and track appointments.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/appointments/new")}
          className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-150 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Unified Toolbar */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative w-full lg:max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient or doctor..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>
        <div className="flex items-center flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${status === s ? "bg-sky-600 border-sky-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-655 hover:bg-slate-50"}`}
            >
              {s === "all" ? "All Schedules" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Cards (Professional white styling) */}
      <div className="grid grid-cols-1 gap-3.5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-slate-100 rounded-xl animate-pulse shadow-sm" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-xl shadow-sm">
            <Calendar className="w-10 h-10 mx-auto mb-2.5 opacity-25 text-slate-400" />
            <p className="text-slate-500 font-medium text-sm">No scheduled appointments found.</p>
          </div>
        ) : filtered.map((appt) => {
          const theme = STATUS_THEME[appt.status] || STATUS_THEME.scheduled;
          return (
            <div
              key={appt.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md transition-all shadow-sm"
            >
              {/* Left Side: Time, Divider, Patient Details */}
              <div className="flex items-center gap-4 min-w-0">
                {/* Date & Time Badge */}
                <div className="w-14 text-center shrink-0">
                  <p className="text-2xl font-black text-slate-900 leading-none">{new Date(appt.appointment_date + "T00:00:00").getDate()}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{new Date(appt.appointment_date + "T00:00:00").toLocaleString("en", { month: "short" })}</p>
                  <p className="text-[11px] text-sky-600 mt-1 font-bold">{formatTime(appt.time_slot)}</p>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-12 bg-slate-100 shrink-0" />

                {/* Patient / Doctor Details */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-900 leading-none">{appt.patient?.name ?? "—"}</h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${theme.bg} ${theme.text} ${theme.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                      {appt.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-550 flex items-center gap-1 truncate">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold">{appt.service?.name ?? "—"}</span>
                    <span className="text-slate-350">•</span>
                    <span>with {appt.doctor?.name ?? "—"}</span>
                  </p>
                </div>
              </div>

              {/* Right Side: Action Trigger Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {nextStatus[appt.status] && (
                  <button
                    onClick={() => updateStatus.mutate({ id: appt.id, newStatus: nextStatus[appt.status] })}
                    className="text-xs px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors border border-sky-150 capitalize font-bold shadow-xs"
                  >
                    → Mark {nextStatus[appt.status].replace("_", " ")}
                  </button>
                )}
                {appt.status === "scheduled" && (
                  <button
                    onClick={() => updateStatus.mutate({ id: appt.id, newStatus: "cancelled" })}
                    className="text-xs px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-650 rounded-lg transition-colors border border-rose-150 font-bold shadow-xs"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => router.push(`/dashboard/appointments/${appt.id}`)}
                  className="text-xs px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors border border-slate-200 font-bold shadow-xs"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
