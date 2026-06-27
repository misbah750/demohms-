import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const DeductSchema = z.object({
  credits_to_use: z.coerce.number().min(1).default(1),
});

async function getClinicId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("clinic_id").eq("user_id", user.id).single();
  return profile?.clinic_id ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const clinicId = await getClinicId(supabase);
    if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = DeductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    // Fetch current record to check credits
    const { data: existing, error: fetchErr } = await supabase
      .from("patient_packages")
      .select("*, package:packages(clinic_id)")
      .eq("id", id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Patient package not found" }, { status: 404 });
    }

    // Ensure this belongs to the clinic
    if (existing.package?.clinic_id !== clinicId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (existing.remaining_credits < parsed.data.credits_to_use) {
      return NextResponse.json({ error: "Insufficient credits remaining" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("patient_packages")
      .update({ remaining_credits: existing.remaining_credits - parsed.data.credits_to_use })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ data, error: null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const clinicId = await getClinicId(supabase);
    if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabase.from("patient_packages").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ error: null, message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
