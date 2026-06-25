'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Package, Tag, Clock, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { Equipment } from '@/lib/types'
import StatusBadge from './StatusBadge'

interface EquipmentCardProps {
  equipment: Equipment
  index?: number
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export default function EquipmentCard({ equipment, index = 0 }: EquipmentCardProps) {
  const router = useRouter()
  const loan = equipment.active_loan
  const isOverdue = loan && new Date(loan.due_date) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => router.push(`/equipment/${equipment.id}`)}
      className="card-hover group"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] rounded-t-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        {equipment.image_url ? (
          <Image
            src={equipment.image_url}
            alt={equipment.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </div>
        )}
        <div className="absolute top-2.5 right-2.5">
          <StatusBadge status={equipment.status} size="sm" />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2 text-sm">
          {equipment.name}
        </h3>

        {equipment.serial_no && (
          <p className="text-xs text-slate-400 font-mono">SN: {equipment.serial_no}</p>
        )}

        {equipment.category && (
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Tag className="w-3 h-3" />
            {equipment.category.name}
          </div>
        )}

        {/* Borrowed: show borrower + due date */}
        {loan && (
          <div className={`pt-1.5 border-t space-y-1 ${
            isOverdue
              ? 'border-rose-200 dark:border-rose-800'
              : 'border-slate-100 dark:border-slate-700'
          }`}>
            {loan.borrower_name && (
              <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{loan.borrower_name}</span>
              </div>
            )}
            <div className={`flex items-center gap-1 text-xs font-medium ${
              isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              <Clock className="w-3 h-3 flex-shrink-0" />
              {isOverdue ? 'เกินกำหนด ' : 'คืน '}{fmtDate(loan.due_date)}
            </div>
          </div>
        )}

        {/* Available */}
        {equipment.status === 'available' && (
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ ว่าง พร้อมยืม</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
