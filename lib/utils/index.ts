import { EquipmentStatus, LoanStatus } from '@/lib/types'

export function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isOverdue(dueDate: string, returnedAt: string | null): boolean {
  if (returnedAt) return false
  return new Date(dueDate) < new Date()
}

export function getDaysOverdue(dueDate: string): number {
  const now = new Date()
  const due = new Date(dueDate)
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export function getDaysUntilDue(dueDate: string): number {
  const now = new Date()
  const due = new Date(dueDate)
  const diff = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export const statusConfig: Record<
  EquipmentStatus,
  { label: string; color: string; bg: string; border: string; darkBg: string; darkText: string; darkBorder: string }
> = {
  available: {
    label: 'Available',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    darkBg: 'dark:bg-emerald-900/30',
    darkText: 'dark:text-emerald-400',
    darkBorder: 'dark:border-emerald-800',
  },
  borrowed: {
    label: 'Borrowed',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    darkBg: 'dark:bg-amber-900/30',
    darkText: 'dark:text-amber-400',
    darkBorder: 'dark:border-amber-800',
  },
  overdue: {
    label: 'Overdue',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    darkBg: 'dark:bg-rose-900/30',
    darkText: 'dark:text-rose-400',
    darkBorder: 'dark:border-rose-800',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    darkBg: 'dark:bg-slate-800',
    darkText: 'dark:text-slate-400',
    darkBorder: 'dark:border-slate-700',
  },
}

export const loanStatusConfig: Record<LoanStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-amber-700' },
  returned: { label: 'Returned', color: 'text-emerald-700' },
  overdue: { label: 'Overdue', color: 'text-rose-700' },
}

export const conditionConfig: Record<string, { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: 'text-emerald-600' },
  good: { label: 'Good', color: 'text-teal-600' },
  fair: { label: 'Fair', color: 'text-amber-600' },
  damaged: { label: 'Damaged', color: 'text-rose-600' },
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getEquipmentQRValue(equipmentId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/equipment/${equipmentId}`
  }
  return `/equipment/${equipmentId}`
}
