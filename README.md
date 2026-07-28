# 📝 ระบบรับสมัครงานออนไลน์ (HR Recruitment Portal)

ระบบรับสมัครงานออนไลน์ที่ออกแบบมาเพื่อความสะดวกสบายของผู้สมัครผ่านมือถือ (Mobile-First) พร้อมระบบจัดการหลังบ้าน (Admin Dashboard) สำหรับฝ่ายบุคคล (HR) บน Desktop, ระบบยืนยันตัวตนด้วย **JWT**, ระบบ **Caching Layer** และการแจ้งเตือนผ่าน **LINE Messaging API** ทันทีที่มีผู้สมัครใหม่

---

## ✨ ฟีเจอร์หลัก (Key Features)

### 1. ฝั่งผู้สมัคร (Frontend Applicant Form)
- **ฟอร์มกรอกข้อมูล 2 ขั้นตอน (Multi-step Form):** แยกข้อมูลส่วนตัวและข้อมูลครอบครัวออกจากกันเพื่อความง่ายในการกรอก
- **บันทึกแบบร่างอัตโนมัติ (LocalStorage Draft):** บันทึกข้อมูลค้างไว้แบบเรียลไทม์ หากเน็ตหลุด รีเฟรช หรือเปิดใหม่ ข้อมูลจะไม่หาย พร้อมปุ่มกด "ล้างแบบร่าง"
- **ระบบค้นหาข้อมูลจากบัตรประชาชน (Smart Autofill):** ดึงข้อมูลเก่ามาแสดงและอัปเดตให้อัตโนมัติเมื่อกรอกเลขบัตร ปชช. ครบ 13 หลัก
- **Mobile-First & Premium Design:** ออกแบบด้วย Ant Design + Custom Theme สวยงามน่าใช้งาน

### 2. ฝั่งแอดมิน (Admin Dashboard & Security)
- **ระบบเข้าสู่ระบบด้วย JWT & Bcrypt:** ตาราง Admin ใน DB บันทึกพาสเวิร์ดแบบเข้ารหัส Bcrypt พร้อมออก JWT Bearer Token ล็อกอินปลอดภัย
- **Protected Routes & Token Middleware:** ดักจับและป้องกัน API หลังบ้าน ไม่ให้ผู้ไม่มีสิทธิ์แอบดึงข้อมูลรายชื่อผู้สมัคร
- **ตารางจัดการข้อมูล:** แสดงรายชื่อผู้สมัครทั้งหมด พร้อมระบบแบ่งหน้า, ตัวกรองตามช่วงเวลา (วัน/สัปดาห์/เดือน/ปี), ค้นหาข้อความ และตัวกรองสถานะ LINE
- **แก้ไขข้อมูลผู้สมัคร:** แอดมินสามารถเปิด Drawer แก้ไขรายละเอียดของผู้สมัครแต่ละคนได้แบบเรียลไทม์
- **ระบบแจ้งเตือนผ่าน LINE (LINE Messaging API):** ปุ่มกด "ส่งเข้า Line" สรุปข้อมูลผู้สมัครส่งตรงเข้ากลุ่ม LINE ของทีม HR ทันที พร้อมแสดงโควต้าข้อความคงเหลือ

### 3. ประสิทธิภาพและความปลอดภัย (Performance & Security)
- **In-Memory & Session Caching Layer:** แคชการดึงข้อมูลเพื่อลดการยิง Query หา PostgreSQL Database จาก 100% เหลือไม่ถึง 10%
- **Go Fiber Recover & Rate Limiting:** ป้องกัน Server ลุ่มจาก Panic และป้องกันการยิงสแปมฟอร์มหรือสุ่มรหัสผ่านด้วย Rate Limiter
- **CORS Protection:** กำหนด Origin อนุญาตการเข้าถึงเฉพาะโดเมนที่ได้รับอนุญาต

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

**Frontend (หน้าบ้าน):**
- React 18 (Vite) + TypeScript
- Ant Design 5 (UI Library หลัก)
- React Router DOM 6 (Client-side SPA Routing)
- LocalStorage / SessionStorage Caching

**Backend (หลังบ้าน):**
- Go (Golang 1.25)
- Go Fiber v2 (Web Framework ความเร็วสูง)
- GORM (ORM จัดการ Database) + Bcrypt & JWT v5
- Thread-safe In-Memory TTL Cache

**Database & Cloud Deployment:**
- **Database**: PostgreSQL (Supabase Free Tier)
- **Backend Hosting**: Render.com (Go Native Web Service)
- **Frontend Hosting**: Vercel (Vite SPA Production Build)

---

## 🚀 วิธีการตั้งค่า Environment Variables (`.env`)

สร้างไฟล์ `backend/.env`:
```env
DB_HOST=aws-0-ap-northeast-1.pooler.supabase.com
DB_USER=postgres.xxxxxxxx
DB_PASSWORD=รหัสผ่าน_Supabase
DB_NAME=postgres
DB_PORT=6543
DB_SSLMODE=require
LINE_CHANNEL_ACCESS_TOKEN=ใส่_Token_ของบอท_ที่นี่
LINE_GROUP_ID=ใส่_Group_ID_หรือ_User_ID_ที่นี่
JWT_SECRET=รหัสลับสำหรับเซ็นสัญญา_JWT
ALLOWED_ORIGIN=https://your-frontend-domain.vercel.app
```

---

## 📱 โครงสร้างหน้าเว็บ (Routes)
- `/` - หน้าฟอร์มสมัครงานสำหรับผู้สมัคร (Mobile-First)
- `/admin/login` - หน้าเข้าสู่ระบบสำหรับ HR / แอดมิน
- `/admin` - หน้าแดชบอร์ดจัดการข้อมูลผู้สมัครสำหรับ HR (Protected Route)

