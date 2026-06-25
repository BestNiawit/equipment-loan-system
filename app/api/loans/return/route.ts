import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const conditionLabel: Record<string, string> = {
  excellent: '✅ Excellent — สภาพดีมาก',
  good:      '✅ Good — สภาพดี',
  fair:      '⚠️ Fair — สภาพพอใช้',
  damaged:   '🔴 Damaged — เสียหาย ต้องซ่อม',
}

export async function POST(req: NextRequest) {
  const { loan_id, equipment_id, condition, return_images, note } = await req.json()

  if (!loan_id || !equipment_id || !condition) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch loan + equipment info before returning (for Discord notification)
  const { data: loanInfo } = await supabase
    .from('loans')
    .select('borrower_name, borrower_contact, borrowed_at, equipment:equipment_id(name, serial_no)')
    .eq('id', loan_id)
    .single()

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

  // Discord notification (non-blocking)
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (webhookUrl && loanInfo) {
    const eq = (Array.isArray(loanInfo.equipment) ? loanInfo.equipment[0] : loanInfo.equipment) as { name: string; serial_no: string | null } | null
    const fields = [
      { name: 'อุปกรณ์', value: eq?.name ?? equipment_id, inline: true },
      { name: 'ผู้คืน', value: loanInfo.borrower_name, inline: true },
      { name: 'สภาพ', value: conditionLabel[condition] ?? condition, inline: false },
      ...(eq?.serial_no ? [{ name: 'Serial No', value: eq.serial_no, inline: true }] : []),
      ...(loanInfo.borrower_contact?.trim() ? [{ name: 'ติดต่อ', value: loanInfo.borrower_contact.trim(), inline: true }] : []),
      ...(note?.trim() ? [{ name: 'หมายเหตุ', value: note.trim(), inline: false }] : []),
    ]

    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🔄 คืนอุปกรณ์แล้ว',
          color: condition === 'damaged' ? 0xef4444 : condition === 'fair' ? 0xf59e0b : 0x22c55e,
          fields,
          timestamp: new Date().toISOString(),
        }],
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
