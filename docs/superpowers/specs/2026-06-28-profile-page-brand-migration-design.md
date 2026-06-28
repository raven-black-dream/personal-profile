# Profile Page Brand Migration

**Date:** 2026-06-28
**Branch:** claude/feature/profile-page-brand-migration
**Status:** approved

## Summary

Migrate the personal-profile site (SvelteKit + Tailwind v4, shadcn-svelte token
architecture) from its current visual identity (Lora serif, rose-700 primary accent,
zinc neutrals, `--radius: 0`) to the **Evan Harley Design System** brand guidelines:
IBM Plex superfamily, Deep Emerald `#1FA37A` accent, warm-charcoal neutrals (never pure
black), restrained radii, and dark as the primary theme.

This is a **visual change only** — no copy, content, routing, data, or behavioural
changes. The site already uses the shadcn-svelte `@theme inline` pattern where Tailwind
color/radius utilities resolve to CSS custom properties in `src/app.css`, and components
consume semantic utilities (`bg-background`, `text-muted-foreground`, `<Button>`
variants). Therefore the migration is primarily a **token remap in `src/app.css`** plus a
**per-component audit** for hardcoded values that bypass the token layer.

Design-system source of truth: `/home/evan/Documents/Claude/Projects/Consultancy/design-system/`
(tokens in `tokens/colors.css`, `tokens/fonts.css`, `tokens/typography.css`,
`tokens/spacing.css`; brand guide in `readme.md`; reference website hero in
`ui_kits/website/index.html`).

## Functional Requirements

1. **Fonts → IBM Plex.** Replace the Lora Google Fonts `@import` with the IBM Plex
   superfamily import (Plex Sans, Plex Mono, Plex Serif) per `tokens/fonts.css`. Body/UI
   uses Plex Sans; Plex Mono is available for eyebrow/label/data treatments; Plex Serif is
   available for editorial moments. Set `body` font to Plex Sans (currently Lora serif).
2. **Accent → Deep Emerald.** Remap `--primary` / `--ring` (currently rose-700) to Deep
   Emerald `#1FA37A` for dark, darkening to `#157A57` on the light theme to hold WCAG AA,
   matching `tokens/colors.css`.
3. **Neutrals → warm charcoal / warm paper.** Remap dark-theme `--background`,
   `--card`, `--popover`, `--secondary`, `--muted`, `--accent`, `--border`, `--input` to
   the warm-charcoal ramp (`--ink-900…600`, text `#F5F3EF`); remap light-theme neutrals to
   the warm-paper ramp (`#FAF8F4` base, etc.). Backgrounds must never be pure black.
4. **Radii → restrained.** Replace `--radius: 0rem` with the design-system radii
   (controls ≈5px, cards ≈12px) via the `@theme inline` radius tokens, so corners are
   restrained-but-not-sharp and not bubbly.
5. **Dark as primary theme.** The design system declares dark primary. Configure
   `ModeWatcher` so dark is the default theme (rather than following system preference by
   default). Retain the existing dark/light toggle and a working, design-system-aligned
   light theme.
6. **Per-section audit & fix.** Audit every section/component for values that bypass the
   token layer and bring them onto brand:
   - `HeroSection.svelte` — the hardcoded radial-gradient hero glow must read as the
     single soft emerald glow (`oklch(from var(--primary) …)` will follow the new accent;
     verify it renders as a soft emerald glow, not a hard ring).
   - `Header.svelte`, `DarkModeToggle.svelte`, `AboutMeSection`, `SkillsSection`,
     `FeaturedProjectsSection`, `ContactSection` — replace any hardcoded colors, font
     classes, or non-token radii with token-backed utilities.
   - `ui/` primitives (`button`, `card`, `badge`) — confirm they resolve to the remapped
     tokens; only touch them if they carry hardcoded brand values.
7. **Visual verification against the design system.** Run the site locally and verify the
   migrated page against the design-system reference (`ui_kits/website/index.html` and the
   token specimen cards) using the `dogfood` skill (agent-browser) and/or Playwright —
   confirming accent, fonts, neutrals, and radii match.

## Out of Scope

- Any change to copy, headlines, section content, or the resume PDF.
- Adding, removing, or reordering sections; new pages or routes (the `/consulting` route
  is a separate in-flight branch and is intentionally absent here).
- Routing, data loading, SEO/JSON-LD, `llms.txt`, or build/deploy configuration.
- Component API/behaviour changes (props, events, interactivity) beyond the
  `ModeWatcher` default-theme setting needed for FR5.
- Self-hosting fonts (CDN `@import` is acceptable, matching the design system's own
  default).
- Pixel-perfect cloning of the marketing-site hero layout — the goal is brand-token
  conformance (color/type/spacing/radii/theme), not replicating the reference's exact
  grid or copy.
- Adopting the design system's bespoke `.eh-*` logo/offer CSS classes or component library
  wholesale (those serve the consultancy collateral, not this portfolio).

## Edge Cases

- **Light theme regression.** Remapping must keep the light theme legible and AA-compliant
  (emerald `#157A57` on paper, not the dark-only `#1FA37A`). Verify both themes.
- **`prefers-reduced-motion`.** Any motion must respect reduced-motion; the design system
  forbids bounce/infinite loops. The migration adds no new motion, but verify existing
  transitions stay calm.
- **`prefers-color-scheme` interaction.** With dark set as the explicit default, a
  first-time visitor on a light-mode OS should still get dark; the toggle must still work
  and persist.
- **Hardcoded oklch values.** The hero gradient and any chart/oklch literals must follow
  the accent token, not a stale rose hue.
- **Font flash / load failure.** If the IBM Plex CDN import fails, the font stack must
  fall back gracefully (system sans), not to Lora.
- **Contrast on remapped tones.** Warm-charcoal surfaces with warm off-white text must
  preserve readable contrast across all sections (cards, muted text, borders).

## Acceptance Criteria

1. `src/app.css` no longer imports Lora; it imports the IBM Plex superfamily, and `body`
   renders in IBM Plex Sans (verified in-browser).
2. The primary accent (buttons, focus ring, hero glow, links) renders Deep Emerald
   `#1FA37A` on dark / `#157A57` on light — no rose/pink remains anywhere.
3. Backgrounds use the warm-charcoal ramp (no pure `#000`/pure-zinc), text is warm
   off-white `#F5F3EF` on dark; light theme uses warm paper `#FAF8F4`.
4. Corner radii are restrained (controls ≈5px, cards ≈12px) — not 0 and not pill-round
   for cards.
5. Dark is the default theme on first load; the toggle switches to a brand-aligned light
   theme and the choice persists.
6. No component contains a hardcoded brand color, the Lora font, or a non-token radius
   that conflicts with the design system (audited section by section).
7. A browser verification pass (dogfood/Playwright) confirms accent, fonts, neutrals, and
   radii visually match the design-system reference; findings recorded.
8. `npm run check` (svelte-check) and `npm run lint` (prettier + eslint) pass.
9. `npm run build` succeeds.

## Security Considerations

This is a pure front-end styling change with no auth, no user data, no endpoints, and no
new data flows. BOLA/IDOR are not applicable (no user-owned resources). The only external
surface is the Google Fonts CDN `@import`, identical in trust profile to the existing Lora
import. No secrets, no server code, no injection surface introduced. Expected security
rating: PASS.

## Testing Guidelines

- **Static checks:** `npm run check`, `npm run lint`, and `npm run build` must all pass —
  these are the project's existing quality gates (no unit test framework is configured).
- **Visual verification (primary):** with `npm run dev` running, use the `dogfood` skill
  (agent-browser) and/or Playwright to load each section and verify against the
  design-system reference and token specimens: accent color, IBM Plex fonts, warm-charcoal
  / warm-paper neutrals, restrained radii, and the single soft emerald hero glow. Verify
  both dark (default) and light themes, and that the toggle persists.
- **Regression watch:** confirm no layout breakage, no rose/Lora remnants, AA-legible
  contrast in both themes, and `prefers-reduced-motion` respected.
- **Coverage target:** every section component on `+page.svelte` (Hero, AboutMe,
  FeaturedProjects, Skills, Contact) plus Header/DarkModeToggle visually confirmed
  on-brand in both themes; all three static checks green.
