# Profile Page Brand Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the SvelteKit personal-profile site to the Evan Harley Design System (IBM Plex fonts, Deep Emerald accent, warm-charcoal/warm-paper neutrals, restrained radii, dark as the default theme) with zero copy/content/behavior changes.

**Architecture:** The site already uses the shadcn-svelte `@theme inline` pattern — Tailwind v4 color/radius/font utilities resolve to CSS custom properties declared in `src/app.css`, and every component consumes semantic utilities (`bg-background`, `text-muted-foreground`, `<Button>` variants, `rounded-md`/`rounded-xl`). The dominant change is therefore a **single token remap in `src/app.css`** that propagates to all components automatically. A per-component audit confirms nothing bypasses the token layer, and a one-line `ModeWatcher` change makes dark the default theme.

**Tech Stack:** SvelteKit, Svelte 5 (runes), Tailwind CSS v4, shadcn-svelte (bits-ui), tailwind-variants, mode-watcher, @lucide/svelte. IBM Plex via Google Fonts CDN `@import`. Verification: `svelte-check`, `prettier`, `eslint`, `vite build`, and the `dogfood` skill (agent-browser).

## Global Constraints

- **Visual change only** — no copy, headline, section content, routing, data, SEO, or component-API/behavior changes (the sole behavior change is the `ModeWatcher` default-theme prop required by FR5). Source: spec "Out of Scope".
- **Accent = Deep Emerald** `#1FA37A` on dark, `#157A57` on light (AA). No rose/pink may remain anywhere. Source: spec FR2/AC2.
- **Backgrounds never pure black / pure zinc.** Dark uses the warm-charcoal ramp (`#0E0F11`…`#2A2E34`), text warm off-white `#F5F3EF`; light uses warm paper `#FAF8F4`. Source: spec FR3/AC3.
- **Radii restrained** — controls ≈5px, cards ≈12px; not 0, not pill-round for cards. Source: spec FR4/AC4.
- **Fonts = IBM Plex superfamily** via the exact CDN `@import` from the design system; body renders IBM Plex Sans; graceful fallback to system sans (never Lora) on CDN failure. Source: spec FR1/AC1.
- **Dark is the default theme** on first load even on a light-mode OS; the toggle still switches to a brand-aligned light theme and the choice persists. Source: spec FR5/AC5.
- **No new motion**; existing transitions stay calm and respect `prefers-reduced-motion`. Source: spec Edge Cases.
- **Design-system source of truth (read-only reference):** `/home/evan/Documents/Claude/Projects/Consultancy/design-system/` — `tokens/colors.css`, `tokens/fonts.css`, `tokens/typography.css`, `tokens/spacing.css`, `readme.md`, `ui_kits/website/index.html`.
- **Quality gate (no unit-test framework exists):** `npm run check && npm run lint && npm run build` must all pass. This is the project's only static gate; do not invent a unit-test framework. Source: spec AC8/AC9 + Testing Guidelines.

## Token mapping reference (authoritative for Task 1)

This project's `:root` block is the **light** theme and the `.dark` block is the **dark** theme (mode-watcher toggles the `.dark` class on `<html>`). Map shadcn semantic tokens onto Evan Harley Design System tokens as follows. **Gotcha:** shadcn's `--accent` is a neutral _hover surface_, NOT the brand accent — the brand accent is `--primary`. Keep them distinct.

**Dark theme (`.dark`, the default):**

| shadcn token                   | value                                             | EH source                                 |
| ------------------------------ | ------------------------------------------------- | ----------------------------------------- |
| `--background`                 | `#0E0F11`                                         | ink-900 / bg-base                         |
| `--foreground`                 | `#F5F3EF`                                         | paper-50 / text-strong                    |
| `--card`                       | `#191B1F`                                         | ink-750 / surface-card                    |
| `--card-foreground`            | `#F5F3EF`                                         | text-strong                               |
| `--popover`                    | `#16181B`                                         | ink-800                                   |
| `--popover-foreground`         | `#F5F3EF`                                         | text-strong                               |
| `--primary`                    | `#1FA37A`                                         | emerald-500 (brand accent)                |
| `--primary-foreground`         | `#04150E`                                         | text-on-accent                            |
| `--secondary`                  | `#1F2227`                                         | ink-700 / surface-raised                  |
| `--secondary-foreground`       | `#F5F3EF`                                         | text-strong                               |
| `--muted`                      | `#16181B`                                         | ink-800                                   |
| `--muted-foreground`           | `#9A9DA3`                                         | text-muted                                |
| `--accent`                     | `#1F2227`                                         | surface-raised (hover surface, NOT brand) |
| `--accent-foreground`          | `#F5F3EF`                                         | text-strong                               |
| `--destructive`                | `#D2685E`                                         | red-500                                   |
| `--border`                     | `rgba(255,255,255,0.08)`                          | border-subtle                             |
| `--input`                      | `rgba(255,255,255,0.12)`                          | between subtle/strong                     |
| `--ring`                       | `rgba(31,163,122,0.42)`                           | emerald-ring / focus-ring                 |
| `--chart-1..5`                 | `#1FA37A` `#D08C4A` `#8E9BC4` `#C9A45B` `#C98BA6` | dv-1..5 (dark)                            |
| `--sidebar`                    | `#16181B`                                         | ink-800                                   |
| `--sidebar-foreground`         | `#F5F3EF`                                         | text-strong                               |
| `--sidebar-primary`            | `#1FA37A`                                         | emerald-500                               |
| `--sidebar-primary-foreground` | `#04150E`                                         | text-on-accent                            |
| `--sidebar-accent`             | `#1F2227`                                         | surface-raised                            |
| `--sidebar-accent-foreground`  | `#F5F3EF`                                         | text-strong                               |
| `--sidebar-border`             | `rgba(255,255,255,0.08)`                          | border-subtle                             |
| `--sidebar-ring`               | `rgba(31,163,122,0.42)`                           | focus-ring                                |

**Light theme (`:root`):**

| shadcn token                   | value                                             | EH source                  |
| ------------------------------ | ------------------------------------------------- | -------------------------- |
| `--background`                 | `#FAF8F4`                                         | bg-base (light)            |
| `--foreground`                 | `#1A1B1E`                                         | text-strong (light)        |
| `--card`                       | `#FFFFFF`                                         | surface-card (light)       |
| `--card-foreground`            | `#1A1B1E`                                         | text-strong                |
| `--popover`                    | `#FFFFFF`                                         | surface-card               |
| `--popover-foreground`         | `#1A1B1E`                                         | text-strong                |
| `--primary`                    | `#157A57`                                         | emerald-600 (AA on paper)  |
| `--primary-foreground`         | `#FFFFFF`                                         | text-on-accent (light)     |
| `--secondary`                  | `#F1EEE8`                                         | bg-section (light)         |
| `--secondary-foreground`       | `#1A1B1E`                                         | text-strong                |
| `--muted`                      | `#F1EEE8`                                         | bg-section                 |
| `--muted-foreground`           | `#63666C`                                         | text-muted (light)         |
| `--accent`                     | `#F1EEE8`                                         | bg-section (hover surface) |
| `--accent-foreground`          | `#1A1B1E`                                         | text-strong                |
| `--destructive`                | `#B14B42`                                         | red (light)                |
| `--border`                     | `rgba(20,18,14,0.10)`                             | border-subtle (light)      |
| `--input`                      | `rgba(20,18,14,0.14)`                             | between subtle/strong      |
| `--ring`                       | `rgba(31,163,122,0.40)`                           | focus-ring (light)         |
| `--chart-1..5`                 | `#157A57` `#9A6A2E` `#5B6B9E` `#9A7A2E` `#A6597A` | dv-1..5 (light)            |
| `--sidebar`                    | `#F1EEE8`                                         | bg-section                 |
| `--sidebar-foreground`         | `#1A1B1E`                                         | text-strong                |
| `--sidebar-primary`            | `#157A57`                                         | emerald-600                |
| `--sidebar-primary-foreground` | `#FFFFFF`                                         | text-on-accent             |
| `--sidebar-accent`             | `#F1EEE8`                                         | bg-section                 |
| `--sidebar-accent-foreground`  | `#1A1B1E`                                         | text-strong                |
| `--sidebar-border`             | `rgba(20,18,14,0.10)`                             | border-subtle              |
| `--sidebar-ring`               | `rgba(31,163,122,0.40)`                           | focus-ring                 |

**Radius:** set `--radius: 0.5rem` (8px). The existing `@theme inline` formulas then yield: `--radius-sm` = 4px, `--radius-md` = 6px (used by Button/Badge → "controls ≈5px"), `--radius-lg` = 8px (placeholder image box), `--radius-xl` = 12px (used by Card → "cards ≈12px"). This satisfies AC4 (controls restrained, cards 12px, nothing 0 or pill-round). Leave the four `calc()` formulas unchanged — only the `--radius` base value changes.

**Fonts:** replace the Lora `@import` (line 1) with the exact IBM Plex line from `tokens/fonts.css`; add `--font-sans`/`--font-mono`/`--font-serif` to `@theme inline` so Tailwind `font-sans`/`font-mono`/`font-serif` utilities resolve to Plex; set `body { font-family: var(--font-sans); }` (with a system-sans fallback stack, never Lora).

---

### Task 1: Token remap in `src/app.css` (foundational)

This is the dominant change. It re-points every Tailwind semantic utility already in use across the app onto the Evan Harley tokens, so most components need no edits at all. Do this first.

**Files:**

- Modify: `src/app.css` (font import line 1; `:root` light block; `.dark` dark block; `body` font-family; `@theme inline` radius base + new font tokens)

**Interfaces:**

- Consumes: nothing (foundational).
- Produces: the remapped CSS custom properties (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-1..5`, `--sidebar-*`, `--radius`) and the Tailwind font tokens (`--font-sans`, `--font-mono`, `--font-serif`) that every later task and component relies on. Values are exactly as listed in the "Token mapping reference" above.

- [ ] **Step 1: Replace the Lora font import with the IBM Plex superfamily import**

In `src/app.css`, replace line 1:

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap');
```

with the exact line from the design system's `tokens/fonts.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;1,400&display=swap');
```

Leave the `@import "tailwindcss";`, `@import "tw-animate-css";`, and `@custom-variant dark (&:is(.dark *));` lines untouched.

- [ ] **Step 2: Remap the `:root` (light theme) tokens**

Replace the entire `:root { ... }` block (lines 9–43) with:

```css
:root {
	--radius: 0.5rem;
	/* Evan Harley Design System — light theme (warm paper, for printed deliverables) */
	--background: #faf8f4;
	--foreground: #1a1b1e;
	--card: #ffffff;
	--card-foreground: #1a1b1e;
	--popover: #ffffff;
	--popover-foreground: #1a1b1e;
	--primary: #157a57;
	--primary-foreground: #ffffff;
	--secondary: #f1eee8;
	--secondary-foreground: #1a1b1e;
	--muted: #f1eee8;
	--muted-foreground: #63666c;
	--accent: #f1eee8;
	--accent-foreground: #1a1b1e;
	--destructive: #b14b42;
	--border: rgba(20, 18, 14, 0.1);
	--input: rgba(20, 18, 14, 0.14);
	--ring: rgba(31, 163, 122, 0.4);
	--chart-1: #157a57;
	--chart-2: #9a6a2e;
	--chart-3: #5b6b9e;
	--chart-4: #9a7a2e;
	--chart-5: #a6597a;
	--sidebar: #f1eee8;
	--sidebar-foreground: #1a1b1e;
	--sidebar-primary: #157a57;
	--sidebar-primary-foreground: #ffffff;
	--sidebar-accent: #f1eee8;
	--sidebar-accent-foreground: #1a1b1e;
	--sidebar-border: rgba(20, 18, 14, 0.1);
	--sidebar-ring: rgba(31, 163, 122, 0.4);
}
```

- [ ] **Step 3: Remap the `.dark` (dark theme, default) tokens**

Replace the entire `.dark { ... }` block (lines 45–77) with:

```css
.dark {
	/* Evan Harley Design System — dark theme (primary). Warm charcoal, never pure black. */
	--background: #0e0f11;
	--foreground: #f5f3ef;
	--card: #191b1f;
	--card-foreground: #f5f3ef;
	--popover: #16181b;
	--popover-foreground: #f5f3ef;
	--primary: #1fa37a;
	--primary-foreground: #04150e;
	--secondary: #1f2227;
	--secondary-foreground: #f5f3ef;
	--muted: #16181b;
	--muted-foreground: #9a9da3;
	--accent: #1f2227;
	--accent-foreground: #f5f3ef;
	--destructive: #d2685e;
	--border: rgba(255, 255, 255, 0.08);
	--input: rgba(255, 255, 255, 0.12);
	--ring: rgba(31, 163, 122, 0.42);
	--chart-1: #1fa37a;
	--chart-2: #d08c4a;
	--chart-3: #8e9bc4;
	--chart-4: #c9a45b;
	--chart-5: #c98ba6;
	--sidebar: #16181b;
	--sidebar-foreground: #f5f3ef;
	--sidebar-primary: #1fa37a;
	--sidebar-primary-foreground: #04150e;
	--sidebar-accent: #1f2227;
	--sidebar-accent-foreground: #f5f3ef;
	--sidebar-border: rgba(255, 255, 255, 0.08);
	--sidebar-ring: rgba(31, 163, 122, 0.42);
}
```

- [ ] **Step 4: Set the body font to IBM Plex Sans with a safe fallback**

Replace the `body { font-family: 'Lora', serif; }` block (lines 79–81) with:

```css
body {
	font-family: var(--font-sans);
}
```

(The `--font-sans` token defined in Step 5 already ends in `ui-sans-serif, system-ui, ...` so a CDN failure falls back to system sans, never Lora.)

- [ ] **Step 5: Add font-family tokens to the `@theme inline` block**

In the `@theme inline { ... }` block, leave the four `--radius-*` `calc()` lines exactly as they are (they now derive 4/6/8/12px from `--radius: 0.5rem`). Immediately after the `--radius-xl` line, add:

```css
--font-sans: 'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-serif: 'IBM Plex Serif', ui-serif, Georgia, 'Times New Roman', serif;
--font-mono: 'IBM Plex Mono', ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace;
```

Leave the rest of the `@theme inline` color mappings (`--color-background: var(--background)` etc.) unchanged — they already point at the tokens you remapped.

- [ ] **Step 6: Run the static quality gate**

Run: `npm run check && npm run lint && npm run build`
Expected: all three PASS. If `npm run lint` reports prettier formatting diffs in `src/app.css`, run `npm run format` and re-run the gate. Expected end state: PASS with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app.css
git commit -m "feat(brand): remap design tokens to Evan Harley Design System (fonts, emerald accent, warm neutrals, radii)"
```

---

### Task 2: Make dark the default theme (`ModeWatcher`)

**Files:**

- Modify: `src/routes/+layout.svelte`

**Interfaces:**

- Consumes: the remapped `.dark` tokens from Task 1.
- Produces: dark-by-default first-load behavior; the existing `toggleMode` toggle in `DarkModeToggle.svelte` continues to switch + persist (unchanged).

- [ ] **Step 1: Confirm the mode-watcher default-mode prop name**

`mode-watcher` v1's `<ModeWatcher>` accepts a `defaultMode` prop of `'dark' | 'light' | 'system'` (default `'system'`). Verify by checking the installed package's types:

Run: `grep -rn "defaultMode" node_modules/mode-watcher/dist/ | head`
Expected: a match showing `defaultMode` is a supported prop. If the prop name differs in the installed version, use the name reported by the types (do not guess). This is a library API, not Svelte core — no `mcp__svelte__*` lookup needed.

- [ ] **Step 2: Set dark as the default mode**

In `src/routes/+layout.svelte`, change:

```svelte
<ModeWatcher />
```

to:

```svelte
<ModeWatcher defaultMode="dark" />
```

Leave the rest of the file (imports, `Header`, `{@render children()}`) unchanged.

- [ ] **Step 3: Run the static quality gate**

Run: `npm run check && npm run lint && npm run build`
Expected: all three PASS.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat(brand): default to dark theme via ModeWatcher (design system is dark-primary)"
```

---

### Task 3: Per-component brand audit & hero glow confirmation

The token architecture means most components inherit the brand automatically through Task 1. This task is an explicit section-by-section audit to (a) confirm no component hardcodes an off-brand color, the Lora font, or a non-token radius, and (b) verify the hero glow reads as a single soft emerald glow now that `--primary` is emerald. Fix only what the audit turns up. Touch the `ui/` primitives only if they carry hardcoded brand values.

**Files (audit; modify only if a finding requires it):**

- `src/lib/components/sections/HeroSection.svelte`
- `src/lib/components/layout/Header.svelte`
- `src/lib/components/custom/DarkModeToggle.svelte`
- `src/lib/components/sections/AboutMeSection.svelte`
- `src/lib/components/sections/SkillsSection.svelte`
- `src/lib/components/sections/FeaturedProjectsSection.svelte`
- `src/lib/components/sections/ContactSection.svelte`
- `src/lib/components/ui/button/button.svelte`
- `src/lib/components/ui/card/card.svelte`
- `src/lib/components/ui/badge/badge.svelte`

**Interfaces:**

- Consumes: all remapped tokens from Task 1 (`bg-background`, `text-muted-foreground`, `bg-card`, `border-primary`, `rounded-md`, `rounded-lg`, `rounded-xl`, `bg-primary`, etc.).
- Produces: brand-conformant components with no token-bypassing literals; a verified soft-emerald hero glow.

- [ ] **Step 1: Grep the components for token-bypassing literals**

Run:

```bash
grep -rnE "Lora|#[0-9a-fA-F]{3,8}|rose|pink|oklch|font-(serif|mono)|radial-gradient" src/lib/components src/routes
```

Expected findings and how to treat each:

- `HeroSection.svelte` — `radial-gradient(... oklch(from var(--primary) l c h / 15%) ...)`. This is **token-derived** (it reads l/c/h from `--primary`, now emerald) — keep it; it is handled in Step 2.
- No `Lora`, no `rose`/`pink`, no raw hex brand colors, no `font-serif`/`font-mono` overrides should appear in any component. If any DO appear, replace them with the equivalent semantic Tailwind utility (`bg-primary`, `text-muted-foreground`, `bg-card`, `border-border`, `rounded-md`/`rounded-xl`) — note each fix in the commit body. (Based on current source, only the hero gradient is expected.)

- [ ] **Step 2: Confirm/soften the hero glow to read as a single soft emerald glow**

Open `src/lib/components/sections/HeroSection.svelte`. The `<style>` block contains:

```css
.hero-section {
	background: radial-gradient(
		ellipse at center,
		oklch(from var(--primary) l c h / 15%) 0%,
		var(--background) 70%
	);
}
```

Because `--primary` is now `#1FA37A`, the `oklch(from var(--primary) ...)` glow already follows the emerald accent. Confirm in Step 4's browser pass that it renders as one soft centered glow (not a hard ring). Only if the browser pass shows it reading as a hard ring or too-saturated halo, soften it to:

```css
.hero-section {
	background: radial-gradient(
		ellipse at center,
		oklch(from var(--primary) l c h / 12%) 0%,
		var(--background) 72%
	);
}
```

Do not change the gradient shape further (out of scope: pixel-cloning the reference hero offset). Leave the markup (`<h1>`, lede `<p>`, the two `<Button>`s) unchanged.

- [ ] **Step 3: Confirm `ui/` primitives carry no hardcoded brand values**

Inspect `ui/button/button.svelte`, `ui/card/card.svelte`, `ui/badge/badge.svelte`. Confirm every variant uses semantic utilities (`bg-primary`, `bg-secondary`, `text-primary-foreground`, `border`, `rounded-md`, `rounded-xl`) — no raw hex, no rose, no Lora. Per the spec, **do not edit these** unless a hardcoded brand value is present (current source has none — Button uses `rounded-md`→6px controls, Card uses `rounded-xl`→12px, Badge uses `rounded-md`; all token-backed and on-brand). Record "no changes required" if clean. (Note: design-system tags use a 5px radius rather than pills, so leaving Badge at `rounded-md` is correct — do not force pill radius.)

- [ ] **Step 4: Browser smoke-check both themes (quick visual confirm)**

With `npm run dev` running, use the `dogfood` skill (agent-browser) to load `http://localhost:5173/`:

- Confirm first load is **dark** with warm-charcoal background (not pure black) and warm off-white text.
- Confirm primary buttons + the project-card hover border render **emerald**, no rose anywhere.
- Confirm the hero shows a single soft emerald glow.
- Toggle to light, confirm warm-paper background and darker emerald `#157A57`, then reload and confirm the choice persisted.
  (The full formal verification is Task 5; this is a fast sanity pass to catch regressions before committing.)

- [ ] **Step 5: Run the static quality gate**

Run: `npm run check && npm run lint && npm run build`
Expected: all three PASS. Run `npm run format` first if lint reports formatting diffs.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components
git commit -m "fix(brand): audit components for token conformance and confirm soft emerald hero glow"
```

---

### Task 4: Browser verification pass against the design system (dogfood)

Formal acceptance-criteria verification in a real browser, recording findings. This is the spec's primary verification method (no unit-test framework exists).

**Files:**

- No source changes expected. If a verification finding reveals a token/component defect, fix it in the relevant file from Task 1 or Task 3, re-run the static gate, and re-verify.

**Interfaces:**

- Consumes: the running dev server and the completed Tasks 1–3.
- Produces: a recorded findings list confirming AC1–AC7.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server on `http://localhost:5173/` (note the actual port if different).

- [ ] **Step 2: Verify the dark (default) theme against the design system**

Using the `dogfood` skill (agent-browser), open the site and the reference `ui_kits/website/index.html` / token specimens, and verify:

- **Fonts (AC1):** body computed `font-family` resolves to IBM Plex Sans; no Lora anywhere.
- **Accent (AC2):** buttons, focus ring, links, and hero glow render Deep Emerald `#1FA37A`; no rose/pink.
- **Neutrals (AC3):** page background is warm charcoal `#0E0F11` (not `#000`), cards `#191B1F`, text warm off-white `#F5F3EF`.
- **Radii (AC4):** controls ≈5–6px, cards 12px; nothing sharp-0 or pill-round for cards.
- Walk every section: Hero, AboutMe, FeaturedProjects, Skills, Contact, plus Header + DarkModeToggle.

- [ ] **Step 3: Verify the light theme and toggle persistence**

- Toggle to light; verify warm-paper `#FAF8F4` background, text `#1A1B1E`, accent darkened to `#157A57` (AC3, AC5, light-AA edge case).
- Reload the page; verify the light choice persisted (AC5).
- Verify dark is restored as default after clearing storage / first visit even on a light-mode OS (AC5 edge case).

- [ ] **Step 4: Regression watch**

- No layout breakage in either theme; no rose/Lora remnants (AC6).
- AA-legible contrast for muted text, borders, and cards in both themes (contrast edge case).
- `prefers-reduced-motion` respected — no new/bouncing motion introduced (motion edge case).

- [ ] **Step 5: Record findings (AC7)**

Summarize the pass/fail of each check above as the verification record (in the dogfood report / PR description). If any check failed, fix at the source token/component, re-run `npm run check && npm run lint && npm run build`, and re-verify the affected check.

- [ ] **Step 6: Final gate + commit (only if Step 5 required fixes)**

If fixes were made:
Run: `npm run check && npm run lint && npm run build` → Expected: PASS.

```bash
git add -A
git commit -m "fix(brand): address browser-verification findings"
```

If no fixes were needed, no commit — the verification record lives in the PR description.

---

## Self-Review

**Spec coverage:**

- FR1 (fonts → IBM Plex, body Plex Sans) → Task 1 Steps 1, 4, 5; verified Task 4 Step 2. ✓
- FR2 (accent → Deep Emerald, light `#157A57`) → Task 1 Steps 2, 3; verified Task 4 Steps 2, 3. ✓
- FR3 (warm-charcoal / warm-paper neutrals) → Task 1 Steps 2, 3; verified Task 4 Steps 2, 3. ✓
- FR4 (restrained radii via `--radius`) → Task 1 Step 2 (`--radius: 0.5rem`) + mapping note; verified Task 4 Step 2. ✓
- FR5 (dark as default) → Task 2; verified Task 4 Step 3. ✓
- FR6 (per-section audit & hero glow) → Task 3 (all listed components + ui primitives). ✓
- FR7 (visual verification vs design system) → Task 4. ✓
- AC1–AC7 → Task 4 Steps 2–5. AC8/AC9 (check/lint/build) → static gate in Tasks 1, 2, 3 and Task 4 Step 6. ✓
- Edge cases: light-AA (Task 4 Step 3), reduced-motion (Task 4 Step 4), prefers-color-scheme default-dark (Task 4 Step 3), hardcoded oklch follows accent (Task 3 Steps 1–2), font-flash fallback to system sans (Task 1 Steps 4–5), contrast on remapped tones (Task 4 Step 4). ✓
- Out of scope honored: no copy/routing/data/SEO changes; `/consulting` route untouched; no `.eh-*` adoption; CDN fonts kept. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N" — all token values and edits are spelled out verbatim. ✓

**Type/value consistency:** Token names and hex values in Task 1 match the mapping reference table and the values consumed by Tasks 3–4. `--radius: 0.5rem` consistently drives the 4/6/8/12px radii referenced in FR4 and Task 3/4. `defaultMode="dark"` consistent across Task 2 and Task 4 verification. ✓
