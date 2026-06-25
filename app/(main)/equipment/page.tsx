export const runtime = 'edge'

import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EquipmentListClient from './EquipmentListClient'

export default async function EquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const profile = user
    ? (await supabase.from('profiles').select('role').eq('id', user.id).single()).data
    : null

  const [{ data: equipment }, { data: categories }, { data: activeLoans }] = await Promise.all([
    supabase.from('equipment').select('*, category:category_id(id, name)').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('name'),
    supabase.from('loans').select('equipment_id, due_date, borrowed_at, borrower_name').in('status', ['active', 'overdue']),
  ])

  const loanMap = new Map((activeLoans ?? []).map(l => [l.equipment_id, l]))
  const equipmentWithLoan = (equipment ?? []).map(e => ({ ...e, active_loan: loanMap.get(e.id) ?? null }))

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="page-container space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Equipment</h1>
          <p className="text-sm text-slate-500">{equipment?.length ?? 0} items registered</p>
        </div>
        {isAdmin && (
          <Link
            href="/equipment/new"
            className="btn-primary px-4 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add
          </Link>
        )}
      </div>

      {!equipment?.length ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-lg">No equipment yet</h3>
          <p className="text-slate-400 text-sm mt-1.5 max-w-xs mx-auto">
            {isAdmin ? 'Start by adding your first piece of equipment.' : 'No equipment has been registered yet.'}
          </p>
          {isAdmin && (
            <Link href="/equipment/new" className="btn-primary mt-6 mx-auto w-fit px-6">
              <Plus className="w-4 h-4" />
              Add First Equipment
            </Link>
          )}
        </div>
      ) : (
        <EquipmentListClient
          equipment={equipmentWithLoan}
          categories={categories ?? []}
        />
      )}
    </div>
  )
}
