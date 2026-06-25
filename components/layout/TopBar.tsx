'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Moon, Sun, LayoutDashboard, History, User, QrCode, HelpCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import HelpModal from '@/components/HelpModal'

const pageLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/equipment': 'Equipment',
  '/history': 'History',
  '/profile': 'Profile',
  '/scan': 'Scan QR',
}

export default function TopBar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [showHelp, setShowHelp] = useState(false)

  const label = Object.entries(pageLabels).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] ?? 'EquipVault'

  return (
    <>
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: logo (desktop) / page title (mobile) */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 lg:flex">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="hidden lg:block font-bold text-slate-900 dark:text-slate-100 text-lg">EquipVault</span>
          </Link>
          <span className="lg:hidden font-semibold text-slate-900 dark:text-slate-100">{label}</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { href: '/equipment', icon: Package, label: 'Equipment' },
            { href: '/scan', icon: QrCode, label: 'Scan' },
            { href: '/history', icon: History, label: 'History' },
            { href: '/profile', icon: User, label: 'Profile' },
          ].map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right: help + theme toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>

    <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  )
}
