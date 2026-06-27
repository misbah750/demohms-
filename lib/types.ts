// ============================================================
// HMS — TypeScript Types (mirrors Supabase DB schema)
// ============================================================

export type UserRole = "admin" | "doctor" | "receptionist";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type InvoiceStatus = "pending" | "paid" | "partial" | "overdue" | "cancelled";

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "online" | "insurance";

export type FollowUpType = "call" | "visit" | "message";
export type FollowUpStatus = "pending" | "completed" | "cancelled";

// ──────────────────────────────────────────────────────────────
// Core entities
// ──────────────────────────────────────────────────────────────
export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  owner_id: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  clinic_id: string;
  created_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  email: string;
  age: number;
  gender?: "male" | "female" | "other";
  medical_history?: string;
  allergies?: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  clinic_id: string;
  name: string;
  specialization: string;
  phone: string;
  bio?: string;
  photo_url?: string;
  created_at: string;
}

export interface Service {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  base_price: number;
  downtime?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  service_id: string;
  appointment_date: string; // ISO date YYYY-MM-DD
  time_slot: string;        // HH:MM
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // joined
  patient?: Patient;
  doctor?: Doctor;
  service?: Service;
}

export interface Treatment {
  id: string;
  appointment_id: string;
  service_id: string;
  materials_used?: string;
  dosage?: string;
  notes?: string;
  before_photo_url?: string;
  after_photo_url?: string;
  created_at: string;
  // joined
  service?: Service;
}

export interface Invoice {
  id: string;
  appointment_id: string;
  patient_id: string;
  clinic_id: string;
  subtotal: number;
  tax: number;
  total: number;
  paid_amount: number;
  status: InvoiceStatus;
  payment_method?: PaymentMethod;
  notes?: string;
  created_at: string;
  updated_at: string;
  // joined
  patient?: Patient;
  appointment?: Appointment;
}

export interface InventoryItem {
  id: string;
  clinic_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  expiry_date?: string;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  services: string[]; // array of service_ids
  total_price: number;
  discounted_price: number;
  validity_days: number;
  created_at: string;
}

export interface PatientPackage {
  id: string;
  patient_id: string;
  package_id: string;
  remaining_credits: number;
  expires_at: string;
  created_at: string;
  // joined
  patient?: Patient;
  package?: Package;
}

export interface FollowUp {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_date: string;
  type: FollowUpType;
  status: FollowUpStatus;
  notes?: string;
  created_at: string;
  // joined
  patient?: Patient;
  doctor?: Doctor;
}

// ──────────────────────────────────────────────────────────────
// API response shapes
// ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ──────────────────────────────────────────────────────────────
// Dashboard stats
// ──────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  monthlyRevenue: number;
  pendingInvoices: number;
  appointmentsTrend: { date: string; count: number }[];
  revenueTrend: { month: string; revenue: number }[];
  recentAppointments: Appointment[];
}

// ──────────────────────────────────────────────────────────────
// Form schemas (used alongside Zod)
// ──────────────────────────────────────────────────────────────
export interface PatientFormData {
  name: string;
  phone: string;
  email: string;
  age: number;
  gender: "male" | "female" | "other";
  medical_history?: string;
  allergies?: string;
}

export interface AppointmentFormData {
  patient_id: string;
  doctor_id: string;
  service_id: string;
  appointment_date: string;
  time_slot: string;
  notes?: string;
}

export interface InvoiceFormData {
  appointment_id: string;
  patient_id: string;
  subtotal: number;
  tax: number;
  payment_method?: PaymentMethod;
  notes?: string;
}
