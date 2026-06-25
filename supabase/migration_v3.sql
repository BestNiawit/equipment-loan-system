-- ============================================================
-- Migration v3: Atomic borrow + overdue auto-sync
-- ============================================================

-- 1. Atomic borrow — check availability, update equipment, insert loan in one transaction
CREATE OR REPLACE FUNCTION public.borrow_equipment(
  p_equipment_id     UUID,
  p_borrower_name    TEXT,
  p_borrower_contact TEXT,
  p_due_date         TIMESTAMPTZ,
  p_note             TEXT DEFAULT NULL,
  p_borrower_id      UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan_id UUID;
BEGIN
  UPDATE public.equipment
  SET status = 'borrowed', updated_at = NOW()
  WHERE id = p_equipment_id AND status = 'available';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'equipment_not_available';
  END IF;

  INSERT INTO public.loans (
    equipment_id, borrower_id, borrower_name, borrower_contact,
    borrowed_at, due_date, note, status
  )
  VALUES (
    p_equipment_id, p_borrower_id, p_borrower_name, p_borrower_contact,
    NOW(), p_due_date, p_note, 'active'
  )
  RETURNING id INTO v_loan_id;

  RETURN v_loan_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.borrow_equipment TO anon, authenticated;

-- 2. Overdue sync function — called by pg_cron every hour
CREATE OR REPLACE FUNCTION public.sync_overdue_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.loans
  SET status = 'overdue'
  WHERE status = 'active'
    AND due_date < NOW()
    AND returned_at IS NULL;

  UPDATE public.equipment
  SET status = 'overdue', updated_at = NOW()
  WHERE status = 'borrowed'
    AND id IN (
      SELECT DISTINCT equipment_id FROM public.loans WHERE status = 'overdue'
    );
END;
$$;

-- 3. Schedule overdue sync every hour
-- Supabase Cloud: enable pg_cron via Dashboard > Database > Extensions first
-- Self-hosted Docker: uncomment the line below
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'sync-overdue-status',
  '0 * * * *',
  'SELECT public.sync_overdue_status()'
);
