# U-Exam Platform

## Project Overview

U-Exam เป็นแพลตฟอร์มบริหารจัดการสอบและระบบสอบออนไลน์แบบครบวงจร (Enterprise-grade Examination Management Platform) รองรับการสอบสาธารณะ (Certification) และองค์กร

### Key Characteristics
- **Multi-tenant**: แต่ละองค์กร/ผู้จัดสอบมี workspace แยก (Row-Level Security)
- **Multi-mode**: Public Exam Mode / Corporate Mode
- **Multi-question-type**: MC, True/False, Short Answer, Essay, Matching, Ordering, Fill-in-the-blank, Image-based
- **Bilingual**: Thai + English (i18n)

## Tech Stack

| Layer        | Technology                                         |
| ------------ | -------------------------------------------------- |
| Framework    | Next.js 15 (App Router) + React 19                 |
| Language     | TypeScript (strict mode)                            |
| Styling      | TailwindCSS 4 + shadcn/ui                          |
| Database     | PostgreSQL 16 + Prisma ORM                          |
| Cache/Queue  | Redis + BullMQ                                      |
| Auth         | NextAuth.js v5 (OAuth 2.0 Social Login)              |
| Validation   | Zod (shared schemas between client & server)        |
| State        | Zustand (client) + TanStack Query (server)          |
| File Storage | S3-compatible (MinIO / AWS S3)                      |
| Real-time    | Socket.io or Server-Sent Events (SSE)               |
| Rich Text    | Tiptap editor                                       |
| Math         | KaTeX                                               |
| PDF          | Puppeteer / React-PDF                               |
| Charts       | Recharts                                            |
| Payment      | Stripe / Omise                                      |
| Email        | SendGrid / AWS SES                                  |
| Testing      | Vitest + React Testing Library + Playwright          |

## Design System (จาก U-Account)

> ใช้ Design System เดียวกับ U-Account เพื่อให้ UI สอดคล้องกันทั้งระบบ
> รายละเอียดเพิ่มเติมดูที่ `docs/UI-UX.md`

| หัวข้อ | ค่า |
|--------|-----|
| Color Theme | **Red Wine** — Primary: `oklch(0.34 0.13 25)` ≈ #741717 |
| Color Space | OKLCh (modern CSS) |
| Font | **Inter** (sans-serif) + **Geist Mono** (monospace) |
| Icon | **Lucide React** (`lucide-react`) |
| Component | **shadcn/ui** (style: `new-york`, baseColor: `neutral`) |
| Layout | Sidebar (w-64) + Header (h-14) |
| Border Radius | `0.625rem` (10px) base |
| Dark Mode | รองรับ Light/Dark ด้วย `.dark` class |
| Animation | `tw-animate-css` |

## Architecture: Modular Monolith

ใช้สถาปัตยกรรม Modular Monolith — 1 codebase แบ่งเป็น Module ภายในอย่างชัดเจน
สามารถแยก Module ออกเป็น Microservice ได้ในอนาคตเมื่อจำเป็น

### Module Structure

```
src/modules/
├── auth/                # Authentication, RBAC, Multi-tenant
├── question-bank/       # คลังข้อสอบ ทุกประเภท
├── exam-management/     # สร้างชุดสอบ, ตั้งค่า, ตารางสอบ
├── exam-taking/         # ทำข้อสอบ, Timer, Anti-cheat, Auto-save
├── test-center/         # ศูนย์สอบ, ห้อง, ที่นั่ง, อุปกรณ์, บุคลากร
├── registration/        # สมัครสอบ, จองที่นั่ง, Waiting list, Voucher
├── payment/             # ชำระเงิน, ใบเสร็จ, Refund
├── grading/             # ตรวจอัตโนมัติ + อัตนัย, Rubric, Appeal
├── certificate/         # ใบ Certificate, Digital Badge, Verify
├── analytics/           # รายงาน, สถิติ, Item Analysis, Dashboard
├── e-profile/           # โปรไฟล์ผู้สอบ, ผลสอบ, พัฒนาการ, Privacy
├── notification/        # Email, SMS, Push, In-app
└── proctoring/          # Webcam, Screen capture, Live monitoring
```

### Module Communication Rules

- แต่ละ Module export เฉพาะ Public API ผ่าน `index.ts`
- ห้ามเรียก internal function ของ Module อื่นโดยตรง
- ห้าม Circular Dependency (A → B → A)
- Module ที่ต้องการข้อมูลข้าม Module ให้เรียกผ่าน Service layer

### Module Dependency Direction

```
Shared (Auth, DB, Utils)
    ↓
Question Bank, Test Center, Certificate (independent)
    ↓
Exam Management, Registration (depend on above)
    ↓
Exam Taking, Payment (depend on above)
    ↓
Analytics (read-only access to all modules)
```

### e-Profile Module

โปรไฟล์ผู้สอบ — ให้ผู้สอบ (Candidate) ดูข้อมูลและผลสอบของตนเองได้

#### Features
- **ข้อมูลส่วนตัว**: รูปโปรไฟล์, ชื่อ, สถาบัน, ข้อมูลติดต่อ (แก้ไขได้)
- **สรุปผลสอบ (Dashboard)**: จำนวนครั้งที่สอบ, อัตราผ่าน, คะแนนเฉลี่ย
- **ประวัติผลสอบ**: รายการสอบทั้งหมด + คะแนน + สถานะผ่าน/ไม่ผ่าน
- **รายละเอียดคะแนน**: คะแนนรายหมวด, จุดแข็ง/จุดอ่อน, feedback จากผู้ตรวจ
- **กราฟพัฒนาการ**: แนวโน้มคะแนน + เทียบกับค่าเฉลี่ย (Recharts)
- **Certificate & Badge**: ใบรับรองทั้งหมด + ดาวน์โหลด PDF + แชร์ลิงก์ + QR verify
- **ประวัติสมัครสอบ**: สถานะการสมัคร, ใบเสร็จ, Voucher
- **Privacy Control**: ตั้งค่าว่าใครเห็นข้อมูลอะไรบ้าง (public/private)
- **Public Profile URL**: ลิงก์โปรไฟล์สาธารณะ เลือกเปิด/ปิดได้
- **Export**: ดาวน์โหลดผลสอบทั้งหมดเป็น PDF Transcript

#### Module Structure
```
src/modules/e-profile/
├── services/
│   ├── profile.service.ts           # จัดการข้อมูลโปรไฟล์
│   ├── exam-history.service.ts      # ประวัติผลสอบ + คะแนน
│   ├── progress-tracking.service.ts # กราฟพัฒนาการ + สถิติ
│   └── privacy.service.ts          # ตั้งค่าความเป็นส่วนตัว
├── schemas/
├── types/
└── index.ts
```

#### Routes
```
src/app/(candidate)/
├── profile/                  # หน้าโปรไฟล์หลัก
│   ├── page.tsx              # Dashboard สรุปภาพรวม
│   ├── edit/                 # แก้ไขข้อมูลส่วนตัว
│   ├── results/              # ประวัติผลสอบทั้งหมด
│   ├── results/[examId]/     # รายละเอียดผลสอบรายวิชา
│   ├── certificates/         # Certificate & Badge ทั้งหมด
│   ├── registrations/        # ประวัติสมัครสอบ
│   ├── wallet/               # e-Wallet (ถ้าเชื่อมต่อ)
│   └── settings/             # Privacy + Notification settings
src/app/(public)/
└── profile/[username]/       # Public profile page
```

### e-Wallet Integration

U-Exam เชื่อมต่อกับระบบ e-Wallet ภายนอก (Next.js, ระบบแยกต่างหาก) ผ่าน REST API
e-Wallet สามารถแสดงผลการเรียนจากระบบอื่นรวมถึง U-Exam ได้

#### Integration Architecture
- **Protocol**: REST API (JSON) over HTTPS
- **Authentication**: API Key + HMAC-SHA256 Signature
- **Direction**: Bidirectional — U-Exam ↔ e-Wallet ส่งข้อมูลหากันได้

#### Data Flow

1. **U-Exam → e-Wallet (ส่งผลสอบ)**
   - เมื่อผลสอบ confirmed → เรียก e-Wallet webhook ส่งผลสอบ
   - เมื่อออก Certificate → เรียก e-Wallet webhook ส่ง credential
   - ข้อมูล: คะแนน, สถานะผ่าน/ไม่ผ่าน, Certificate, Badge

2. **e-Wallet → U-Exam (ชำระเงิน)**
   - ผู้สอบเลือกชำระค่าสมัครสอบผ่าน e-Wallet balance
   - e-Wallet หักเงิน → callback แจ้ง U-Exam → ยืนยันการสมัคร
   - รองรับ Refund กลับ e-Wallet เมื่อยกเลิก

#### U-Exam API สำหรับ e-Wallet

```
# e-Wallet เรียก U-Exam (ดึงข้อมูลผู้สอบ)
GET  /api/v1/external/students/{id}/results           # ผลสอบทั้งหมด
GET  /api/v1/external/students/{id}/results/{examId}   # ผลสอบรายวิชา
GET  /api/v1/external/students/{id}/certificates       # Certificate ทั้งหมด
GET  /api/v1/external/students/{id}/certificates/{id}/verify  # ตรวจ Cert
GET  /api/v1/external/students/{id}/profile-summary    # สรุปโปรไฟล์
```

#### e-Wallet API ที่ U-Exam เรียก

```
# U-Exam เรียก e-Wallet (ชำระเงิน + ส่งผลสอบ)
POST /api/external/payment/create          # สร้างรายการชำระเงิน
GET  /api/external/payment/{id}/status     # เช็คสถานะ
POST /api/external/payment/{id}/refund     # คืนเงิน
POST /api/external/results                 # ส่งผลสอบ (Webhook)
POST /api/external/credentials             # ส่ง Certificate (Webhook)
```

#### API Security

- **API Key**: แต่ละระบบมี key คู่กัน (U-Exam key + e-Wallet key)
- **HMAC Signature**: `HMAC-SHA256(secret, timestamp + body)` ส่งใน `X-Signature` header
- **Timestamp Validation**: request ต้องมาภายใน 5 นาที ป้องกัน replay attack
- **IP Whitelist**: จำกัด IP ของ server อีกฝั่ง
- **Rate Limiting**: 1000 requests/minute ต่อ API Key
- **Webhook Retry**: retry 3 ครั้ง (exponential backoff) ถ้า endpoint ไม่ตอบ

#### Module Structure
```
src/modules/e-profile/services/
└── ewallet-integration.service.ts   # จัดการการเชื่อมต่อ e-Wallet

src/app/api/v1/external/             # External API สำหรับ e-Wallet
├── students/[id]/results/
├── students/[id]/certificates/
└── students/[id]/profile-summary/

src/app/api/webhooks/
└── ewallet/                         # รับ callback จาก e-Wallet (payment status)
```

#### Configuration
```env
# .env - e-Wallet Integration
EWALLET_API_URL=https://ewallet.example.com/api
EWALLET_API_KEY=ew_key_xxxxx
EWALLET_API_SECRET=ew_secret_xxxxx
EWALLET_WEBHOOK_SECRET=ew_webhook_xxxxx
EWALLET_ENABLED=true
```

## Project Structure

```
src/
├── app/                      # Next.js App Router (routes + pages)
│   ├── (public)/             # Landing, Exam Catalog, Center Directory
│   ├── (auth)/               # Login, Register, SSO
│   ├── (candidate)/          # ผู้สมัคร: e-Profile, ผลสอบ, Certificate, e-Wallet
│   ├── (exam)/               # หน้าทำข้อสอบ (Fullscreen, isolated)
│   ├── (dashboard)/          # Admin/Instructor Dashboard
│   └── api/                  # API Routes + External API (e-Wallet)
│
├── modules/                  # Business Logic แยกตาม Module
│   └── [module-name]/
│       ├── services/         # Business logic
│       ├── schemas/          # Zod validation schemas
│       ├── types/            # TypeScript types
│       └── index.ts          # Public API exports only
│
├── shared/                   # Shared across all modules
│   ├── components/           # UI Components (shadcn/ui based)
│   ├── hooks/                # React hooks
│   ├── lib/                  # Utility libraries (prisma, redis, s3, etc.)
│   ├── types/                # Global TypeScript types
│   └── constants/            # Global constants
│
└── prisma/
    ├── schema/               # Prisma schema files (แยกตาม Module)
    ├── migrations/
    └── seed.ts
```

## User Roles (RBAC)

| Role               | Scope           | Description                              |
| ------------------ | --------------- | ---------------------------------------- |
| `PLATFORM_ADMIN`   | Platform-wide   | จัดการแพลตฟอร์มทั้งหมด, Tenant, Billing |
| `TENANT_OWNER`     | Tenant          | เจ้าของ workspace, จัดการทุกอย่างภายใน    |
| `ADMIN`            | Tenant          | จัดการองค์กร, ตารางสอบ, อนุมัติ            |
| `EXAM_CREATOR`     | Tenant          | สร้างข้อสอบ, จัดสอบ, ตรวจข้อสอบ            |
| `GRADER`           | Tenant + Exam   | ช่วยตรวจข้อสอบอัตนัย, สิทธิ์จำกัด          |
| `PROCTOR`          | Tenant + Session | ผู้คุมสอบ: คุมสอบออนไลน์/onsite           |
| `CENTER_MANAGER`   | Test Center     | ผู้จัดการศูนย์สอบ                          |
| `CENTER_STAFF`     | Test Center     | เจ้าหน้าที่ศูนย์สอบ                        |
| `CANDIDATE`        | Public          | ผู้สมัครสอบ: สมัคร, ทำข้อสอบ, ดูผล         |

## Coding Conventions

### General
- ใช้ TypeScript strict mode เสมอ — ห้าม `any`
- ใช้ Zod schema เป็น single source of truth สำหรับ validation (shared ระหว่าง client & server)
- ตั้งชื่อไฟล์เป็น kebab-case: `exam-session.service.ts`
- ตั้งชื่อ Component เป็น PascalCase: `ExamSessionCard.tsx`
- ตั้งชื่อ function/variable เป็น camelCase
- ตั้งชื่อ constant เป็น UPPER_SNAKE_CASE
- ตั้งชื่อ type/interface เป็น PascalCase
- ตั้งชื่อ database table เป็น PascalCase (Prisma convention)
- ตั้งชื่อ database column เป็น snake_case ใน DB แต่ camelCase ใน Prisma schema

### File Organization
- 1 service file ต่อ 1 domain concept: `question.service.ts`, `exam.service.ts`
- Colocate related files: schema + service + types อยู่ใน module เดียวกัน
- ใช้ barrel exports (`index.ts`) สำหรับ module public API

### API & Data
- ใช้ Server Actions เป็นหลักสำหรับ mutations
- ใช้ API Routes สำหรับ webhooks, external API, file uploads
- ทุก API response ใช้ consistent format: `{ success, data, error, meta }`
- ทุก list endpoint รองรับ pagination: `{ page, limit, total, totalPages }`
- Tenant isolation: ทุก query ต้องมี `tenantId` filter (enforced by middleware)

### Error Handling
- ใช้ custom AppError class ที่มี error code
- ห้าม expose internal error details ให้ client
- Log errors ด้วย structured logging (JSON format)

### Security
- ทุก input ต้องผ่าน Zod validation
- ใช้ parameterized queries เสมอ (Prisma handles this)
- Sanitize rich text content (DOMPurify)
- Rate limiting บน sensitive endpoints (login, register, payment)
- CSRF protection บน mutations
- Content Security Policy (CSP) headers

### Testing
- Unit tests สำหรับ services / utilities
- Integration tests สำหรับ API routes
- E2E tests สำหรับ critical flows (สมัครสอบ, ทำข้อสอบ, ชำระเงิน)
- Test file อยู่ข้าง ๆ source file: `exam.service.ts` → `exam.service.test.ts`

## Development Phases

| Phase | Scope                                       | Status  |
| ----- | ------------------------------------------- | ------- |
| 1     | Foundation: Auth, Multi-tenant, RBAC        | Pending |
| 2     | Question Bank                               | Pending |
| 3     | Exam Builder + Scheduling                   | Pending |
| 4     | Exam Taking + Anti-cheat                    | Pending |
| 5     | Grading (Auto + Manual)                     | Pending |
| 6     | Analytics & Reporting                       | Pending |
| 7     | Test Center: Profile + Building + Room      | Pending |
| 8     | Test Center: Seat Layout + Equipment        | Pending |
| 9     | Test Center: Staff Management               | Pending |
| 10    | Exam Catalog + Registration                 | Pending |
| 11    | Seat Booking Engine                         | Pending |
| 12    | Waiting List + Reschedule/Cancel            | Pending |
| 13    | Payment & Billing                           | Pending |
| 14    | Voucher + Check-in System                   | Pending |
| 15    | Test Center: Exam Day Operations            | Pending |
| 16    | Test Center: Approval & Certification       | Pending |
| 17    | Test Center: Analytics & Review             | Pending |
| 18    | e-Profile: โปรไฟล์ผู้สอบ + ผลสอบ + พัฒนาการ  | Pending |
| 19    | e-Wallet Integration: API + Payment + Webhook| Pending |
| 20    | Certificate & Digital Badge                 | Pending |
| 21    | Proctoring                                  | Pending |
| 22    | Integration (OAuth, API, Webhook)           | Pending |

## Related Documentation

> เมื่อทำงานกับ Module ใด ให้อ่านเอกสารที่เกี่ยวข้อง:

| Document                             | Description                           |
| ------------------------------------ | ------------------------------------- |
| `docs/PRD.md`                        | Product Requirements Document ฉบับเต็ม |
| `docs/ARCHITECTURE.md`              | สถาปัตยกรรมระบบ + Diagrams            |
| `docs/DATABASE.md`                   | Database Schema Design (Prisma)       |
| `docs/API.md`                        | API Endpoints Design                  |
| `docs/UI-UX.md`                      | UI/UX Guidelines & Wireframes        |
| `docs/modules/auth.md`              | Auth + RBAC + Multi-tenant Module     |
| `docs/modules/question-bank.md`     | Question Bank Module                  |
| `docs/modules/exam-management.md`   | Exam Management Module                |
| `docs/modules/exam-taking.md`       | Exam Taking Module                    |
| `docs/modules/test-center.md`       | Test Center Module                    |
| `docs/modules/registration.md`      | Registration + Seat Booking Module    |
| `docs/modules/payment.md`           | Payment & Billing Module              |
| `docs/modules/certificate.md`       | Certificate & Digital Badge Module    |
| `docs/modules/analytics.md`         | Analytics & Reporting Module          |
| `docs/modules/e-profile.md`         | e-Profile + ผลสอบ + พัฒนาการ Module   |
| `docs/modules/e-wallet-integration.md` | e-Wallet Integration Design        |
| `docs/development/CONVENTIONS.md`   | Coding Conventions ฉบับละเอียด         |
| `docs/development/SETUP.md`         | วิธี Setup โปรเจกต์                    |
| `docs/development/DEPLOYMENT.md`    | วิธี Deploy                           |

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Lint code
npm run type-check       # TypeScript type checking

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations (dev)
npx prisma studio        # Open Prisma Studio
npx prisma db seed       # Seed database

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Run tests with coverage
```
