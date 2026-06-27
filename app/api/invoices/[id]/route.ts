import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const PaymentSchema = z.object({
  paid_amount: z.number().min(0),
  payment_method: z.enum(["cash","card","bank_transfer","online","insurance"]),
});

async function getClinicId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("clinic_id").eq("user_id", user.id).single();
  return profile?.clinic_id ?? null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const clinicId = await getClinicId(supabase);
  if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await supabase
    .from("invoices")
    .select("*, patient:patients(*), appointment:appointments(*, doctor:doctors(name), service:services(name,base_price))")
    .eq("id", id).eq("clinic_id", clinicId).single();

  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data, error: null });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const clinicId = await getClinicId(supabase);
  if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = PaymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  // Fetch current invoice to determine new status
  const { data: inv } = await supabase.from("invoices").select("total").eq("id", id).single();
  const total = (inv as { total: number } | null)?.total ?? 0;
  const newStatus = parsed.data.paid_amount >= total ? "paid" : parsed.data.paid_amount > 0 ? "partial" : "pending";

  const { data, error } = await supabase
    .from("invoices")
    .update({ ...parsed.data, status: newStatus })
    .eq("id", id).eq("clinic_id", clinicId)
    .select().single();

  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  return NextResponse.json({ data, error: null });
}
