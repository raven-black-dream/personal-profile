# Task: Create Featured Projects Section

**Status:** To Do
**Source:** `planning_doc.md`

---

### Purpose

To provide tangible proof of skills and project impact.

### Layout

A two-column grid on desktop, collapsing to a single column on mobile.

### Component: `<ProjectCard />`

- **Structure:** A project image/screenshot at the top, followed by title, summary, technology tags, and links.
- **Styling:** Cards will feature a subtle 1px border ("etched" look) instead of a box-shadow.
- **Interactivity:** On hover, the border will glow with the accent color to provide user feedback.

### Content Strategy

- Each project description will follow the **Problem-Action-Result (PAR)** model.

### Technical Implementation

- A reusable `<ProjectCard />` Svelte component will be created.
- Project data will be managed in a separate file (e.g., `src/lib/projects.js`) as an array of objects and rendered using an `{#each}` block.
