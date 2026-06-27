import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const InventorySchema = z.object({
  product_name: z.string().min(1),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
  expiry_date: z.string().optional(),
  reorder_level: z.number().min(0).default(10),
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
  const lowStock = searchParams.get("low_stock") === "true";

  let query = supabase
    .from("inventory")
    .select("*", { count: "exact" })
    .eq("clinic_id", clinicId)
    .order("product_name");

  if (lowStock) {
    query = query.lte("quantity", supabase.rpc as unknown as number);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const clinicId = await getClinicId(supabase);
  if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = InventorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("inventory").insert({ ...parsed.data, clinic_id: clinicId }).select().single();

  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  return NextResponse.json({ data, error: null }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const clinicId = await getClinicId(supabase);
  if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("inventory").update(body).eq("id", id).eq("clinic_id", clinicId).select().single();

  if (error) return NextResponse.json({ error: String(error) }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

