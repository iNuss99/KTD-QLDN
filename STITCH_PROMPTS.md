# Google Stitch UI Prompts - TechRetail Enterprise ERP

This document contains precise text prompts optimized for Google Stitch, generated directly from the `PRD.md` file. You can copy and paste these directly into Google Stitch to generate the UI screens.

All prompts follow the "The Silicon Valley High-End" design philosophy and enforce the specified design tokens (Tailwind classes).

---

## Page 1: Dashboard Overview

```text
Dashboard overview for Enterprise Users and Store Managers

Key Features:
- Top metrics row showing KPI cards horizontally (Flex-row).
- Charts section visualizing revenue and activity data.
- Integrate core UI components: primary and outline buttons, and status badges (success, warning, danger with 10-15% background opacity).

Visual Style:
- Colors: Primary indigo-600, App background slate-50, Card background white, Sidebar slate-900, Main text slate-900, Muted text/labels slate-500.
- Borders & Shadows: Global radius rounded-md (6px max), global thin border border-slate-200. Minimal shadows: use shadow-sm for cards. No drop shadows.
- Icons: Lucide React or Heroicons.
- Design aesthetic: "The Silicon Valley High-End" - Flat, thin borders, data-dense, minimalist. Component-based architecture.

Platform: Responsive web (desktop-first)
```

---

## Page 2: Employee Management (List & Modal)

```text
Employee Management List and Modal for Admins

Key Features:
- Data table listing employees with pagination. Table MUST have Zebra Striping (e.g., even row bg-slate-50), small text (text-sm), and compact padding to optimize data density.
- Add Employee Modal popup. The modal MUST have a small avatar/image upload field placed directly beside the First and Last Name inputs.
- Form inputs inside modal: Label must be placed above the input using small size (text-sm) and muted color (slate-500). Input fields must have thin borders and focus state with a blue ring (focus:ring-1 focus:ring-indigo-500).

Visual Style:
- Colors: Primary indigo-600, App background slate-50, Card/Modal background white, Text main slate-900, Text muted slate-500.
- Borders & Shadows: Global radius rounded-md (6px), thin borders border-slate-200. Modal must use shadow-xl, while underlying cards/table use shadow-sm.
- Icons: Lucide React or Heroicons.
- Design aesthetic: "The Silicon Valley High-End" - Flat, data-dense, minimalist.

Platform: Responsive web (desktop-first)
```

---

## Page 3: Permission Matrix

```text
Permission Matrix for Admins

Key Features:
- Grid matrix layout displaying permissions using Checkboxes.
- The table must have sticky headers for the column titles (Admin, Manager, Staff).
- Data table styling: zebra striping, small text (text-sm), and minimal padding for maximum data density.

Visual Style:
- Colors: Primary indigo-600, App background slate-50, Card/Table background white, Text main slate-900.
- Borders & Shadows: Global radius rounded-md (6px), thin borders border-slate-200. shadow-sm for containers.
- Icons: Lucide React or Heroicons.
- Design aesthetic: "The Silicon Valley High-End" - Flat, data-dense, minimalist.

Platform: Responsive web (desktop-first)
```

---

## Page 4: Finance & Reports

```text
Finance & Reports dashboard for Enterprise Users

Key Features:
- 2-column layout section.
- Left column: Donut chart visualizing financial data.
- Right column: Descriptive labels and legend corresponding to the donut chart.

Visual Style:
- Colors: Primary indigo-600, App background slate-50, Card background white, Text main slate-900, Text muted slate-500.
- Borders & Shadows: Global radius rounded-md (6px), thin borders border-slate-200, shadow-sm for cards.
- Icons: Lucide React or Heroicons.
- Design aesthetic: "The Silicon Valley High-End" - Flat, thin borders, data-dense, minimalist.

Platform: Responsive web (desktop-first)
```
