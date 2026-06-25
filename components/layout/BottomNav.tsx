'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, History, User, QrCode } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/equipment', icon: Package, label: 'Equipment' },
  { href: '/scan', icon: QrCode, label: 'Scan' },
  { href: '/history', icon: History, label: 'History' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 pb-safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            const isScan = href === '/scan'

            if (isScan) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative -mt-6 flex flex-col items-center"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                    isActive
                      ? 'gradient-bg shadow-indigo-200 dark:shadow-indigo-900 scale-110'
                      : 'bg-gradient-to-br from-indigo-500 to-teal-500 shadow-slate-200 dark:shadow-slate-900'
                  }`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</span>
                </Link>
              )
            }

            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors min-w-[52px]"
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`} />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
