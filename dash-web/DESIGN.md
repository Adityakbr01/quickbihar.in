---
version: 1.0.0
name: QuickBihar dashboard
description: >-
  Enterprise dashboard & verified business marketplace. Single Clik connects consumers with verified businesses
  and professionals without sharing personal contact details. Enquire, chat, negotiate, and manage workflows
  in one secure, privacy-first platform.
tagline: Connect. Collaborate. Get Things Done.
logo:
  src: /favicon.svg
  brandMark: QuickBihar SC Badge with Emerald Verification Dot
themes:
  engine: Tailwind CSS v4 (CSS-first config via @theme and @custom-variant dark)
  controller: next-themes (class-based dark mode on <html>)
  default: system
colors:
  # Light Theme (Clean Slate & Modern Canvas)
  surface: '#F8FAFC'
  surface-dim: '#F1F5F9'
  surface-bright: '#FFFFFF'
  surface-container-lowest: '#FFFFFF'
  surface-container-low: '#F8FAFC'
  surface-container: '#F1F5F9'
  surface-container-high: '#E2E8F0'
  surface-container-highest: '#CBD5E1'
  surface-variant: '#F1F5F9'
  surface-tint: '#2563EB'
  on-surface: '#0F172A'
  on-surface-variant: '#475569'
  inverse-surface: '#0F172A'
  inverse-on-surface: '#F8FAFC'
  outline: '#E2E8F0'
  outline-variant: '#CBD5E1'
  background: '#F8FAFC'
  on-background: '#0F172A'
  primary: '#2563EB'
  on-primary: '#FFFFFF'
  primary-container: '#EFF6FF'
  on-primary-container: '#1E40AF'
  inverse-primary: '#93C5FD'
  primary-hover: '#1D4ED8'
  primary-active: '#1E40AF'
  secondary: '#10B981'
  on-secondary: '#FFFFFF'
  secondary-container: '#ECFDF5'
  on-secondary-container: '#047857'
  tertiary: '#F59E0B'
  on-tertiary: '#FFFFFF'
  tertiary-container: '#FEF3C7'
  on-tertiary-container: '#B45309'
  error: '#EF4444'
  on-error: '#FFFFFF'
  error-container: '#FEE2E2'
  on-error-container: '#991B1B'
  primary-fixed: '#EFF6FF'
  primary-fixed-dim: '#DBEAFE'
  on-primary-fixed: '#1E40AF'
  on-primary-fixed-variant: '#1D4ED8'
  secondary-fixed: '#ECFDF5'
  secondary-fixed-dim: '#D1FAE5'
  on-secondary-fixed: '#065F46'
  on-secondary-fixed-variant: '#047857'
  tertiary-fixed: '#FEF3C7'
  tertiary-fixed-dim: '#FDE68A'
  on-tertiary-fixed: '#92400E'
  on-tertiary-fixed-variant: '#B45309'
dark-colors:
  # Dark Theme (QuickBihar Deep Midnight Slate)
  surface: '#0B1120'
  surface-dim: '#070C16'
  surface-bright: '#1E293B'
  surface-container-lowest: '#0F172A'
  surface-container-low: '#131D33'
  surface-container: '#1E293B'
  surface-container-high: '#283548'
  surface-container-highest: '#334155'
  surface-variant: '#1E293B'
  surface-tint: '#3B82F6'
  on-surface: '#F8FAFC'
  on-surface-variant: '#94A3B8'
  inverse-surface: '#F8FAFC'
  inverse-on-surface: '#0F172A'
  outline: '#1E293B'
  outline-variant: '#334155'
  background: '#0B1120'
  on-background: '#F8FAFC'
  primary: '#3B82F6'
  on-primary: '#FFFFFF'
  primary-container: '#1E3A8A'
  on-primary-container: '#DBEAFE'
  inverse-primary: '#1D4ED8'
  primary-hover: '#60A5FA'
  primary-active: '#2563EB'
  secondary: '#10B981'
  on-secondary: '#FFFFFF'
  secondary-container: '#064E3B'
  on-secondary-container: '#A7F3D0'
  tertiary: '#F59E0B'
  on-tertiary: '#FFFFFF'
  tertiary-container: '#451A03'
  on-tertiary-container: '#FDE68A'
  error: '#F87171'
  on-error: '#450A0A'
  error-container: '#7F1D1D'
  on-error-container: '#FEE2E2'
typography:
  fontFamilies:
    sans: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    display: 'Space Grotesk, sans-serif'
    serif: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif'
  display:
    fontFamily: '{typography.fontFamilies.display}'
    fontSize: 96px
    fontWeight: '600'
    lineHeight: 104px
    letterSpacing: '-0.04em'
  headline-lg:
    fontFamily: '{typography.fontFamilies.display}'
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: '-0.02em'
  headline-md:
    fontFamily: '{typography.fontFamilies.display}'
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: '-0.01em'
  title-lg:
    fontFamily: '{typography.fontFamilies.sans}'
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: '{typography.fontFamilies.sans}'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: '{typography.fontFamilies.sans}'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: '{typography.fontFamilies.sans}'
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: '{typography.fontFamilies.sans}'
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.375rem
  DEFAULT: 0.625rem
  md: 0.75rem
  lg: 1rem
  xl: 1.25rem
  2xl: 1.5rem
  3xl: 1.75rem
  full: 9999px
elevation:
  light:
    sm: 0 1px 3px rgba(15, 23, 42, 0.05)
    md: 0 4px 12px rgba(15, 23, 42, 0.07)
    lg: 0 12px 30px rgba(15, 23, 42, 0.09)
    focus-ring: 0 0 0 3px rgba(37, 99, 235, 0.25)
  dark:
    sm: 0 1px 3px rgba(0, 0, 0, 0.5)
    md: 0 4px 14px rgba(0, 0, 0, 0.6)
    lg: 0 12px 32px rgba(0, 0, 0, 0.7)
    focus-ring: 0 0 0 3px rgba(59, 130, 246, 0.35)
layout:
  containerMaxWidth: 1280px
  gridColumns: 12
  sidebarWidth: 288px # 72 in Tailwind (18rem)
  headerHeight: 64px # 16 in Tailwind (4rem)
  gutter: 24px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label-md}'
    rounded: '{rounded.lg}'
    padding: 6px 15px
    minHeight: 36px
    fontWeight: '500'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
    textColor: '{colors.on-primary}'
    transition: background-color 0.2s ease
  button-secondary:
    backgroundColor: '{colors.primary-container}'
    textColor: '{colors.primary}'
    typography: '{typography.label-md}'
    rounded: '{rounded.lg}'
    padding: 6px 15px
    minHeight: 36px
    fontWeight: '500'
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.on-surface}'
    typography: '{typography.label-md}'
    rounded: '{rounded.lg}'
    padding: 6px 15px
    minHeight: 36px
    fontWeight: '400'
  card:
    backgroundColor: '{colors.surface-container-lowest}'
    rounded: '{rounded.lg}'
    padding: 16px
    boxShadow: '{elevation.light.md}'
    border: 1px solid {colors.outline}
  card-hover:
    backgroundColor: '{colors.surface-container-low}'
    boxShadow: '{elevation.light.lg}'
    transition: all 0.2s ease
  input-field:
    backgroundColor: '{colors.surface-container-low}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-md}'
    rounded: '{rounded.DEFAULT}'
    padding: 8px 12px
    border: 1px solid {colors.outline}
    minHeight: 36px
  badge:
    backgroundColor: '{colors.secondary-container}'
    textColor: '{colors.on-secondary-container}'
    typography: '{typography.label-sm}'
    rounded: '{rounded.full}'
    padding: 4px 12px
    fontWeight: '500'
  badge-accent:
    backgroundColor: '{colors.tertiary-container}'
    textColor: '{colors.on-tertiary-container}'
---

# QuickBihar dashboard — Design System & Style Guide

## 1. Brand & Product Overview

**QuickBihar dashboard** is the administrative and operational heart of the QuickBihar Verified Marketplace. QuickBihar connects everyday consumers with verified businesses, contractors, and professionals while preserving user privacy—enabling seamless inquiry, negotiation, and contract execution without exposing personal phone numbers.

### Core Brand Identity
- **Product Name**: QuickBihar dashboard
- **Motto / Tagline**: *“Connect. Collaborate. Get Things Done.”*
- **Sub-tagline**: *“Verified Businesses & Professionals · Privacy First”*
- **Aesthetic Philosophy**: **Clean Slate & Precision Slate** — Crisp typography, generous breathing room, high-contrast readability, and purposeful visual anchors.
- **Brand Signature Color**: **Electric Royal Blue (`#2563EB`)**, signifying reliability, security, and prompt action.
- **Trust Accent Color**: **Verified Emerald (`#10B981`)**, utilized for verified badges, successful statuses, and active toggles.

---

## 2. Theme Architecture & Color System

The application utilizes **Tailwind CSS v4** with CSS-first variable design tokens registered inside `@theme` and class-level dark mode switching via `@custom-variant dark (&:where(.dark, .dark *))` with `next-themes`.

An inline pre-render script in `index.html` inspects `localStorage.getItem('theme')` and `window.matchMedia('(prefers-color-scheme: dark)')` to guarantee zero Flash of Unstyled Content (FOUC).

### 2.1 Surfaces & Canvas Hierarchy

| Token Name | Tailwind Utility | Light Theme (Slate Light) | Dark Theme (Deep Midnight Slate) | Semantic Role |
| :--- | :--- | :--- | :--- | :--- |
| `surface` | `bg-surface` | `#F8FAFC` (Slate 50) | `#0B1120` (Midnight Navy) | Default viewport base |
| `surface-dim` | `bg-surface-dim` | `#F1F5F9` (Slate 100) | `#070C16` (Deep Obsidian) | Recessed background areas |
| `surface-bright` | `bg-surface-bright` | `#FFFFFF` (Pure White) | `#1E293B` (Slate 800) | Elevated highlighted canvas |
| `surface-container-lowest` | `bg-surface-container-lowest` | `#FFFFFF` (Pure White) | `#0F172A` (Slate 900) | Primary card & table backgrounds |
| `surface-container-low` | `bg-surface-container-low` | `#F8FAFC` (Slate 50) | `#131D33` (Slate 900 tint) | Input backgrounds & table headers |
| `surface-container` | `bg-surface-container` | `#F1F5F9` (Slate 100) | `#1E293B` (Slate 800) | Standard container surfaces |
| `surface-container-high` | `bg-surface-container-high` | `#E2E8F0` (Slate 200) | `#283548` (Slate 750) | Hover backgrounds & borders |
| `surface-container-highest` | `bg-surface-container-highest`| `#CBD5E1` (Slate 300) | `#334155` (Slate 700) | Inactive switch tracks & chip fills |
| `surface-variant` | `bg-surface-variant` | `#F1F5F9` (Slate 100) | `#1E293B` (Slate 800) | Alternate surface treatment |
| `surface-tint` | `text-surface-tint` | `#2563EB` | `#3B82F6` | Primary tint overlay |
| `outline` | `border-outline` | `#E2E8F0` (Slate 200) | `#1E293B` (Slate 800) | Default card & input borders |
| `outline-variant` | `border-outline-variant` | `#CBD5E1` (Slate 300) | `#334155` (Slate 700) | Emphasized or active borders |
| `on-surface` | `text-on-surface` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Primary high-contrast text |
| `on-surface-variant` | `text-on-surface-variant`| `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Secondary metadata & hint text |

---

### 2.2 Brand & Status Color Tokens

| Semantic Role | Token Name | Light Mode Hex | Dark Mode Hex | Usage in Application |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Brand** | `primary` | `#2563EB` | `#3B82F6` | Primary action buttons, active navigation, brand marks |
| **Primary Hover** | `primary-hover` | `#1D4ED8` | `#60A5FA` | Hover state for primary buttons |
| **Primary Active** | `primary-active` | `#1E40AF` | `#2563EB` | Active pressed state for primary actions |
| **Primary Container** | `primary-container` | `#EFF6FF` | `#1E3A8A` | Secondary buttons, selection pills, input focus rings |
| **On-Primary Container** | `on-primary-container` | `#1E40AF` | `#DBEAFE` | High-contrast text on primary container backgrounds |
| **Inverse Primary** | `inverse-primary` | `#93C5FD` | `#1D4ED8` | Contrasting accents on reversed surfaces |
| **Secondary (Verified)** | `secondary` | `#10B981` | `#10B981` | Verification checkmarks, success toasts, live metrics |
| **Secondary Container** | `secondary-container` | `#ECFDF5` | `#064E3B` | Verified badge backgrounds, positive delta indicators |
| **On-Secondary Container**| `on-secondary-container` | `#047857` | `#A7F3D0` | Text within verified badges |
| **Tertiary (Attention)** | `tertiary` | `#F59E0B` | `#F59E0B` | Category badges, alerts, warning toasts, feedback hearts |
| **Tertiary Container** | `tertiary-container` | `#FEF3C7` | `#451A03` | Amber badge backgrounds, warning cards |
| **On-Tertiary Container** | `on-tertiary-container` | `#B45309` | `#FDE68A` | Text within amber badges |
| **Error (Destructive)** | `error` | `#EF4444` | `#F87171` | Delete actions, destructive dialogs, error toasts |
| **Error Container** | `error-container` | `#FEE2E2` | `#7F1D1D` | Error banners, invalid field badges |
| **On-Error Container** | `on-error-container` | `#991B1B` | `#FEE2E2` | Text inside error containers |

---

### 2.3 Dashboard Stat Card Themes

The dashboard dashboard uses four specialized color variants for KPI cards (`StatCard.tsx`), backed by live API metrics:

| Variant | Light Mode (Card / Icon / Badge) | Dark Mode (Card / Icon / Badge) | Representative Metric |
| :--- | :--- | :--- | :--- |
| **Amber** | `bg-amber-50/70 border-amber-200` <br/> `bg-amber-100 text-amber-700` | `bg-amber-950/20 border-amber-900/40` <br/> `bg-amber-900/50 text-amber-300` | **Total Categories** |
| **Blue** | `bg-[#EFF6FF] border-[#DBEAFE]` <br/> `bg-[#DBEAFE] text-[#1D4ED8]` | `bg-[#141F32] border-[#1E3252]` <br/> `bg-[#1E3252] text-[#93C5FD]` | **Verified Businesses** |
| **Purple** | `bg-[#F5F3FF] border-[#EDE9FE]` <br/> `bg-[#EDE9FE] text-[#6D28D9]` | `bg-[#1E1932] border-[#322752]` <br/> `bg-[#322752] text-[#C4B5FD]` | **Consumer Accounts** |
| **Mint (Emerald)**| `bg-[#ECFDF5] border-[#D1FAE5]` <br/> `bg-[#D1FAE5] text-[#047857]` | `bg-[#12261E] border-[#1C3E30]` <br/> `bg-[#1C3E30] text-[#6EE7B7]` | **Feedback Received** |

---

## 3. Typography Hierarchy

QuickBihar dashboard combines modern geometric sans fonts for high visual punch and effortless administrative scanning:

1. **`Plus Jakarta Sans`** (`--font-sans`): Main UI, navigation, buttons, table data, and inputs.
2. **`Space Grotesk`** (`--font-display`): Brand titles, section headlines, KPI counters, and hero greeting headers.
3. **`Playfair Display`**: Available for selective editorial emphasis or high-tier enterprise statements.

### Typography Scale

| Token | CSS Utility | Size | Line Height | Letter Spacing | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `text-display` | `96px` | `104px` | `-0.04em` | `600` | Hero visual anchor |
| **Headline Large** | `text-headline-lg` | `48px` | `56px` | `-0.02em` | `600` | Major page banners & landing titles |
| **Headline Medium**| `text-headline-md` | `24px` | `32px` | `-0.01em` | `600` | Module & page headers (`h1`) |
| **Title Large** | `text-title-lg` | `20px` | `28px` | Normal | `600` | Card headers, table titles, modal titles |
| **Body Large** | `text-body-lg` | `16px` | `24px` | Normal | `400` | Descriptive introductions, callouts |
| **Body Medium** | `text-body-md` | `14px` | `20px` | Normal | `400` | Default body copy, table cell content |
| **Label Medium** | `text-label-md` | `14px` | `20px` | `+0.01em` | `500` | Button labels, form labels, menu items |
| **Label Small** | `text-label-sm` | `12px` | `16px` | `+0.02em` | `500` | Badges, table headers (`th`), helper text |

---

## 4. Shapes & Border Radius

The shape language utilizes smooth geometric rounding:

| Token | CSS Variable | Value | Implementation Examples |
| :--- | :--- | :--- | :--- |
| `rounded-sm` | `--radius-sm` | `0.375rem` (6px) | Checkboxes, dropdown menu items |
| `rounded-default`| `--radius-default` | `0.625rem` (10px) | Text inputs, select triggers, table controls |
| `rounded-md` | `--radius-md` | `0.75rem` (12px) | Navigation links, sub-panels |
| `rounded-lg` | `--radius-lg` | `1.0rem` (16px) | Primary buttons, standard cards, modals |
| `rounded-xl` | `--radius-xl` | `1.25rem` (20px) | Brand mark logo container, SideNav items |
| `rounded-2xl` | `--radius-2xl` | `1.5rem` (24px) | Metric stat cards, hero banners, auth inputs |
| `rounded-3xl` | `--radius-3xl` | `1.75rem` (28px) | Floating auth cards, directory containers |
| `rounded-full` | `--radius-full` | `9999px` | Badges, user avatars, pill action buttons |

---

## 5. Elevation & Shadows

Shadows provide tactile depth without visual clutter:

### Light Mode
- **`shadow-sm`**: `0 1px 3px rgba(15, 23, 42, 0.05)` — Subtle separation for buttons and navigation bars.
- **`shadow-md`**: `0 4px 12px rgba(15, 23, 42, 0.07)` — Standard card elevation, table wrappers.
- **`shadow-lg`**: `0 12px 30px rgba(15, 23, 42, 0.09)` — Modals, popovers, card hover elevations.
- **`shadow-focus-ring`**: `0 0 0 3px rgba(37, 99, 235, 0.25)` — Accessible outline for interactive focus states.

### Dark Mode
- **`shadow-sm`**: `0 1px 3px rgba(0, 0, 0, 0.5)`
- **`shadow-md`**: `0 4px 14px rgba(0, 0, 0, 0.6)`
- **`shadow-lg`**: `0 12px 32px rgba(0, 0, 0, 0.7)`
- **`shadow-focus-ring`**: `0 0 0 3px rgba(59, 130, 246, 0.35)`

---

## 6. Layout & Grid Architecture

### Master Structure
- **Sidebar (`SideNav.tsx`)**:
  - Desktop: Fixed left position, width `72` (`18rem` / `288px`), `z-50`.
  - Content offset: `xl:ml-72`.
  - Mobile: Slide-over drawer toggled via mobile menu trigger with backdrop click-outside dismissal.
  - Active route: Filled Royal Blue (`bg-blue-600 font-semibold text-white shadow-sm shadow-blue-500/25`).
- **Header (`header`)**:
  - Sticky top: `sticky top-0 z-30 h-16` (64px).
  - Background: Frosted translucent glass (`bg-white/90 backdrop-blur-md dark:bg-[#0F172A]/90`).
  - Contains responsive drawer trigger, live formatted date, and `UserMenu` profile dropdown with theme switcher.
- **Content Container (`container-page`)**:
  - Max Width: `1280px` (`--container-page`).
  - Padding: `p-4 md:p-6 lg:p-8`.
- **Footer (`Footer.tsx`)**:
  - Subtle copyright and attribution with tertiary heart icon.

---

## 7. Core Component Specifications

### 7.1 Buttons (`src/components/ui/button.tsx` & `.btn-*`)
- **Primary**: Solid blue (`bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active`). 36px min-height, 6px 15px padding, rounded-lg, label-md font.
- **Secondary**: Soft tint (`bg-primary-container text-primary hover:bg-primary-fixed-dim`).
- **Ghost**: Transparent (`hover:bg-surface-container-low text-on-surface`).
- **Outline**: Clean border (`border border-outline bg-surface text-on-surface hover:bg-surface-container-low`).
- **Destructive**: Alert red (`bg-error text-on-error hover:brightness-95`).
- **Success**: Emerald green (`bg-emerald-600 text-white hover:bg-emerald-700`).

### 7.2 Cards & Surfaces (`src/components/ui/card.tsx` & `.card`)
- Base surface: `bg-surface-container-lowest border border-outline rounded-lg p-4 shadow-md`.
- Interactive hover: `transition: all 0.2s ease; hover:bg-surface-container-low hover:shadow-lg`.
- No top accent bars/borders on cards — ever. Card hierarchy comes from
  surface, border, icon tiles, and typography, not decorative top strips.

### 7.3 Data Tables (`src/components/ui/data-table.tsx`)
- Powered by `@tanstack/react-table` v9 with animated row entrances via `framer-motion`.
- Top Action Bar: Search input, CSV download, print-ready view generator, and column visibility toggle dropdown.
- Header (`th`): `bg-surface-container-low text-label-sm font-medium text-on-surface-variant`.
- Rows (`tr`): `border-b border-outline hover:bg-surface-container-low transition-colors`.
- Scroll Container: `@utility scrollbar-hide` with `scrollbar-gutter: stable` to eliminate layout shift on data load.

### 7.4 Form Inputs & Controls
- **Input (`input.tsx`)**: `h-9 rounded-default border border-outline bg-surface-container-low px-3 py-2 text-body-md text-on-surface focus:border-primary focus:shadow-focus-ring`.
- **Select (`select.tsx`)**: Popover dropdown with animated zoom-in, item check indicators, and scroll buttons.
- **Switch (`switch.tsx`)**: Emerald active fill (`data-[state=checked]:bg-emerald-600`) with smooth sliding circular thumb.
- **Checkbox (`checkbox.tsx`)**: Rounded 4px, primary blue fill on check (`data-[state=checked]:bg-primary`).

### 7.5 Badges (`src/components/ui/badge.tsx`)
- Pill shape (`rounded-full`), `px-3 py-1`, `text-label-sm font-medium`.
- Variants:
  - `secondary`: Emerald tint (`bg-secondary-container text-on-secondary-container`).
  - `accent`: Amber tint (`bg-tertiary-container text-on-tertiary-container`).
  - `primary`: Blue tint (`bg-primary-container text-on-primary-container`).
  - `success`: Emerald solid badge (`bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200`).
  - `destructive`: Red tint (`bg-error-container text-on-error-container`).

---

## 8. Do's and Don'ts

### Do
- **Do use Electric Royal Blue (`#2563EB`)** as the primary interactive anchor for main CTAs, active route indicators, and brand marks.
- **Do use Verified Emerald (`#10B981`)** strictly for verification badges, success indicators, and verified business statuses.
- **Do support both Light and Dark themes** using CSS tokens (`bg-surface`, `text-on-surface`, `border-outline`) or Tailwind's `dark:` variant.
- **Do keep interactive heights aligned**: standard buttons and form inputs should respect 36px–40px heights with 10px–16px border-radii.
- **Do use `scrollbar-hide` and `scrollbar-gutter: stable`** on data tables to prevent horizontal bounce or jumping when data updates.

### Don't
- **Don't hardcode arbitrary colors** when a semantic token exists (use `bg-primary`, `bg-surface-container-lowest`, `border-outline`).
- **Don't use pure `#000000` for dark backgrounds**; use QuickBihar's calibrated `#0B1120` (Midnight Navy) and `#0F172A` (Slate 900) to maintain subtle depth and avoid eye strain.
- **Don't expose raw phone numbers or personal contacts** in UI copy or layouts—QuickBihar is fundamentally built as a **Privacy-First Marketplace**.
- **Don't mix mismatched border radii** on adjacent elements—pair `rounded-default` (10px) inputs with `rounded-lg` (16px) or `rounded-full` CTA buttons.
