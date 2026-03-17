# U-Exam — UI/UX Design System

> Design System อ้างอิงจาก U-Account เพื่อให้ UI สอดคล้องกันทั้งระบบ
> อัปเดตล่าสุด: 2026-03-09

---

## 1. Color Theme: Red Wine

ใช้ OKLCh color space สำหรับความสม่ำเสมอในการรับรู้สี (perceptually uniform)

### Light Mode (`:root`)

| Token | OKLCh Value | คำอธิบาย |
|-------|-------------|----------|
| `--background` | `oklch(1 0 0)` | Pure white |
| `--foreground` | `oklch(0.175 0 0)` | Very dark gray/charcoal |
| `--card` | `oklch(1 0 0)` | White |
| `--card-foreground` | `oklch(0.175 0 0)` | Dark gray |
| `--popover` | `oklch(1 0 0)` | White |
| `--popover-foreground` | `oklch(0.175 0 0)` | Dark gray |
| `--primary` | `oklch(0.34 0.13 25)` | **Red Wine** ≈ #741717 |
| `--primary-foreground` | `oklch(0.985 0 0)` | Off-white |
| `--secondary` | `oklch(0.97 0 0)` | Almost white |
| `--secondary-foreground` | `oklch(0.205 0 0)` | Dark gray |
| `--muted` | `oklch(0.97 0 0)` | Almost white |
| `--muted-foreground` | `oklch(0.556 0 0)` | Medium gray |
| `--accent` | `oklch(0.97 0 0)` | Almost white |
| `--accent-foreground` | `oklch(0.205 0 0)` | Dark gray |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Red/Orange-red |
| `--border` | `oklch(0.922 0 0)` | Light gray |
| `--input` | `oklch(0.922 0 0)` | Light gray |
| `--ring` | `oklch(0.34 0.13 25)` | Red Wine (focus ring) |

### Light Mode — Sidebar

| Token | OKLCh Value | คำอธิบาย |
|-------|-------------|----------|
| `--sidebar` | `oklch(0.985 0 0)` | Off-white |
| `--sidebar-foreground` | `oklch(0.175 0 0)` | Dark gray |
| `--sidebar-primary` | `oklch(0.34 0.13 25)` | Red Wine |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | Off-white |
| `--sidebar-accent` | `oklch(0.97 0 0)` | Almost white |
| `--sidebar-accent-foreground` | `oklch(0.205 0 0)` | Dark gray |
| `--sidebar-border` | `oklch(0.922 0 0)` | Light gray |

### Light Mode — Chart Colors

| Token | OKLCh Value | คำอธิบาย |
|-------|-------------|----------|
| `--chart-1` | `oklch(0.34 0.13 25)` | Red Wine (primary) |
| `--chart-2` | `oklch(0.6 0.118 184.704)` | Blue |
| `--chart-3` | `oklch(0.398 0.07 227.392)` | Blue-purple |
| `--chart-4` | `oklch(0.828 0.189 84.429)` | Yellow-orange |
| `--chart-5` | `oklch(0.769 0.188 70.08)` | Orange |

### Dark Mode (`.dark`)

| Token | OKLCh Value | คำอธิบาย |
|-------|-------------|----------|
| `--background` | `oklch(0.145 0 0)` | Very dark gray/black |
| `--foreground` | `oklch(0.985 0 0)` | Off-white |
| `--card` | `oklch(0.205 0 0)` | Dark gray |
| `--card-foreground` | `oklch(0.985 0 0)` | Off-white |
| `--popover` | `oklch(0.205 0 0)` | Dark gray |
| `--popover-foreground` | `oklch(0.985 0 0)` | Off-white |
| `--primary` | `oklch(0.55 0.14 25)` | Lighter Red Wine |
| `--primary-foreground` | `oklch(0.985 0 0)` | Off-white |
| `--secondary` | `oklch(0.269 0 0)` | Dark gray |
| `--secondary-foreground` | `oklch(0.985 0 0)` | Off-white |
| `--muted` | `oklch(0.269 0 0)` | Dark gray |
| `--muted-foreground` | `oklch(0.708 0 0)` | Light gray |
| `--accent` | `oklch(0.269 0 0)` | Dark gray |
| `--accent-foreground` | `oklch(0.985 0 0)` | Off-white |
| `--destructive` | `oklch(0.704 0.191 22.216)` | Light red |
| `--border` | `oklch(1 0 0 / 10%)` | White 10% opacity |
| `--input` | `oklch(1 0 0 / 15%)` | White 15% opacity |
| `--ring` | `oklch(0.55 0.14 25)` | Lighter Red Wine |

### Dark Mode — Sidebar

| Token | OKLCh Value | คำอธิบาย |
|-------|-------------|----------|
| `--sidebar` | `oklch(0.205 0 0)` | Dark gray |
| `--sidebar-foreground` | `oklch(0.985 0 0)` | Off-white |
| `--sidebar-primary` | `oklch(0.55 0.14 25)` | Lighter Red Wine |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | Off-white |
| `--sidebar-accent` | `oklch(0.269 0 0)` | Dark gray |
| `--sidebar-accent-foreground` | `oklch(0.985 0 0)` | Off-white |
| `--sidebar-border` | `oklch(1 0 0 / 10%)` | White 10% opacity |
| `--sidebar-ring` | `oklch(0.55 0.14 25)` | Lighter Red Wine |

### Dark Mode — Chart Colors

| Token | OKLCh Value | คำอธิบาย |
|-------|-------------|----------|
| `--chart-1` | `oklch(0.55 0.14 25)` | Light Red Wine |
| `--chart-2` | `oklch(0.696 0.17 162.48)` | Light blue |
| `--chart-3` | `oklch(0.769 0.188 70.08)` | Light orange |
| `--chart-4` | `oklch(0.627 0.265 303.9)` | Magenta |
| `--chart-5` | `oklch(0.645 0.246 16.439)` | Light red |

---

## 2. Typography

### Font Family

| ประเภท | Font | Source |
|--------|------|--------|
| Sans-serif (Primary) | **Inter** | Google Fonts (`next/font/google`) |
| Monospace | **Geist Mono** | Vercel font |

### CSS Configuration

```css
--font-sans: var(--font-inter);
--font-mono: var(--font-geist-mono);
```

### HTML Setup

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
});

// layout.tsx
<body className={`${inter.variable} font-sans antialiased`}>
```

---

## 3. Icon Library

### Lucide React (`lucide-react`)

**Version**: ^0.576.0

### Icon ที่ใช้บ่อย (แนวทางสำหรับ U-Exam)

| หน้าที่ | Icon | ตัวอย่างการใช้ |
|---------|------|---------------|
| Dashboard | `LayoutDashboard` | หน้า Dashboard หลัก |
| ข้อสอบ | `FileText` | คลังข้อสอบ, ชุดข้อสอบ |
| ผู้สอบ | `Users` | รายชื่อผู้สอบ |
| ศูนย์สอบ | `Building2` | Test Center |
| การสมัคร | `ClipboardList` | สมัครสอบ |
| ชำระเงิน | `CreditCard` | Payment |
| e-Wallet | `Wallet` | e-Wallet integration |
| Analytics | `BarChart3` | รายงาน/สถิติ |
| ตั้งค่า | `Settings` | Settings page |
| User | `User` | Profile/Account |
| Logout | `LogOut` | ออกจากระบบ |
| Menu | `Menu` | Mobile menu toggle |
| Certificate | `Award` | ใบรับรอง/Badge |
| Timer | `Clock` | Countdown timer |
| Notification | `Bell` | แจ้งเตือน |
| Search | `Search` | ค้นหา |
| Dropdown | `ChevronDown` | Collapse/Expand |
| Loading | `Loader2` | Loading spinner |

### ขนาด Icon

| Context | Class | ขนาด |
|---------|-------|------|
| Small (ในปุ่ม, menu) | `h-4 w-4` | 16px |
| Medium (sidebar, header) | `h-5 w-5` | 20px |
| Large (empty state, hero) | `h-8 w-8` หรือ `h-12 w-12` | 32-48px |

---

## 4. Component Library: shadcn/ui

### Configuration (`components.json`)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Component ที่ต้องติดตั้ง

| Category | Components |
|----------|-----------|
| Form | Button, Input, Label, Textarea, Select, Checkbox, Switch |
| Data Display | Table, Card, Badge, Avatar |
| Feedback | Alert Dialog, Dialog, Toast |
| Navigation | Tabs, Dropdown Menu, Command (search palette) |
| Layout | Separator, Scroll Area, Sheet (mobile drawer) |
| Overlay | Popover, Dialog, Sheet |

---

## 5. Layout Structure

### Desktop Layout

```
┌──────────────┬──────────────────────────────────────┐
│   Sidebar    │  Header (h-14, border-b)             │
│   (w-64)     │  ┌─────────────────────────────────┐  │
│   border-r   │  │ Menu | Search | Branch | User   │  │
│              ├──┴─────────────────────────────────┴──┤
│  ┌────────┐  │                                       │
│  │ Logo   │  │  Main Content                         │
│  ├────────┤  │  (p-4 / lg:p-6)                       │
│  │ Nav    │  │  overflow-y-auto                       │
│  │ Items  │  │                                       │
│  │        │  │                                       │
│  │        │  │                                       │
│  └────────┘  │                                       │
└──────────────┴───────────────────────────────────────┘
```

### Mobile Layout (< lg breakpoint)

```
┌──────────────────────────────────────┐
│  Header (h-14)                       │
│  ┌─────────────────────────────────┐  │
│  │ ☰ Menu | Search | User         │  │
├──┴─────────────────────────────────┴──┤
│                                       │
│  Main Content                         │
│  (p-4)                                │
│  overflow-y-auto                      │
│                                       │
└───────────────────────────────────────┘

☰ → เปิด Sheet/Drawer จากซ้าย (w-64)
```

### Layout Code Pattern

```tsx
<div className="flex h-screen overflow-hidden">
  {/* Desktop Sidebar */}
  <div className="hidden lg:block">
    <Sidebar />  {/* w-64, border-r, bg-sidebar */}
  </div>

  {/* Main Area */}
  <div className="flex flex-1 flex-col overflow-hidden">
    <Header />  {/* h-14, border-b, bg-background */}
    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
      {children}
    </main>
  </div>
</div>
```

### Sidebar Navigation Style

```tsx
// Navigation item
<a className="flex items-center gap-3 rounded-lg px-3 py-2
  text-muted-foreground hover:bg-accent hover:text-accent-foreground
  transition-colors">
  <Icon className="h-4 w-4" />
  <span>Menu Label</span>
</a>

// Active state
<a className="flex items-center gap-3 rounded-lg px-3 py-2
  bg-accent text-accent-foreground font-medium">
  <Icon className="h-4 w-4" />
  <span>Active Menu</span>
</a>
```

---

## 6. Border Radius System

| Token | Value | ขนาด |
|-------|-------|------|
| `--radius` | `0.625rem` | 10px (base) |
| `--radius-sm` | `calc(var(--radius) - 4px)` | 6px |
| `--radius-md` | `calc(var(--radius) - 2px)` | 8px |
| `--radius-lg` | `var(--radius)` | 10px |
| `--radius-xl` | `calc(var(--radius) + 4px)` | 14px |
| `--radius-2xl` | `calc(var(--radius) + 8px)` | 18px |

---

## 7. Tailwind CSS v4 Setup

### PostCSS Config (`postcss.config.mjs`)

```javascript
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Global CSS (`src/app/globals.css`)

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-geist-mono);
  /* ... sidebar colors ... */
  /* ... chart colors ... */
  /* ... border radius ... */
}
```

### Base Styles

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 8. Dark Mode

### Implementation

- ใช้ **class-based** dark mode (`.dark` class บน `<html>` หรือ parent element)
- Tailwind variant: `@custom-variant dark (&:is(.dark *))`
- Primary color ปรับอ่อนลงใน dark mode เพื่อ contrast ที่ดี

### Dark Mode Toggle

```tsx
// ใช้ next-themes สำหรับ toggle
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
// setTheme("light") | setTheme("dark") | setTheme("system")
```

---

## 9. Responsive Breakpoints

ใช้ Tailwind default breakpoints:

| Prefix | Min Width | การใช้งาน |
|--------|-----------|----------|
| (default) | 0px | Mobile first |
| `sm:` | 640px | Small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop (layout breakpoint หลัก) |
| `xl:` | 1280px | Large desktop |
| `2xl:` | 1536px | Extra large |

### ตัวอย่างการใช้

```tsx
// Sidebar: ซ่อนบน mobile, แสดงบน desktop
<div className="hidden lg:block">

// Padding: เล็กบน mobile, ใหญ่ขึ้นบน desktop
<main className="p-4 lg:p-6">

// Text: ซ่อนบน mobile
<span className="hidden text-sm md:block">
```

---

## 10. Key Dependencies

| Package | Version | หน้าที่ |
|---------|---------|--------|
| `tailwindcss` | ^4 | CSS utility framework |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin |
| `shadcn` | ^3.8.5 | Component library CLI |
| `radix-ui` | ^1.4.3 | Headless UI (base for shadcn) |
| `lucide-react` | ^0.576.0 | Icon library |
| `class-variance-authority` | ^0.7.1 | Component variants (CVA) |
| `clsx` | ^2.1.1 | Classname utility |
| `tailwind-merge` | ^3.5.0 | Smart Tailwind class merging |
| `tw-animate-css` | ^1.4.0 | Animation utilities |
| `next-themes` | - | Dark mode toggle |

---

## 11. Theme Metadata (PWA)

```tsx
// layout.tsx metadata
export const metadata = {
  themeColor: "#0f172a",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "U-Exam",
  },
};
```

---

## 12. U-Exam Specific Layouts

นอกจาก Dashboard Layout หลัก U-Exam มี Layout พิเศษเพิ่มเติม:

### Exam Taking Layout (Fullscreen)

```
┌──────────────────────────────────────────────┐
│  Exam Header: ชื่อข้อสอบ | Timer | Progress  │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────┐  ┌──────────────┐   │
│  │                     │  │ Navigation   │   │
│  │  Question Content   │  │ Panel        │   │
│  │  (Main area)        │  │ ┌──┬──┬──┐   │   │
│  │                     │  │ │1 │2 │3 │   │   │
│  │                     │  │ ├──┼──┼──┤   │   │
│  │                     │  │ │4 │5 │6 │   │   │
│  │                     │  │ └──┴──┴──┘   │   │
│  └─────────────────────┘  └──────────────┘   │
│                                              │
│  ┌──────────────────────────────────────────┐ │
│  │ Actions: ◁ Prev | Flag ⚑ | Next ▷ | Submit │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Candidate Portal Layout

```
┌──────────────────────────────────────┐
│  Navbar (centered, public-facing)    │
│  Logo | Catalog | My Exams | Profile │
├──────────────────────────────────────┤
│                                      │
│  Content Area                        │
│  (max-w-7xl mx-auto)                 │
│                                      │
├──────────────────────────────────────┤
│  Footer                             │
└──────────────────────────────────────┘
```

### Seat Map Layout (Interactive)

```
┌──────────────────────────────────────┐
│  Room Info | Legend | Zoom Controls  │
├──────────────────────────────────────┤
│  ┌──────────────────────────────┐    │
│  │     ▓▓▓▓▓ (กระดาน/หน้าห้อง)   │    │
│  │                              │    │
│  │  ○ ○ ○ ● ○   ○ ○ ○ ○ ○     │    │
│  │  ○ ● ○ ○ ○   ○ ○ ● ○ ○     │    │
│  │  ○ ○ ○ ○ ○   ○ ○ ○ ○ ○     │    │
│  │  ○ ○ ● ○ ○   ○ ○ ○ ● ○     │    │
│  │                              │    │
│  │  ○ = ว่าง  ● = จอง  ◉ = เลือก  │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```
