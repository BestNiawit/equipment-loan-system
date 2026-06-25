# EquipVault — ระบบยืม-คืนอุปกรณ์

Next.js + Supabase self-hosted · Deploy ด้วย Docker Compose บน Mac Mini

> **ต้องการ:** Docker Desktop, Node.js 18+, Git

---

## การใช้งาน

### หน้าหลัก

| หน้า | คืออะไร |
| --- | --- |
| **Dashboard** | สรุปภาพรวม — อุปกรณ์ทั้งหมด, กำลังถูกยืม, เกินกำหนด |
| **Equipment** | รายการอุปกรณ์ทั้งหมด — ค้นหา, กรองสถานะ/หมวดหมู่ |
| **Scan QR** | สแกน QR หรือพิมพ์ชื่อ/serial ค้นหาก็ได้ ไม่จำเป็นต้องสแกน |
| **History** | ประวัติการยืม-คืนทั้งหมด |
| **Profile** | ข้อมูลบัญชี |

### ผู้ใช้ทั่วไป (ไม่ต้อง login)

- **ยืม** — เลือกอุปกรณ์ที่สถานะ Available → กด Borrow → กรอกชื่อ, เบอร์, วันกำหนดคืน
- **คืน** — เปิดอุปกรณ์ที่ยืมอยู่ → กด Return → ถ่ายรูปสภาพ (optional) → เลือก condition → Confirm
- **หาอุปกรณ์** — สแกน QR บนตัวอุปกรณ์ หรือค้นหาชื่อในหน้า Scan / Equipment

### Admin (เพิ่มเติมจาก user ทั่วไป)

- เพิ่ม / แก้ไข / ลบอุปกรณ์
- Export ประวัติเป็น CSV (กรองช่วงวันที่ได้)
- ดูประวัติของทุกคน

### Discord Notification

ส่ง 2 กรณี:

**ยืม** — embed "📦 มีการยืมอุปกรณ์" มี:

- ชื่ออุปกรณ์ + Serial No
- ชื่อผู้ยืม + เบอร์ติดต่อ
- วันกำหนดคืน
- หมายเหตุ (ถ้ามี)

**คืน** — embed "🔄 คืนอุปกรณ์แล้ว" มี:

- ชื่ออุปกรณ์ + Serial No
- ชื่อผู้ยืม + เบอร์ติดต่อ
- วันกำหนดคืน
- หมายเหตุ (ถ้ามี)

- ชื่ออุปกรณ์ + Serial No
- ชื่อผู้คืน + เบอร์ติดต่อ
- สภาพอุปกรณ์หลังคืน (Excellent / Good / Fair / Damaged)
- หมายเหตุ (ถ้ามี)

> ถ้า Discord ล่ม การยืม-คืนยังสำเร็จตามปกติ — notification เป็น best-effort

---

## Deploy

```bash
git clone <repo-url>
cd equipment-loan-system
```

### 1. ตั้ง hostname

```bash
cp .env.example .env
```

หา hostname: System Settings → General → Sharing → Local Hostname แล้วใส่ใน `.env`:

```env
CADDY_HOST=Johns-Mac-mini.local
```

### 2. รัน stack

```bash
npm run docker:reset   # build + start ทุก service (~5 นาทีครั้งแรก)
npm run docker:setup   # apply migrations + enable pg_cron
```

เข้าแอปได้ที่ `https://<CADDY_HOST>`

### 3. สร้าง Admin คนแรก

เปิดแอป → Create account → เลือก Role: **Admin**

### 4. iPhone/iPad — ติดตั้ง Certificate (ทำครั้งเดียวต่ออุปกรณ์)

iOS ต้องการ HTTPS จึงจะใช้กล้อง QR ได้  
เปิดแอปในมือถือ → กดปุ่ม **?** มุมขวาบน → **iOS Setup** → **Download Certificate** แล้วทำตามขั้นตอน

### 5. Discord (optional)

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

เพิ่มใน `.env` แล้ว restart:

```bash
docker compose up -d web
```

---

## อัปเดต App

```bash
git pull
npm run docker:rebuild
```

---

## Commands

```bash
npm run docker:reset    # ล้าง data ทั้งหมด + rebuild (ใช้ตอน deploy ครั้งแรก)
npm run docker:setup    # apply migrations (ใช้หลัง reset)
npm run docker:rebuild  # rebuild เฉพาะ web container (ใช้ตอน update โค้ด)
npm run docker:up       # start containers โดยไม่ rebuild
npm run docker:down     # stop containers
npm run docker:logs     # ดู logs ทุก service
```

pgweb (ดู DB ตรงๆ): `http://<mac-mini-ip>:5555`

---

## Troubleshooting

| ปัญหา | วิธีแก้ |
| --- | --- |
| App ไม่ขึ้น / มี error ตอน start | `npm run docker:reset` แล้วลองใหม่ |
| `relation "profiles" does not exist` | `npm run docker:setup` |
| กล้อง iOS ไม่ทำงาน | ยังไม่ได้ติดตั้ง cert — ดู Step 4 |
| overdue ไม่อัปเดตอัตโนมัติ | ตรวจ pg_cron ใน pgweb: `SELECT * FROM cron.job;` |
