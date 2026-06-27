"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Package, Plus, Tag, Users, Clock, TrendingUp,
  Database, X, Pencil, Trash2, CheckCircle, AlertCircle,
  MoreVertical, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Pkg {
  id: string; clinic_id: string; name: string; description: string;
  services: string[]; total_price: number; discounted_price: number;
  validity_days: number; created_at: string;
}
interface Sub {
  id: string; patient_id: string; package_id: string;
  remaining_credits: number; total_credits: number; expires_at: string;
  created_at: string;
  patient: { id: string; name: string; phone: string };
  package: { id: string; name: string; discounted_price: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);
}
function daysLeft(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}
function uid() { return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function addDays(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString();
}
function subStatusInfo(s: Sub): { label: string; cls: string; dot: string } {
  if (s.remaining_credits === 0) return { label: "Exhausted", cls: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" };
  const d = daysLeft(s.expires_at);
  if (d === 0) return { label: "Expired", cls: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" };
  if (d <= 14) return { label: "Expiring Soon", cls: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" };
  return { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" };
}

const ACCENTS = [
  { bar: "bg-sky-500", icon: "bg-sky-50 text-sky-600", badge: "bg-sky-50 text-sky-700 border-sky-100" },
  { bar: "bg-violet-500", icon: "bg-violet-50 text-violet-600", badge: "bg-violet-50 text-violet-700 border-violet-100" },
  { bar: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { bar: "bg-rose-500", icon: "bg-rose-50 text-rose-600", badge: "bg-rose-50 text-rose-700 border-rose-100" },
  { bar: "bg-amber-500", icon: "bg-amber-50 text-amber-600", badge: "bg-amber-50 text-amber-700 border-amber-100" },
  { bar: "bg-teal-500", icon: "bg-teal-50 text-teal-600", badge: "bg-teal-50 text-teal-700 border-teal-100" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Initial dummy data
// ─────────────────────────────────────────────────────────────────────────────
const INIT_PACKAGES: Pkg[] = [
  { id: "dp1", clinic_id: "c1", name: "Dental Care Bundle", description: "Complete dental care — cleaning, X-rays, and 2 fillings included", services: [], total_price: 25000, discounted_price: 19500, validity_days: 365, created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "dp2", clinic_id: "c1", name: "Physiotherapy Pack", description: "10 sessions for pain management, rehab & post-surgical recovery", services: [], total_price: 18000, discounted_price: 14000, validity_days: 180, created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: "dp3", clinic_id: "c1", name: "Annual Wellness Check", description: "Full body checkup, blood panel, ECG & specialist consultation", services: [], total_price: 12000, discounted_price: 9500, validity_days: 365, created_at: new Date(Date.now() - 21 * 86400000).toISOString() },
  { id: "dp4", clinic_id: "c1", name: "Skin Care Essentials", description: "6 sessions — hydrafacial, chemical peel, and laser toning", services: [], total_price: 35000, discounted_price: 28000, validity_days: 270, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "dp5", clinic_id: "c1", name: "Ortho Consultation Bundle", description: "3 consultations + digital X-rays + cast fitting included", services: [], total_price: 14000, discounted_price: 10500, validity_days: 120, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "dp6", clinic_id: "c1", name: "Mental Wellness Program", description: "8 therapy sessions with a licensed clinical psychologist", services: [], total_price: 32000, discounted_price: 24000, validity_days: 180, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const INIT_PATIENTS = [
  { id: "pat1", name: "Sarah Ahmed", phone: "0300-1234567" },
  { id: "pat2", name: "Zara Khan", phone: "0321-7654321" },
  { id: "pat3", name: "Amna Siddiqui", phone: "0333-1112223" },
  { id: "pat4", name: "Hina Baig", phone: "0345-4445556" },
  { id: "pat5", name: "Ali Hassan", phone: "0311-9998887" },
  { id: "pat6", name: "Usman Farooq", phone: "0322-5556664" },
];

const INIT_SUBS: Sub[] = [
  { id: "ds1", patient_id: "pat1", package_id: "dp1", remaining_credits: 8, total_credits: 10, expires_at: addDays(120), created_at: new Date(Date.now() - 45 * 86400000).toISOString(), patient: { id: "pat1", name: "Sarah Ahmed", phone: "0300-1234567" }, package: { id: "dp1", name: "Dental Care Bundle", discounted_price: 19500 } },
  { id: "ds2", patient_id: "pat2", package_id: "dp2", remaining_credits: 3, total_credits: 10, expires_at: addDays(10), created_at: new Date(Date.now() - 170 * 86400000).toISOString(), patient: { id: "pat2", name: "Zara Khan", phone: "0321-7654321" }, package: { id: "dp2", name: "Physiotherapy Pack", discounted_price: 14000 } },
  { id: "ds3", patient_id: "pat3", package_id: "dp3", remaining_credits: 0, total_credits: 5, expires_at: addDays(60), created_at: new Date(Date.now() - 20 * 86400000).toISOString(), patient: { id: "pat3", name: "Amna Siddiqui", phone: "0333-1112223" }, package: { id: "dp3", name: "Annual Wellness Check", discounted_price: 9500 } },
  { id: "ds4", patient_id: "pat4", package_id: "dp4", remaining_credits: 5, total_credits: 6, expires_at: addDays(200), created_at: new Date(Date.now() - 10 * 86400000).toISOString(), patient: { id: "pat4", name: "Hina Baig", phone: "0345-4445556" }, package: { id: "dp4", name: "Skin Care Essentials", discounted_price: 28000 } },
];

// ─────────────────────────────────────────────────────────────────────────────
// Reusable UI pieces
// ─────────────────────────────────────────────────────────────────────────────
const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all";

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, iconCls }: { icon: any; label: string; value: string | number; sub?: string; iconCls: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconCls}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

// Dropdown menu hook
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return { open, setOpen, ref };
}

// ─────────────────────────────────────────────────────────────────────────────
// Package Card
// ─────────────────────────────────────────────────────────────────────────────
function PkgCard({ pkg, index, onSell, onEdit, onDelete }: {
  pkg: Pkg; index: number;
  onSell: (p: Pkg) => void;
  onEdit: (p: Pkg) => void;
  onDelete: (id: string) => void;
}) {
  const ac = ACCENTS[index % ACCENTS.length];
  const disc = pkg.total_price > 0 ? Math.round(((pkg.total_price - pkg.discounted_price) / pkg.total_price) * 100) : 0;
  const { open, setOpen, ref } = useDropdown();

  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col">
      <div className={`h-1 w-full ${ac.bar}`} />
      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ac.icon}`}>
            <Package className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            {disc > 0 && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${ac.badge}`}>
                <Tag className="w-3 h-3" />{disc}% off
              </span>
            )}
            {/* Actions dropdown */}
            <div ref={ref} className="relative">
              <button
                onClick={() => setOpen(o => !o)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {open && (
                <div className="absolute right-0 top-8 z-30 w-36 rounded-xl border border-slate-100 bg-white shadow-lg py-1 text-sm">
                  <button
                    onClick={() => { setOpen(false); onEdit(pkg); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { setOpen(false); onDelete(pkg.id); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1">{pkg.name}</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1 line-clamp-2">
          {pkg.description || "No description."}
        </p>

        {/* Pricing */}
        <div className="flex items-end justify-between mb-4">
          <div>
            {pkg.total_price !== pkg.discounted_price && (
              <p className="text-xs line-through text-slate-300">{fmt(pkg.total_price)}</p>
            )}
            <p className="text-lg font-bold text-slate-900">{fmt(pkg.discounted_price)}</p>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{pkg.validity_days}d</span>
          </div>
        </div>

        <button
          onClick={() => onSell(pkg)}
          className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-sm font-medium py-2 rounded-lg transition-all duration-150"
        >
          <Users className="w-3.5 h-3.5" />
          Assign to Patient
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Package form (shared for create & edit)
// ─────────────────────────────────────────────────────────────────────────────
type PkgForm = { name: string; description: string; total_price: string; discounted_price: string; validity_days: string };
const emptyForm: PkgForm = { name: "", description: "", total_price: "", discounted_price: "", validity_days: "365" };

function PkgFormModal({ open, onClose, initial, onSave }: {
  open: boolean; onClose: () => void;
  initial?: Pkg | null;
  onSave: (f: PkgForm) => void;
}) {
  const [f, setF] = useState<PkgForm>(emptyForm);
  useEffect(() => {
    if (open) {
      setF(initial ? {
        name: initial.name, description: initial.description,
        total_price: String(initial.total_price),
        discounted_price: String(initial.discounted_price),
        validity_days: String(initial.validity_days),
      } : emptyForm);
    }
  }, [open, initial]);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) { toast.error("Package name is required"); return; }
    if (Number(f.discounted_price) > Number(f.total_price)) {
      toast.error("Discounted price can't exceed original price");
      return;
    }
    onSave(f);
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit Package" : "Create New Package"}>
      <form onSubmit={handle} className="space-y-4">
        <Field label="Package Name" id="pn">
          <input id="pn" className={inputCls} placeholder="e.g. Dental Care Bundle" required
            value={f.name} onChange={e => setF(v => ({ ...v, name: e.target.value }))} />
        </Field>
        <Field label="Description" id="pd">
          <textarea id="pd" rows={3} className={inputCls} placeholder="What's included?"
            value={f.description} onChange={e => setF(v => ({ ...v, description: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Original Price (PKR)" id="pt">
            <input id="pt" className={inputCls} type="number" min="0" placeholder="25000" required
              value={f.total_price} onChange={e => setF(v => ({ ...v, total_price: e.target.value }))} />
          </Field>
          <Field label="Discounted Price (PKR)" id="pdi">
            <input id="pdi" className={inputCls} type="number" min="0" placeholder="19500" required
              value={f.discounted_price} onChange={e => setF(v => ({ ...v, discounted_price: e.target.value }))} />
          </Field>
        </div>
        <Field label="Validity (Days)" id="pv">
          <input id="pv" className={inputCls} type="number" min="1" placeholder="365"
            value={f.validity_days} onChange={e => setF(v => ({ ...v, validity_days: e.target.value }))} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg py-2.5 text-sm font-medium transition-all">
            Cancel
          </button>
          <button type="submit"
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-all shadow-sm">
            {initial ? "Save Changes" : "Create Package"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit Subscription Modal
// ─────────────────────────────────────────────────────────────────────────────
function EditSubModal({ open, onClose, sub, onSave }: {
  open: boolean; onClose: () => void; sub: Sub | null;
  onSave: (id: string, credits: number, expiresAt: string) => void;
}) {
  const [credits, setCredits] = useState("");
  const [expiry, setExpiry] = useState("");
  useEffect(() => {
    if (open && sub) {
      setCredits(String(sub.remaining_credits));
      setExpiry(sub.expires_at.split("T")[0]);
    }
  }, [open, sub]);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!sub) return;
    const c = Number(credits);
    if (isNaN(c) || c < 0) { toast.error("Invalid credit count"); return; }
    onSave(sub.id, c, new Date(expiry).toISOString());
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Subscription">
      <form onSubmit={handle} className="space-y-4">
        {sub && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">{sub.patient.name}</p>
            <p className="text-xs text-slate-400">{sub.package.name}</p>
          </div>
        )}
        <Field label="Remaining Credits" id="ec">
          <input id="ec" className={inputCls} type="number" min="0" required
            value={credits} onChange={e => setCredits(e.target.value)} />
        </Field>
        <Field label="Expiry Date" id="ed">
          <input id="ed" className={inputCls} type="date" required
            value={expiry} onChange={e => setExpiry(e.target.value)} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg py-2.5 text-sm font-medium transition-all">
            Cancel
          </button>
          <button type="submit"
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-all shadow-sm">
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Assign Modal
// ─────────────────────────────────────────────────────────────────────────────
function AssignModal({ open, onClose, pkg, patients, onAssign }: {
  open: boolean; onClose: () => void; pkg: Pkg | null;
  patients: typeof INIT_PATIENTS;
  onAssign: (patientId: string, credits: number) => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [credits, setCredits] = useState("10");
  useEffect(() => { if (open) { setPatientId(""); setCredits("10"); } }, [open]);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) { toast.error("Please select a patient"); return; }
    onAssign(patientId, Number(credits));
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign Package to Patient">
      <form onSubmit={handle} className="space-y-4">
        {pkg && (
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-sky-600" />
              <span className="font-semibold text-slate-800 text-sm">{pkg.name}</span>
            </div>
            <div className="grid grid-cols-2 text-xs gap-1 text-slate-500">
              <span>Price:</span>
              <span className="font-semibold text-slate-700 text-right">{fmt(pkg.discounted_price)}</span>
              <span>Validity:</span>
              <span className="font-semibold text-slate-700 text-right">{pkg.validity_days} days</span>
            </div>
          </div>
        )}
        <Field label="Select Patient">
          <select
            required value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className={inputCls}
          >
            <option value="" disabled>— Choose patient —</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} · {p.phone}</option>
            ))}
          </select>
        </Field>
        <Field label="Total Sessions / Credits" id="ac">
          <input id="ac" className={inputCls} type="number" min="1" placeholder="10" required
            value={credits} onChange={e => setCredits(e.target.value)} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg py-2.5 text-sm font-medium transition-all">
            Cancel
          </button>
          <button type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-all shadow-sm">
            Assign Package
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function PackagesPage() {
  const [tab, setTab] = useState<"packages" | "subscriptions">("packages");

  // Core state — live local copy (works without DB)
  const [packages, setPackages] = useState<Pkg[]>(INIT_PACKAGES);
  const [subs, setSubs] = useState<Sub[]>(INIT_SUBS);
  const [patients] = useState(INIT_PATIENTS);

  // Modal state
  const [pkgModal, setPkgModal] = useState<{ open: boolean; editing: Pkg | null }>({ open: false, editing: null });
  const [assignModal, setAssignModal] = useState<{ open: boolean; pkg: Pkg | null }>({ open: false, pkg: null });
  const [editSubModal, setEditSubModal] = useState<{ open: boolean; sub: Sub | null }>({ open: false, sub: null });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; name: string } | null>(null);

  // ── Package CRUD ──
  function savePkg(form: PkgForm) {
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      total_price: Number(form.total_price),
      discounted_price: Number(form.discounted_price),
      validity_days: Number(form.validity_days) || 365,
    };
    if (pkgModal.editing) {
      setPackages(prev => prev.map(p =>
        p.id === pkgModal.editing!.id ? { ...p, ...data } : p
      ));
      toast.success("Package updated!");
    } else {
      const newPkg: Pkg = { id: uid(), clinic_id: "c1", created_at: new Date().toISOString(), services: [], ...data };
      setPackages(prev => [newPkg, ...prev]);
      toast.success("Package created!");
    }
    setPkgModal({ open: false, editing: null });
  }

  function deletePkg(id: string) {
    setPackages(prev => prev.filter(p => p.id !== id));
    setSubs(prev => prev.filter(s => s.package_id !== id));
    toast.success("Package deleted");
    setConfirmDelete(null);
  }

  // ── Subscription operations ──
  function assignPkg(patientId: string, credits: number) {
    if (!assignModal.pkg) return;
    const pkg = assignModal.pkg;
    const patient = patients.find(p => p.id === patientId)!;
    const newSub: Sub = {
      id: uid(), patient_id: patientId, package_id: pkg.id,
      remaining_credits: credits, total_credits: credits,
      expires_at: addDays(pkg.validity_days),
      created_at: new Date().toISOString(),
      patient: { id: patient.id, name: patient.name, phone: patient.phone },
      package: { id: pkg.id, name: pkg.name, discounted_price: pkg.discounted_price },
    };
    setSubs(prev => [newSub, ...prev]);
    toast.success(`Package assigned to ${patient.name}!`);
    setAssignModal({ open: false, pkg: null });
    setTab("subscriptions");
  }

  function useCredit(id: string) {
    setSubs(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (s.remaining_credits === 0) { toast.error("No credits remaining"); return s; }
      toast.success("1 credit used");
      return { ...s, remaining_credits: s.remaining_credits - 1 };
    }));
  }

  function updateSub(id: string, credits: number, expiresAt: string) {
    setSubs(prev => prev.map(s =>
      s.id === id ? { ...s, remaining_credits: credits, expires_at: expiresAt, total_credits: Math.max(s.total_credits, credits) } : s
    ));
    toast.success("Subscription updated!");
    setEditSubModal({ open: false, sub: null });
  }

  function deleteSub(id: string) {
    setSubs(prev => prev.filter(s => s.id !== id));
    toast.success("Subscription removed");
  }

  // Stats
  const activeCount = subs.filter(s => s.remaining_credits > 0 && daysLeft(s.expires_at) > 0).length;
  const expiringCount = subs.filter(s => { const d = daysLeft(s.expires_at); return d <= 14 && d > 0 && s.remaining_credits > 0; }).length;
  const totalRevenue = subs.reduce((sum, s) => sum + s.package.discounted_price, 0);

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Treatment Packages</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Create bundles, assign to patients, and track session credits.
          </p>
        </div>
        <button
          onClick={() => setPkgModal({ open: true, editing: null })}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Package
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <KpiCard icon={Package} label="Total Packages" value={packages.length} sub="Available bundles" iconCls="bg-sky-50 text-sky-600" />
        <KpiCard icon={Users} label="Active Subscriptions" value={activeCount} sub="Enrolled patients" iconCls="bg-emerald-50 text-emerald-600" />
        <KpiCard icon={Clock} label="Expiring Soon" value={expiringCount} sub="Within 14 days" iconCls="bg-amber-50 text-amber-600" />
        <KpiCard icon={TrendingUp} label="Package Revenue" value={fmt(totalRevenue)} sub="From all sales" iconCls="bg-violet-50 text-violet-600" />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-100">
        {(["packages", "subscriptions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
              tab === t ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            {t === "packages" ? <Package className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            <span className="capitalize">{t}</span>
            <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">
              {t === "packages" ? packages.length : subs.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Packages Tab ── */}
      {tab === "packages" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {packages.map((pkg, i) => (
            <PkgCard
              key={pkg.id} pkg={pkg} index={i}
              onSell={p => setAssignModal({ open: true, pkg: p })}
              onEdit={p => setPkgModal({ open: true, editing: p })}
              onDelete={id => {
                const p = packages.find(x => x.id === id);
                setConfirmDelete({ open: true, id, name: p?.name ?? "this package" });
              }}
            />
          ))}
          {/* Add card */}
          <button
            onClick={() => setPkgModal({ open: true, editing: null })}
            className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-sky-300 hover:text-sky-500 hover:bg-sky-50/30 transition-all duration-200 min-h-[220px]"
          >
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium">Create Package</p>
          </button>
        </div>
      )}

      {/* ── Subscriptions Tab ── */}
      {tab === "subscriptions" && (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
          {subs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Users className="w-10 h-10 text-slate-200" />
              <p className="font-medium text-slate-500">No subscriptions yet</p>
              <p className="text-xs">Assign a package to a patient from the Packages tab.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {["Patient", "Package", "Credits", "Expires", "Status", "Actions"].map(h => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {subs.map(sub => {
                    const d = daysLeft(sub.expires_at);
                    const { label, cls, dot } = subStatusInfo(sub);
                    const pct = sub.total_credits > 0 ? (sub.remaining_credits / sub.total_credits) * 100 : 0;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800 text-sm">{sub.patient.name}</p>
                          <p className="text-xs text-slate-400">{sub.patient.phone}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{sub.package.name}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 tabular-nums">
                              {sub.remaining_credits}/{sub.total_credits}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {d > 0 ? `${d}d left` : "Expired"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                            {label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => useCredit(sub.id)}
                              disabled={sub.remaining_credits === 0 || d === 0}
                              className="border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Use Credit
                            </button>
                            <button
                              onClick={() => setEditSubModal({ open: true, sub })}
                              className="border border-slate-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 text-slate-500 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteSub(sub.id)}
                              className="border border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <PkgFormModal
        open={pkgModal.open}
        onClose={() => setPkgModal({ open: false, editing: null })}
        initial={pkgModal.editing}
        onSave={savePkg}
      />

      <AssignModal
        open={assignModal.open}
        onClose={() => setAssignModal({ open: false, pkg: null })}
        pkg={assignModal.pkg}
        patients={patients}
        onAssign={assignPkg}
      />

      <EditSubModal
        open={editSubModal.open}
        onClose={() => setEditSubModal({ open: false, sub: null })}
        sub={editSubModal.sub}
        onSave={updateSub}
      />

      {/* Delete confirm dialog */}
      <Modal
        open={!!confirmDelete?.open}
        onClose={() => setConfirmDelete(null)}
        title="Delete Package"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-800">Delete "{confirmDelete?.name}"?</p>
              <p className="text-xs text-rose-600 mt-1">This will also remove all patient subscriptions for this package. This cannot be undone.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)}
              className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg py-2.5 text-sm font-medium transition-all">
              Cancel
            </button>
            <button onClick={() => confirmDelete && deletePkg(confirmDelete.id)}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-all">
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
