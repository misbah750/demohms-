import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const PatientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  age: z.coerce.number().min(0).max(150).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await (supabase.from("profiles").select("clinic_id").eq("user_id", user.id).single() as any);
    const clinicId = profile?.clinic_id;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20");
    const from = (page - 1) * pageSize;

    let query = supabase
      .from("patients")
      .select("*", { count: "exact" })
      .eq("clinic_id", clinicId ?? "")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      data: data ?? [],
      count: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await (supabase.from("profiles").select("clinic_id").eq("user_id", user.id).single() as any);
    const clinicId = profile?.clinic_id;

    const body = await request.json();
    const parsed = PatientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({ ...parsed.data, clinic_id: clinicId })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

