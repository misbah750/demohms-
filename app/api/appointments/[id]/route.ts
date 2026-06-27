import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum(["scheduled","confirmed","in_progress","completed","cancelled","no_show"]).optional(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time_slot: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  doctor_id: z.string().uuid().optional(),
  notes: z.string().optional(),
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
    .from("appointments")
    .select("*, patient:patients(*), doctor:doctors(*), service:services(*)")
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
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const { data, error } = await supabase
    .from("appointments").update(parsed.data).eq("id", id).eq("clinic_id", clinicId)
    .select("*, patient:patients(name), doctor:doctors(name), service:services(name)").single();

  if (error) throw error;
  return NextResponse.json({ data, error: null });
}
