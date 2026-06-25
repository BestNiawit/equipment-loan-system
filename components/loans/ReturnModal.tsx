'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Star, Camera, X, ImagePlus, ScanLine, CheckCircle2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import { Equipment, Loan } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface ReturnModalProps {
  equipment: Equipment
  loan: Loan
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const conditions = [
  { value: 'excellent', label: 'Excellent', desc: 'สภาพดีมาก', color: 'emerald' },
  { value: 'good',      label: 'Good',      desc: 'สภาพดี มีรอยนิดหน่อย', color: 'teal' },
  { value: 'fair',      label: 'Fair',      desc: 'สภาพพอใช้', color: 'amber' },
  { value: 'damaged',   label: 'Damaged',   desc: 'เสียหาย ต้องซ่อม', color: 'rose' },
] as const

interface PhotoSlot {
  label: string
  file: File | null
  preview: string | null
}

export default function ReturnModal({ equipment, loan, isOpen, onClose, onSuccess }: ReturnModalProps) {
  const [verified, setVerified]   = useState(false)
  const [scanning, setScanning]   = useState(false)
  const [condition, setCondition] = useState<string>('good')
  const [note, setNote]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [photos, setPhotos]       = useState<[PhotoSlot, PhotoSlot]>([
    { label: 'รูปด้านหน้า', file: null, preview: null },
    { label: 'รูปด้านหลัง', file: null, preview: null },
  ])

  const inputRefs  = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setVerified(false)
      setScanning(false)
      setCondition('good')
      setNote('')
      setPhotos([
        { label: 'รูปด้านหน้า', file: null, preview: null },
        { label: 'รูปด้านหลัง', file: null, preview: null },
      ])
    }
  }, [isOpen])

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}) }
  }, [])

  function isMatchingCode(decoded: string): boolean {
    // Accept: URL containing equipment id OR exact serial_no match
    if (decoded.includes(equipment.id)) return true
    if (equipment.serial_no && decoded.trim() === equipment.serial_no.trim()) return true
    return false
  }

  async function startScan() {
    setScanning(true)
    await new Promise(r => setTimeout(r, 100))
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
      const formats = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
      ]
      const scanner = new Html5Qrcode('return-verify-scanner', { formatsToSupport: formats, verbose: false })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 100 } },
        (decoded) => {
          if (isMatchingCode(decoded)) {
            scanner.stop().catch(() => {})
            scannerRef.current = null
            setScanning(false)
            setVerified(true)
            toast.success('ยืนยันตัวเครื่องสำเร็จ ✓')
          } else {
            // wrong device
            scanner.stop().catch(() => {})
            scannerRef.current = null
            setScanning(false)
            toast.error('QR/Barcode ไม่ตรงกับเครื่องที่ยืม กรุณาสแกนเครื่องนี้')
          }
        },
        () => {}
      )
    } catch {
      toast.error('ไม่สามารถเปิดกล้องได้')
      setScanning(false)
    }
  }

  async function stopScan() {
    await scannerRef.current?.stop().catch(() => {})
    scannerRef.current = null
    setScanning(false)
  }

  function handlePhoto(idx: 0 | 1, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('รูปต้องไม่เกิน 10MB'); return }
    const preview = URL.createObjectURL(file)
    setPhotos(prev => {
      const next = [...prev] as [PhotoSlot, PhotoSlot]
      next[idx] = { ...next[idx], file, preview }
      return next
    })
  }

  function removePhoto(idx: 0 | 1) {
    setPhotos(prev => {
      const next = [...prev] as [PhotoSlot, PhotoSlot]
      next[idx] = { ...next[idx], file: null, preview: null }
      return next
    })
    if (inputRefs[idx].current) inputRefs[idx].current!.value = ''
  }

  async function uploadPhotos(): Promise<string[]> {
    const supabase = createClient()
    const urls: string[] = []
    for (let i = 0; i < 2; i++) {
      const { file } = photos[i]
      if (!file) continue
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `returns/${loan.id}/${i === 0 ? 'front' : 'back'}_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('equipment-images').upload(path, file, { upsert: true })
      if (error) { toast.error(`อัปโหลดรูปที่ ${i + 1} ไม่สำเร็จ`); continue }
      const { data: { publicUrl } } = supabase.storage.from('equipment-images').getPublicUrl(path)
      urls.push(publicUrl)
    }
    return urls
  }

  async function handleReturn() {
    setLoading(true)
    const supabase = createClient()
    const now = new Date().toISOString()
    const imageUrls = await uploadPhotos()

    const { error: loanError } = await supabase.from('loans').update({
      returned_at: now,
      condition_on_return: condition,
      return_images: imageUrls,
      note: note || loan.note,
      status: 'returned',
    }).eq('id', loan.id)

    if (loanError) { toast.error('บันทึกการคืนไม่สำเร็จ'); setLoading(false); return }

    const newStatus = condition === 'damaged' ? 'maintenance' : 'available'
    await supabase.from('equipment').update({ status: newStatus, updated_at: now }).eq('id', equipment.id)

    toast.success(condition === 'damaged'
      ? `"${equipment.name}" คืนแล้ว — ส่งซ่อม`
      : `"${equipment.name}" คืนเรียบร้อย!`)
    onSuccess()
    onClose()
    setLoading(false)
  }

  const borrowerDisplay = loan.borrower_name
    ?? (loan.borrower as { full_name: string | null; email: string } | null)?.full_name
    ?? 'Unknown'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="คืนอุปกรณ์">
      <div className="space-y-5">

        {/* Equipment info */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">กำลังคืน</p>
          <p className="font-semibold text-amber-900 dark:text-amber-100">{equipment.name}</p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">ยืมโดย: <strong>{borrowerDisplay}</strong></p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            {formatDate(loan.borrowed_at)} · กำหนดคืน {formatDate(loan.due_date)}
          </p>
        </div>

        {/* ── STEP 1: Verify by scanning ── */}
        {!verified ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">ยืนยันตัวเครื่องก่อนคืน</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                  สแกน QR code หรือ barcode ของ <strong>{equipment.name}</strong> เพื่อยืนยันว่ามีเครื่องอยู่ในมือ
                </p>
              </div>
            </div>

            {scanning && (
              <div className="rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-800 bg-black relative">
                <div id="return-verify-scanner" className="w-full" />
                <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/70">
                  ส่องกล้องที่ QR / barcode ของเครื่องนี้
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={scanning ? stopScan : startScan}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all ${
                  scanning
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <ScanLine className="w-4 h-4" />
                {scanning ? 'หยุดสแกน' : 'สแกนเพื่อยืนยัน'}
              </button>
            </div>
          </div>

        ) : (
          // ── STEP 2: Verified — show return form ──
          <>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">ยืนยันตัวเครื่องแล้ว</p>
            </div>

            {/* Photos */}
            <div>
              <label className="label-base flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-400" />
                แนบรูปถ่าย
                <span className="text-slate-400 font-normal text-xs">(ไม่บังคับ)</span>
              </label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {photos.map((slot, i) => (
                  <div key={i}>
                    <p className="text-xs text-slate-500 mb-1.5 font-medium">{slot.label}</p>
                    {slot.preview ? (
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slot.preview} alt={slot.label} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i as 0 | 1)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => inputRefs[i].current?.click()}
                        className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-2 transition-colors">
                        <ImagePlus className="w-6 h-6 text-slate-400" />
                        <span className="text-xs text-slate-400">ถ่ายรูป</span>
                      </button>
                    )}
                    <input ref={inputRefs[i]} type="file" accept="image/*" capture="environment"
                      onChange={(e) => handlePhoto(i as 0 | 1, e)} className="hidden" />
                  </div>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="label-base flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400" />
                สภาพอุปกรณ์ <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {conditions.map((c) => (
                  <button key={c.value} type="button" onClick={() => setCondition(c.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      condition === c.value
                        ? `border-${c.color}-400 bg-${c.color}-50 dark:bg-${c.color}-900/20`
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}>
                    <p className={`text-sm font-medium ${condition === c.value ? `text-${c.color}-700 dark:text-${c.color}-400` : 'text-slate-700 dark:text-slate-300'}`}>
                      {c.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="label-base">
                หมายเหตุ <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
              </label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="สภาพเพิ่มเติม, รอยขีดข่วน, อุปกรณ์เสริม..." rows={2}
                className="input-base resize-none" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 btn-secondary" disabled={loading}>ยกเลิก</button>
              <button onClick={handleReturn} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl py-3 transition-all disabled:opacity-60">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ยืนยันการคืน'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
