export const runtime = 'edge'

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Tag, FileText, ArrowLeft, Pencil, History, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/equipment/StatusBadge'
import EquipmentDetailClient from './EquipmentDetailClient'
import { formatDate, formatDateTime, getDaysOverdue } from '@/lib/utils'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EquipmentDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Optional auth for admin features
  const { data: { user } } = await supabase.auth.getUser()
  const profile = user
    ? (await supabase.from('profiles').select('*').eq('id', user.id).single()).data
    : null
  const isAdmin = profile?.role === 'admin'

  const { data: equipment } = await supabase
    .from('equipment')
    .select('*, category:category_id(id, name)')
    .eq('id', id)
    .single()

  if (!equipment) notFound()

  const { data: activeLoan } = await supabase
    .from('loans')
    .select('*, borrower:borrower_id(id, full_name, email)')
    .eq('equipment_id', id)
    .in('status', ['active', 'overdue'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: loanHistory } = await supabase
    .from('loans')
    .select('*, borrower:borrower_id(full_name, email)')
    .eq('equipment_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const isOverdue = activeLoan && new Date(activeLoan.due_date) < new Date()

  // Resolve borrower display name
  const activeBorrowerName = activeLoan?.borrower_name
    ?? (activeLoan?.borrower as { full_name: string | null; email: string } | null)?.full_name
    ?? (activeLoan?.borrower as { full_name: string | null; email: string } | null)?.email
    ?? null

  return (
    <div className="page-container max-w-lg mx-auto space-y-5">
      {/* Back + edit */}
      <div className="flex items-center justify-between">
        <Link href="/equipment" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Equipment
        </Link>
        {isAdmin && (
          <Link href={`/equipment/${id}/edit`} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        )}
      </div>

      {/* Image */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm">
        {equipment.image_url ? (
          <Image src={equipment.image_url} alt={equipment.name} fill className="object-cover" priority />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-slate-300 dark:text-slate-600" />
          </div>
        )}
        <div className="absolute bottom-3 left-3">
          <StatusBadge status={equipment.status} />
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{equipment.name}</h1>
        {equipment.serial_no && (
          <p className="text-sm text-slate-400 font-mono mt-1">SN: {equipment.serial_no}</p>
        )}
        {equipment.category && (
          <div className="flex items-center gap-1.5 mt-2">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-500 dark:text-slate-400">{equipment.category.name}</span>
          </div>
        )}
      </div>

      {/* Overdue warning */}
      {isOverdue && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
              Overdue by {getDaysOverdue(activeLoan!.due_date)} day{getDaysOverdue(activeLoan!.due_date) !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-rose-500 mt-0.5">Was due {formatDate(activeLoan!.due_date)}</p>
          </div>
        </div>
      )}

      {/* Currently borrowed by */}
      {activeLoan && activeBorrowerName && (
        <div className="card p-4 border-l-4 border-amber-400">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">Currently Borrowed By</p>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{activeBorrowerName}</p>
          {activeLoan.borrower_contact && (
            <p className="text-sm text-slate-500 mt-0.5">{activeLoan.borrower_contact}</p>
          )}
          <p className="text-xs text-slate-400 mt-1.5">
            Borrowed {formatDate(activeLoan.borrowed_at)} · Due {formatDate(activeLoan.due_date)}
          </p>
          {activeLoan.note && (
            <p className="text-xs text-slate-400 italic mt-1.5">&ldquo;{activeLoan.note}&rdquo;</p>
          )}
        </div>
      )}

      {/* Description */}
      {equipment.description && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{equipment.description}</p>
        </div>
      )}

      {/* Action buttons */}
      <EquipmentDetailClient
        equipment={equipment}
        isAdmin={isAdmin}
        activeLoan={activeLoan}
      />

      {/* Loan history */}
      {loanHistory && loanHistory.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Loan History</h2>
          </div>
          <div className="space-y-2">
            {loanHistory.map((loan) => {
              const borrowerProfile = loan.borrower as { full_name: string | null; email: string } | null
              const name = loan.borrower_name ?? borrowerProfile?.full_name ?? borrowerProfile?.email ?? 'Unknown'
              return (
                <div key={loan.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(loan.borrowed_at)} → {loan.returned_at ? formatDate(loan.returned_at) : 'Not returned'}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      loan.status === 'returned' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      loan.status === 'overdue' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                      'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                  {loan.condition_on_return && (
                    <p className="text-xs text-slate-400 mt-1.5">Condition: <span className="font-medium">{loan.condition_on_return}</span></p>
                  )}
                  {Array.isArray(loan.return_images) && loan.return_images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {(loan.return_images as string[]).map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`return photo ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 text-center pb-2">Added {formatDateTime(equipment.created_at)}</p>
    </div>
  )
}
