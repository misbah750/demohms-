"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Eye, Pencil, Trash2, Phone, Mail, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import type { Patient } from "@/lib/types";
import { toast } from "sonner";

const MOCK_PATIENTS: Patient[] = [
  { id: "1", clinic_id: "c1", name: "Sarah Ahmed",    phone: "0300-1234567", email: "sarah@example.com",  age: 28, gender: "female", medical_history: "None",       allergies: "Penicillin", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "2", clinic_id: "c1", name: "Zara Khan",      phone: "0311-9876543", email: "zara@example.com",   age: 35, gender: "female", medical_history: "Hypertension",allergies: "None",       created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "3", clinic_id: "c1", name: "Amna Siddiqui",  phone: "0321-5551234", email: "amna@example.com",   age: 42, gender: "female", medical_history: "Diabetes",    allergies: "Sulfa",      created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "4", clinic_id: "c1", name: "Hina Baig",      phone: "0333-6670000", email: "hina@example.com",   age: 31, gender: "female", medical_history: "None",        allergies: "None",       created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "5", clinic_id: "c1", name: "Ali Hassan",     phone: "0345-4321000", email: "ali@example.com",    age: 45, gender: "male",   medical_history: "Asthma",      allergies: "None",       created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "6", clinic_id: "c1", name: "Maryam Riaz",    phone: "0300-9998877", email: "maryam@example.com", age: 26, gender: "female", medical_history: "None",        allergies: "Latex",      created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const GENDER_TABS = ["all", "female", "male", "allergies"];

async function fetchPatients(search: string, page: number) {
  try {
    const res = await fetch(`/api/patients?search=${search}&page=${page}&pageSize=10`);
    return await res.json();
  } catch {
    return { data: MOCK_PATIENTS, count: MOCK_PATIENTS.length, totalPages: 1 };
  }
}

const AVATAR_COLORS = [
  "bg-sky-50 text-sky-700 border-sky-100", "bg-violet-50 text-violet-700 border-violet-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100", "bg-amber-50 text-amber-700 border-amber-100",
  "bg-rose-50 text-rose-700 border-rose-100", "bg-teal-50 text-teal-700 border-teal-100",
];

export default function PatientsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filterGender, setFilterGender] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["patients", debouncedSearch, page],
    queryFn: () => fetchPatients(debouncedSearch, page),
    placeholderData: { data: MOCK_PATIENTS, count: MOCK_PATIENTS.length, totalPages: 1 },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient record deleted");
    },
    onError: () => toast.error("Failed to delete patient record"),
  });

  function handleSearch(val: string) {
    setSearch(val);
    clearTimeout((window as typeof window & { _st?: ReturnType<typeof setTimeout> })._st);
    (window as typeof window & { _st?: ReturnType<typeof setTimeout> })._st = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  }

  const rawPatients: Patient[] = data?.data ?? MOCK_PATIENTS;

  // Perform filtering client-side for mock robustness
  const patients = rawPatients.filter((p) => {
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      const match = p.name.toLowerCase().includes(term) ||
                    (p.phone && p.phone.toLowerCase().includes(term)) ||
                    (p.email && p.email.toLowerCase().includes(term));
      if (!match) return false;
    }
    if (filterGender === "all") return true;
    if (filterGender === "allergies") return p.allergies && p.allergies !== "None" && p.allergies !== "";
    return p.gender === filterGender;
  });

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patients Directory</h1>
          <p className="text-slate-500 text-xs mt-0.5">Lookup patient medical records, edit allergy profiles, and register new patients.</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/patients/new")}
          className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-150 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      {/* Unified Toolbar */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search patient records..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center flex-wrap gap-1.5">
          {GENDER_TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setFilterGender(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${filterGender === t ? "bg-sky-600 border-sky-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-655 hover:bg-slate-50"}`}
            >
              {t === "all" ? "All Patients" : t === "allergies" ? "Warnings / Allergies" : t}
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
                <th className="text-left px-6 py-3.5">Patient Name</th>
                <th className="text-left px-6 py-3.5 hidden sm:table-cell">Contact Details</th>
                <th className="text-left px-6 py-3.5 hidden md:table-cell">Age / Gender</th>
                <th className="text-left px-6 py-3.5 hidden lg:table-cell">Allergy Warnings</th>
                <th className="text-left px-6 py-3.5 hidden xl:table-cell">Joined Date</th>
                <th className="text-right px-6 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-medium bg-slate-50/20">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2.5 opacity-25 text-slate-400" />
                    No patient records matched the selection.
                  </td>
                </tr>
              ) : patients.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Name with initials avatar */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs border ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">{p.name}</span>
                        <span className="text-[10px] text-slate-400 sm:hidden mt-0.5">{p.phone}</span>
                      </div>
                    </div>
                  </td>

                  {/* Contact details */}
                  <td className="px-6 py-3.5 hidden sm:table-cell">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-700">{p.phone ?? "—"}</div>
                      <div className="text-[10px] text-slate-400">{p.email ?? "—"}</div>
                    </div>
                  </td>

                  {/* Age / Gender */}
                  <td className="px-6 py-3.5 hidden md:table-cell text-slate-700 text-xs">
                    <span className="font-bold">{p.age ?? "—"} Yrs</span>
                    <span className="text-slate-300 mx-1.5">/</span>
                    <span className="capitalize text-slate-500 font-medium">{p.gender ?? "—"}</span>
                  </td>

                  {/* Allergy Warnings with status dot styling */}
                  <td className="px-6 py-3.5 hidden lg:table-cell">
                    {p.allergies && p.allergies !== "None" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {p.allergies}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">No Warnings</span>
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-3.5 hidden xl:table-cell text-slate-500 text-xs font-semibold">
                    {formatDate(p.created_at)}
                  </td>

                  {/* Action items */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/patients/${p.id}`)}
                        title="View File"
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/patients/${p.id}/edit`)}
                        title="Edit Record"
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Are you sure you want to delete the medical file for ${p.name}?`)) deleteMutation.mutate(p.id); }}
                        title="Delete Record"
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
