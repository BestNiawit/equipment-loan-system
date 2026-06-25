import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { loan_id, equipment_id, condition, return_images, note } = await req.json()

  if (!loan_id || !equipment_id || !condition) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('return_equipment', {
    p_loan_id:       loan_id,
    p_equipment_id:  equipment_id,
    p_condition:     condition,
    p_return_images: return_images ?? [],
    p_note:          note ?? null,
  })

  if (error) {
    const alreadyReturned = error.message.includes('loan_already_returned')
    return NextResponse.json(
      { error: alreadyReturned ? 'This loan has already been returned' : 'Failed to process return' },
      { status: alreadyReturned ? 409 : 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
