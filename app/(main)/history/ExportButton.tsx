'use client'

import { useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'

type Preset = 'last_month' | 'this_month' | 'last_3months' | 'custom'

function getPresetDates(preset: Preset): { from: string; to: string } {
  const now  = new Date()
  const yyyy = now.getFullYear()
  const mm   = now.getMonth() // 0-indexed

  if (preset === 'last_month') {
    const first = new Date(yyyy, mm - 1, 1)
    const last  = new Date(yyyy, mm, 0)
    return { from: fmt(first), to: fmt(last) }
  }
  if (preset === 'this_month') {
    const first = new Date(yyyy, mm, 1)
    const last  = new Date(yyyy, mm + 1, 0)
    return { from: fmt(first), to: fmt(last) }
  }
  if (preset === 'last_3months') {
    const first = new Date(yyyy, mm - 3, 1)
    const last  = new Date(yyyy, mm + 1, 0)
    return { from: fmt(first), to: fmt(last) }
  }
  return { from: fmt(new Date(yyyy, mm - 1, 1)), to: fmt(new Date()) }
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'last_month',   label: 'เดือนที่แล้ว' },
  { value: 'this_month',   label: 'เดือนนี้' },
  { value: 'last_3months', label: '3 เดือนที่แล้ว' },
  { value: 'custom',       label: 'กำหนดเอง' },
]

export default function ExportButton() {
  const [open, setOpen]     = useState(false)
  const [preset, setPreset] = useState<Preset>('last_month')
  const [custom, setCustom] = useState(() => getPresetDates('last_month'))

  const dates = preset === 'custom' ? custom : getPresetDates(preset)

  function download() {
    const url = `/api/export/loans?from=${dates.from}&to=${dates.to}`
    const a   = document.createElement('a')
    a.href    = url
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl
          bg-indigo-50 text-indigo-700 hover:bg-indigo-100
          dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50
          transition-colors"
      >
        <Download className="w-4 h-4" />
        Export CSV
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 w-72 card shadow-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Export ข้อมูลการยืม
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => {
                    setPreset(p.value)
                    if (p.value !== 'custom') setCustom(getPresetDates(p.value))
                  }}
                  className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
                    preset === p.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="space-y-2">
                <label className="block">
                  <span className="text-xs text-slate-500">จาก</span>
                  <input
                    type="date"
                    value={custom.from}
                    onChange={e => setCustom(v => ({ ...v, from: e.target.value }))}
                    className="input-base mt-1 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">ถึง</span>
                  <input
                    type="date"
                    value={custom.to}
                    onChange={e => setCustom(v => ({ ...v, to: e.target.value }))}
                    className="input-base mt-1 text-sm"
                  />
                </label>
              </div>
            )}

            <div className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1.5">
              {dates.from} → {dates.to}
            </div>

            <button
              onClick={download}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลด CSV
            </button>
          </div>
        </>
      )}
    </div>
  )
}
