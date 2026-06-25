'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { User, Mail, Shield, LogOut, Moon, Sun, Save, Loader2, ArrowDownToLine, RotateCcw, AlertCircle, History } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'

interface Stats {
  totalBorrowed: number
  activeLoans: number
  overdueLoans: number
  returnedLoans: number
}

interface Props {
  profile: Profile
  stats: Stats
}

export default function ProfileClient({ profile, stats }: Props) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSave() {
    if (!fullName.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', profile.id)
    if (error) { toast.error('Failed to save'); setSaving(false); return }
    toast.success('Profile updated!')
    setSaving(false)
    router.refresh()
  }

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="page-container max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>
        <p className="text-sm text-slate-500">Your account settings</p>
      </div>

      {/* Avatar + role */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-100 dark:shadow-indigo-900">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {profile.full_name ?? 'No name set'}
          </h2>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3.5 h-3.5" />
            {profile.email}
          </p>
          <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
            profile.role === 'admin'
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            <Shield className="w-3 h-3" />
            {profile.role === 'admin' ? 'Admin' : 'User'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Borrowed', value: stats.totalBorrowed, icon: ArrowDownToLine, color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Active Loans', value: stats.activeLoans, icon: History, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Returned', value: stats.returnedLoans, icon: RotateCcw, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Overdue', value: stats.overdueLoans, icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit name */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Edit Profile</h3>
        <div>
          <label className="label-base">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="input-base"
          />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Theme */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Appearance</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`py-3 rounded-xl flex flex-col items-center gap-1.5 text-sm font-medium transition-all border ${
                theme === t
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t === 'light' ? <Sun className="w-4 h-4" /> : t === 'dark' ? <Moon className="w-4 h-4" /> : <span className="text-base">⚙️</span>}
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-rose-600 dark:text-rose-400 font-medium border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
      >
        {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        Sign Out
      </button>
    </div>
  )
}
