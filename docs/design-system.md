# Design system

One small set of tokens, defined once in [`src/routes/layout.css`](../src/routes/layout.css), used everywhere through Tailwind utilities. The look is tactile: a warm sand neutral, white cards that sit on the page with a soft shadow, and hue only where it means something. When this doc and the CSS disagree, the CSS wins; fix the doc.

Visual reference: _Doop canvas link goes here._

## Tokens

### Colour

Every colour is a CSS variable with a light value in `:root` and a dark value in `.dark`. Components never use raw hex.

| Token | Utility | Use for |
| --- | --- | --- |
| `--ink-1` … `--ink-12` | `bg-ink-3`, `text-ink-11`, `border-ink-6` … | The neutral scale (Radix sand). 1–2 page, 3–5 wells and hovers, 6–8 borders, 9–10 quiet icons and placeholders, 11 secondary text, 12 primary text. |
| `--ground` | `bg-background` | The page. |
| `--raised` | `bg-raised`, `bg-card`, `bg-popover` | Anything that sits on the page: cards, diagrams, popovers, secondary buttons. |
| `--control` | `bg-control` | Toolbar controls and the current nav row. |
| `--green-3` / `--green-11` | `badge-green`, `text-green-11` | Right, passed. Nothing else. |
| `--red-3` / `--red-11` | `badge-red`, `text-red-11` | Wrong, failed, a miss in a diagram. Nothing else. |

The shadcn names (`--background`, `--foreground`, `--primary`, `--muted`, `--accent`, `--border`, `--ring` …) are kept as the contract for `src/lib/components/ui`; they point at the ink roles above. Primary is ink-12 on ink-1: the only filled button colour.

### Type

Geist Sans (`font-sans`, the default) for UI and prose; Geist Mono (`font-mono`) for code and for numbers that line up (counts, list indices, footnote markers; pair with `tabular-nums`). Prose code blocks pick up Geist Mono on their own.

| Utility | Size | Use for |
| --- | --- | --- |
| `text-3xl` | 30px | Page title (`h1`), with `tracking-tight`. |
| `text-xl` | 20px | Section title on a page (Quiz, Sources), card title. |
| `text-base` | 16px | Lead paragraph, quiz prompts, card headings. |
| `text-sm` | 14px | UI default: nav, buttons, lists, captions. |
| `text-xs` | 12px | Meta: counts, source lines, step counters. |
| `text-2xs` | 11px | Keyboard hints only. |

Weight is 450 for body and 550 for prose headings (Geist is variable). Use `font-medium` sparingly; hierarchy comes from size and ink step, not bold. Buttons and prose headings use `tracking-ui` (−0.01em).

### Spacing

Tailwind's 4px scale, no custom steps. The rhythm in use:

- `gap-1`/`gap-2` inside controls and tight lists, `gap-3`/`gap-4` between items in a card.
- `p-3` popovers, `p-4` cards and diagram cards, `p-5` the hero card.
- `mt-3` after a heading, `mt-6`/`mt-8` between blocks, `mt-12` between page sections. Figures sit in `my-8`.
- Control heights: `h-8` (toolbar), `h-9` (primary action); `max-md:h-11` on touch for a 44px target.

### Radius

One base, `--radius` = 8px, with derived steps: `rounded-sm` (≈5px), `rounded-md` (6px) for controls and chips, `rounded-lg` (8px) for cards, diagram cards and code blocks, `rounded-xl` for sheets. Diagram boxes use `rx="6"` to match `rounded-md`.

### Borders and shadows

Surfaces are separated by shadow, not borders. Each shadow token has a dark variant (a 0.5px ink outline plus a black drop).

| Utility | Use for |
| --- | --- |
| `shadow-button` | Raised controls: secondary buttons, quiz options, the selected segment. |
| `shadow-card` | Cards, diagram cards. |
| `shadow-popover` | Floating layers: the glossary popover. |

Borders are for lists and tables only: `border-ink-5`/`border-border`, often 0.5px.

### Motion

| Token | Utility | Use for |
| --- | --- | --- |
| `--ease-out` | `ease-out` | UI feedback. `duration-150` for presses (`active:scale-[.97]`), hovers and colour changes. |
| `--ease-move` | `ease-move` | Diagram objects that travel (dots, boxes). 550–900ms so the eye can follow. |

Every transition gets `motion-reduce:transition-none` (or sits under `.walkthrough`, which already handles reduced motion).

## Rules for a new component

1. Use utilities that name a token (`bg-raised`, `text-ink-11`, `shadow-card`, `rounded-lg`). No arbitrary values like `text-[13px]`, `#hex`, `shadow-[…]`, or `ease-[cubic-bezier…]`. If you need a value that is not here, add a token in `layout.css` and a row in this doc first.
2. Pick the surface first: on the page (`bg-background`), raised (`bg-raised` + `shadow-card`), or a well (`bg-ink-3`, no shadow).
3. Text is ink-12 for content and ink-11 for secondary. Colour other than ink means right (green) or wrong (red) only.
4. Buttons: primary is `bg-primary text-primary-foreground`; everything else is `bg-raised shadow-button`. Use `ui/button` where it fits.
5. Check it in both themes and at 375px wide.

## Rules for a new diagram

1. Wrap it in `Diagram` (static) or `Walkthrough` / `FlowWalkthrough` (stepped). They supply the card, the title and description for screen readers, and the motion rules.
2. Draw with the diagram classes only: `d-box` (node), `d-box-strong` with `d-on-strong` (the one node that matters), `d-line` + `d-arrow` (edges), `d-text` (13px labels), `d-meta` (12px annotations), `d-wait` (a miss or a blocked step). Never set `fill`, `stroke` or `font-size` inline.
3. Boxes use `rx="6"` and sit on a 10-unit grid; keep the viewBox no wider than about 600 units so labels stay readable.
4. Labels inherit Geist Sans from the page.
