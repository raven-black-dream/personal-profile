# Browser Verification Record — Profile Page Brand Migration

Method: agent-browser (dogfood) against `npm run dev` on http://localhost:5173/, computed-style readouts + screenshots, both themes.

| AC  | Check                                                                                              | Result                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| AC1 | body font-family resolves to IBM Plex Sans; no Lora                                                | PASS — `"IBM Plex Sans", ui-sans-serif, …`; `anyRoseLeft/Lora=false`                                                   |
| AC2 | accent Deep Emerald (#1FA37A dark / #157A57 light); no rose                                        | PASS — primary CTA bg `rgb(31,163,122)`, `--primary` `#1fa37a` dark / `#157a57` light; ring `rgba(31,163,122,0.42)`    |
| AC3 | warm-charcoal dark (`#0E0F11`, not pure black) / warm paper light (`#FAF8F4`); text `#F5F3EF` dark | PASS — dark bg `rgb(14,15,17)`, text `rgb(245,243,239)`; light bg `rgb(250,248,244)`, text `rgb(26,27,30)`             |
| AC4 | restrained radii: controls ≈6px, cards 12px                                                        | PASS — `--radius` `0.5rem`; button/badge radius 6px; card radius 12px                                                  |
| AC5 | dark is default on fresh visit; toggle switches + persists                                         | PASS — fresh visit (cleared storage) → `html.class="dark"`; toggle→light persists across reload (`localStorage=light`) |
| AC6 | no layout breakage; no rose/Lora remnants                                                          | PASS — Hero/Projects render clean in both themes; no Lora/rose in DOM                                                  |
| AC7 | matches design-system reference (accent/fonts/neutrals/radii)                                      | PASS — values match EH tokens (emerald, IBM Plex, warm charcoal/paper, restrained radii)                               |

Card surface `#191B1F`, hairline border `rgba(255,255,255,0.08)` — matches EH surface-card/border-subtle. Hero shows a single soft emerald radial glow in both themes (no hard ring).

Screenshots: profile-dark.png, profile-light.png, profile-projects-dark.png (scratchpad).

OUT OF SCOPE (pre-existing repo debt, NOT introduced by this migration): `npm run lint` still fails on ~41 files due to pre-existing prettier formatting violations that predate this branch (base commit had 42). svelte-check 0/0, eslint clean, build PASS. Recommend a separate `chore: prettier --write` cleanup PR.
