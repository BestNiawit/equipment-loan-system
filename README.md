# EquipVault — ระบบยืม-คืนอุปกรณ์

ระบบบริหารจัดการยืม-คืนอุปกรณ์ สำหรับทีม/องค์กรขนาดเล็ก  
สร้างด้วย **Next.js 16 + Supabase** รองรับมือถือ (PWA) และ Dark Mode

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Backend + DB | Supabase (Postgres) |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage |
| Deploy | Cloudflare Pages |

---

## ⚡ Quick Start

### 1. สมัคร Supabase (ฟรี)

1. ไปที่ [supabase.com](https://supabase.com) → Sign Up
2. กด **New Project** ตั้งชื่อโปรเจกต์และรหัสผ่าน Database
3. รอสักครู่ให้โปรเจกต์พร้อมใช้งาน

### 2. รัน SQL Schema

1. ใน Supabase Dashboard → **SQL Editor** → **New Query**
2. คัดลอกเนื้อหาจาก `supabase/schema.sql` ทั้งหมด
3. วางแล้วกด **Run** (Ctrl+Enter)
4. ควรเห็น "Success" ไม่มี error

### 3. เก็บ API Keys

ใน Supabase Dashboard → **Project Settings** → **API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. ติดตั้งและรันโปรเจกต์

```bash
# Clone หรือ copy โฟลเดอร์โปรเจกต์นี้

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ environment
cp .env.example .env.local
```

แก้ไข `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

```bash
# รัน development server
npm run dev
```

เปิด http://localhost:3000 ในเบราว์เซอร์

### 5. สร้างบัญชี Admin

1. เปิดแอป → กด **Create account**
2. กรอก Full Name, Email, Password
3. เลือก Role → **Admin** (สำหรับคนแรก)
4. กด **Create Account**

> **หมายเหตุ:** หากไม่เห็นตัวเลือก Role ในหน้า Register ตรวจสอบว่า trigger `on_auth_user_created` ทำงานถูกต้อง

---

## 📱 PWA (ติดตั้งบนมือถือ)

### Android (Chrome):
1. เปิดเว็บในแอป Chrome
2. แตะเมนู (⋮) → **"Add to Home Screen"**
3. ยืนยัน → แอปปรากฏบนหน้าจอโฮม

### iOS (Safari):
1. เปิดเว็บใน Safari
2. แตะปุ่ม Share (□↑) → **"Add to Home Screen"**
3. ตั้งชื่อ → **Add**

> **สำหรับ PWA จริง:** ให้สร้างไฟล์ PNG จริงแทน placeholder:
> - `/public/icons/icon-192.png` (192×192 px)
> - `/public/icons/icon-512.png` (512×512 px)

---

## 🚀 Deploy ไป Cloudflare Pages

1. Push โค้ดขึ้น GitHub Repository
2. ไปที่ [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
3. เลือก **Pages** → **Connect to Git** → เลือก repo
4. ตั้งค่า Build:
   - **Build command:** `npm run pages:build`
   - **Build output directory:** `.open-next/assets`
5. เพิ่ม Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. กด **Save and Deploy**

---

## 🗂 โครงสร้างโปรเจกต์

```
equipment-loan-system/
├── app/
│   ├── (auth)/              # หน้า Login / Register (ไม่ต้อง auth)
│   │   ├── login/
│   │   └── register/
│   └── (main)/              # หน้าหลัก (ต้อง auth)
│       ├── dashboard/       # แดชบอร์ดสรุป
│       ├── equipment/       # รายการและรายละเอียดอุปกรณ์
│       ├── history/         # ประวัติการยืม-คืน
│       ├── profile/         # โปรไฟล์ผู้ใช้
│       └── scan/            # สแกน QR Code
├── components/
│   ├── ui/                  # Reusable components
│   ├── layout/              # TopBar, BottomNav
│   ├── equipment/           # EquipmentCard, StatusBadge, QRCodeModal, EquipmentForm
│   ├── loans/               # LoanModal, ReturnModal
│   └── dashboard/           # StatsCard, DashboardChart
├── lib/
│   ├── supabase/            # Client + Server Supabase instances
│   ├── types/               # TypeScript types
│   └── utils/               # Utilities, date helpers, status configs
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service Worker
│   └── icons/               # App icons
├── supabase/
│   └── schema.sql           # Database schema + RLS policies
├── open-next.config.ts      # Cloudflare deployment config
└── wrangler.toml            # Cloudflare Pages config
```

---

## 👥 Role Permissions

| Feature | User | Admin |
|---|---|---|
| View equipment | ✅ | ✅ |
| Borrow equipment | ✅ | ✅ |
| Return own loans | ✅ | ✅ |
| Return any loan | ❌ | ✅ |
| Add equipment | ❌ | ✅ |
| Edit equipment | ❌ | ✅ |
| Delete equipment | ❌ | ✅ |
| View all history | ❌ | ✅ |
| View own history | ✅ | ✅ |

---

## 📊 Database Schema

```
profiles        → ข้อมูลผู้ใช้ (extends auth.users)
categories      → หมวดหมู่อุปกรณ์
equipment       → รายการอุปกรณ์
loans           → บันทึกการยืม-คืน (ไม่ลบ, เก็บถาวร)
```

---

## 🎨 Features

- ✅ Mobile-first PWA (เพิ่มลง Home Screen ได้)
- ✅ Dark mode
- ✅ QR Code สำหรับทุกอุปกรณ์ (พิมพ์แปะอุปกรณ์ได้)
- ✅ สแกน QR ด้วยกล้องมือถือ
- ✅ อัปโหลดรูปจากกล้องหรือแกลเลอรี
- ✅ แดชบอร์ด + กราฟสถิติ
- ✅ ค้นหา + กรองตามสถานะ/หมวดหมู่
- ✅ ประวัติการยืม-คืนแบบถาวร
- ✅ แจ้งเตือนอุปกรณ์เกินกำหนด
- ✅ Skeleton loading states
- ✅ Toast notifications

---

## 🔧 การแก้ไขปัญหาที่พบบ่อย

**`relation "profiles" does not exist`**
→ รัน `supabase/schema.sql` ใน SQL Editor อีกครั้ง

**รูปภาพไม่แสดง**
→ ตรวจสอบว่า Bucket `equipment-images` เป็น Public ใน Supabase Storage

**ผู้ใช้ใหม่ไม่มี profile**
→ ตรวจสอบว่า trigger `on_auth_user_created` ถูกสร้างแล้ว (ดูใน Database > Functions)

**กล้องไม่ทำงานบน iOS**
→ ต้องใช้ HTTPS (deploy ขึ้น Vercel ก่อน หรือใช้ ngrok สำหรับ local dev)
