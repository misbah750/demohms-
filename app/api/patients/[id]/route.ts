import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  age: z.coerce.number().min(0).max(150).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
});

async function getClinicId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("clinic_id").eq("user_id", user.id).single();
  return profile?.clinic_id ?? null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const clinicId = await getClinicId(supabase);
    if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .eq("clinic_id", clinicId)
      .single();

    if (error) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    return NextResponse.json({ data, error: null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const clinicId = await getClinicId(supabase);
    if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("patients")
      .update(parsed.data)
      .eq("id", id)
      .eq("clinic_id", clinicId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, error: null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerSupabaseClient();
    const clinicId = await getClinicId(supabase);
    if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinicId);

    if (error) throw error;
    return NextResponse.json({ data: null, error: null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
