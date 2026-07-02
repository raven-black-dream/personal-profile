# Design Decisions: Modern Goth Aesthetic

**Source:** `planning_doc.md`
**Date:** 2025-07-20

---

## 1. Guiding Principles & Aesthetic

The overall aesthetic will be a "Modern Goth" theme, aiming for a look that is moody, sophisticated, and professional.

- **Primary Theme:** Dark Mode First. A light mode will be a secondary goal.
- **General Style:** Sharp, 90-degree corners on containers (cards, buttons) will be used instead of rounded corners to create a more intentional, severe look.

## 2. Color Palette (Dark Mode)

This project will use the default Tailwind CSS color palette to ensure consistency and ease of use.

- **Background:** `zinc-950` (e.g., `bg-zinc-950`). For slightly lighter surfaces like cards, `zinc-900` can be used.
- **Text:** `neutral-200` (e.g., `text-neutral-200`).
- **Accent:** `rose-900` (for a crimson look) or `purple-900` (for a plum look). These will be used for buttons, links, and interactive highlights.

## 3. Color Palette (Light Mode)

To ensure a polished and professional light theme, the following palette was established:

- **Background:** `zinc-50`
- **Text:** `zinc-950`
- **Borders & Inputs:** `zinc-300` (Provides clear but subtle definition).
- **Primary Accent:** `rose-700` (A deeper, more refined crimson for accents).

## 4. Hero Section Styling

To make the Hero section stand out and create an atmospheric focal point, a subtle radial gradient was added to its background.

- **Implementation:** `background: radial-gradient(ellipse at center, oklch(from var(--primary) l c h / 15%) 0%, var(--background) 70%);`
- **Rationale:** This creates a soft, red-tinged glow that emanates from the center, drawing the eye to the main heading while reinforcing the "Modern Goth" aesthetic. It provides visual separation from the subsequent sections without creating hard lines.

## 5. Typography

- **Headings:** Lora (A sharp, elegant serif font).
- **Body Text:** Lora (or a clean, complementary sans-serif like Lato if readability becomes an issue).
