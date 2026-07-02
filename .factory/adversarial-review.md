# Adversarial Review — Profile Page Brand Migration — PASS

Reviewer verdict: **PASS** (only nitpicks). I attacked every token value, the radius math, the keyed-each keys, the hero glow, the ModeWatcher change, and scope creep. Every design-system value is reproduced exactly, the keys are stable/unique, dark-default is wired correctly, and the diff introduces no out-of-scope changes and no new lint violations. Findings below are nitpicks, not defects.

---

## Verification of correctness (no defect found)

**Token values vs design system — exact match.** Cross-checked every value in `src/app.css` against `/home/evan/Documents/Claude/Projects/Consultancy/design-system/tokens/colors.css` and `tokens/fonts.css`:

- Dark `.dark` block (src/app.css:45-78): `--background #0e0f11` = ink-900; `--foreground #f5f3ef` = paper-50/text-strong; `--card #191b1f` = ink-750/surface-card; `--popover #16181b` = ink-800; `--primary #1fa37a` = emerald-500; `--primary-foreground #04150e` = text-on-accent; `--secondary #1f2227` = ink-700; `--muted #16181b` = ink-800; `--muted-foreground #9a9da3` = text-muted; `--accent #1f2227` = surface-raised (correctly the neutral hover surface, NOT the brand accent); `--destructive #d2685e` = red-500; `--border rgba(255,255,255,0.08)` = border-subtle; `--ring rgba(31,163,122,0.42)` = emerald-ring; `--chart-1..5` = dv-1..5 dark exactly. All correct.
- Light `:root` block (src/app.css:9-43): `--background #faf8f4`, `--foreground #1a1b1e`, `--primary #157a57` (emerald-600, AA on paper — not the dark-only #1FA37A), `--primary-foreground #ffffff`, `--muted-foreground #63666c`, `--destructive #b14b42`, `--chart-1..5` = dv-1..5 light. All match `.theme-light` in colors.css.

**Font import — byte-identical** (src/app.css:1 vs fonts.css:9). Font tokens in `@theme inline` (src/app.css:89-91) match fonts.css:13-15. `body { font-family: var(--font-sans) }` (src/app.css:80-82) falls back to `ui-sans-serif, system-ui, …` on CDN failure — never to Lora. No Lora `@import` or usage remains anywhere (grep clean).

**@theme inline mapping — intact.** All `--color-*: var(--*)` lines (src/app.css:92-122) preserved; the four `--radius-*` `calc()` formulas (src/app.css:85-88) left unchanged as the plan required. No broken mapping.

**Hero glow follows the accent, not a stale rose hue.** HeroSection.svelte:29 uses `oklch(from var(--primary) l c h / 15%)` — relative-color syntax reading l/c/h from `--primary`, now emerald. Correct per FR6/edge-case "hardcoded oklch must follow the accent token." No hardcoded rose oklch remains.

**Keyed-each keys are stable and unique.** Verified the underlying data:

- FeaturedProjectsSection.svelte:38 `(project.title)` — two distinct titles. :47 `(tag)` — each project's tag array has no duplicates.
- SkillsSection.svelte:41 `(category.title)` (4 distinct), :47 `(subCategory.title)` (distinct within each category), :51 `(skill)` — no duplicate skill string within any single `subCategory.skills` array (checked all 8). No render/reconciliation bug.
- `grep "#each"` shows zero remaining unkeyed blocks.

**Dark default correctly wired.** `+layout.svelte:9` `<ModeWatcher defaultMode="dark" />`; `defaultMode?: Mode` is a real prop in the installed mode-watcher 1.1.0 (node_modules/mode-watcher/dist/mode.d.ts:12). `src/app.html` hardcodes no theme class and no `prefers-color-scheme` override, so first-load on a light-mode OS resolves to dark (matches the verification record's cleared-storage test).

**Scope is clean.** The full diff touches only: src/app.css (tokens), +layout.svelte (one prop), and the two section files (keys only — no copy/data/markup changes). No routing/SEO/llms.txt/data-loading changes; `/consulting` untouched; no `.eh-*` adoption. No rose/pink/zinc/slate/hardcoded-hex literals anywhere (grep clean).

---

## Nitpick 1 — Controls render 6px, spec says "≈5px"

- **Category:** Correctness (radii)
- **File:** src/app.css:10 (`--radius: 0.5rem`) → src/app.css:86 (`--radius-md: calc(var(--radius) - 2px)` = 6px, consumed by Button/Badge `rounded-md`)
- **Description:** AC4/FR4 say "controls ≈5px." With `--radius: 0.5rem` (8px), the unchanged shadcn `calc()` formula yields 6px for controls (cards `rounded-xl` = 12px is exact). 6px vs the literal 5px is a 1px deviation, within the spec's "≈" tolerance and explicitly anticipated by the plan (which left the `calc()` formulas intentionally untouched to avoid altering the radius system).
- **Suggested fix:** None required. If pixel-exact 5px controls are ever wanted, set `--radius-md: 5px` directly rather than re-basing `--radius` (which would shift cards). Leave as-is.

## Nitpick 2 — Two prettier-dirty files were touched but not reformatted

- **Category:** Scope/consistency (non-blocking)
- **File:** src/lib/components/sections/SkillsSection.svelte, src/lib/components/sections/FeaturedProjectsSection.svelte
- **Description:** These two files fail `prettier --check`, but I confirmed the violations are entirely pre-existing data-array line-wrapping (e.g. SkillsSection.svelte:9, the long `skills: [...]` literals predating the branch). The keyed-each additions this migration made are themselves prettier-compliant — **the diff introduces zero new violations.** Minor inconsistency: src/app.css (also touched) WAS brought to prettier-clean, while these two touched files were left dirty. The scope decision (no repo-wide reformat per scope discipline) is defensible, and the verification record's claim that the ~41 lint failures are pre-existing debt "NOT introduced by this migration" is accurate.
- **Suggested fix:** Optional — fold these two touched files into the recommended separate `chore: prettier --write` cleanup PR so every file this branch edits ends up lint-clean. Not blocking.

---

## Items checked and cleared (not defects)

- `npm run lint` red — pre-existing prettier debt on ~41 unrelated files; svelte-check 0/0, eslint clean, build PASS. Excluded from scoring per the review mandate; scope call is defensible.
- Light-theme AA contrast — primary/muted values copied verbatim from a design system that vouches WCAG 2.1 AA for all pairings.
- prefers-reduced-motion / new motion — diff adds none.
- ui/ primitives (button/card/badge) — grep shows no hardcoded brand values; correctly left untouched.
