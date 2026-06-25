-- ============================================================
-- Migration v4: Atomic return function
-- ============================================================

CREATE OR REPLACE FUNCTION public.return_equipment(
  p_loan_id        UUID,
  p_equipment_id   UUID,
  p_condition      TEXT,
  p_return_images  TEXT[],
  p_note           TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_status TEXT;
BEGIN
  v_new_status := CASE WHEN p_condition = 'damaged' THEN 'maintenance' ELSE 'available' END;

  UPDATE public.loans
  SET
    returned_at         = NOW(),
    condition_on_return = p_condition,
    return_images       = p_return_images,
    note                = COALESCE(p_note, note),
    status              = 'returned'
  WHERE id = p_loan_id
    AND status != 'returned';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'loan_already_returned';
  END IF;

  UPDATE public.equipment
  SET status = v_new_status, updated_at = NOW()
  WHERE id = p_equipment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.return_equipment TO anon, authenticated;
