export const runtime = 'edge'

import Link from 'next/link'
import { Package, CheckCircle2, Clock, AlertCircle, Wrench, Plus, QrCode, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'
import StatusBadge from '@/components/equipment/StatusBadge'
import DashboardChart from '@/components/dashboard/DashboardChart'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Optional auth — admin features shown if logged in as admin
  const { data: { user } } = await supabase.auth.getUser()
  const profile = user
    ? (await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()).data
    : null
  const isAdmin = profile?.role === 'admin'

  const { data: equipment } = await supabase
    .from('equipment')
    .select('id, status')

  const { data: recentLoans } = await supabase
    .from('loans')
    .select(`
      id, status, borrowed_at, due_date, borrower_name,
      equipment:equipment_id(id, name, image_url, status),
      borrower:borrower_id(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const total = equipment?.length ?? 0
  const available = equipment?.filter(e => e.status === 'available').length ?? 0
  const borrowed = equipment?.filter(e => e.status === 'borrowed').length ?? 0
  const overdue = equipment?.filter(e => e.status === 'overdue').length ?? 0
  const maintenance = equipment?.filter(e => e.status === 'maintenance').length ?? 0

  return (
    <div className="page-container space-y-6">
      {/* Hero */}
      <div className="gradient-bg rounded-2xl p-6 text-white shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/50">
        <p className="text-indigo-200 text-sm font-medium">Equipment Status</p>
        <h1 className="text-2xl font-bold mt-1">EquipVault Dashboard</h1>
        <p className="text-indigo-200 text-sm mt-1">
          {overdue > 0
            ? `⚠️ ${overdue} item${overdue > 1 ? 's' : ''} overdue`
            : `${available} item${available !== 1 ? 's' : ''} available to borrow`}
        </p>
        <div className="flex gap-3 mt-5">
          <Link href="/equipment" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm font-medium transition-all">
            <Package className="w-4 h-4" />
            Browse
          </Link>
          <Link href="/scan" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm font-medium transition-all">
            <QrCode className="w-4 h-4" />
            Scan Barcode
          </Link>
          {isAdmin && (
            <Link href="/equipment/new" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm font-medium transition-all ml-auto">
              <Plus className="w-4 h-4" />
              Add
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="Total" value={total} color="indigo" index={0}><Package className="w-6 h-6" /></StatsCard>
        <StatsCard label="Available" value={available} color="emerald" index={1}><CheckCircle2 className="w-6 h-6" /></StatsCard>
        <StatsCard label="Borrowed" value={borrowed} color="amber" index={2}><Clock className="w-6 h-6" /></StatsCard>
        <StatsCard label="Overdue" value={overdue} color="rose" index={3}><AlertCircle className="w-6 h-6" /></StatsCard>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DashboardChart available={available} borrowed={borrowed} overdue={overdue} maintenance={maintenance} />
          {maintenance > 0 && (
            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">In Maintenance</p>
                <p className="text-3xl font-bold text-slate-600 dark:text-slate-400">{maintenance}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
          <Link href="/history" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {!recentLoans?.length ? (
          <div className="card p-8 text-center">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="font-medium text-slate-500">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentLoans.map((loan) => {
              const eq = loan.equipment as unknown as { id: string; name: string; image_url: string | null; status: string } | null
              const borrowerProfile = loan.borrower as unknown as { full_name: string | null; email: string } | null
              const displayName = loan.borrower_name ?? borrowerProfile?.full_name ?? borrowerProfile?.email ?? 'Unknown'
              return (
                <Link key={loan.id} href={`/equipment/${eq?.id}`}
                  className="card flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {eq?.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={eq.image_url} alt="" className="w-full h-full object-cover" />
                      : <Package className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">{eq?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{displayName} · {formatDate(loan.borrowed_at)}</p>
                  </div>
                  <StatusBadge status={(eq?.status ?? 'available') as never} size="sm" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
