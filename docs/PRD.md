# U-Exam Platform — Product Requirements Document (PRD)

> ฉบับเต็ม สรุปคุณสมบัติทั้งหมดของระบบ
> อัปเดตล่าสุด: 2026-03-09

---

## 1. Project Overview

U-Exam เป็นแพลตฟอร์มบริหารจัดการสอบและระบบสอบออนไลน์แบบครบวงจร (Enterprise-grade Examination Management Platform)

### Key Characteristics

| คุณลักษณะ | รายละเอียด |
|-----------|------------|
| Multi-tenant | แต่ละองค์กร/ผู้จัดสอบมี workspace แยก (Row-Level Security) |
| Multi-mode | Public Exam Mode / Corporate Mode |
| Multi-question-type | MC, True/False, Short Answer, Essay, Matching, Ordering, Fill-in-the-blank, Image-based |
| Bilingual | Thai + English (i18n) |
| Architecture | Modular Monolith (Next.js 15) — แยกเป็น Microservice ได้ในอนาคต |
| External Integration | เชื่อมต่อกับ e-Wallet ภายนอกผ่าน REST API |

### Target Users

| บริบท | ผู้ใช้หลัก |
|-------|----------|
| สอบสาธารณะ (Certification) | ผู้จัดสอบ, ผู้สมัครสอบทั่วไป, ผู้จัดการศูนย์สอบ |
| องค์กร/บริษัท | HR, พนักงาน, ผู้ฝึกอบรม |

---

## 2. User Roles (RBAC)

| Role | Scope | Description |
|------|-------|-------------|
| `PLATFORM_ADMIN` | Platform-wide | จัดการแพลตฟอร์มทั้งหมด, Tenant, Billing |
| `TENANT_OWNER` | Tenant | เจ้าของ workspace, จัดการทุกอย่างภายใน |
| `ADMIN` | Tenant | จัดการองค์กร, ตารางสอบ, อนุมัติ |
| `EXAM_CREATOR` | Tenant | สร้างข้อสอบ, จัดสอบ, ตรวจข้อสอบ |
| `GRADER` | Tenant + Exam | ช่วยตรวจข้อสอบอัตนัย, สิทธิ์จำกัด |
| `PROCTOR` | Tenant + Session | ผู้คุมสอบ: คุมสอบออนไลน์/onsite |
| `CENTER_MANAGER` | Test Center | ผู้จัดการศูนย์สอบ |
| `CENTER_STAFF` | Test Center | เจ้าหน้าที่ศูนย์สอบ |
| `CANDIDATE` | Public | ผู้สมัครสอบ: สมัคร, ทำข้อสอบ, ดูผล |

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript (strict mode) |
| Styling | TailwindCSS 4 + shadcn/ui |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queue | Redis + BullMQ |
| Auth | NextAuth.js v5 (OAuth 2.0 Social Login) |
| Validation | Zod (shared schemas between client & server) |
| State | Zustand (client) + TanStack Query (server) |
| File Storage | S3-compatible (MinIO / AWS S3) |
| Real-time | Socket.io or Server-Sent Events (SSE) |
| Rich Text | Tiptap editor |
| Math | KaTeX |
| PDF | Puppeteer / React-PDF |
| Charts | Recharts |
| Payment | Stripe / Omise |
| Email | SendGrid / AWS SES |
| Testing | Vitest + React Testing Library + Playwright |

---

## 4. Module Features (รายละเอียดทั้งหมด)

### Module 1: Auth, RBAC & Multi-Tenant

| Feature | รายละเอียด |
|---------|------------|
| Authentication | Email/Password, OAuth 2.0 Social Login (Google, Facebook, LINE) |
| Multi-tenant | แต่ละองค์กรมี workspace แยก, Row-Level Security (RLS) ใน PostgreSQL |
| RBAC | 9 roles พร้อม permission ละเอียดระดับ action (create/read/update/delete) ต่อ resource |
| Organization Structure | Tenant → แผนก/ฝ่าย → กลุ่มสอบ (โครงสร้างยืดหยุ่นตามองค์กร) |
| User Management | CRUD ผู้ใช้, Bulk import จาก CSV/Excel, กำหนด Role ต่อ Tenant |
| Session Management | JWT token, refresh token, หลาย device, force logout |
| Branding | แต่ละ Tenant ตั้งค่าโลโก้, สี, ชื่อ, Custom domain (White-label) |
| Plan & Quota | จำกัดจำนวนผู้สอบ, ข้อสอบ, storage ตามแพ็กเกจ |

### Module 2: Question Bank (คลังข้อสอบ)

#### ประเภทข้อสอบที่รองรับ

| ประเภท | รายละเอียด |
|--------|------------|
| Multiple Choice | ตัวเลือกเดียว (Single) หรือ หลายตัวเลือก (Multi-select) |
| True / False | ถูก/ผิด พร้อม explanation |
| Short Answer | คำตอบสั้น, รองรับ keyword matching + regex |
| Essay | อัตนัย (เขียนตอบยาว), ตรวจด้วย Rubric |
| Fill-in-the-blank | เติมคำในช่องว่าง, หลายช่องว่างต่อข้อ |
| Matching | จับคู่ข้อความ/รูปภาพ (Drag & Drop) |
| Ordering | เรียงลำดับ (Drag & Drop) |
| Image-based / Hot Spot | คลิกบนรูปภาพเพื่อเลือกคำตอบ |

#### คุณสมบัติคลังข้อสอบ

| Feature | รายละเอียด |
|---------|------------|
| Rich Text Editor | Tiptap editor (Bold, Italic, List, Table, Code Block) |
| Math / Formula | สูตรคณิตศาสตร์ด้วย KaTeX (LaTeX syntax) |
| Media Support | แนบรูปภาพ, Audio, Video ในโจทย์และตัวเลือก |
| Category / Taxonomy | จัดหมวดตาม Topic, Learning Outcome, Bloom's Taxonomy (6 ระดับ) |
| Difficulty Level | Easy / Medium / Hard (ใช้สำหรับสุ่มข้อสอบ) |
| Tag System | ติด Tag อิสระเพื่อค้นหาข้ามหมวด |
| Version Control | ประวัติการแก้ไขทุกครั้ง, กู้คืน version เก่าได้ |
| Import / Export | Import จาก Word, Excel, QTI format / Export เป็น QTI, PDF |
| Duplication Check | ตรวจจับข้อสอบซ้ำ/คล้ายกัน |
| Review Workflow | Draft → Review → Published (สร้าง → ตรวจสอบ → อนุมัติ) |
| Usage Statistics | แสดงสถิติข้อสอบจากการใช้งานจริง (ค่า Difficulty, Discrimination) |

### Module 3: Exam Management (จัดการชุดสอบ)

| Feature | รายละเอียด |
|---------|------------|
| Exam Blueprint | สร้างโครงร่างชุดข้อสอบ กำหนดจำนวนข้อต่อหมวด/ระดับความยาก |
| Manual Selection | เลือกข้อสอบจากคลังด้วยตัวเอง |
| Random Selection | สุ่มข้อสอบอัตโนมัติตามเงื่อนไข (หมวด, ระดับ, จำนวน) |
| Section / Part | แบ่งข้อสอบเป็นส่วน (Part 1: ปรนัย, Part 2: อัตนัย) |
| Score Weighting | กำหนดน้ำหนักคะแนนแต่ละข้อ / แต่ละ Section |
| Shuffle Questions | สลับลำดับข้อสอบ (Anti-cheat) — แต่ละคนได้ลำดับต่างกัน |
| Shuffle Choices | สลับลำดับตัวเลือก (ปรนัย) |
| Exam Preview | ดูตัวอย่างข้อสอบก่อนเผยแพร่ (มุมมองผู้สอบ) |
| Scheduling | ตั้งวัน/เวลาเริ่ม-สิ้นสุด + Time zone |
| Time Limit | จำกัดเวลาทำ (countdown timer) |
| Attempt Limit | จำกัดจำนวนครั้งที่สอบได้ |
| Access Control | Password / Access Code / IP Restriction / เฉพาะกลุ่มที่กำหนด |
| Late Policy | อนุญาตเข้าสอบสาย (กี่นาที) + หักคะแนนหรือไม่ |
| Multiple Sessions | เปิดหลายรอบสอบ (เช้า/บ่าย/หลายวัน) |
| PDF Export | พิมพ์ข้อสอบเป็น PDF สำหรับสอบกระดาษ |
| Clone Exam | คัดลอกชุดข้อสอบเพื่อใช้ซ้ำ/ปรับแก้ |

### Module 4: Exam Taking (ระบบทำข้อสอบ)

#### หน้าทำข้อสอบ

| Feature | รายละเอียด |
|---------|------------|
| Display Mode | แสดงทีละข้อ (One-by-one) หรือ ทุกข้อ (All-at-once) |
| Navigation Panel | แสดงสถานะแต่ละข้อ: ตอบแล้ว / ยังไม่ตอบ / Flag ไว้ดูทีหลัง |
| Auto-Save | บันทึกคำตอบอัตโนมัติทุก 10 วินาที (ป้องกันข้อมูลหาย) |
| Countdown Timer | นาฬิกานับถอยหลัง + แจ้งเตือนเมื่อเหลือ 15/5/1 นาที |
| Flag Question | ปักธงข้อสอบเพื่อกลับมาทบทวนก่อน submit |
| Review Before Submit | หน้าสรุปก่อน submit: กี่ข้อตอบแล้ว/ยังไม่ตอบ/Flag |
| Resume Session | กลับมาทำต่อได้ถ้า disconnect (ดึงจาก auto-save) |
| Submit Confirmation | ยืนยัน 2 ครั้งก่อน submit จริง |
| Auto Submit | ส่งข้อสอบอัตโนมัติเมื่อหมดเวลา |
| Rich Answer Input | ตอบอัตนัยด้วย Rich Text + แนบรูป |
| Math Answer Input | พิมพ์สูตรคณิตศาสตร์ใน Answer (KaTeX) |
| Progress Indicator | แสดง % ความคืบหน้า |

#### Anti-Cheating Features

| Feature | รายละเอียด |
|---------|------------|
| Fullscreen Mode | บังคับเปิด Fullscreen ระหว่างสอบ |
| Lockdown Browser | ล็อคเบราว์เซอร์ ปิดแท็บอื่น |
| Tab Switch Detection | ตรวจจับการสลับแท็บ/หน้าต่าง + บันทึก + แจ้ง Proctor |
| Copy/Paste Disabled | ปิดการ Copy/Paste/Cut |
| Right-Click Disabled | ปิด Context Menu |
| Screenshot Detection | ตรวจจับ PrintScreen / Screen capture |
| Activity Logging | บันทึกทุก action (คลิก, พิมพ์, เลื่อน, focus/blur) + timestamp |
| Violation Counter | นับจำนวนครั้งที่ละเมิดกฎ + แจ้งเตือน + auto-submit ถ้าเกิน threshold |
| Browser Fingerprint | ตรวจสอบว่าสอบจากเครื่อง/เบราว์เซอร์เดียวกัน |

### Module 5: Grading (ตรวจข้อสอบ)

| Feature | รายละเอียด |
|---------|------------|
| Auto Grading | ตรวจอัตโนมัติ: MC, T/F, Matching, Ordering, Fill-in-blank |
| Manual Grading | ผู้ตรวจตรวจอัตนัยผ่านหน้าจอ (อ่าน + ให้คะแนน) |
| Rubric-Based Scoring | สร้าง Rubric template (เกณฑ์ + ระดับคะแนน) ใช้ซ้ำได้ |
| Blind Grading | ไม่แสดงชื่อผู้สอบขณะตรวจ (ป้องกัน bias) |
| Double Grading | ตรวจ 2 คน → เปรียบเทียบ → Moderation ถ้าคะแนนต่างเกิน threshold |
| Partial Credit | ให้คะแนนบางส่วนได้ (เช่น MC หลายตัวเลือก) |
| Negative Marking | หักคะแนนเมื่อตอบผิด (optional, ตั้งค่าได้) |
| Grade Curve | ปรับเกรดตาม curve / Bell curve |
| Score Adjustment | ปรับคะแนนรายข้อ/รายคน (กรณีข้อสอบมีปัญหา) |
| Feedback | ผู้ตรวจเขียน feedback รายข้อ/รายคน |
| Appeal System | ผู้สอบยื่นอุทธรณ์คะแนน → ผู้ตรวจ review → อนุมัติ/ปฏิเสธ |
| Grade Publishing | ตั้งเวลาเผยแพร่ผลสอบ + ส่ง notification |
| Score Export | ส่งออกคะแนนเป็น CSV/Excel |

### Module 6: Test Center (ศูนย์สอบ)

#### 6A: Profile & Infrastructure

| Feature | รายละเอียด |
|---------|------------|
| Center Profile | ชื่อ, ที่อยู่, พิกัด GPS, เบอร์โทร, อีเมล, เว็บไซต์ |
| Location Map | Google Maps embed + เส้นทาง + ระยะทาง |
| Facilities | รายการสิ่งอำนวยความสะดวก (WiFi, แอร์, ที่จอดรถ, Accessible, ล็อคเกอร์) |
| Operating Hours | เวลาทำการรายวัน + วันหยุดพิเศษ |
| Gallery | รูปภาพศูนย์สอบ, อาคาร, ห้องสอบ |
| Status | เปิดให้บริการ / ปรับปรุง / ระงับ / ปิด |
| Rating & Review | ผู้เข้าสอบให้คะแนน + เขียนรีวิว |
| Network Map | แผนที่เครือข่ายศูนย์สอบทั่วประเทศ (Interactive map) |
| Nearest Center | ค้นหาศูนย์สอบใกล้ที่สุดจาก GPS |
| Partner Centers | ศูนย์สอบพันธมิตรใช้ร่วมกันระหว่าง Tenant |

#### 6B: Building & Room Management

| Feature | รายละเอียด |
|---------|------------|
| Building Management | CRUD อาคาร พร้อมข้อมูลชั้น + แผนผัง |
| Room Management | CRUD ห้องสอบ พร้อมประเภท (Lecture Hall / Computer Lab / Special Needs) |
| Room Status | พร้อมใช้งาน / กำลังบำรุง / ปิดชั่วคราว |
| Capacity | ความจุปกติ vs ความจุเว้นระยะ (COVID mode) |
| Floor Plan | Upload แผนผังชั้น (รูปภาพ / interactive) |
| Scheduling Calendar | ดูตารางการใช้ห้องแบบ Calendar view |

#### 6C: Seat Layout Builder

| Feature | รายละเอียด |
|---------|------------|
| Drag & Drop Builder | วางที่นั่ง, ทางเดิน, โซน ด้วยการลาก |
| Templates | เทมเพลตสำเร็จรูป (Classroom, Theater, Lab, U-shape) |
| Auto-Generate | ใส่จำนวนแถว x คอลัมน์ → สร้างผังอัตโนมัติ |
| Seat Types | Normal / Accessible / Left-handed / VIP / Extra Space |
| Aisle & Gap | วางทางเดิน + ช่องว่างได้อิสระ |
| Zone Grouping | แบ่งโซน (A, B, C) สำหรับห้องใหญ่ |
| Auto Numbering | ตั้งชื่อที่นั่งอัตโนมัติ (A-1, A-2...) หรือ custom |
| COVID Spacing | เปิด/ปิด เว้นที่นั่งอัตโนมัติ (เว้น 1 ที่, สลับแถว) |
| Import/Export | Import ผังจาก CSV / Export เป็น JSON |
| Preview Mode | ดูผังจากมุมมองผู้สอบ |
| Version History | เก็บประวัติการแก้ไขผัง กู้คืนได้ |

#### 6D: Equipment Management

| Feature | รายละเอียด |
|---------|------------|
| Equipment Registry | บันทึกอุปกรณ์ทุกชิ้น พร้อม Asset tag |
| Categories | คอมพิวเตอร์, กล้อง, Projector, OMR Scanner, เฟอร์นิเจอร์ |
| Status Tracking | พร้อมใช้ / กำลังซ่อม / ปลดระวาง / สูญหาย |
| Assignment | ผูกอุปกรณ์กับห้องสอบ / ที่นั่งเฉพาะ |
| Maintenance Log | บันทึกการบำรุงรักษา + กำหนดรอบตรวจ |
| Alert | แจ้งเตือนครบกำหนดตรวจ / จำนวนวัสดุต่ำกว่า threshold |
| Inventory | สต็อกวัสดุสิ้นเปลือง (กระดาษคำตอบ, ดินสอ 2B) |

#### 6E: Staff Management

| Feature | รายละเอียด |
|---------|------------|
| Staff Roster | รายชื่อบุคลากร พร้อมบทบาท + ข้อมูลติดต่อ |
| Roles | Center Manager / Proctor / IT Support / Reception / Security |
| Shift Scheduling | จัดตารางเวรรายวันสอบ (Drag & Drop) |
| Availability | บุคลากรแจ้งวันว่าง/ไม่ว่าง |
| Auto-Assign | จัดเวรอัตโนมัติตาม availability + workload |
| Notification | แจ้งเตือนตารางเวร + เปลี่ยนเวร |
| Training Record | บันทึกประวัติอบรม (เช่น อบรมคุมสอบ) |
| Performance | ประเมินผลการปฏิบัติงาน (rating จากผู้จัดสอบ) |

#### 6F: Exam Day Operations

| Feature | รายละเอียด |
|---------|------------|
| Day-of Dashboard | ภาพรวมวันสอบ real-time (จำนวนผู้สอบ, check-in %, เหตุการณ์) |
| QR Check-in | สแกน QR บัตรเข้าสอบ + ตรวจสอบอัตโนมัติ |
| Identity Verification | เทียบบัตรประชาชน + ใบหน้า |
| Attendance Tracking | บันทึกเวลาเข้า-ออกทุกคน |
| Incident Reporting | บันทึกเหตุการณ์ผิดปกติ + ระดับความรุนแรง (Low/Medium/High/Critical) |
| Emergency Protocol | ขั้นตอนฉุกเฉิน (ไฟดับ, ไฟไหม้, ระบบล่ม) |
| Spare Seat Assignment | จัดที่นั่งสำรองเมื่ออุปกรณ์มีปัญหา |
| Live Communication | Chat ระหว่าง Proctor ↔ Center Manager ↔ IT Support |
| No-Show Tracking | บันทึกผู้ไม่มาสอบ |

#### 6G: Approval & Certification

| Feature | รายละเอียด |
|---------|------------|
| Application Form | สมัครเป็นศูนย์สอบ (พร้อม upload เอกสาร) |
| Inspection Checklist | แบบประเมินตามเกณฑ์มาตรฐาน (สถานที่, IT, ความปลอดภัย) |
| On-site Audit | บันทึกผลตรวจ + รูปถ่าย |
| Approval Workflow | Reviewer → Approver → ออกใบรับรอง |
| Certification | ใบรับรองศูนย์สอบ + วันหมดอายุ (2 ปี) |
| Renewal | แจ้งเตือนต่ออายุ + ตรวจซ้ำ |
| Suspension | ระงับชั่วคราวหากไม่ผ่านเกณฑ์ |

#### 6H: Test Center Analytics

| Feature | รายละเอียด |
|---------|------------|
| Utilization Rate | อัตราการใช้ห้องสอบ (%) แยกรายห้อง/เดือน |
| Occupancy Report | จำนวนผู้สอบ vs ความจุ แต่ละรอบ |
| Check-in Analytics | อัตรา Check-in, เวลาเฉลี่ย, No-show rate |
| Incident Summary | สรุปเหตุการณ์แยกประเภท + แนวโน้ม |
| Equipment Health | สถานะอุปกรณ์, อัตราชำรุด, ค่าบำรุงรักษา |
| Staff Performance | ประเมินผลบุคลากร, ชั่วโมงทำงาน |
| Satisfaction Survey | ผลสำรวจความพึงพอใจจากผู้เข้าสอบ |
| Center Comparison | เปรียบเทียบประสิทธิภาพระหว่างศูนย์สอบ |

### Module 7: Registration & Seat Booking (สมัครสอบ & จองที่นั่ง)

#### 7A: Exam Catalog

| Feature | รายละเอียด |
|---------|------------|
| Listing Page | รายการสอบที่เปิดรับสมัคร + Filter + Search |
| Filter | หมวดหมู่, วันที่, ราคา, สถานะ, ผู้จัด, สถานที่ |
| Sort | วันสอบ, ความนิยม, ที่นั่งเหลือ, ราคา |
| Exam Status | เปิดรับ / ใกล้ปิด / ปิดรับ / เลื่อนสอบ / ยกเลิก |
| Calendar View | ปฏิทินการสอบรายเดือน |
| SEO | URL สวย + OG tags สำหรับ share |

#### 7B: Registration Form

| Feature | รายละเอียด |
|---------|------------|
| Multi-step Form | แบ่ง Step: ข้อมูลส่วนตัว → เลือกรอบ/ศูนย์ → อัปโหลดเอกสาร → สรุป/ชำระ |
| Real-time Validation | ตรวจสอบข้อมูลทันที (Zod) |
| Conditional Fields | แสดง field เพิ่มตามประเภทผู้สมัคร |
| Draft Save | บันทึกแบบร่างอัตโนมัติ กลับมาทำต่อได้ |
| Prerequisite Check | ตรวจสอบคุณสมบัติอัตโนมัติ (เช่น ต้องผ่านสอบ X ก่อน) |
| Duplicate Check | ป้องกันสมัครซ้ำ (คนเดิม + สอบเดียวกัน) |
| KYC | Upload บัตรประชาชน/พาสปอร์ต + ถ่ายรูป Selfie (Public Exam Mode) |

#### 7C: Seat Booking

| Feature | รายละเอียด |
|---------|------------|
| Visual Seat Map | แสดงผังที่นั่งแบบ interactive เลือกที่นั่งได้ |
| Auto-Assign | ระบบจัดที่นั่งอัตโนมัติ |
| Temporary Hold | Lock ที่นั่ง 15 นาทีระหว่างชำระเงิน (Redis TTL) |
| Concurrency Control | Optimistic Locking + Redis Distributed Lock ป้องกัน double booking |
| Real-time Availability | แสดงที่นั่งว่าง/จอง real-time (SSE + Redis Pub/Sub) |
| Seat Types | ปกติ / ผู้พิการ / VIP / ห้องสอบพิเศษ |
| Group Booking | สมัครเป็นกลุ่ม (Corporate) |

#### 7D: Waiting List

| Feature | รายละเอียด |
|---------|------------|
| Auto Waiting List | เมื่อที่นั่งเต็ม → เข้าคิวอัตโนมัติ |
| Queue Position | แสดงลำดับคิว real-time |
| Auto Promote | เมื่อมีคนยกเลิก → แจ้งคนถัดไปในคิว |
| Time Limit | ต้องยืนยัน + ชำระเงินภายใน 24 ชม. |
| Priority Queue | กำหนดลำดับความสำคัญ (เช่น ศิษย์เก่าได้สิทธิ์ก่อน) |

#### 7E: Reschedule & Cancellation

| Feature | รายละเอียด |
|---------|------------|
| Reschedule | เลื่อนไปรอบอื่นที่ยังว่าง (ตาม Policy) |
| Cancel + Refund | ยกเลิก + คืนเงินตามเงื่อนไขเวลา |
| Policy Builder | ผู้จัดสอบตั้ง policy เอง (กี่วันก่อนสอบ = คืนกี่ %) |
| Transfer | โอนสิทธิ์สอบให้คนอื่น (optional) |
| Force Cancel | Admin ยกเลิกทั้งรอบ → คืนเงินทุกคน + แจ้งเตือน |

#### 7F: Voucher & Check-in

| Feature | รายละเอียด |
|---------|------------|
| Exam Voucher | บัตรเข้าสอบดิจิทัลพร้อม QR Code |
| PDF Download | พิมพ์บัตรเข้าสอบเป็น PDF |
| Add to Calendar | เพิ่มลง Google/Apple/Outlook Calendar (.ics) |
| QR Check-in | สแกน QR ที่หน้าห้องสอบ → ยืนยันตัวตน → เข้าสอบ |

### Module 8: Payment & Billing

| Feature | รายละเอียด |
|---------|------------|
| Payment Gateway | Stripe / Omise / 2C2P integration |
| Payment Methods | PromptPay QR, บัตรเครดิต/เดบิต, โอนธนาคาร, e-Wallet |
| Invoice | ออกใบเสร็จ/ใบกำกับภาษีอัตโนมัติ (PDF) |
| Refund | คืนเงินตามนโยบาย (เต็มจำนวน/บางส่วน) |
| Pricing Plans | Free / Basic / Pro / Enterprise (สำหรับ Tenant) |
| Discount / Coupon | รหัสส่วนลด, ส่วนลดสมาชิก, Early bird, Group discount |
| Revenue Report | รายงานรายได้สำหรับผู้จัดสอบ |
| Payment History | ประวัติการชำระเงินทั้งหมด |

### Module 9: e-Profile (โปรไฟล์ผู้สอบ)

| Feature | รายละเอียด |
|---------|------------|
| Personal Info | รูปโปรไฟล์, ชื่อ, สถาบัน, ข้อมูลติดต่อ (แก้ไขได้) |
| Dashboard Summary | จำนวนครั้งที่สอบ, อัตราผ่าน, คะแนนเฉลี่ย (ภาพรวม) |
| Exam History | รายการสอบทั้งหมด + คะแนน + สถานะผ่าน/ไม่ผ่าน |
| Score Detail | คะแนนรายหมวด, จุดแข็ง/จุดอ่อน, feedback จากผู้ตรวจ |
| Progress Chart | กราฟแนวโน้มคะแนน + เทียบกับค่าเฉลี่ย (Recharts) |
| Certificate & Badge | ใบรับรองทั้งหมด + ดาวน์โหลด PDF + แชร์ลิงก์ + QR verify |
| Registration History | สถานะการสมัครสอบ, ใบเสร็จ, Voucher |
| Privacy Control | ตั้งค่าว่าใครเห็นข้อมูลอะไร (public/private) |
| Public Profile URL | ลิงก์โปรไฟล์สาธารณะ เลือกเปิด/ปิดได้ |
| Export Transcript | ดาวน์โหลดผลสอบทั้งหมดเป็น PDF Transcript |

### Module 10: e-Wallet Integration (ระบบภายนอก)

| Feature | รายละเอียด |
|---------|------------|
| ส่งผลสอบ → e-Wallet | เมื่อผลสอบ confirmed → เรียก webhook ส่งคะแนน + สถานะ |
| ส่ง Certificate → e-Wallet | เมื่อออก Cert → ส่ง credential ไป e-Wallet |
| ชำระเงินผ่าน e-Wallet | ผู้สอบจ่ายค่าสมัครจาก e-Wallet balance |
| Refund → e-Wallet | คืนเงินกลับ e-Wallet เมื่อยกเลิก |
| API Security | API Key + HMAC-SHA256 + IP Whitelist + Rate Limiting |
| Webhook Retry | retry 3 ครั้ง (exponential backoff) ถ้า endpoint ไม่ตอบ |
| Feature Toggle | เปิด/ปิด e-Wallet integration ได้ (EWALLET_ENABLED) |

#### e-Wallet Integration — API Endpoints

```
# U-Exam เปิด API ให้ e-Wallet เรียก (ดึงข้อมูลผู้สอบ)
GET  /api/v1/external/students/{id}/results
GET  /api/v1/external/students/{id}/results/{examId}
GET  /api/v1/external/students/{id}/certificates
GET  /api/v1/external/students/{id}/certificates/{id}/verify
GET  /api/v1/external/students/{id}/profile-summary

# e-Wallet เปิด API ให้ U-Exam เรียก (ชำระเงิน + ส่งผลสอบ)
POST /api/external/payment/create
GET  /api/external/payment/{id}/status
POST /api/external/payment/{id}/refund
POST /api/external/results
POST /api/external/credentials
```

#### e-Wallet Integration — Security

| Layer | รายละเอียด |
|-------|------------|
| API Key | แต่ละระบบมี key คู่กัน |
| HMAC Signature | HMAC-SHA256(secret, timestamp + body) ใน X-Signature header |
| Timestamp Validation | request ต้องมาภายใน 5 นาที ป้องกัน replay attack |
| IP Whitelist | จำกัด IP ของ server อีกฝั่ง |
| Rate Limiting | 1000 requests/minute ต่อ API Key |
| Webhook Retry | retry 3 ครั้ง (exponential backoff) |

### Module 11: Certificate & Digital Badge

| Feature | รายละเอียด |
|---------|------------|
| Certificate Template | ออกแบบใบ Certificate (Drag & Drop builder) |
| Auto Issue | ออกอัตโนมัติเมื่อผ่านเกณฑ์ → PDF + QR Code |
| Digital Badge | ออก Open Badge (Credly compatible) |
| Verification Portal | หน้าสาธารณะตรวจสอบ Certificate (สแกน QR → เห็นผล) |
| Expiry & Renewal | Certificate มีอายุ → แจ้งเตือนต่ออายุ → สอบใหม่ |
| Share | แชร์ลิงก์ Certificate ไป LinkedIn, Facebook |
| Revocation | ยกเลิก/เพิกถอน Certificate ได้ (กรณีทุจริต) |

### Module 12: Analytics & Reporting

| Feature | รายละเอียด |
|---------|------------|
| Item Analysis | ค่า Difficulty Index, Discrimination Index, Point Biserial ต่อข้อ |
| Distractor Analysis | วิเคราะห์ตัวเลือกที่ผิดของปรนัย |
| Score Distribution | กราฟกระจายคะแนน, Mean, Median, SD, Skewness |
| Pass/Fail Rate | อัตราผ่าน/ไม่ผ่าน แยกตามรอบ/ศูนย์/หมวด |
| Reliability | ค่าความเชื่อมั่น KR-20, Cronbach's Alpha |
| Candidate Report | ผลสอบรายบุคคล + เปรียบเทียบกับค่าเฉลี่ย + feedback |
| Organization Dashboard | ภาพรวมทั้งองค์กร: เปรียบเทียบรายการสอบ/ช่วงเวลา |
| Competency Mapping | วัดผล Competency achievement ตามหมวดข้อสอบ |
| Trend Analysis | แนวโน้มผลสอบข้ามปี/ช่วงเวลา |
| Export | PDF, Excel, CSV |
| Scheduled Report | ตั้งเวลาส่งรายงานอัตโนมัติ (Email) |

### Module 13: Notification

| Feature | รายละเอียด |
|---------|------------|
| Email | แจ้งเตือนผ่าน Email (SendGrid / AWS SES) |
| SMS | แจ้งเตือนผ่าน SMS (SMS Gateway) |
| Push Notification | แจ้งเตือน Push บน Browser / Mobile |
| In-App | แจ้งเตือนภายในระบบ (Bell icon + Notification center) |
| Events | สมัครสำเร็จ, ชำระเงิน, เตือนก่อนสอบ (7d/1d/1h), ผลสอบ, Certificate, ได้คิว, เลื่อน/ยกเลิก |
| Template | Email/SMS template ปรับแต่งได้ (ใส่ตัวแปร) |
| Preference | ผู้ใช้ตั้งค่าเลือกช่องทางแจ้งเตือนเองได้ |

### Module 14: Proctoring (คุมสอบออนไลน์)

| Feature | รายละเอียด |
|---------|------------|
| Webcam Monitoring | ดูกล้องผู้สอบแบบ real-time |
| Face Detection | ตรวจจับใบหน้า — แจ้งเตือนถ้าไม่พบใบหน้า / มีคนเกิน 1 คน |
| Screen Capture | บันทึกหน้าจอผู้สอบ |
| Live Proctor Dashboard | Proctor ดูผู้สอบหลายคนพร้อมกัน (Grid view) |
| Auto Flagging | AI flag พฤติกรรมน่าสงสัยอัตโนมัติ |
| Recording | บันทึกวิดีโอ/หน้าจอสำหรับตรวจสอบย้อนหลัง |
| Chat | Proctor สื่อสารกับผู้สอบรายบุคคล |
| Force Submit | Proctor บังคับ submit ข้อสอบ (กรณีทุจริต) |
| Incident Report | Proctor บันทึกเหตุการณ์ + screenshot ทันที |

### Module 15: Integration

| Feature | รายละเอียด |
|---------|------------|
| SSO | OAuth 2.0 Social Login (Google, Facebook, LINE) + Corporate SSO |
| RESTful API | Public API สำหรับ third-party integration |
| Webhook | Event-driven notification สำหรับระบบภายนอก |
| e-Wallet API | เชื่อมต่อระบบ e-Wallet (ชำระเงิน + ส่งผลสอบ) |

---

## 5. Non-Functional Requirements

| หัวข้อ | ข้อกำหนด |
|--------|----------|
| Performance | รองรับ 5,000+ concurrent users ขณะสอบ |
| Availability | 99.9% uptime ช่วงสอบ |
| Security | Encryption at rest & in transit, PDPA compliance, Audit trail |
| Scalability | Horizontal scaling, CDN, Read replica |
| Accessibility | WCAG 2.1 AA |
| Browser Support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Mobile | Responsive design (ทำข้อสอบบนมือถือ/แท็บเล็ต) |
| Backup | Automated daily backup + Point-in-time recovery |
| i18n | ภาษาไทย + English |
| Data Isolation | Row-Level Security ต่อ Tenant |

---

## 6. Development Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Foundation: Auth, Multi-tenant, RBAC | Pending |
| 2 | Question Bank | Pending |
| 3 | Exam Builder + Scheduling | Pending |
| 4 | Exam Taking + Anti-cheat | Pending |
| 5 | Grading (Auto + Manual) | Pending |
| 6 | Analytics & Reporting | Pending |
| 7 | Test Center: Profile + Building + Room | Pending |
| 8 | Test Center: Seat Layout + Equipment | Pending |
| 9 | Test Center: Staff Management | Pending |
| 10 | Exam Catalog + Registration | Pending |
| 11 | Seat Booking Engine | Pending |
| 12 | Waiting List + Reschedule/Cancel | Pending |
| 13 | Payment & Billing | Pending |
| 14 | Voucher + Check-in System | Pending |
| 15 | Test Center: Exam Day Operations | Pending |
| 16 | Test Center: Approval & Certification | Pending |
| 17 | Test Center: Analytics & Review | Pending |
| 18 | e-Profile: โปรไฟล์ผู้สอบ + ผลสอบ + พัฒนาการ | Pending |
| 19 | e-Wallet Integration: API + Payment + Webhook | Pending |
| 20 | Certificate & Digital Badge | Pending |
| 21 | Proctoring | Pending |
| 22 | Integration (OAuth, API, Webhook) | Pending |

---

## 7. Risks & Mitigation

| ความเสี่ยง | แนวทางแก้ไข |
|------------|-------------|
| ระบบล่มขณะสอบ | Auto-save ทุก 10 วินาที, Resume session, Database replication |
| การทุจริต | Lockdown browser, Activity logging, AI-based detection, Proctoring |
| ข้อมูลรั่วไหล | Encryption, RLS, Access control, Audit log, PDPA compliance |
| Performance bottleneck ช่วงสอบ | Connection pooling, Read replica, Caching, Rate limiting |
| ข้อสอบอัตนัยตรวจยาก | Rubric templates, Double grading, Moderation |
| Double booking ที่นั่ง | Redis Distributed Lock, Optimistic Locking, Temporary Hold |
| Payment failure | Retry mechanism, Idempotency key, Transaction log |
| e-Wallet API downtime | Circuit breaker, Fallback to other payment, Webhook retry |
