'use client'

import { useRef } from 'react'
import { Download, Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Modal from '@/components/ui/Modal'
import { Equipment } from '@/lib/types'

interface QRCodeModalProps {
  equipment: Equipment
  isOpen: boolean
  onClose: () => void
}

export default function QRCodeModal({ equipment, isOpen, onClose }: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrValue = typeof window !== 'undefined'
    ? `${window.location.origin}/equipment/${equipment.id}`
    : `/equipment/${equipment.id}`

  function handlePrint() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const qrSVG = qrRef.current?.querySelector('svg')?.outerHTML || ''
    printWindow.document.write(`
      <html><head><title>QR Code - ${equipment.name}</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }
        h2 { margin: 16px 0 4px; font-size: 18px; }
        p { color: #666; margin: 0 0 8px; font-size: 12px; }
        svg { width: 200px; height: 200px; }
      </style></head>
      <body>${qrSVG}<h2>${equipment.name}</h2><p>${equipment.serial_no ?? ''}</p></body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  function handleDownload() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${equipment.name.replace(/\s+/g, '-')}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code" size="sm">
      <div className="flex flex-col items-center gap-5">
        <div
          ref={qrRef}
          className="p-5 bg-white rounded-2xl border border-slate-100 shadow-inner"
        >
          <QRCodeSVG
            value={qrValue}
            size={180}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: '/icons/icon-192.png',
              height: 36,
              width: 36,
              excavate: true,
            }}
          />
        </div>

        <div className="text-center">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{equipment.name}</p>
          {equipment.serial_no && (
            <p className="text-sm text-slate-500 font-mono mt-0.5">{equipment.serial_no}</p>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 font-mono break-all">
          {qrValue}
        </p>

        <div className="flex gap-3 w-full">
          <button onClick={handleDownload} className="flex-1 btn-secondary text-sm py-2.5">
            <Download className="w-4 h-4" />
            Download SVG
          </button>
          <button onClick={handlePrint} className="flex-1 btn-primary text-sm py-2.5">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </Modal>
  )
}
