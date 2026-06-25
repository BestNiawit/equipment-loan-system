'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownToLine, RotateCcw, QrCode, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Equipment, Loan } from '@/lib/types'
import LoanModal from '@/components/loans/LoanModal'
import ReturnModal from '@/components/loans/ReturnModal'
import QRCodeModal from '@/components/equipment/QRCodeModal'

interface Props {
  equipment: Equipment
  isAdmin: boolean
  activeLoan: Loan | null
}

export default function EquipmentDetailClient({ equipment, isAdmin, activeLoan }: Props) {
  const router = useRouter()
  const [showLoan, setShowLoan] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const canBorrow = equipment.status === 'available'
  const canReturn = equipment.status === 'borrowed' || equipment.status === 'overdue'

  async function handleDelete() {
    if (!confirm(`Delete "${equipment.name}"? This cannot be undone.`)) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('equipment').delete().eq('id', equipment.id)
    if (error) { toast.error('Failed to delete'); setDeleting(false); return }
    toast.success('Equipment deleted')
    router.push('/equipment')
    router.refresh()
  }

  return (
    <>
      <div className="space-y-3">
        {canBorrow && (
          <button onClick={() => setShowLoan(true)} className="w-full btn-primary py-3.5 text-base">
            <ArrowDownToLine className="w-5 h-5" />
            Borrow This Equipment
          </button>
        )}

        {canReturn && activeLoan && (
          <button
            onClick={() => setShowReturn(true)}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl py-3.5 text-base transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Return Equipment
          </button>
        )}

        <div className="flex gap-2">
          <button onClick={() => setShowQR(true)} className="flex-1 btn-secondary py-3">
            <QrCode className="w-4 h-4" />
            QR Code
          </button>
          {isAdmin && (
            <button onClick={handleDelete} disabled={deleting} className="flex-1 btn-danger py-3">
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      <LoanModal
        equipment={equipment}
        isOpen={showLoan}
        onClose={() => setShowLoan(false)}
        onSuccess={() => router.refresh()}
      />

      {activeLoan && (
        <ReturnModal
          equipment={equipment}
          loan={activeLoan}
          isOpen={showReturn}
          onClose={() => setShowReturn(false)}
          onSuccess={() => router.refresh()}
        />
      )}

      <QRCodeModal
        equipment={equipment}
        isOpen={showQR}
        onClose={() => setShowQR(false)}
      />
    </>
  )
}
