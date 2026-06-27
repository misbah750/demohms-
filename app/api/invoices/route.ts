import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const InvoiceSchema = z.object({
  appointment_id: z.string().uuid().optional(),
  patient_id: z.string().uuid(),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  payment_method: z.enum(["cash","card","bank_transfer","online","insurance"]).optional(),
  notes: z.string().optional(),
});

async function getClinicId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("clinic_id").eq("user_id", user.id).single();
  return profile?.clinic_id ?? null;
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const clinicId = await getClinicId(supabase);
  if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20");
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("invoices")
    .select("*, patient:patients(name,phone), appointment:appointments(appointment_date,time_slot)", { count: "exact" })
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });

  return NextResponse.json({ data: data ?? [], count: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const clinicId = await getClinicId(supabase);
  if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = InvoiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const total = parsed.data.subtotal + parsed.data.tax;
  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...parsed.data, clinic_id: clinicId, total, paid_amount: 0, status: "pending" })
    .select("*, patient:patients(name)")
    .single();

  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  return NextResponse.json({ data, error: null }, { status: 201 });
}

