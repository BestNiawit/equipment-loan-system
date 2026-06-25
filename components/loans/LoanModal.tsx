'use client'

import { useState } from 'react'
import { CalendarDays, User, Phone, StickyNote, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import { Equipment } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface LoanModalProps {
  equipment: Equipment
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function LoanModal({ equipment, isOpen, onClose, onSuccess }: LoanModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const defaultDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerContact, setBorrowerContact] = useState('')
  const [dueDate, setDueDate] = useState(defaultDue)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  function handleClose() {
    onClose()
    setBorrowerName('')
    setBorrowerContact('')
    setNote('')
    setDueDate(defaultDue)
  }

  async function handleBorrow() {
    if (!borrowerName.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!dueDate) {
      toast.error('Please select a due date')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: loanError } = await supabase.from('loans').insert({
      equipment_id: equipment.id,
      borrower_id: null,
      borrower_name: borrowerName.trim(),
      borrower_contact: borrowerContact.trim() || null,
      borrowed_at: new Date().toISOString(),
      due_date: new Date(dueDate + 'T23:59:59').toISOString(),
      note: note.trim() || null,
      status: 'active',
    })

    if (loanError) {
      toast.error('Failed to create loan record')
      setLoading(false)
      return
    }

    const { error: statusError } = await supabase
      .from('equipment')
      .update({ status: 'borrowed', updated_at: new Date().toISOString() })
      .eq('id', equipment.id)

    if (statusError) {
      toast.error('Failed to update equipment status')
      setLoading(false)
      return
    }

    toast.success(`"${equipment.name}" borrowed successfully!`)
    onSuccess()
    handleClose()
    setLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Borrow Equipment">
      <div className="space-y-5">
        {/* Equipment info */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
          <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">Equipment</p>
          <p className="font-semibold text-indigo-900 dark:text-indigo-100">{equipment.name}</p>
          {equipment.serial_no && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">SN: {equipment.serial_no}</p>
          )}
        </div>

        {/* Your name */}
        <div>
          <label className="label-base flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-500" />
            Your Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
            placeholder="e.g. John Smith"
            autoFocus
            className="input-base"
          />
        </div>

        {/* Contact */}
        <div>
          <label className="label-base flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-slate-400" />
            Phone / Email <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={borrowerContact}
            onChange={(e) => setBorrowerContact(e.target.value)}
            placeholder="For contact if overdue"
            className="input-base"
          />
        </div>

        {/* Due date */}
        <div>
          <label className="label-base flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            Due Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={dueDate}
            min={today}
            onChange={(e) => setDueDate(e.target.value)}
            className="input-base"
          />
        </div>

        {/* Note */}
        <div>
          <label className="label-base flex items-center gap-1.5">
            <StickyNote className="w-4 h-4 text-slate-400" />
            Note <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Purpose, what's included..."
            rows={3}
            className="input-base resize-none"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={handleClose} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={handleBorrow} disabled={loading} className="flex-1 btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Borrow'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
