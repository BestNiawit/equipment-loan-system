
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EquipmentForm from '@/components/equipment/EquipmentForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditEquipmentPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect(`/equipment/${id}`)

  const { data: equipment } = await supabase
    .from('equipment')
    .select('*, category:category_id(id, name)')
    .eq('id', id)
    .single()

  if (!equipment) notFound()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="page-container max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/equipment/${id}`} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Equipment</h1>
          <p className="text-sm text-slate-500 truncate">{equipment.name}</p>
        </div>
      </div>
      <EquipmentForm categories={categories ?? []} userId={user.id} existing={equipment} />
    </div>
  )
}
