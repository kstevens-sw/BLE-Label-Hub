# BLE Label Hub Design System

## 1. Atmosphere & Identity

A warm, precise workspace for label design: calm, professional, and quietly tactile. The interface borrows the manual’s soft paper tones and terracotta accent so the app feels cohesive without losing its utility-first character.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---|---|
| Page | `--surface-page` | `#f6f1ea` | Application background |
| Workspace | `--surface-workspace` | `#efe5d9` | Canvas surround |
| Primary | `--surface-primary` | `#fffdf9` | Headers, panels, dialogs |
| Secondary | `--surface-secondary` | `#f7efe6` | Controls and grouped tools |
| Elevated | `--surface-elevated` | `#fffdf9` | Popovers and modals |
| Text primary | `--text-primary` | `#26231f` | Titles and body |
| Text secondary | `--text-secondary` | `#6d655e` | Supporting copy |
| Text muted | `--text-muted` | `#938a81` | Disabled and captions |
| Border | `--border-default` | `#ddd4c7` | Inputs and panel boundaries |
| Border strong | `--border-strong` | `#cdbfae` | Active grouping |
| Accent | `--accent-primary` | `#b65f45` | Primary actions and focus |
| Accent hover | `--accent-hover` | `#984b35` | Hovered primary actions |
| Accent soft | `--accent-soft` | `#f3dfd6` | Selected and informational states |
| Success | `--status-success` | `#4f6b5b` | Connected and successful states |
| Warning | `--status-warning` | `#9d7337` | Cautions |
| Error | `--status-error` | `#a1443e` | Errors and destructive actions |

Accent color is reserved for interaction, selection, and focus. Surface depth comes from warm tonal shifts, thin borders, and subtle tinted shadows.

## 3. Typography

The interface uses `Manrope`, with `system-ui` as fallback. Numbers and technical values use the same family with tabular numerals.

| Level | Size | Weight | Line height | Usage |
|---|---:|---:|---:|---|
| Product | 18px | 700 | 1.25 | Application title |
| Section | 14px | 700 | 1.35 | Panel and dialog headings |
| Body | 14px | 500 | 1.5 | Controls and content |
| Small | 12px | 500 | 1.4 | Help text and status |
| Label | 11px | 700 | 1.3 | Uppercase field labels |

## 4. Spacing & Layout

Base unit is 4px. Common spacing steps are 4, 8, 12, 16, 20, 24, and 32px.

- Desktop uses a fixed top command bar, a central workspace, and a narrow properties rail.
- Tool groups use 8px internal gaps and 12px separation between groups.
- Panels use 16px padding; dialogs use 20px to 24px.
- Mobile collapses to one canvas surface with fixed top and bottom controls.
- Canvas remains the visual center and gets more breathing room than tool surfaces.

## 5. Components

- Command bar: primary navigation and printer actions in compact groups.
- Tool button: 36px minimum target, icon-led, low-contrast warm surface, 8px radius.
- Primary button: terracotta fill, white text, subtle press translation.
- Secondary button: white fill, neutral-gray border, charcoal text.
- Panel: primary surface with a single boundary and minimal shadow.
- Input: 36px minimum height, white fill, visible label, slate focus ring.
- Dialog: elevated white surface, 12px radius, thin border, restrained footer actions.
- Status pill: tinted compact state with text and dot.
- Empty state: concise explanation and one clear next action.

## 6. Motion & Interaction

Motion intensity is low. Use 140–180ms transitions for color, opacity, and transform. Buttons translate down 1px on active. Panels and dialogs use opacity plus a maximum 4px transform. Respect `prefers-reduced-motion`.

Every interactive control has visible hover, focus, active, disabled, and selected states. Focus is never represented by color alone.

## 7. Responsive & Accessibility

- Minimum touch target is 44px on mobile and 36px on desktop.
- Maintain WCAG AA contrast for text and interactive controls.
- Preserve keyboard order and native control semantics.
- Avoid horizontal scrolling at 375px, 768px, and 1280px.
- Dialogs remain scrollable below 700px viewport height.
- Status uses text plus color; destructive actions remain visually distinct.
