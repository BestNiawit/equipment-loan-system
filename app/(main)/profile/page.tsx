export const runtime = 'edge'

import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — show login prompt
  if (!user) {
    return (
      <div className="page-container max-w-lg mx-auto">
        <div className="card p-10 text-center">
          <div className="w-20 h-20 gradient-bg rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Admin Sign In</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
            Sign in to access admin features like adding and managing equipment.
          </p>
          <Link href="/login" className="btn-primary mt-6 mx-auto w-fit px-8">
            Sign In
          </Link>
          <p className="text-xs text-slate-400 mt-4">
            Regular users don&apos;t need an account — just borrow equipment directly.
          </p>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: loanStats } = await supabase
    .from('loans')
    .select('id, status')
    .eq('borrower_id', user.id)

  const totalBorrowed = loanStats?.length ?? 0
  const activeLoans = loanStats?.filter(l => l.status === 'active').length ?? 0
  const overdueLoans = loanStats?.filter(l => l.status === 'overdue').length ?? 0
  const returnedLoans = loanStats?.filter(l => l.status === 'returned').length ?? 0

  return (
    <ProfileClient
      profile={profile!}
      stats={{ totalBorrowed, activeLoans, overdueLoans, returnedLoans }}
    />
  )
}
