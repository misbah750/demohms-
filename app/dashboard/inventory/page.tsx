"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, Search, Package, AlertTriangle, X, Save, Pencil,
  Trash2, MoreVertical, TrendingDown, ShieldAlert, CheckCircle,
  BarChart3, ArrowUpDown, Filter, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────────────────────────
interface Item {
  id: string; clinic_id: string; product_name: string; category: string;
  quantity: number; unit_price: number; expiry_date?: string;
  reorder_level: number; supplier?: string; sku?: string;
  created_at: string; updated_at: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}
function daysToExp(d?: string) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}
function uid() { return `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

type StockStatus = "critical" | "low" | "expiring" | "expired" | "ok";
function stockStatus(item: Item): StockStatus {
  const dte = daysToExp(item.expiry_date);
  if (dte !== null && dte <= 0) return "expired";
  if (item.quantity === 0) return "critical";
  if (item.quantity <= item.reorder_level) return "low";
  if (dte !== null && dte <= 30) return "expiring";
  return "ok";
}

const STATUS_META: Record<StockStatus, { label: string; cls: string; dot: string }> = {
  critical:  { label: "Out of Stock",   cls: "bg-rose-50 text-rose-700 border-rose-200",   dot: "bg-rose-500" },
  low:       { label: "Low Stock",      cls: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  expiring:  { label: "Expiring Soon",  cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  expired:   { label: "Expired",        cls: "bg-red-50 text-red-700 border-red-200",      dot: "bg-red-600" },
  ok:        { label: "In Stock",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

const CATEGORIES = ["All", "Injectables", "Consumables", "Equipment", "Skincare", "Pharmaceuticals", "PPE", "Dental"];

// ─────────────────────────────────────────────────────────────────────────────
// Rich dummy data — 18 items across categories
// ─────────────────────────────────────────────────────────────────────────────
const INIT_ITEMS: Item[] = [
  { id:"v1",  clinic_id:"c1", product_name:"Botox 100U (Allergan)",      category:"Injectables",      quantity:24,  unit_price:8500,  expiry_date:"2026-11-30", reorder_level:5,  supplier:"MedSupply Co.",    sku:"BOT-100-ALL", created_at:"",updated_at:"" },
  { id:"v2",  clinic_id:"c1", product_name:"HA Filler Juvederm 1ml",     category:"Injectables",      quantity:3,   unit_price:14000, expiry_date:"2026-04-15", reorder_level:5,  supplier:"AbbVie Pakistan",  sku:"HAF-JUV-1ML", created_at:"",updated_at:"" },
  { id:"v3",  clinic_id:"c1", product_name:"PRP Centrifuge Tubes",        category:"Consumables",      quantity:2,   unit_price:600,   expiry_date:"2025-09-30", reorder_level:10, supplier:"Lab Essentials",   sku:"PRP-TUBE-10", created_at:"",updated_at:"" },
  { id:"v4",  clinic_id:"c1", product_name:"Numbing Cream EMLA 30g",     category:"Pharmaceuticals",  quantity:15,  unit_price:1800,  expiry_date:"2027-03-01", reorder_level:3,  supplier:"AstraZeneca PK",  sku:"EMC-30G",     created_at:"",updated_at:"" },
  { id:"v5",  clinic_id:"c1", product_name:"Saline 0.9% 500ml",          category:"Pharmaceuticals",  quantity:48,  unit_price:320,   expiry_date:"2027-06-01", reorder_level:10, supplier:"Otsuka Pak.",     sku:"SAL-500-09",  created_at:"",updated_at:"" },
  { id:"v6",  clinic_id:"c1", product_name:"Disposable Syringes 3ml",    category:"Consumables",      quantity:200, unit_price:55,                              reorder_level:50, supplier:"Med Disposables", sku:"SYR-3ML",     created_at:"",updated_at:"" },
  { id:"v7",  clinic_id:"c1", product_name:"Vitamin C Serum 30ml",       category:"Skincare",         quantity:0,   unit_price:3200,  expiry_date:"2026-08-20", reorder_level:5,  supplier:"Dermeca Labs",    sku:"VCS-30ML",    created_at:"",updated_at:"" },
  { id:"v8",  clinic_id:"c1", product_name:"Chemical Peel 30% TCA",      category:"Skincare",         quantity:8,   unit_price:4500,  expiry_date:"2025-12-15", reorder_level:3,  supplier:"PeelPro Inc.",    sku:"TCA-30-100",  created_at:"",updated_at:"" },
  { id:"v9",  clinic_id:"c1", product_name:"Surgical Gloves (S) x100",   category:"PPE",              quantity:12,  unit_price:950,                             reorder_level:4,  supplier:"SafeGuard PK",    sku:"GLV-S-100",   created_at:"",updated_at:"" },
  { id:"v10", clinic_id:"c1", product_name:"N95 Face Masks x50",         category:"PPE",              quantity:4,   unit_price:1100,                            reorder_level:5,  supplier:"SafeGuard PK",    sku:"N95-50",      created_at:"",updated_at:"" },
  { id:"v11", clinic_id:"c1", product_name:"Lidocaine 2% 20ml Vial",     category:"Pharmaceuticals",  quantity:18,  unit_price:450,   expiry_date:"2026-10-01", reorder_level:5,  supplier:"AstraZeneca PK",  sku:"LID-2-20",    created_at:"",updated_at:"" },
  { id:"v12", clinic_id:"c1", product_name:"Hydra Boost Filler 2ml",     category:"Injectables",      quantity:6,   unit_price:16500, expiry_date:"2025-07-10", reorder_level:3,  supplier:"Teoxane SA",      sku:"HBF-2ML",     created_at:"",updated_at:"" },
  { id:"v13", clinic_id:"c1", product_name:"LED Therapy Lamp (set)",     category:"Equipment",        quantity:2,   unit_price:45000,                           reorder_level:1,  supplier:"Lumiwave Tech",   sku:"LED-LMP-SET", created_at:"",updated_at:"" },
  { id:"v14", clinic_id:"c1", product_name:"Dental Composite Resin",     category:"Dental",           quantity:1,   unit_price:7500,  expiry_date:"2026-02-28", reorder_level:2,  supplier:"Dentsply Pak.",   sku:"DCR-A2-4G",   created_at:"",updated_at:"" },
  { id:"v15", clinic_id:"c1", product_name:"Retinol Serum 1% 50ml",      category:"Skincare",         quantity:11,  unit_price:2800,  expiry_date:"2026-09-15", reorder_level:3,  supplier:"Dermeca Labs",    sku:"RTS-1-50",    created_at:"",updated_at:"" },
  { id:"v16", clinic_id:"c1", product_name:"Bandages Sterile 10cm x50",  category:"Consumables",      quantity:30,  unit_price:650,                             reorder_level:8,  supplier:"Med Disposables", sku:"BND-10-50",   created_at:"",updated_at:"" },
  { id:"v17", clinic_id:"c1", product_name:"Antibiotic Ointment 15g",    category:"Pharmaceuticals",  quantity:0,   unit_price:280,   expiry_date:"2025-06-01", reorder_level:5,  supplier:"GlaxoSmithKline", sku:"ABO-15G",     created_at:"",updated_at:"" },
  { id:"v18", clinic_id:"c1", product_name:"Microneedling Cartridge",    category:"Equipment",        quantity:9,   unit_price:1200,                            reorder_level:4,  supplier:"Dermapen World",  sku:"MNC-36-PIN",  created_at:"",updated_at:"" },
];

type SortKey = "product_name" | "quantity" | "unit_price" | "expiry_date";
const EMPTY_FORM = {
  product_name: "", category: "Consumables", quantity: "", unit_price: "",
  expiry_date: "", reorder_level: "10", supplier: "", sku: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Dropdown hook
// ─────────────────────────────────────────────────────────────────────────────
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return { open, setOpen, ref };
}

// ─────────────────────────────────────────────────────────────────────────────
// Row actions dropdown
// ─────────────────────────────────────────────────────────────────────────────
function RowMenu({ onEdit, onRestock, onDelete }: { onEdit: () => void; onRestock: () => void; onDelete: () => void }) {
  const { open, setOpen, ref } = useDropdown();
  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(o => !o)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-36 rounded-xl border border-slate-100 bg-white shadow-lg py-1 text-sm">
          <button onClick={() => { setOpen(false); onEdit(); }} className="flex items-center gap-2 w-full px-3 py-2 text-slate-600 hover:bg-slate-50">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => { setOpen(false); onRestock(); }} className="flex items-center gap-2 w-full px-3 py-2 text-emerald-600 hover:bg-emerald-50">
            <RefreshCw className="w-3.5 h-3.5" /> Restock
          </button>
          <div className="border-t border-slate-100 my-0.5" />
          <button onClick={() => { setOpen(false); onDelete(); }} className="flex items-center gap-2 w-full px-3 py-2 text-rose-600 hover:bg-rose-50">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 p-6 z-10 max-h-[90vh] overflow-y-auto">
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

const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all";

function Field({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Item Form (create / edit)
// ─────────────────────────────────────────────────────────────────────────────
type FormState = typeof EMPTY_FORM;

function ItemForm({ initial, onSave, onClose }: {
  initial?: Item | null;
  onSave: (f: FormState) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<FormState>(
    initial ? {
      product_name: initial.product_name, category: initial.category,
      quantity: String(initial.quantity), unit_price: String(initial.unit_price),
      expiry_date: initial.expiry_date ?? "", reorder_level: String(initial.reorder_level),
      supplier: initial.supplier ?? "", sku: initial.sku ?? "",
    } : EMPTY_FORM
  );

  function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!f.product_name.trim()) { toast.error("Product name is required"); return; }
    onSave(f);
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Product Name" id="pn">
            <input id="pn" className={inputCls} placeholder="e.g. Botox 100U" required value={f.product_name} onChange={e => setF(v => ({ ...v, product_name: e.target.value }))} />
          </Field>
        </div>
        <Field label="Category" id="cat">
          <select id="cat" className={inputCls} value={f.category} onChange={e => setF(v => ({ ...v, category: e.target.value }))}>
            {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="SKU / Code" id="sku">
          <input id="sku" className={inputCls} placeholder="e.g. BOT-100" value={f.sku} onChange={e => setF(v => ({ ...v, sku: e.target.value }))} />
        </Field>
        <Field label="Quantity" id="qty">
          <input id="qty" className={inputCls} type="number" min="0" placeholder="0" required value={f.quantity} onChange={e => setF(v => ({ ...v, quantity: e.target.value }))} />
        </Field>
        <Field label="Unit Price (PKR)" id="up">
          <input id="up" className={inputCls} type="number" min="0" placeholder="0" required value={f.unit_price} onChange={e => setF(v => ({ ...v, unit_price: e.target.value }))} />
        </Field>
        <Field label="Reorder Level" id="rl">
          <input id="rl" className={inputCls} type="number" min="0" placeholder="10" required value={f.reorder_level} onChange={e => setF(v => ({ ...v, reorder_level: e.target.value }))} />
        </Field>
        <Field label="Expiry Date" id="ed">
          <input id="ed" className={inputCls} type="date" value={f.expiry_date} onChange={e => setF(v => ({ ...v, expiry_date: e.target.value }))} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Supplier" id="sup">
            <input id="sup" className={inputCls} placeholder="e.g. MedSupply Co." value={f.supplier} onChange={e => setF(v => ({ ...v, supplier: e.target.value }))} />
          </Field>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg py-2.5 text-sm font-medium transition-all">Cancel</button>
        <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-all shadow-sm">
          {initial ? "Save Changes" : "Add Item"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>(INIT_ITEMS);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | StockStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("product_name");
  const [sortAsc, setSortAsc] = useState(true);

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [restockItem, setRestockItem] = useState<Item | null>(null);
  const [restockQty, setRestockQty] = useState("10");
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);

  // ── CRUD ──
  function addItem(f: FormState) {
    const it: Item = {
      id: uid(), clinic_id: "c1", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      product_name: f.product_name, category: f.category,
      quantity: Number(f.quantity), unit_price: Number(f.unit_price),
      expiry_date: f.expiry_date || undefined,
      reorder_level: Number(f.reorder_level) || 10,
      supplier: f.supplier || undefined, sku: f.sku || undefined,
    };
    setItems(prev => [it, ...prev]);
    toast.success("Item added to inventory");
    setAddModal(false);
  }

  function saveEdit(f: FormState) {
    if (!editItem) return;
    setItems(prev => prev.map(i => i.id !== editItem.id ? i : {
      ...i, product_name: f.product_name, category: f.category,
      quantity: Number(f.quantity), unit_price: Number(f.unit_price),
      expiry_date: f.expiry_date || undefined,
      reorder_level: Number(f.reorder_level) || 10,
      supplier: f.supplier || undefined, sku: f.sku || undefined,
      updated_at: new Date().toISOString(),
    }));
    toast.success("Item updated");
    setEditItem(null);
  }

  function doRestock() {
    if (!restockItem) return;
    const qty = Number(restockQty);
    if (isNaN(qty) || qty <= 0) { toast.error("Enter a valid quantity"); return; }
    setItems(prev => prev.map(i => i.id === restockItem.id ? { ...i, quantity: i.quantity + qty, updated_at: new Date().toISOString() } : i));
    toast.success(`Restocked ${qty} units of "${restockItem.product_name}"`);
    setRestockItem(null);
    setRestockQty("10");
  }

  function deleteIt(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Item removed from inventory");
    setDeleteItem(null);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  // ── Filtering & sorting ──
  const filtered = items
    .filter(i => !search || i.product_name.toLowerCase().includes(search.toLowerCase()) || (i.sku ?? "").toLowerCase().includes(search.toLowerCase()) || (i.supplier ?? "").toLowerCase().includes(search.toLowerCase()))
    .filter(i => catFilter === "All" || i.category === catFilter)
    .filter(i => statusFilter === "all" || stockStatus(i) === statusFilter)
    .sort((a, b) => {
      let va: any = a[sortKey as keyof Item] ?? "";
      let vb: any = b[sortKey as keyof Item] ?? "";
      if (typeof va === "number") return sortAsc ? va - vb : vb - va;
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  // ── Stats ──
  const totalValue = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const criticalCount = items.filter(i => stockStatus(i) === "critical").length;
  const lowCount = items.filter(i => stockStatus(i) === "low").length;
  const expiringCount = items.filter(i => stockStatus(i) === "expiring" || stockStatus(i) === "expired").length;

  function SortBtn({ col }: { col: SortKey }) {
    return (
      <button onClick={() => toggleSort(col)} className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
        <ArrowUpDown className={`w-3 h-3 ${sortKey === col ? "text-sky-500" : "text-slate-300"}`} />
      </button>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 text-xs mt-0.5">Track stock levels, expiry dates, and reorder alerts across all supplies.</p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{items.length}</p>
            <p className="text-[11px] text-slate-400">{filtered.length} shown</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Value</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(totalValue)}</p>
            <p className="text-[11px] text-slate-400">Current inventory worth</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
        <div
          className={`bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${statusFilter === "low" || statusFilter === "critical" ? "border-orange-200 bg-orange-50/30" : "border-slate-100"}`}
          onClick={() => setStatusFilter(f => (f === "low" || f === "critical") ? "all" : "low")}
        >
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low / Out of Stock</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{criticalCount + lowCount}</p>
            <p className="text-[11px] text-slate-400">Click to filter</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div
          className={`bg-white border rounded-xl p-5 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all ${statusFilter === "expiring" || statusFilter === "expired" ? "border-amber-200 bg-amber-50/30" : "border-slate-100"}`}
          onClick={() => setStatusFilter(f => (f === "expiring" || f === "expired") ? "all" : "expiring")}
        >
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiring / Expired</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{expiringCount}</p>
            <p className="text-[11px] text-slate-400">Click to filter</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Alert banners */}
      {(criticalCount + lowCount + expiringCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-rose-800 font-semibold">{criticalCount} item{criticalCount > 1 ? "s" : ""} out of stock</span>
            </div>
          )}
          {lowCount > 0 && (
            <div className="flex items-center gap-2.5 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="text-orange-800 font-semibold">{lowCount} item{lowCount > 1 ? "s" : ""} below reorder level</span>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-amber-800 font-semibold">{expiringCount} item{expiringCount > 1 ? "s" : ""} expiring or expired</span>
            </div>
          )}
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, SKU, supplier…"
            className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all shadow-sm"
          />
        </div>
        {/* Category filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${catFilter === c ? "bg-sky-600 text-white border-sky-600 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"}`}
            >
              {c}
            </button>
          ))}
        </div>
        {/* Status filter */}
        {statusFilter !== "all" && (
          <button onClick={() => setStatusFilter("all")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all border border-slate-200">
            <X className="w-3 h-3" /> Clear filter
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-5 py-3 text-left">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Product <SortBtn col="product_name" />
                  </span>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-right">
                  <span className="flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Qty <SortBtn col="quantity" />
                  </span>
                </th>
                <th className="px-5 py-3 text-right">
                  <span className="flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Unit Price <SortBtn col="unit_price" />
                  </span>
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Value</th>
                <th className="px-5 py-3 text-left">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Expiry <SortBtn col="expiry_date" />
                  </span>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="font-medium text-slate-500">No items found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or add a new item.</p>
                  </td>
                </tr>
              ) : filtered.map(item => {
                const dte = daysToExp(item.expiry_date);
                const st = stockStatus(item);
                const { label, cls, dot } = STATUS_META[st];
                const rowAlert = st === "critical" || st === "expired";

                return (
                  <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${rowAlert ? "bg-rose-50/30" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${st === "ok" || st === "expiring" ? "bg-sky-50 border border-sky-100" : "bg-rose-50 border border-rose-100"}`}>
                          <Package className={`w-4 h-4 ${st === "ok" || st === "expiring" ? "text-sky-600" : "text-rose-500"}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.product_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.sku && <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.sku}</span>}
                            {item.supplier && <span className="text-[10px] text-slate-400">{item.supplier}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">{item.category}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div>
                        <span className={`font-bold text-base ${item.quantity === 0 ? "text-rose-600" : item.quantity <= item.reorder_level ? "text-orange-600" : "text-slate-900"}`}>
                          {item.quantity}
                        </span>
                        <span className="text-slate-300 text-xs ml-1">/ {item.reorder_level}</span>
                      </div>
                      <div className="w-16 h-1 rounded-full bg-slate-100 mt-1 ml-auto overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${item.quantity === 0 ? "bg-rose-500" : item.quantity <= item.reorder_level ? "bg-orange-400" : "bg-emerald-400"}`}
                          style={{ width: `${Math.min(100, (item.quantity / Math.max(item.reorder_level * 3, 1)) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600 tabular-nums">{fmt(item.unit_price)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-800 tabular-nums">{fmt(item.unit_price * item.quantity)}</td>
                    <td className="px-5 py-4">
                      {item.expiry_date ? (
                        <div>
                          <span className={`text-xs font-medium ${dte !== null && dte <= 0 ? "text-red-600" : dte !== null && dte <= 30 ? "text-amber-600" : "text-slate-500"}`}>
                            {fmtDate(item.expiry_date)}
                          </span>
                          {dte !== null && dte > 0 && dte <= 30 && (
                            <p className="text-[10px] text-amber-500 mt-0.5">{dte}d remaining</p>
                          )}
                          {dte !== null && dte <= 0 && (
                            <p className="text-[10px] text-red-500 mt-0.5">Expired</p>
                          )}
                        </div>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <RowMenu
                        onEdit={() => setEditItem(item)}
                        onRestock={() => { setRestockItem(item); setRestockQty("10"); }}
                        onDelete={() => setDeleteItem(item)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Footer summary */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 flex items-center justify-between text-xs text-slate-400">
          <span>{filtered.length} of {items.length} items</span>
          <span>Total stock value: <strong className="text-slate-700">{fmt(filtered.reduce((s, i) => s + i.quantity * i.unit_price, 0))}</strong></span>
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Inventory Item">
        <ItemForm onSave={addItem} onClose={() => setAddModal(false)} />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Item">
        <ItemForm initial={editItem} onSave={saveEdit} onClose={() => setEditItem(null)} />
      </Modal>

      {/* Restock modal */}
      <Modal open={!!restockItem} onClose={() => setRestockItem(null)} title="Restock Item">
        {restockItem && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-semibold text-slate-800">{restockItem.product_name}</p>
              <p className="text-xs text-slate-400 mt-1">Current stock: <strong className="text-slate-700">{restockItem.quantity}</strong> units</p>
            </div>
            <Field label="Units to Add" id="rq">
              <input id="rq" className={inputCls} type="number" min="1" placeholder="10" value={restockQty}
                onChange={e => setRestockQty(e.target.value)} onKeyDown={e => e.key === "Enter" && doRestock()} />
            </Field>
            <div className="flex gap-3">
              <button onClick={() => setRestockItem(null)} className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg py-2.5 text-sm font-medium transition-all">Cancel</button>
              <button onClick={doRestock} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Restock
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Remove Item">
        {deleteItem && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-800">Remove "{deleteItem.product_name}"?</p>
                <p className="text-xs text-rose-600 mt-1">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteItem(null)} className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg py-2.5 text-sm font-medium transition-all">Cancel</button>
              <button onClick={() => deleteIt(deleteItem.id)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2.5 text-sm font-semibold transition-all">Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
