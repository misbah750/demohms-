import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ──────────────────────────────────────────────────────────────
// Tailwind class merger
// ──────────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ──────────────────────────────────────────────────────────────
// Currency
// ──────────────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ──────────────────────────────────────────────────────────────
// Dates
// ──────────────────────────────────────────────────────────────
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatTime(timeSlot: string): string {
  const [hours, minutes] = timeSlot.split(":");
  const h = parseInt(hours);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
}

export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function isToday(date: string): boolean {
  return date === toISODate(new Date());
}

// ──────────────────────────────────────────────────────────────
// Status helpers
// ──────────────────────────────────────────────────────────────
export const appointmentStatusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  no_show: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export const invoiceStatusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  partial: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  overdue: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// ──────────────────────────────────────────────────────────────
// Misc
// ──────────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 18,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}
