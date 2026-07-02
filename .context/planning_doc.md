# Project Plan: Personal Profile Page

**Version:** 1.0
**Date:** 2025-07-20

This document outlines the project plan for creating a modern, professional personal profile page. It is a living document and will be updated as the project progresses.

---

## 1. Project Overview

- **Vision:** A sharp, modern, and aesthetically unique personal profile page to act as a professional landing point.
- **Objective:** To clearly present information about myself, including my resume and featured projects, to potential employers and professional contacts.
- **Target Audience:** Hiring managers, recruiters, and professional peers.
- **Core Technology:**
  - **Framework:** Svelte 5
  - **UI Components:** shadcn-svelte
- **Key Constraint:** The project serves as a learning opportunity for `shadcn-svelte`, with a focus on overcoming self-identified weaknesses in UI design.

---

## 2. Guiding Principles & Aesthetic

The overall aesthetic will be a "Modern Goth" theme, aiming for a look that is moody, sophisticated, and professional.

- **Primary Theme:** Dark Mode First. A light mode will be a secondary goal.
- **Color Palette (Dark Mode):**
  - **Background:** Deep, desaturated charcoal (`#1a1a1d`)
  - **Text:** Legible off-white (`#e5e5e5`)
  - **Accent:** Rich, deep crimson (`#950740`) or dark plum (`#4E2A84`) for buttons, links, and interactive highlights.
- **Typography:**
  - **Headings:** Lora (A sharp, elegant serif font).
  - **Body Text:** Lora (or a clean, complementary sans-serif like Lato if readability becomes an issue).
- **General Style:** Sharp, 90-degree corners on containers (cards, buttons) will be used instead of rounded corners to create a more intentional, severe look.

---

## 3. Information Architecture

The page will be a single-page layout with a clear narrative flow, guiding the user from top to bottom through the following sections:

1.  **Hero Section:** Immediate, high-impact introduction.
2.  **About Me:** A more detailed summary of professional identity.
3.  **Featured Projects:** A grid showcasing key work samples.
4.  **Skills & Technologies:** A scannable list of technical proficiencies.
5.  **Contact & Resume:** Final calls-to-action and links.

---

## 4. Component Breakdown

### 4.1. Hero Section

- **Purpose:** To immediately establish identity and provide primary navigation.
- **Layout:** Centered alignment with generous whitespace.
- **Content:**
  - **Headline:** `[Your Name]`
  - **Sub-headline:** `Full Stack Data Scientist | Building with clarity and purpose.`
  - **Introductory Sentence:** `A curious mind passionate about solving complex puzzles with data.`
  - **Calls to Action (Buttons):** "View My Work" (scroll-link to Projects) and "Download Resume".
- **Technical:** Will be built using `shadcn-svelte`'s `Button` components.

### 4.2. Featured Projects Section

- **Purpose:** To provide tangible proof of skills and project impact.
- **Layout:** A two-column grid on desktop, collapsing to a single column on mobile.
- **Component:** Each project will be displayed in a `<ProjectCard />`.
- **Card Design:**
  - **Structure:** A project image/screenshot at the top, followed by title, summary, technology tags, and links.
  - **Styling:** Cards will feature a subtle 1px border ("etched" look) instead of a box-shadow.
  - **Interactivity:** On hover, the border will glow with the accent color to provide user feedback.
- **Content Strategy:** Each project description will follow the **Problem-Action-Result (PAR)** model.
- **Technical Implementation:**
  - A reusable `<ProjectCard />` Svelte component will be created.
  - Project data will be managed in a separate file (e.g., `src/lib/projects.js`) as an array of objects and rendered using an `{#each}` block.

---

## 5. Action Items & Next Steps

The immediate next step is for the user to provide the core content for the **Featured Projects** section.

- **Task:** Select 2-3 projects to feature.
- **Action:** For each project, write a description following the **Problem-Action-Result** model. Provide a title, a list of technologies used, and links to the code and/or a live demo.

Once this content is provided, the AI team will proceed with refining the text and creating visual mock-ups for review.
