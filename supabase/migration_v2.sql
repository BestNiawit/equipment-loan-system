-- ============================================================
-- Migration v2: Remove auth requirement for borrowing
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- Add borrower_name column to loans (for non-auth borrowers)
ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS borrower_name TEXT,
  ADD COLUMN IF NOT EXISTS borrower_contact TEXT;

-- Make borrower_id optional (was NOT NULL)
ALTER TABLE public.loans
  ALTER COLUMN borrower_id DROP NOT NULL;

-- Drop old restrictive loan policies
DROP POLICY IF EXISTS "loans: insert own" ON public.loans;
DROP POLICY IF EXISTS "loans: update own or admin" ON public.loans;

-- Allow anyone (including anonymous) to create a loan
CREATE POLICY "loans: public insert"
  ON public.loans FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update a loan (return it)
CREATE POLICY "loans: public update"
  ON public.loans FOR UPDATE
  USING (true);

-- Allow anonymous read on equipment and categories
DROP POLICY IF EXISTS "equipment: read all" ON public.equipment;
CREATE POLICY "equipment: read all" ON public.equipment
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories: read all" ON public.categories;
CREATE POLICY "categories: read all" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "loans: read all" ON public.loans;
CREATE POLICY "loans: read all" ON public.loans
  FOR SELECT USING (true);

-- Allow anonymous read on profiles
DROP POLICY IF EXISTS "profiles: read all" ON public.profiles;
CREATE POLICY "profiles: read all" ON public.profiles
  FOR SELECT USING (true);
