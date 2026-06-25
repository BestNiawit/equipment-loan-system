'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface StatsCardProps {
  label: string
  value: number
  children: ReactNode
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
  index?: number
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-100 dark:border-indigo-900/50',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-900/50',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-900/50',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    icon: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-100 dark:border-rose-900/50',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-100 dark:border-slate-800',
  },
}

export default function StatsCard({ label, value, children, color, index = 0 }: StatsCardProps) {
  const c = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`rounded-2xl p-5 border ${c.bg} ${c.border} flex items-center gap-4`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.icon}`}>
        {children}
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${c.text}`}>{value}</p>
      </div>
    </motion.div>
  )
}
