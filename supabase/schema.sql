-- ================================================================
-- HMS — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────────
-- 1. CLINICS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  timezone    TEXT DEFAULT 'Asia/Karachi',
  owner_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 2. PROFILES (extends auth.users)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  role        TEXT CHECK (role IN ('admin','doctor','receptionist')) DEFAULT 'receptionist',
  clinic_id   UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 3. PATIENTS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patients (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  phone            TEXT,
  email            TEXT,
  age              INTEGER,
  gender           TEXT CHECK (gender IN ('male','female','other')),
  medical_history  TEXT,
  allergies        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 4. DOCTORS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  specialization   TEXT,
  phone            TEXT,
  bio              TEXT,
  photo_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 5. SERVICES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.services (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  duration_minutes  INTEGER DEFAULT 30,
  base_price        NUMERIC(10,2) DEFAULT 0,
  downtime          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 6. APPOINTMENTS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id        UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id         UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  service_id        UUID REFERENCES public.services(id) ON DELETE SET NULL,
  appointment_date  DATE NOT NULL,
  time_slot         TIME NOT NULL,
  status            TEXT CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')) DEFAULT 'scheduled',
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 7. TREATMENTS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.treatments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id   UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  service_id       UUID REFERENCES public.services(id) ON DELETE SET NULL,
  materials_used   TEXT,
  dosage           TEXT,
  notes            TEXT,
  before_photo_url TEXT,
  after_photo_url  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 8. INVOICES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id   UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id       UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  clinic_id        UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  subtotal         NUMERIC(10,2) DEFAULT 0,
  tax              NUMERIC(10,2) DEFAULT 0,
  total            NUMERIC(10,2) DEFAULT 0,
  paid_amount      NUMERIC(10,2) DEFAULT 0,
  status           TEXT CHECK (status IN ('pending','paid','partial','overdue','cancelled')) DEFAULT 'pending',
  payment_method   TEXT CHECK (payment_method IN ('cash','card','bank_transfer','online','insurance')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 9. INVENTORY
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id      UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  product_name   TEXT NOT NULL,
  quantity       INTEGER DEFAULT 0,
  unit_price     NUMERIC(10,2) DEFAULT 0,
  expiry_date    DATE,
  reorder_level  INTEGER DEFAULT 10,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 10. PACKAGES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.packages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  services          UUID[] DEFAULT '{}',
  total_price       NUMERIC(10,2) DEFAULT 0,
  discounted_price  NUMERIC(10,2) DEFAULT 0,
  validity_days     INTEGER DEFAULT 365,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 11. PATIENT PACKAGES
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_packages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  package_id        UUID REFERENCES public.packages(id) ON DELETE CASCADE NOT NULL,
  remaining_credits INTEGER DEFAULT 0,
  expires_at        DATE NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- 12. FOLLOW-UPS
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id       UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  scheduled_date  DATE NOT NULL,
  type            TEXT CHECK (type IN ('call','visit','message')) DEFAULT 'call',
  status          TEXT CHECK (status IN ('pending','completed','cancelled')) DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_name   ON public.patients(name);

CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON public.doctors(clinic_id);

CREATE INDEX IF NOT EXISTS idx_services_clinic ON public.services(clinic_id);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic  ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date    ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor  ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status  ON public.appointments(status);

CREATE INDEX IF NOT EXISTS idx_invoices_clinic   ON public.invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient  ON public.invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status   ON public.invoices(status);

CREATE INDEX IF NOT EXISTS idx_inventory_clinic ON public.inventory(clinic_id);

CREATE INDEX IF NOT EXISTS idx_follow_ups_patient ON public.follow_ups(patient_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date    ON public.follow_ups(scheduled_date);

-- ────────────────────────────────────────────────────────────────
-- SECURITY DEFINER HELPER FUNCTIONS (Bypasses RLS to avoid recursion)
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ────────────────────────────────────────────────────────────────

-- 1. CLINICS
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic members can view their clinic" ON public.clinics;
DROP POLICY IF EXISTS "Clinic owners can update their clinic" ON public.clinics;
DROP POLICY IF EXISTS "Authenticated users can create a clinic" ON public.clinics;

CREATE POLICY "Clinic members can view their clinic"
  ON public.clinics FOR SELECT
  USING (id = public.get_user_clinic_id());

CREATE POLICY "Clinic owners can update their clinic"
  ON public.clinics FOR UPDATE
  USING (owner_id = auth.uid());

-- Allow any authenticated user to create their own clinic (used during signup)
CREATE POLICY "Authenticated users can create a clinic"
  ON public.clinics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles in clinic" ON public.profiles;
DROP POLICY IF EXISTS "System trigger can insert profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles in clinic"
  ON public.profiles FOR SELECT
  USING (
    clinic_id = public.get_user_clinic_id() AND public.get_user_role() = 'admin'
  );

-- Allow users to insert their own profile (needed if trigger doesn't fire or for manual signup flow)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3. PATIENTS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic staff can manage patients" ON public.patients;

CREATE POLICY "Clinic staff can manage patients"
  ON public.patients FOR ALL
  USING (
    clinic_id = public.get_user_clinic_id()
  );

-- 4. DOCTORS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic staff can view doctors" ON public.doctors;
DROP POLICY IF EXISTS "Admins can manage doctors" ON public.doctors;

CREATE POLICY "Clinic staff can view doctors"
  ON public.doctors FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Admins can manage doctors"
  ON public.doctors FOR ALL
  USING (
    clinic_id = public.get_user_clinic_id() AND public.get_user_role() = 'admin'
  );

-- 5. SERVICES
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic staff can view services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;

CREATE POLICY "Clinic staff can view services"
  ON public.services FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  USING (
    clinic_id = public.get_user_clinic_id() AND public.get_user_role() = 'admin'
  );

-- 6. APPOINTMENTS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic staff can manage appointments" ON public.appointments;

CREATE POLICY "Clinic staff can manage appointments"
  ON public.appointments FOR ALL
  USING (clinic_id = public.get_user_clinic_id());

-- 7. TREATMENTS
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic staff can manage treatments" ON public.treatments;

CREATE POLICY "Clinic staff can manage treatments"
  ON public.treatments FOR ALL
  USING (
    appointment_id IN (
      SELECT id FROM public.appointments
      WHERE clinic_id = public.get_user_clinic_id()
    )
  );

-- 8. INVOICES
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic staff can manage invoices" ON public.invoices;

CREATE POLICY "Clinic staff can manage invoices"
  ON public.invoices FOR ALL
  USING (clinic_id = public.get_user_clinic_id());

-- 9. INVENTORY
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic staff can manage inventory" ON public.inventory;

CREATE POLICY "Clinic staff can manage inventory"
  ON public.inventory FOR ALL
  USING (clinic_id = public.get_user_clinic_id());

-- 10. PACKAGES
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic staff can view packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
DROP POLICY IF EXISTS "Clinic staff can manage packages" ON public.packages;

CREATE POLICY "Clinic staff can view packages"
  ON public.packages FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

-- Allow all clinic staff (not just admins) to manage packages so seed/create works
CREATE POLICY "Clinic staff can manage packages"
  ON public.packages FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- 11. PATIENT PACKAGES
ALTER TABLE public.patient_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic staff can manage patient packages" ON public.patient_packages;

CREATE POLICY "Clinic staff can manage patient packages"
  ON public.patient_packages FOR ALL
  USING (
    patient_id IN (
      SELECT id FROM public.patients
      WHERE clinic_id = public.get_user_clinic_id()
    )
  );

-- 12. FOLLOW-UPS
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clinic staff can manage follow-ups" ON public.follow_ups;

CREATE POLICY "Clinic staff can manage follow-ups"
  ON public.follow_ups FOR ALL
  USING (
    patient_id IN (
      SELECT id FROM public.patients
      WHERE clinic_id = public.get_user_clinic_id()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- TRIGGERS AND FUNCTIONS
-- ────────────────────────────────────────────────────────────────

-- 1. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_patients_updated_at ON public.patients;
CREATE TRIGGER set_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_appointments_updated_at ON public.appointments;
CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_invoices_updated_at ON public.invoices;
CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_inventory_updated_at ON public.inventory;
CREATE TRIGGER set_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
