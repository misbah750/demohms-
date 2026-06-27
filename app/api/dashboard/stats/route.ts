import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("user_id", user.id)
      .single();

    const clinicId = profile?.clinic_id;

    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const [patientsRes, todayApptRes, revenueRes, pendingRes, recentRes] =
      await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId ?? ""),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("clinic_id", clinicId ?? "").eq("appointment_date", today),
        supabase.from("invoices").select("total").eq("clinic_id", clinicId ?? "")
          .eq("status", "paid").gte("created_at", monthStart),
        supabase.from("invoices").select("id", { count: "exact", head: true })
          .eq("clinic_id", clinicId ?? "").eq("status", "pending"),
        supabase.from("appointments")
          .select("*, patient:patients(name,phone), doctor:doctors(name), service:services(name,base_price)")
          .eq("clinic_id", clinicId ?? "")
          .order("appointment_date", { ascending: false })
          .limit(8),
      ]);

    const monthlyRevenue = (revenueRes.data ?? []).reduce(
      (sum: number, inv: { total: number }) => sum + (inv.total ?? 0), 0
    );

    return NextResponse.json({
      data: {
        totalPatients: patientsRes.count ?? 0,
        todayAppointments: todayApptRes.count ?? 0,
        monthlyRevenue,
        pendingInvoices: pendingRes.count ?? 0,
        recentAppointments: recentRes.data ?? [],
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: String(err) }, { status: 500 });
  }
}

