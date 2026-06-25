import QRScannerClient from './QRScannerClient'

export default function ScanPage() {
  return (
    <div className="page-container max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Scan QR Code</h1>
        <p className="text-sm text-slate-500">Point your camera at an equipment QR code</p>
      </div>
      <QRScannerClient />
    </div>
  )
}
