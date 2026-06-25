export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EquipmentForm from '@/components/equipment/EquipmentForm'

export default async function NewEquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/equipment')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="page-container max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Add Equipment</h1>
        <p className="text-sm text-slate-500 mt-0.5">Register a new item to the inventory</p>
      </div>
      <EquipmentForm categories={categories ?? []} userId={user.id} />
    </div>
  )
}
