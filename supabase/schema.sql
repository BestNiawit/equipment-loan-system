-- ============================================================
-- EquipVault — Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Equipment
CREATE TABLE IF NOT EXISTS public.equipment (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  serial_no   TEXT UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url   TEXT,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'available'
              CHECK (status IN ('available', 'borrowed', 'overdue', 'maintenance')),
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Loans
CREATE TABLE IF NOT EXISTS public.loans (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id        UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  borrower_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  borrower_name       TEXT,
  borrower_contact    TEXT,
  borrowed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date            TIMESTAMPTZ NOT NULL,
  returned_at         TIMESTAMPTZ,
  condition_on_return TEXT CHECK (condition_on_return IN ('excellent', 'good', 'fair', 'damaged')),
  return_images       TEXT[] DEFAULT '{}',
  note                TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'returned', 'overdue')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_equipment_status ON public.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_loans_equipment ON public.loans(equipment_id);
CREATE INDEX IF NOT EXISTS idx_loans_borrower ON public.loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);

-- ============================================================
-- Auto-create profile when user registers
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Auto-update equipment.updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS equipment_updated_at ON public.equipment;
CREATE TRIGGER equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans      ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles: read all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles: insert own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Categories (all read, admin write)
CREATE POLICY "categories: read all" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "categories: admin write" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Equipment (all read, admin write)
CREATE POLICY "equipment: read all" ON public.equipment
  FOR SELECT USING (true);

CREATE POLICY "equipment: admin insert" ON public.equipment
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "equipment: admin update" ON public.equipment
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "equipment: admin delete" ON public.equipment
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Loans (all read, own insert, own/admin update)
CREATE POLICY "loans: read all" ON public.loans
  FOR SELECT USING (true);

-- Public insert: anyone can borrow (no account needed)
CREATE POLICY "loans: public insert" ON public.loans
  FOR INSERT WITH CHECK (true);

-- Public update: anyone can return
CREATE POLICY "loans: public update" ON public.loans
  FOR UPDATE USING (true);

-- ============================================================
-- Storage bucket + policies
-- For cloud Supabase: run supabase/storage.sql separately
-- For Docker local: runs automatically via docker/init-storage.sh
-- ============================================================
DO $$
BEGIN
  -- Only run if storage schema exists (Supabase cloud/local)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('equipment-images', 'equipment-images', true)
    ON CONFLICT (id) DO NOTHING;

    -- Storage RLS policies (idempotent)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'equipment-images: public read') THEN
      CREATE POLICY "equipment-images: public read"
        ON storage.objects FOR SELECT USING (bucket_id = 'equipment-images');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'equipment-images: auth upload') THEN
      CREATE POLICY "equipment-images: auth upload"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'equipment-images' AND auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'equipment-images: owner update') THEN
      CREATE POLICY "equipment-images: owner update"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'equipment-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'equipment-images: owner delete') THEN
      CREATE POLICY "equipment-images: owner delete"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'equipment-images' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
  END IF;
END $$;

-- ============================================================
-- Seed default categories (optional)
-- ============================================================
INSERT INTO public.categories (name) VALUES
  ('Laptops'),
  ('Monitors'),
  ('Cameras'),
  ('Audio Equipment'),
  ('Cables & Adapters'),
  ('Tools'),
  ('Projectors'),
  ('Tablets'),
  ('Mobile'),
  ('Tablet')
ON CONFLICT (name) DO NOTHING;
