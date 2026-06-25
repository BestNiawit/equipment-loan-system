import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { equipment_id, equipment_name, serial_no, borrower_name, borrower_contact, due_date, note } =
    await req.json()

  if (!equipment_id || !borrower_name?.trim() || !due_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: loanId, error } = await supabase.rpc('borrow_equipment', {
    p_equipment_id:     equipment_id,
    p_borrower_name:    borrower_name.trim(),
    p_borrower_contact: borrower_contact?.trim() || null,
    p_due_date:         new Date(due_date + 'T23:59:59').toISOString(),
    p_note:             note?.trim() || null,
  })

  if (error) {
    const notAvailable = error.message.includes('equipment_not_available')
    return NextResponse.json(
      { error: notAvailable ? 'Equipment is no longer available' : 'Failed to create loan' },
      { status: notAvailable ? 409 : 500 }
    )
  }

  // Discord notification (non-blocking — borrow still succeeds if Discord is down)
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (webhookUrl) {
    const dueDateFormatted = new Date(due_date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const fields = [
      { name: 'อุปกรณ์', value: equipment_name, inline: true },
      { name: 'ผู้ยืม', value: borrower_name.trim(), inline: true },
      { name: 'คืนภายใน', value: dueDateFormatted, inline: true },
      ...(serial_no ? [{ name: 'Serial No', value: serial_no, inline: true }] : []),
      ...(borrower_contact?.trim() ? [{ name: 'ติดต่อ', value: borrower_contact.trim(), inline: true }] : []),
      ...(note?.trim() ? [{ name: 'หมายเหตุ', value: note.trim() }] : []),
    ]

    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '📦 มีการยืมอุปกรณ์',
          color: 0x6366f1,
          fields,
          timestamp: new Date().toISOString(),
        }],
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ loan_id: loanId })
}
