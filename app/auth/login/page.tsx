"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Activity, Eye, EyeOff, Lock, Mail, AlertCircle, Zap, User, Building } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  // Mode state: 'login' or 'signup'
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [clinicName, setClinicName] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Determine if we are in local offline Demo mode (Supabase URL is not configured)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isDemoMode = !supabaseUrl || supabaseUrl.includes("your-project-id");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // If local offline demo mode, bypass auth completely
    if (isDemoMode) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    if (isSignUp) {
      try {
        // 1. Sign Up in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        const user = authData?.user;
        if (!user) {
          setError("Failed to register. Please check your credentials.");
          setLoading(false);
          return;
        }

        // Small delay to let the auth trigger (handle_new_user) fire and create the profile row
        await new Promise(res => setTimeout(res, 1000));

        // 2. Create the Clinic
        const { data: clinic, error: clinicError } = await supabase
          .from("clinics")
          .insert({
            name: clinicName || `${fullName}'s Clinic`,
            owner_id: user.id,
          })
          .select()
          .single();

        if (clinicError) {
          setError(`Account created, but failed to create clinic: ${clinicError.message}`);
          setLoading(false);
          return;
        }

        // 3. Upsert the Profile — handles both: trigger already created it (update), or it hasn't yet (insert)
        await supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              full_name: fullName,
              clinic_id: clinic.id,
              role: "admin",
            },
            { onConflict: "user_id" }
          );

        // Auto redirect after signup (email confirmation may be required by Supabase settings)
        router.push(redirect);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during sign up.");
        setLoading(false);
      }
    } else {
      // Log In
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        router.push(redirect);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred during login.");
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background subtle highlights */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-sky-600 rounded-xl mb-3 shadow-md">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HMS</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Hospital Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {isSignUp ? "Register your clinic and start managing patients" : "Sign in to access your clinic portal"}
          </p>

          {/* Dev mode notice — Only show if Supabase is NOT configured */}
          {isDemoMode && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3.5 text-xs mb-5 shadow-sm">
              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Demo Mode Active</p>
                <p className="text-amber-700 mt-1 leading-relaxed">
                  Supabase credentials not configured. Click below to enter the dashboard directly with mock data.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/dashboard");
                    router.refresh();
                  }}
                  className="mt-2 text-sky-700 hover:text-sky-800 font-semibold underline underline-offset-2 transition-colors inline-block"
                >
                  → Enter Dashboard directly
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-tight">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Sarah Malik"
                    required={isSignUp}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Clinic Name (Sign Up only) */}
            {isSignUp && (
              <div className="space-y-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Clinic Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="City Skin Clinic"
                    required={isSignUp}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@clinic.com"
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-950 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-950 placeholder-slate-400 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isSignUp ? "Creating Account…" : "Signing In…"}
                </>
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </button>
          </form>

          {/* Toggle Tab */}
          {!isDemoMode && (
            <div className="mt-5 text-center text-xs">
              <span className="text-slate-500">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-sky-600 hover:text-sky-700 font-semibold transition-colors underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-400 text-center mt-6">
            © 2026 HMS. Professional Clinic Portal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
