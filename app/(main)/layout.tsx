export const runtime = 'edge'

import { createClient } from '@/lib/supabase/server'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // No auth redirect — public app
  // TopBar/BottomNav check login state themselves for admin features
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <TopBar />
      <main className="min-h-[calc(100vh-56px)]">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
