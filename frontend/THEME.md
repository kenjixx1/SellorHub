# SellorHub frontend theme reference

This document describes the **current** visual language implemented in [`src/index.css`](src/index.css). Use it so new pages, components, and AI-assisted work stay consistent.

---

## One-line description

**Dark, glass-morphism UI on a slate base** with **indigo–violet** as the primary action color, **Inter** typography, **soft radial background**, **frosted nav and cards**, **pill-shaped primary buttons**, and **subtle borders**—aiming for a modern SaaS / marketplace feel.

---

## 1. Design intent

- **Mood:** Premium, calm, readable at night; not neon-heavy.
- **Hierarchy:** Primary actions stand out; secondary actions are quieter; destructive actions (logout) use a red tint.
- **Surfaces:** Prefer frosted “glass” panels on the dark base rather than flat white cards.

---

## 2. CSS variables (source of truth)

Defined in `:root` in [`src/index.css`](src/index.css).

| Token | Value | Role |
|-------|--------|------|
| `--primary` | `#6366f1` | Primary CTAs, focus accent |
| `--primary-hover` | `#4f46e5` | Primary hover |
| `--bg` | `#0f172a` | Page background base |
| `--bg-secondary` | `#1e293b` | Deeper panels / select options |
| `--text` | `#f8fafc` | Primary text |
| `--text-muted` | `#94a3b8` | Labels, secondary copy, muted links |
| `--border` | `rgba(255, 255, 255, 0.1)` | Hairline dividers and input borders |
| `--glass` | `rgba(30, 41, 59, 0.7)` | Frosted navbar / page panels |

### Gradient accents (reuse for brand moments)

Use **135deg** from **indigo-light** to **violet** for logo, hero emphasis, and avatars:

- **Stops:** `#818cf8` → `#c084fc`

Used in:

- `.logo` text gradient
- `.hero h1 span` emphasis
- `.user-avatar` background

### Page background

`body` uses a radial wash, then falls back to `--bg`:

- `radial-gradient(circle at top right, #1e1b4b, var(--bg) 40%)`

---

## 3. Typography

- **Font:** `Inter`, `system-ui`, `-apple-system`, `sans-serif` (loaded from Google Fonts in CSS).
- **Base line-height:** `1.5`.
- **color-scheme:** `dark` (browser UI hints).
- **Heading weights in practice:**
  - Marketing / hero: `800` (`.hero h1`), `700` (`.page-container h1`)
  - UI labels: `500`–`600` (`.form-label`, `.nav-link`, buttons)

---

## 4. Layout and surfaces

### Navbar (`.navbar`)

- Sticky top bar; `var(--glass)` background.
- `backdrop-filter: blur(12px)` (+ webkit prefix).
- Bottom border: `1px solid var(--border)`.
- Horizontal padding: `1rem 2rem`.

### Main content (`.main-content`)

- Flex column; grows to fill viewport under the navbar.

### Page container (`.page-container`)

- Max width `800px`, centered; vertical margin `4rem`.
- Glass panel: `var(--glass)`, blur `12px`, border, `border-radius: 1rem`.
- Shadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5)`.

### Hero (`.hero`)

- Flex row with gap; padding `6rem 5%`.
- Large headline (`4rem`, weight `800`, tight line-height).
- Supporting paragraph: `1.25rem`, `var(--text-muted)`.

### Hero graphics (`.hero-graphics`, `.glass-card`)

- Graphics hidden below `1024px`; shown on large screens.
- `.glass-card`: very subtle fill `rgba(255, 255, 255, 0.03)`, stronger blur, float animation (~6s).

---

## 5. Components (class names to reuse)

### Buttons

| Class | When to use |
|-------|-------------|
| `.btn-primary` | Main CTA (pill shape, indigo, shadow) |
| `.btn-secondary` | Secondary action (outline / subtle fill) |
| `.btn-large` | Larger primary/secondary padding (combine with button class) |
| `.btn-logout` | Destructive / sign-out (red tint, not pill) |

### Navigation & identity

| Class | When to use |
|-------|-------------|
| `.navbar` | Top app bar |
| `.logo` | Brand wordmark (gradient text) |
| `.nav-links` | Horizontal nav cluster |
| `.nav-link` | Text links in nav |
| `.user-badge` | Signed-in user chip |
| `.user-avatar` | Initial circle (gradient fill) |

### Forms

| Class | When to use |
|-------|-------------|
| `.form-group` | Vertical stack for label + control + hint |
| `.form-label` | Label styling |
| `.form-input` | Text inputs and textareas |
| `select.form-input` | Selects (custom arrow, matches inputs) |
| `.password-input-wrapper` | Wrap password field + toggle |
| `.password-toggle` | Show/hide password control |
| `.validation-hint` | Small helper line; add `.valid` or `.invalid` for state |

Validation colors (from CSS):

- Success hint: `#4ade80` (`.validation-hint.valid`)
- Error hint: `#f87171` (`.validation-hint.invalid`)

---

## 6. Interaction and motion

- **Links (`a`):** `transition: all 0.2s ease`.
- **Buttons:** `transition: all 0.2s ease`.
- **Primary hover:** `translateY(-1px)` and stronger shadow.
- **Hero cards:** `float` keyframes (gentle vertical motion).

---

## 7. Accessibility notes

- Theme is **dark-first**; keep body text on `--bg` / `--glass` readable.
- **`--text-muted`** on `--bg`: verify contrast for small text; use for labels, not long paragraphs if contrast feels low.
- **Focus:** `.form-input:focus` uses indigo border + `box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2)`. Reuse this pattern for new focusable controls.

---

## 8. Do / don’t (consistency)

**Do**

- Use `:root` variables for new colors and borders.
- Add new shared styles to [`src/index.css`](src/index.css) (or a split file if the stylesheet grows) instead of scattering hex values in components.
- Reuse **135deg** `#818cf8` → `#c084fc` for brand emphasis.
- Reuse `.page-container` for “main” authenticated or form-centric pages when it fits.

**Don’t**

- Introduce a second primary brand color (e.g. green/orange CTAs) without updating this doc and the tokens.
- Default to light gray-on-white patterns; this product UI is dark.
- Bypass tokens for large areas of color (harder to theme later).

---

## 9. Relationship to code

- **Authoritative stylesheet:** [`frontend/src/index.css`](src/index.css).
- **Future (optional):** If `index.css` grows, extract `:root` and base tokens into e.g. `theme.css` and import it from `index.css`; keep this `THEME.md` in sync when tokens change.

---

## Quick reference: primary palette

| Role | Hex |
|------|-----|
| Primary | `#6366f1` |
| Primary hover | `#4f46e5` |
| Background | `#0f172a` |
| Background secondary | `#1e293b` |
| Text | `#f8fafc` |
| Text muted | `#94a3b8` |
| Accent gradient A | `#818cf8` |
| Accent gradient B | `#c084fc` |
