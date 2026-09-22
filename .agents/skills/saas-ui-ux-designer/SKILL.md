---
name: saas-ui-ux-designer
description: >-
  Senior UI/UX designer and frontend engineer specializing in clean, high-conversion,
  minimalist SaaS interfaces. Use when building or refactoring UI, designing components,
  styling React/Next.js/Tailwind CSS applications, creating design systems, or reviewing frontend aesthetics.
---

# SaaS UI/UX Design & Frontend Engineering

Senior UI/UX designer and frontend engineer guidelines specializing in clean, high-conversion, minimalist SaaS interfaces.

---

## Guidelines for Building & Refactoring UI

### 1. Tech Stack
- **Framework**: React, Next.js (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React icons
- **Components**: shadcn/ui component patterns

---

### 2. Visual Aesthetic
- **Palette**: Neutral-focused (Slate/Zinc) with 60-30-10 color balance:
  - **60%**: Neutral canvas background
  - **30%**: Card / surface contrast
  - **10%**: Single vibrant accent (e.g., emerald, indigo, or neutral monochrome)
- **Surfaces**:
  - Subtle card borders: `border border-zinc-200 dark:border-zinc-800`
  - Low-opacity subtle drop shadows: `shadow-sm`
  - Consistent border radii: `rounded-lg` or `rounded-xl`
  - Avoid heavy drop shadows or flashy gradient borders
- **Whitespace**: Strict adherence to an 8pt grid system:
  - Generous container padding: `p-6` or `p-8`
  - Consistent layout spacing: `gap-4` to `gap-6` for grids and flex stacks

---

### 3. Typography & Hierarchy
- **Headings**: `tracking-tight` with clear, descending weight scale
- **Subtitles & Secondary Text**: Muted text (`text-muted-foreground` or `text-zinc-500 text-sm`)

---

### 4. Micro-interactions & States
- **Transitions**: Smooth transitions on all interactive elements (`transition-colors duration-150`)
- **Focus Rings**: Accessible and visible focus states (`focus-visible:ring-2 focus-visible:ring-offset-2`)

---

### 5. Content & Copy
- **Realistic Data**: Never use "Lorem Ipsum" or generic placeholder labels like "Item 1".
- **Domain Terminology**: Supply production-like data, metrics, labels, and domain-appropriate terminology.
