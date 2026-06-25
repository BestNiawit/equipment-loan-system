'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Camera, Upload, X, Plus, Loader2, Tag, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Category, Equipment } from '@/lib/types'

interface EquipmentFormProps {
  categories: Category[]
  userId: string
  existing?: Equipment
}

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'maintenance', label: 'Maintenance' },
] as const

export default function EquipmentForm({ categories, userId, existing }: EquipmentFormProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(existing?.name ?? '')
  const [serialNo, setSerialNo] = useState(existing?.serial_no ?? '')
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [status, setStatus] = useState<'available' | 'maintenance'>(
    existing?.status === 'maintenance' ? 'maintenance' : 'available'
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(existing?.image_url ?? null)
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [allCategories, setAllCategories] = useState<Category[]>(categories)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}) }
  }, [])

  async function startScan() {
    setScanning(true)
    await new Promise(r => setTimeout(r, 100))
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
      ]
      const scanner = new Html5Qrcode('serial-scanner-div', { formatsToSupport, verbose: false })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 120 } },
        (decoded) => {
          scanner.stop().catch(() => {})
          scannerRef.current = null
          setScanning(false)
          setSerialNo(decoded)
          toast.success('Scanned: ' + decoded)
        },
        () => {}
      )
    } catch {
      toast.error('Cannot access camera')
      setScanning(false)
    }
  }

  async function stopScan() {
    await scannerRef.current?.stop().catch(() => {})
    scannerRef.current = null
    setScanning(false)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategory.trim() })
      .select()
      .single()
    if (error) {
      toast.error('Category already exists or failed to create')
      return
    }
    setAllCategories([...allCategories, data])
    setCategoryId(data.id)
    setNewCategory('')
    setShowNewCategory(false)
    toast.success('Category added')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Equipment name is required')
      return
    }

    setLoading(true)
    const supabase = createClient()
    let imageUrl = existing?.image_url ?? null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filePath = `${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('equipment-images')
        .upload(filePath, imageFile, { upsert: true })

      if (uploadError) {
        toast.error('Failed to upload image')
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('equipment-images')
        .getPublicUrl(filePath)
      imageUrl = publicUrl
    }

    const payload = {
      name: name.trim(),
      serial_no: serialNo.trim() || null,
      category_id: categoryId || null,
      description: description.trim() || null,
      status,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error } = await supabase.from('equipment').update(payload).eq('id', existing.id)
      if (error) { toast.error('Failed to update'); setLoading(false); return }
      toast.success('Equipment updated!')
      router.push(`/equipment/${existing.id}`)
    } else {
      const { data, error } = await supabase
        .from('equipment')
        .insert({ ...payload, created_by: userId })
        .select()
        .single()
      if (error) { toast.error('Failed to add equipment'); setLoading(false); return }
      toast.success('Equipment added!')
      router.push(`/equipment/${data.id}`)
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Image upload */}
      <div>
        <label className="label-base">Photo</label>
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative w-full aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
            imagePreview
              ? 'border-transparent'
              : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50 dark:bg-slate-800/50'
          }`}
        >
          {imagePreview ? (
            <>
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null) }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 gap-2">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Upload photo</p>
                <p className="text-xs text-slate-400 mt-0.5">or take one with camera</p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Name */}
      <div>
        <label className="label-base">Equipment Name <span className="text-rose-500">*</span></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. MacBook Pro 14-inch"
          className="input-base"
        />
      </div>

      {/* Serial Number */}
      <div>
        <label className="label-base">Serial Number / Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={serialNo}
            onChange={(e) => setSerialNo(e.target.value)}
            placeholder="e.g. SN12345678"
            className="input-base font-mono flex-1"
          />
          <button
            type="button"
            onClick={scanning ? stopScan : startScan}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 rounded-xl border text-sm font-medium transition-all ${
              scanning
                ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400'
                : 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            {scanning ? 'Stop' : 'Scan'}
          </button>
        </div>

        {/* Inline scanner */}
        {scanning && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-800 bg-black relative">
            <div id="serial-scanner-div" className="w-full" />
            <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/70">
              ส่องกล้องที่ QR code หรือ barcode
            </p>
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="label-base flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          Category
        </label>
        <div className="flex gap-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input-base flex-1"
          >
            <option value="">No category</option>
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewCategory(!showNewCategory)}
            className="btn-secondary px-3 py-2"
            title="Add new category"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {showNewCategory && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
              className="input-base flex-1 text-sm"
            />
            <button type="button" onClick={handleAddCategory} className="btn-primary px-4 text-sm">Add</button>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="label-base">Description / Contents</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's included? (cables, adapters, case, etc.)"
          rows={3}
          className="input-base resize-none"
        />
      </div>

      {/* Status */}
      <div>
        <label className="label-base">Initial Status</label>
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                status === opt.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn-primary"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : existing ? 'Save Changes' : 'Add Equipment'}
        </button>
      </div>
    </form>
  )
}
