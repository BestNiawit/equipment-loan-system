'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import {
  Search, ArrowDownToLine, ClipboardList, RotateCcw, Camera, CheckCircle2,
  QrCode, Package, ShieldCheck, Download,
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const tabs = [
  { id: 'borrow', label: 'วิธียืม', icon: ArrowDownToLine },
  { id: 'return', label: 'วิธีคืน', icon: RotateCcw },
  { id: 'ios', label: 'iOS Setup', icon: ShieldCheck },
] as const

type Tab = typeof tabs[number]['id']

const borrowSteps = [
  {
    icon: Search,
    title: 'ค้นหาอุปกรณ์',
    desc: 'ไปที่หน้า Equipment แล้วค้นหาชื่อหรือเลข Serial ของอุปกรณ์ที่ต้องการ',
    sub: 'หรือใช้ Scan QR บนป้ายอุปกรณ์เพื่อเปิดหน้ารายละเอียดทันที',
  },
  {
    icon: Package,
    title: 'ตรวจสอบสถานะ Available',
    desc: 'อุปกรณ์ต้องมีป้ายสีเขียว "Available" ถึงจะยืมได้',
    sub: 'หากแสดง "Borrowed" หรือ "Overdue" แสดงว่ายังถูกยืมอยู่',
  },
  {
    icon: ArrowDownToLine,
    title: 'กดปุ่ม Borrow',
    desc: 'กรอกข้อมูล: ชื่อผู้ยืม, เบอร์โทรติดต่อ, วันกำหนดคืน',
    sub: 'กดยืนยัน — ระบบจะบันทึกและแจ้งเตือน Discord อัตโนมัติ',
  },
]

const returnSteps = [
  {
    icon: QrCode,
    title: 'เปิดหน้าอุปกรณ์',
    desc: 'ไปที่หน้า Equipment และเลือกอุปกรณ์ที่ต้องการคืน',
    sub: 'หรือสแกน QR บนตัวอุปกรณ์เพื่อเปิดหน้ารายละเอียดทันที',
  },
  {
    icon: Camera,
    title: 'ถ่ายรูปสภาพอุปกรณ์',
    desc: 'กดปุ่ม Return แล้วถ่ายรูปอุปกรณ์ก่อนคืน (ถ่ายหรือไม่ก็ได้)',
    sub: 'รูปจะถูกบันทึกไว้เป็นหลักฐานสภาพก่อนคืน',
  },
  {
    icon: ClipboardList,
    title: 'เลือกสภาพและยืนยัน',
    desc: 'เลือกสภาพอุปกรณ์หลังคืน: Good / Damaged / Needs Maintenance',
    sub: 'กด Confirm Return — สถานะจะเปลี่ยนเป็น Available ทันที',
  },
  {
    icon: CheckCircle2,
    title: 'เสร็จสิ้น',
    desc: 'ประวัติการยืม-คืนจะถูกบันทึกในหน้า History',
    sub: 'Admin สามารถ Export เป็น CSV เพื่อรายงานได้',
  },
]

const iosInstallSteps = [
  {
    title: 'ติดตั้ง Profile',
    desc: 'เปิดไฟล์ที่โหลด → กด Allow → ไปที่ Settings → General → VPN & Device Management',
    detail: 'กด "Caddy Local Authority" → Install → ใส่ Passcode → Install',
  },
  {
    title: 'เปิดความเชื่อถือ Certificate',
    desc: 'ไปที่ Settings → General → About → Certificate Trust Settings',
    detail: 'เปิด Toggle ของ "Caddy Local Authority" → Continue',
  },
  {
    title: 'ใช้งานได้แล้ว',
    desc: 'กลับมาเปิดแอปใหม่ — กล้องและ QR Scanner ทำงานได้ปกติ',
    detail: 'ทำครั้งเดียวต่ออุปกรณ์ ไม่ต้องทำซ้ำ',
  },
]

export default function HelpModal({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('borrow')

  const steps = tab === 'borrow' ? borrowSteps : returnSteps
  const stepColor = tab === 'borrow' ? 'indigo' : 'amber'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="วิธีใช้งาน" size="md">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* iOS Setup tab */}
      {tab === 'ios' ? (
        <div className="space-y-3">
          {/* Why banner */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-semibold">ทำไมต้องติดตั้ง?</span>
              {' '}iOS บังคับให้ใช้ HTTPS ก่อนเปิดกล้อง — แอปใช้ Certificate ภายในเครือข่าย ต้องติดตั้งครั้งเดียวต่ออุปกรณ์
            </p>
          </div>

          {/* Step 1 — download button */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <div className="w-px flex-1 min-h-[10px] bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="pb-1 min-w-0 w-full">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">โหลด Certificate</p>
              <a
                href={`http://${typeof window !== 'undefined' ? window.location.hostname : 'mac-mini.local'}/caddy-root-ca.crt`}
                download="caddy-root-ca.crt"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Certificate
              </a>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">กดปุ่มด้านบน — iOS จะถาม "Allow" ให้กด Allow</p>
            </div>
          </div>

          {/* Steps 2–4 */}
          <ol className="space-y-3">
            {iosInstallSteps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 2}
                  </div>
                  {i < iosInstallSteps.length - 1 && (
                    <div className="w-px flex-1 min-h-[10px] bg-slate-200 dark:bg-slate-700" />
                  )}
                </div>
                <div className="pb-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{step.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{step.desc}</p>
                  {step.detail && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mt-1">{step.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Android / PC:</span>
              {' '}ไม่ต้องทำขั้นตอนนี้ — เข้าใช้งานได้เลย
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Borrow / Return Steps */}
          <ol className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <li key={i} className="flex gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      stepColor === 'indigo'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-px flex-1 min-h-[12px] bg-slate-200 dark:bg-slate-700" />
                    )}
                  </div>

                  <div className="pb-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                        stepColor === 'indigo'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      }`}>{i + 1}</span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{step.title}</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{step.desc}</p>
                    {step.sub && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{step.sub}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

          {/* Tips */}
          <div className="mt-5 space-y-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">💡 เคล็ดลับ:</span>
                {' '}ไม่จำเป็นต้อง Login ก็ยืม-คืนได้ — แค่กรอกชื่อและเบอร์ติดต่อก็พอ
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">📱 ใช้ iPhone?</span>
                {' '}ต้องติดตั้ง Certificate ก่อน 1 ครั้ง — ดูวิธีที่ tab{' '}
                <button
                  onClick={() => setTab('ios')}
                  className="underline font-semibold"
                >
                  iOS Setup
                </button>
              </p>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
