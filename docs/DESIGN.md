---
name: Annotated Margin
colors:
  surface: '#0d131e'
  surface-dim: '#0d131e'
  surface-bright: '#333946'
  surface-container-lowest: '#080e19'
  surface-container-low: '#161c27'
  surface-container: '#1a202b'
  surface-container-high: '#242a36'
  surface-container-highest: '#2f3541'
  on-surface: '#dde2f2'
  on-surface-variant: '#c3c6d0'
  inverse-surface: '#dde2f2'
  inverse-on-surface: '#2b303c'
  outline: '#8d919a'
  outline-variant: '#43474f'
  surface-tint: '#a8c8fc'
  primary: '#c2d8ff'
  on-primary: '#07315c'
  primary-container: '#9dbdf0'
  on-primary-container: '#2a4c78'
  inverse-primary: '#3f5f8d'
  secondary: '#67d9cb'
  on-secondary: '#003732'
  secondary-container: '#21a196'
  on-secondary-container: '#00302b'
  tertiary: '#fdd089'
  on-tertiary: '#432c00'
  tertiary-container: '#dfb570'
  on-tertiary-container: '#634609'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a8c8fc'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#264874'
  secondary-fixed: '#85f5e8'
  secondary-fixed-dim: '#67d9cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdeac'
  tertiary-fixed-dim: '#ebc07a'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#5f4105'
  background: '#0d131e'
  on-background: '#dde2f2'
  surface-variant: '#2f3541'
typography:
  headline-xl:
    fontFamily: Source Serif 4
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-xl-mobile:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  legal-clause:
    fontFamily: Source Serif 4
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  code-citation:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system channels the quiet, contemplative atmosphere of an academic law library's private reading room late at night. The visual personality is scholarly, authoritative, and deeply focused. Instead of the cold, stark void of pure black or the fatigue of clinical enterprise monitors, the interface presents a rich, deep ink-navy ground paired with softly illuminated, warm paper-toned typography. 

It draws inspiration from classical editorial design, legal treatises, and high-end archival marginalia:
- **Atmosphere:** Subdued, nocturnal, highly focused, and non-dramatic. No neon glows, harsh saturation, or plastic glassmorphism.
- **Editorial Precision:** High typographic distinction where legal text commands physical dignity and metadata recedes gracefully into supporting margins.
- **Trust & Rigor:** The product feels durable, intellectual, and unhurried—calibrated for long-form legal review, contract analysis, and forensic document reading without ocular strain.

## Colors
The palette is built upon layered ink-navy values and archival document tones, ensuring strict WCAG AA contrast compliance across all text and interactive states.

### Core Canvas & Containers
- **Page Background / Base Surface:** `#0F1520` — The foundational deep ink-navy sheet.
- **Container / Cards:** `#172033` — Mid-tone reading plane for panels, margin sidebars, and document segments.
- **Container-High / Raised:** `#1E2A40` — Elevated surface for popovers, flyouts, and active selection blocks.

### Typography & Content
- **On-Surface (Primary Text):** `#F3EFE8` — Softly lit warm paper white; non-glare, organic readability.
- **Muted Text (Secondary / Structural):** `#B8C0CC` — Cool parchment gray for metadata, labels, and secondary documentation.
- **Hairline Borders:** `#26354E` — Structural boundary line for subtle layout division without visual noise.
- **Strong Borders:** `#7C8798` — Deliberate edge contrast for focused components, active cards, and split panes.

### Accents & Interactivity
- **Primary Interactive Fill:** `#9DBDF0` (Morning mist periwinkle) paired strictly with `#0F1520` text for maximum legibility on primary triggers.
- **Editorial Accent:** `#5ED0C3` (Sea-sage teal) reserved for verified badges, inline document anchors, hyperlinked citations, and clarity-lens highlights.
- **Focus Rings:** `3px solid #9DBDF0` offset by `2px` over `#0F1520` for unmistakable keyboard navigation.

### Legal Risk Spectrum
Color tokens for legal severity must strictly follow container/border/text trios:
- **High Risk:** Background `#3A1712`, Text and 1px Border `#FFB4A9` (Triangle icon glyph).
- **Medium Risk:** Background `#3A2A0B`, Text and 1px Border `#FFD28A` (Diamond icon glyph).
- **Low Risk / Safe:** Background `#12283F`, Text and 1px Border `#A9CFF5` (Circle icon glyph).

## Typography
Typographic harmony relies on an intentional dichotomy:
1. **Source Serif 4** expresses the authoritative, humanistic tradition of legal codices, briefs, statutory analysis, and document excerpts (`legal-clause`).
2. **Inter** acts as the modern, utilitarian framework driving metadata, toolbars, interactive forms, annotations, and UI indicators.

### Typesetting Rules
- **Line Length:** Primary legal text must strictly target 60 to 75 characters per line to optimize sustained comprehension in night-mode environments.
- **Editorial Dignity:** Document quotes and clauses retain classical serif italicization and generous vertical line height (`28px` on `16px` font) to emulate archival legal monographs.
- **Micro-labels:** Risk indicators and legal citations employ `label-sm` with slight tracking to preserve clarity against deep backdrops.

## Layout & Spacing
The layout simulates an asymmetric academic desk layout: the primary legal document pane occupies the center stage, while an annotated commentary column runs continuously down the right margin.

### Structural Grids
- **Desktop (>= 1280px):** Asymmetric split layout. Main reading pane conforms to 8 columns of a 12-column grid; the annotation margin claims the remaining 4 columns. Outer margin: `2rem`; column gutter: `1.5rem`.
- **Tablet (768px - 1279px):** Adaptive 8-column layout. The annotation shelf docks below active paragraphs or converts into a collapsible floating sheet. Gutter: `1.5rem`.
- **Mobile (< 768px):** Single-column stacked stream. Margin: `1rem`; Gutter: `1rem`. Annotations compress into inline collapsible cards positioned directly underneath the highlighted clause.

### Touch Target Rule
All interactive tap targets—regardless of screen form factor—maintain an absolute minimum hit box of `44px x 44px`.

## Elevation & Depth
Depth in this night reading room is communicated through **tonal layering** and **tactile hairline illumination**, not through drop shadows. In a deep ink-navy setting, conventional black drop shadows are imperceptible, and heavy colored shadows cause visual distortion.

### Hierarchy Rules
1. **Level 0 (Document Mat):** Page canvas at `#0F1520`. Zero elevation.
2. **Level 1 (Panels & Cards):** Tonal lift to `#172033` enclosed with a crisp, discrete 1px hairline border in `#26354E`.
3. **Level 2 (Popovers, Clause Annotations & Drawers):** Tonal lift to `#1E2A40` with an outer border in `#7C8798`. An ambient, ultra-diffused shadow is permitted solely to break edges over dense text: `box-shadow: 0 12px 32px rgba(5, 8, 13, 0.65)`.
4. **Active Selections:** An interactive state never relies on glow effects; it applies a precise `1px solid #9DBDF0` border or a tinted wash at 10% opacity of `#5ED0C3`.

## Shapes
The design balances modern ergonomic software design with legal structure.
- **Cards & Panes:** Standardized on `12px` (`0.75rem` / `rounded-lg`) corner radii, conferring a soft, approachable container without appearing toy-like.
- **Risk Badges & Interactive Tags:** Formed with `6px` radius (`space-xs` to `space-sm`) to preserve a structured, index-card appearance.
- **Buttons & Form Fields:** Clipped to `8px` radius, instilling purpose and stability.
- **Clarity Lens / Text Highlights:** Micro-radii of `2px` hugging the text baseline and cap-height to honor traditional physical highlighter markings.

## Components

### 1. Buttons
- **Primary:** Background `#9DBDF0`, Text `#0F1520`, font `Inter` 600. Height 44px minimum. Hover state: Lightens fill by 8%. Focus: `3px solid #9DBDF0` with `2px` offset.
- **Secondary:** Background transparent, Border `1px solid #7C8798`, Text `#F3EFE8`. Hover: Background `#1E2A40`.
- **Text / Tertiary:** Background transparent, Text `#5ED0C3`. Hover: Underline decoration with 2px gap.

### 2. Risk Badges
Compact micro-components signaling legal exposure:
- **High Risk:** Background `#3A1712`, Border `1px solid #FFB4A9`, Text `#FFB4A9`. Prepended with an explicit geometric triangle glyph (`▲`).
- **Medium Risk:** Background `#3A2A0B`, Border `1px solid #FFD28A`, Text `#FFD28A`. Prepended with a diamond glyph (`◆`).
- **Low Risk:** Background `#12283F`, Border `1px solid #A9CFF5`, Text `#A9CFF5`. Prepended with a solid circle glyph (`●`).
- **Padding:** Vertical `4px`, Horizontal `8px`. Font: `label-sm`.

### 3. Cards & Marginalia Units
- Card backgrounds use `#172033` with a structural `1px solid #26354E` frame and `12px` border radius.
- Padding inside cards uses `space-md` (16px) or `space-lg` (24px).
- Highlighted or active cards shift border color to `#7C8798` or `#5ED0C3` depending on selection state.

### 4. Form Fields & Search Inputs
- **Base:** Background `#0F1520`, Border `1px solid #26354E`, Text `#F3EFE8`, Placeholder `#B8C0CC`.
- Minimum field height: `44px`.
- **Active / Focus:** Border becomes `1px solid #9DBDF0`, outline `3px solid #9DBDF0` with `2px` offset.

### 5. Checkboxes & Radio Controls
- Target footprint: 44px hit container; physical glyph dimension: `18px x 18px`.
- Unchecked state: Border `1.5px solid #7C8798` over `#0F1520`.
- Checked state: `#9DBDF0` solid fill with `#0F1520` checkmark.

### 6. Marginalia Anchors & The "Clarity Lens"
- **Annotated Text Spans:** Inline text highlighted via `#5ED0C3` at 18% fill opacity, bordered on the bottom with a dotted `1.5px solid #5ED0C3` underline.
- **Margin Thread Connectors:** A clean hairline `#26354E` bridges the highlighted sentence directly to the corresponding card in the right-hand annotation track.