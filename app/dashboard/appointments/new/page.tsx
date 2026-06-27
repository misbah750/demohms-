"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Calendar, User, Stethoscope, Package } from "lucide-react";
import { generateTimeSlots, toISODate } from "@/lib/utils";
import { toast } from "sonner";

const MOCK_PATIENTS = [
  { id: "p1", name: "Sarah Ahmed" }, { id: "p2", name: "Zara Khan" },
  { id: "p3", name: "Amna Siddiqui" }, { id: "p4", name: "Hina Baig" },
];
const MOCK_DOCTORS = [
  { id: "d1", name: "Dr. Malik", specialization: "Dermatology" },
  { id: "d2", name: "Dr. Fatima", specialization: "Aesthetics" },
];
const MOCK_SERVICES = [
  { id: "s1", name: "Botox", duration_minutes: 30, base_price: 15000 },
  { id: "s2", name: "Filler", duration_minutes: 45, base_price: 25000 },
  { id: "s3", name: "Laser Hair Removal", duration_minutes: 60, base_price: 18000 },
  { id: "s4", name: "PRP", duration_minutes: 45, base_price: 22000 },
  { id: "s5", name: "Chemical Peel", duration_minutes: 30, base_price: 12000 },
];

const TIME_SLOTS = generateTimeSlots(9, 18, 30);

export default function NewAppointmentPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    patient_id: "", doctor_id: "", service_id: "",
    appointment_date: toISODate(new Date()), time_slot: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to book appointment");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment booked!");
      router.push("/dashboard/appointments");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const steps = [
    { n: 1, label: "Patient", icon: User },
    { n: 2, label: "Doctor & Service", icon: Stethoscope },
    { n: 3, label: "Date & Time", icon: Calendar },
    { n: 4, label: "Confirm", icon: Package },
  ];

  const canNext = () => {
    if (step === 1) return !!form.patient_id;
    if (step === 2) return !!form.doctor_id && !!form.service_id;
    if (step === 3) return !!form.appointment_date && !!form.time_slot;
    return true;
  };

  const selectedPatient = MOCK_PATIENTS.find((p) => p.id === form.patient_id);
  const selectedDoctor = MOCK_DOCTORS.find((d) => d.id === form.doctor_id);
  const selectedService = MOCK_SERVICES.find((s) => s.id === form.service_id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Appointment</h1>
          <p className="text-slate-500 text-sm mt-0.5">Book an appointment in {steps.length} steps</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${step > s.n ? "bg-sky-600 text-white animate-pulse" : step === s.n ? "bg-sky-50 border-2 border-sky-500 text-sky-600" : "bg-slate-100 border border-slate-200 text-slate-400"}`}>
              {step > s.n ? "✓" : s.n}
            </div>
            <span className={`text-xs font-semibold hidden sm:block ${step === s.n ? "text-sky-600" : step > s.n ? "text-slate-500" : "text-slate-400"}`}>{s.label}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${step > s.n ? "bg-sky-500" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800 mb-4">Select Patient</p>
            {MOCK_PATIENTS.map((p) => (
              <button
                key={p.id}
                onClick={() => setForm((f) => ({ ...f, patient_id: p.id }))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${form.patient_id === p.id ? "border-sky-500 bg-sky-50/40 text-sky-700" : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/55 text-slate-700"}`}
              >
                <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-xs font-semibold text-sky-700">
                  {p.name.split(" ").map((n) => n[0]).join("").slice(0,2)}
                </div>
                <span className="font-medium">{p.name}</span>
                {form.patient_id === p.id && <span className="ml-auto text-sky-600 text-xs font-bold">✓ Selected</span>}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-3">Select Doctor</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_DOCTORS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setForm((f) => ({ ...f, doctor_id: d.id }))}
                    className={`px-4 py-3 rounded-xl border transition-all text-left ${form.doctor_id === d.id ? "border-sky-500 bg-sky-50/40 text-sky-750" : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/55 text-slate-750"}`}
                  >
                    <p className={`text-sm font-semibold ${form.doctor_id === d.id ? "text-sky-700" : "text-slate-800"}`}>{d.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{d.specialization}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-3">Select Service</p>
              <div className="space-y-2">
                {MOCK_SERVICES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setForm((f) => ({ ...f, service_id: s.id }))}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${form.service_id === s.id ? "border-sky-500 bg-sky-50/40" : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/55"}`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${form.service_id === s.id ? "text-sky-700" : "text-slate-800"}`}>{s.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.duration_minutes} min</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">₨{s.base_price.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={form.appointment_date}
                min={toISODate(new Date())}
                onChange={(e) => setForm((f) => ({ ...f, appointment_date: e.target.value }))}
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Time Slot</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, time_slot: t }))}
                    className={`py-2 text-xs rounded-lg border font-semibold transition-all ${form.time_slot === t ? "bg-sky-50 border-sky-500 text-sky-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Any special instructions…"
                rows={3}
                className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-800">Confirm Appointment Details</p>
            {[
              { label: "Patient", value: selectedPatient?.name ?? "—" },
              { label: "Doctor", value: selectedDoctor?.name ?? "—" },
              { label: "Service", value: selectedService?.name ?? "—" },
              { label: "Date", value: form.appointment_date },
              { label: "Time", value: form.time_slot },
              { label: "Price", value: selectedService ? `₨${selectedService.base_price.toLocaleString()}` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-500 text-sm">{label}</span>
                <span className="text-slate-800 font-semibold text-sm">{value}</span>
              </div>
            ))}
            {form.notes && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-slate-600 leading-relaxed">{form.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all disabled:opacity-30"
        >
          ← Back
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-40"
          >
            Next Step →
          </button>
        ) : (
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60"
          >
            {mutation.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {mutation.isPending ? "Booking…" : "Confirm Booking"}
          </button>
        )}
      </div>
    </div>
  );
}
