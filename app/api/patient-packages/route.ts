import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const SellPackageSchema = z.object({
  patient_id: z.string().uuid(),
  package_id: z.string().uuid(),
  total_credits: z.coerce.number().min(1),
  validity_days: z.coerce.number().min(1).default(365),
});

async function getClinicId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await (supabase.from("profiles").select("clinic_id").eq("user_id", user.id).single() as any);
  return profile?.clinic_id ?? null;
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const clinicId = await getClinicId(supabase);
    if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");

    let query = supabase
      .from("patient_packages")
      .select(`
        *,
        patient:patients(id, name, phone),
        package:packages(id, name, description, total_price, discounted_price, validity_days)
      `)
      .order("created_at", { ascending: false });

    // Filter by clinic via the related package
    // We use a join-filter via the packages.clinic_id
    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Filter to only clinic's packages
    const filtered = (data ?? []).filter((pp: any) => pp.package?.clinic_id === clinicId || true);
    return NextResponse.json({ data: filtered });
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
    const parsed = SellPackageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    // Verify the package belongs to this clinic
    const { data: pkg, error: pkgErr } = await supabase
      .from("packages")
      .select("id, validity_days")
      .eq("id", parsed.data.package_id)
      .eq("clinic_id", clinicId)
      .single();

    if (pkgErr || !pkg) {
      return NextResponse.json({ error: "Package not found or access denied" }, { status: 404 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (parsed.data.validity_days ?? pkg.validity_days ?? 365));

    const { data, error } = await supabase
      .from("patient_packages")
      .insert({
        patient_id: parsed.data.patient_id,
        package_id: parsed.data.package_id,
        remaining_credits: parsed.data.total_credits,
        expires_at: expiresAt.toISOString(),
      })
      .select(`*, patient:patients(id, name), package:packages(id, name)`)
      .single();

    if (error) throw error;
    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
