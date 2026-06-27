import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const PackageSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().or(z.literal("")),
  services: z.array(z.string().uuid()).optional().default([]),
  total_price: z.coerce.number().min(0),
  discounted_price: z.coerce.number().min(0),
  validity_days: z.coerce.number().min(1).default(365),
});

async function getClinicId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("clinic_id").eq("user_id", user.id).single();
  return profile?.clinic_id ?? null;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const clinicId = await getClinicId(supabase);
    if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const clinicId = await getClinicId(supabase);
    if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = PackageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("packages")
      .insert({ ...parsed.data, clinic_id: clinicId })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
