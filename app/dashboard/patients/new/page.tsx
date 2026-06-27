"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, User } from "lucide-react";
import { toast } from "sonner";

interface PatientFormData {
  name: string;
  phone: string;
  email: string;
  age: string;
  gender: string;
  medical_history: string;
  allergies: string;
}

const EMPTY: PatientFormData = { name: "", phone: "", email: "", age: "", gender: "female", medical_history: "", allergies: "" };

export default function NewPatientPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState<PatientFormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<PatientFormData>>({});

  function validate(): boolean {
    const e: Partial<PatientFormData> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email address";
    if (form.age && (isNaN(+form.age) || +form.age < 0 || +form.age > 150)) e.age = "Age must be 0–150";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const mutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, age: data.age ? parseInt(data.age) : undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create patient");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient created successfully");
      router.push("/dashboard/patients");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) mutation.mutate(form);
  }

  function field(key: keyof PatientFormData, label: string, opts?: { type?: string; placeholder?: string; as?: "textarea" }) {
    const hasError = !!errors[key];
    const inputClass = `w-full bg-white border ${hasError ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-sky-500/20 focus:border-sky-500"} text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all`;

    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</label>
        {opts?.as === "textarea" ? (
          <textarea
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={opts?.placeholder}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        ) : (
          <input
            type={opts?.type ?? "text"}
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={opts?.placeholder}
            className={inputClass}
          />
        )}
        {hasError && <p className="text-xs text-red-500">{errors[key]}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Patient</h1>
          <p className="text-slate-500 text-sm mt-0.5">Register a new patient record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Icon & Title */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Personal Information</p>
            <p className="text-xs text-slate-500">Basic patient profile details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("name", "Full Name *", { placeholder: "e.g. Sarah Ahmed" })}
          {field("phone", "Phone Number", { placeholder: "e.g. 0300-1234567" })}
          {field("email", "Email Address", { type: "email", placeholder: "e.g. sarah@example.com" })}
          {field("age", "Age", { type: "number", placeholder: "e.g. 28" })}
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Gender</label>
          <div className="flex gap-3">
            {["female", "male", "other"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setForm((f) => ({ ...f, gender: g }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${form.gender === g ? "bg-sky-50 border-sky-200 text-sky-700 font-semibold" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Medical */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <p className="text-sm font-semibold text-slate-800">Medical Information</p>
          {field("medical_history", "Medical History", { as: "textarea", placeholder: "Any existing conditions…" })}
          {field("allergies", "Known Allergies", { placeholder: "e.g. Penicillin, Latex, None" })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm disabled:opacity-60"
          >
            {mutation.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {mutation.isPending ? "Saving…" : "Save Patient"}
          </button>
        </div>
      </form>
    </div>
  );
}
