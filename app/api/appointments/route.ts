import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const AppointmentSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  service_id: z.string().uuid(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slot: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional(),
});

async function getClinicId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("clinic_id").eq("user_id", user.id).single();
  return profile?.clinic_id ?? null;
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const clinicId = await getClinicId(supabase);
    if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const doctorId = searchParams.get("doctor_id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20");
    const from = (page - 1) * pageSize;

    let query = supabase
      .from("appointments")
      .select("*, patient:patients(name,phone,email), doctor:doctors(name,specialization), service:services(name,base_price,duration_minutes)", { count: "exact" })
      .eq("clinic_id", clinicId)
      .order("appointment_date", { ascending: false })
      .order("time_slot", { ascending: true })
      .range(from, from + pageSize - 1);

    if (date) query = query.eq("appointment_date", date);
    if (doctorId) query = query.eq("doctor_id", doctorId);
    if (status) query = query.eq("status", status);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data ?? [], count: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const clinicId = await getClinicId(supabase);
    if (!clinicId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = AppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    // Check for conflicts
    const { data: conflict } = await supabase
      .from("appointments")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("doctor_id", parsed.data.doctor_id)
      .eq("appointment_date", parsed.data.appointment_date)
      .eq("time_slot", parsed.data.time_slot)
      .neq("status", "cancelled")
      .single();

    if (conflict) {
      return NextResponse.json({ error: "This time slot is already booked for that doctor" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({ ...parsed.data, clinic_id: clinicId, status: "scheduled" })
      .select("*, patient:patients(name), doctor:doctors(name), service:services(name,base_price)")
      .single();

    if (error) throw error;
    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

