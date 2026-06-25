export const runtime = 'edge'

import Link from 'next/link'
import { ClipboardList, Package, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate, getDaysOverdue } from '@/lib/utils'
import ExportButton from './ExportButton'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const profile = user
    ? (await supabase.from('profiles').select('role').eq('id', user.id).single()).data
    : null
  const isAdmin = profile?.role === 'admin'

  // Public: show all loans. Non-admin logged-in users see their own only.
  const query = supabase
    .from('loans')
    .select(`
      id, status, borrowed_at, due_date, returned_at, condition_on_return, note,
      borrower_name, borrower_contact,
      equipment:equipment_id(id, name, image_url, serial_no),
      borrower:borrower_id(id, full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: loans } = await query

  const activeLoans = loans?.filter(l => l.status !== 'returned') ?? []
  const returnedLoans = loans?.filter(l => l.status === 'returned') ?? []

  return (
    <div className="page-container space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Loan History</h1>
          <p className="text-sm text-slate-500 mt-0.5">All loans · {loans?.length ?? 0} records</p>
        </div>
        <ExportButton />
      </div>

      {!loans?.length ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-lg">No loan history</h3>
          <p className="text-slate-400 text-sm mt-1.5">No loans have been made yet.</p>
          <Link href="/equipment" className="btn-primary mt-6 mx-auto w-fit px-6 text-sm">
            Browse Equipment
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {activeLoans.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Active · {activeLoans.length}
              </h2>
              <div className="space-y-2.5">
                {activeLoans.map(loan => <LoanCard key={loan.id} loan={loan} />)}
              </div>
            </section>
          )}
          {returnedLoans.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Returned · {returnedLoans.length}
              </h2>
              <div className="space-y-2.5">
                {returnedLoans.map(loan => <LoanCard key={loan.id} loan={loan} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LoanCard({ loan }: { loan: any }) {
  const eq = loan.equipment as { id: string; name: string; image_url: string | null; serial_no: string | null } | null
  const borrowerProfile = loan.borrower as { full_name: string | null; email: string } | null
  const borrowerDisplay = loan.borrower_name ?? borrowerProfile?.full_name ?? borrowerProfile?.email ?? 'Unknown'
  const isOverdue = loan.status !== 'returned' && new Date(loan.due_date) < new Date()
  const daysOverdue = isOverdue ? getDaysOverdue(loan.due_date) : 0

  return (
    <Link
      href={`/equipment/${eq?.id}`}
      className={`card block p-4 hover:shadow-md transition-shadow ${
        isOverdue ? 'border-rose-200 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-900/10' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {eq?.image_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={eq.image_url} alt="" className="w-full h-full object-cover" />
            : <Package className="w-5 h-5 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
              {eq?.name ?? 'Unknown'}
            </p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
              loan.status === 'returned'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : isOverdue
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {isOverdue ? 'Overdue' : loan.status}
            </span>
          </div>

          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5 truncate">
            {borrowerDisplay}
          </p>

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <span>Borrowed: {formatDate(loan.borrowed_at)}</span>
            <span>Due: {formatDate(loan.due_date)}</span>
          </div>

          {loan.returned_at && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
              Returned: {formatDate(loan.returned_at)}
              {loan.condition_on_return && ` · ${loan.condition_on_return}`}
            </p>
          )}

          {isOverdue && daysOverdue > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <AlertTriangle className="w-3 h-3" />
              {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
