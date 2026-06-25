
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  const supabase = await createClient()

  let query = supabase
    .from('loans')
    .select(`
      id, status, borrowed_at, due_date, returned_at,
      condition_on_return, note,
      borrower_name, borrower_contact,
      equipment:equipment_id(name, serial_no, category:category_id(name)),
      borrower:borrower_id(full_name, email)
    `)
    .order('borrowed_at', { ascending: false })

  if (from) query = query.gte('borrowed_at', new Date(from).toISOString())
  if (to)   query = query.lte('borrowed_at', new Date(to + 'T23:59:59').toISOString())

  const { data: loans, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (loans ?? []).map((l) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eq  = l.equipment as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pro = l.borrower  as any
    const borrowerName    = l.borrower_name    ?? pro?.full_name ?? pro?.email ?? ''
    const borrowerContact = l.borrower_contact ?? pro?.email     ?? ''

    return {
      'Equipment'      : eq?.name        ?? '',
      'Serial No'      : eq?.serial_no   ?? '',
      'Category'       : eq?.category?.name ?? '',
      'Borrower Name'  : borrowerName,
      'Contact'        : borrowerContact,
      'Status'         : l.status,
      'Borrowed At'    : l.borrowed_at   ? new Date(l.borrowed_at).toLocaleString('th-TH')   : '',
      'Due Date'       : l.due_date      ? new Date(l.due_date).toLocaleString('th-TH')       : '',
      'Returned At'    : l.returned_at   ? new Date(l.returned_at).toLocaleString('th-TH')    : '',
      'Condition'      : l.condition_on_return ?? '',
      'Note'           : l.note ?? '',
    }
  })

  const headers = rows[0] ? Object.keys(rows[0]) : [
    'Equipment','Serial No','Category','Borrower Name','Contact',
    'Status','Borrowed At','Due Date','Returned At','Condition','Note',
  ]

  const csvLines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const v = String((row as Record<string,string>)[h] ?? '')
        return v.includes(',') || v.includes('"') || v.includes('\n')
          ? `"${v.replace(/"/g, '""')}"`
          : v
      }).join(',')
    ),
  ]

  const csv = '﻿' + csvLines.join('\r\n') // BOM for Excel UTF-8

  const label   = from && to ? `${from}_to_${to}` : 'all'
  const filename = `loans_${label}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type'        : 'text/csv; charset=utf-8',
      'Content-Disposition' : `attachment; filename="${filename}"`,
    },
  })
}
