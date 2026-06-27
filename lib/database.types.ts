// Auto-generated Supabase DB types stub
// For full generated types, run: npx supabase gen types typescript --project-id <your-project-id>

export type Database = {
  public: {
    Tables: {
      clinics: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      profiles: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      patients: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      doctors: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      services: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      appointments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      treatments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      invoices: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      inventory: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      packages: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      patient_packages: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
      follow_ups: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
