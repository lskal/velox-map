# Velox Map – Design system

Final design as of **2026-10-30**. Source: the Claude design canvas "Velox Map – UI design" (tokens, landing, map, about; desktop 1440 px + mobile 390 px; dark + light) and its "Map interactions" row (region views, detail cards, loading, error – dark desktop). This file is the spec the code is built from. Change it first, then the code.

---

## 1. Principles

- **Calm, not alarmist.** A reference viewer for official open data, not a radar warner. No sirens, flashes, warning triangles, speedometers or "danger" reds as brand colours.
- **Information only.** No user position, no navigation, no alerts. The notice "Information only – not for use while driving" is visible on every page.
- **Dark first, light equal.** Dark is the default look. Light is a full theme, not an afterthought. Both pass WCAG AA.
- **Flat and precise.** Tonal layers + 1 px borders instead of shadows. Only floating cards get a shadow.
- **Two fonts with strict roles.** A pixel font for identity, a variable sans for everything you read.

---

## 2. Colour tokens

Named by **role**, not by value. In CSS: custom properties on `:root` (dark) and `[data-theme="light"]`.

### Interface

| Token (`--color-…`) | Dark | Light | Use |
|---|---|---|---|
| `canvas` | `#0B0F14` | `#F8FAFC` | page background, map sea (dark) |
| `bg` | `#101419` | `#F8FAFC` | page sections, marker panel |
| `panel` | `#141B24` | `#FFFFFF` | header, footer, panels |
| `elevated` | `#1C2533` | `#F1F5F9` | cards, dropdowns, hover rows |
| `active` | `#263344` | `#F0F9FF` | selected / hovered control |
| `border` | `#233041` | `#CBD5E1` | all 1 px borders |
| `border-subtle` | `#1A2430` | `#E2E8F0` | table row dividers |
| `text` | `#F1F5F9` | `#0F172A` | headings, primary text |
| `text-body` | `#CBD5E1` | `#334155` | running text (About paragraphs) |
| `text-2` | `#94A3B8` | `#475569` | secondary text, labels, captions |
| `accent` | `#38BDF8` | `#0284C7` | focus ring, icons, borders of selected controls |
| `accent-text` | `#7DD3FC` | `#0369A1` | links and accent-coloured **text** |
| `notice-text` | `#FBBF24` | `#92400E` | disclaimer pill text |
| `notice-bg` | `rgba(245,158,11,0.10)` | `#FFFBEB` | disclaimer pill background |
| `notice-border` | `rgba(245,158,11,0.30)` | `#FCD34D` | disclaimer pill border |

- ⚠️ **Light mode: `accent` (`#0284C7`) is for icons and borders only.** On white it is 4.1:1, below 4.5:1 for normal text → text uses `accent-text` (`#0369A1`, 5.9:1).
- Dark `accent-text` (`#7DD3FC`) on `panel`: 10.4:1.

### Landing Europe map (SVG)

| Token (`--color-…`) | Dark | Light | Use |
|---|---|---|---|
| `map-sea` | `#0B0F14` | `#DCE6EF` | sea |
| `map-country` | `#1C2533` | `#FFFFFF` | the six supported countries |
| `map-country-border` | `#64748B` | `#64748B` | border of supported countries (3:1 against the sea) |
| `map-country-off` | `#131A22` | `#EEF2F6` | all other countries (not focusable) |
| `map-spotlight` | `rgba(56,189,248,0.18)` | `rgba(2,132,199,0.12)` (not on the canvas yet – tune in the browser) | hover glow, clipped to the country shape |

### Map markers

Each marker has its **own shape** (WCAG 1.4.1: never colour alone) and a halo (dark `#0B0F14`, light `#FFFFFF`, 2.5 px) so it keeps **≥ 3:1** against the map in both themes.

| Marker | Shape | Dark | Light |
|---|---|---|---|
| Speed camera | circle, 16 px | `#FACC15` | `#A16207` |
| Red light | rounded square 14 px, radius 4 | `#F43F5E` | `#E11D48` |
| Level crossing | diamond 14 px | `#A855F7` | `#9333EA` |
| Average-speed section | 3 px line, perpendicular bar at both ends | `#F97316` | `#EA580C` |
| OpenStreetMap report (not official) | hollow dashed ring (`2.4 2`) with "?" | `#E2E8F0` on `#0B0F14` | `#334155` on `#FFFFFF` |
| Comune indicator (Italy) | pill 22 px high, building icon + count | border `#10B981`, text `#6EE7B7`, bg `rgba(16,185,129,0.14)` | border `#059669`, text `#047857`, bg `#ECFDF5` |
| **Approximate position** (Italy: derived from road + km, address or motorway exits) | the type's own shape + a **dashed halo** (points: ring r 15, 1.5 px, dash `3 2.5`, fill 12%; sections: 14 px band at 22% under the line) | halo in the marker's colour | same |
| **May not be active** (NO, SE, ES: installation site or cabin) | the type's own shape + a **grey dotted ring** (r 14, 2 px, dash `1 3`, round caps, no fill) – different pattern and colour from the approximate halo | ring `#94A3B8` | ring `#64748B` |
| Cluster | circle 34 px + 4 px soft ring, count inside | `#475569`, text `#FFFFFF` | `#475569`, text `#FFFFFF` |

- **Speed = yellow (decided 2026-10-30).** It used to share the accent cyan, so a speed camera looked like a selected control. Yellow has the highest contrast of the coloured candidates checked (yellow, lime, blue, indigo, pink): at least 10.1:1 on the dark map and 3.9:1 on the light map (`#A16207`, worst case on the light sea). Under colour-blindness simulation it stays apart from the accent; it gets closest to the orange section line, which has a different shape.
- The notice pill is also amber/yellow, but it is text in the footer, never on the map, so the two don't compete.
- **Italy, final state:** derived positions (approximate halo) + comune indicators for devices with no position + unmatched OSM reports; Polizia Stradale mobile units are listed in a chip, never on the map. The card of a derived device always says "Approximate position", how it was computed and the original note.
- **Card fields are dynamic:** each country passes its own detail rows (speed limit, direction, bearing, road, km…). Empty fields are **hidden**, never shown as "Not given". Sweden has no device type → every point is a speed camera.
- **Same position:** devices with identical coordinates are grouped in code before they reach the map (one marker, the card lists all of them).
- **Later (not designed yet):** French sections known by one point only; PL/ES sections known by start + end only (path not known); areas not covered by a source (ES: Catalonia, Basque Country). See `plan.md` → UI → Later.
- **Zoom rule:** at country zoom only **clusters** are shown. Comune indicators and OSM reports appear from **region zoom**. A hint line says so ("Country view: groups only · zoom in to a region for comuni and OSM reports").

### Contrast checks (WCAG AA)

| Pair | Ratio | Needs |
|---|---|---|
| dark `text` on `canvas` | 17.5:1 | 4.5 |
| dark `text-2` on `panel` | 6.8:1 | 4.5 |
| light `text` on `panel` | 17.9:1 | 4.5 |
| light `text-2` on `panel` | 7.6:1 | 4.5 |
| light `accent-text` on `panel` | 5.9:1 | 4.5 |
| light `accent` on `panel` (icons only) | 4.1:1 | 3 |
| light `notice-text` on `notice-bg` | 6.8:1 | 4.5 |
| `map-country-border` on dark / light sea | 4.0:1 / 3.8:1 | 3 |

Re-check every pair in the accessibility pass (step 9 of `ui-implementation-process.md`).

---

## 3. Typography

### Fonts

| Font | Role | Loading |
|---|---|---|
| **Tiny5 Duo** (pixel, 400) | logo, H1, H2, country names. Fixed UI text only, **uppercase via CSS**. Never for data, numbers, body or inputs | self-hosted, `font-display: swap` |
| **Roboto Flex** (variable) | everything else: H3–H6, body, controls, tables, captions | self-hosted, `font-display: swap`, Latin Extended (PL, NO, SV…) |

Fallback stacks (if a web font fails or before it arrives):

```scss
$font-display: 'Tiny5 Duo', ui-monospace, 'SF Mono', Menlo, 'Cascadia Mono',
  Consolas, 'Roboto Mono', 'DejaVu Sans Mono', 'Liberation Mono', 'Courier New', monospace;
$font-body: 'Roboto Flex', Roboto, system-ui, -apple-system, BlinkMacSystemFont,
  'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
```

No system font looks like a pixel font: a monospace font is the closest fallback.

### Type scale

Size/line-height in px. "Mobile" = below 768px (see chapter 5).

| Style | Font | Desktop | Mobile | Weight | Use |
|---|---|---|---|---|---|
| H1 | Tiny5 Duo | 36/40 | 26/30 | 400 | one per page: landing title, About, country name on the map page |
| H2 | Tiny5 Duo | 24/29 | 20/24 | 400 | page sections (About, Privacy…) |
| H3 | Roboto Flex | 18/26 | 17/24 | 600 | sub-sections, card titles |
| H4 | Roboto Flex | 16/24 | 16/24 | 600 | groups inside a card or panel (not used yet) |
| H5 | Roboto Flex | 14/20 | 14/20 | 600 | small block titles (not used yet) |
| H6 | Roboto Flex | 12/16, +0.08em, uppercase | same | 600 | panel labels ("Legend", "Choose a country"), colour `text-2` |
| Body | Roboto Flex | 16/26 | 15/24 | 400 | running text, subtitles, About paragraphs, colour `text-body` |
| Body S | Roboto Flex | 14/21 | 14/21 | 400 | lists, cards, controls, table cells |
| Caption | Roboto Flex | 12/17 | 12/17 | 400–500 | attribution, dates, footer notice, colour `text-2` |
| Logo | Tiny5 Duo | 22 | 19 | 400 | header wordmark (32 for large use) |
| Country | Tiny5 Duo | 18/22 | 18/22 | 400 | country names in lists and the mobile sheet |
| Numbers | Roboto Flex | inherit | inherit | 600 | counts, table numbers, dates: `font-variant-numeric: tabular-nums` |

- Visual style and HTML tag are separate: a `<h2>` can look like H3 if the outline needs it (`<Text variant as>` in `ui-implementation-process.md`).
- Heading order is never skipped. Map pages have an `h1` ("Speed cameras in Italy"), visually hidden on desktop.

---

## 4. Shape, spacing, depth

- **Radius:** 8 px controls · 12 px cards · 16 px sheets (top corners) · pill (`9999px`) for badges, the notice and clusters.
- **Spacing:** 4 px base – 4, 8, 12, 16, 24, 32, 48.
- **Touch targets:** ≥ 44 × 44 px for every button, toggle and link in a list.
- **Focus ring:** `2px solid accent`, `2px` offset, on every focusable element.
- **Depth:** canvas → panel → elevated, each with a 1 px `border`. Shadow only on floating cards: `0 10px 25px -5px rgba(0,0,0,0.6), 0 8px 10px -6px rgba(0,0,0,0.4)` (dark); lighter in light mode.
- **Motion:** short, functional (hover, spotlight, sheet). Under `prefers-reduced-motion: reduce` → no animation, instant states (spotlight becomes a flat `elevated` fill).

---

## 5. Layout and pages

### Breakpoints

**One breakpoint for now: 768px** (decided 2026-10-30). The canvas designs two widths, mobile 390 px and desktop 1440 px; 768 is where one switches to the other.

| Width | Layout |
|---|---|
| below 768px | **mobile**: mobile type sizes, landing = country list only, map header = Settings sheet |
| 768px and up | **desktop**: desktop type sizes, landing = country list + Europe map, full map header |

- **Mobile first:** base styles are the mobile ones; desktop styles go inside `@media (min-width: 768px)`. The value lives only in `src/styles/_breakpoints.scss`; components use the variable or mixin, never a hard-coded number.
- **Tablets (768–1023px)** get the desktop layout, not designed on the canvas. Check them in the browser when building the pages (step 8 of `ui-implementation-process.md`); if something looks cramped (e.g. the Europe map next to the list), add a second breakpoint then, only for that component.

### Every page

- **Header:** logo (icon + "VELOX MAP" wordmark → `/`) + settings. **Settings live in the header and footer**: no settings page.
- **Footer:** the notice pill + links. Exact content per page below.
- **Notice pill:** "Information only – not for use while driving", `notice-*` colours, pill shape. Its **(i)** is a link to the Disclaimer section of `/about` (`/about#disclaimer`): a pop-up would be too long to read.
- **Theme toggle:** sun / moon icon button ("Switch to light mode"). Default from `prefers-color-scheme`, user choice in `localStorage`.
- **Language:** EN / IT.

### Landing `/`

- Eyebrow "Official open data · 6 countries", H1 "SPEED CAMERAS, FROM THE SOURCE", one-line intro.
- **Desktop:** country list (name in the Country style, device count, source) next to the **Europe SVG map** (the larger part of the width). Supported countries are links with a spotlight hover clipped to their shape; hover shows "<country> · <count> · click to open the map". Other countries are dimmed and not focusable. "Loading map…" placeholder while the SVG loads.
- **Mobile:** no Europe map. The country list is the main UI; the suggested country has a "Suggested" badge.
- Footer: notice · "Open source · AGPL-3.0" · "About, data sources and privacy" · GitHub.

### Map `/:country`

- **Header (desktop):** logo + country selector (shows "Italy · 4,143") + "OSM reports" toggle (Italy only) + Legend + language + theme toggle.
- **Header (mobile):** logo + **Settings** button → sheet with country, OSM reports, legend, language, light mode.
- **Country line:** country name (H1 style on mobile) + "4,143 devices · last update: 21 Oct 2026".
- **Country note** when needed (Italy: "Positions per comune only. The official registry has no coordinates.").
- **Map:** full width, markers and zoom rule from chapter 2.
- **Bottom table:** "Device table" panel; for now the empty state "The table is coming soon – it will list every device of the selected country, as the keyboard and screen-reader alternative to the map."
- **Region view** (zoomed in): top-left a "Whole of <country>" button + a hint line ("Region view · select a marker for details"); Italy adds a chip "Not on the map: 416 Polizia Stradale mobile devices, usable anywhere in Italy". Legend panel bottom-left, map controls bottom-right.
- **Map controls:** vertical group bottom-right, 44 px buttons: zoom in, zoom out, show the whole country.
- **Detail card:** see chapter 6.
- **Loading state:** basemap dimmed, centred card "Loading <country>…" with an indeterminate bar and "can take up to 10 seconds the first time"; country selector shows "<country> · …", OSM switch disabled, table bar as a grey placeholder. `role="status"`, `aria-busy` on the map.
- **Source not answering:** basemap dimmed, centred card "<Country>'s data couldn't be loaded" + "the other countries still work"; buttons **Try again** and **Choose another country**, link to the official source. No red, no alarm icon. `role="alert"`.
- **Footer:** notice · "Last update: <date>" (from `dataAsOf`) · attribution "© OpenStreetMap contributors · OpenFreeMap · Data: <source>" (+ ISTAT for Italy).

### About `/about`

- Header: logo + language + "Back to the map".
- H1 "ABOUT VELOX MAP", in-page navigation, four sections (H2): **About**, **Disclaimer** (`#disclaimer`), **Data sources and licences**, **Privacy**.
- Data sources: table per country (country, publisher + dataset link, licence, what a point means) → cards on mobile; then maps, reference data and fonts with their licences; NLOD text, ES coverage note, IT/PL reuse requests; "AGPL covers the code only"; corrections via GitHub issues.
- Footer: "Open source · AGPL-3.0 · GitHub" · "Last updated <month year>".

---

## 6. Components

| Component | Spec |
|---|---|
| **Button** | `elevated` bg, 1 px `border`, `text`; hover `active` bg + `accent` border; radius 8; height 44 |
| **Icon button** | 44 × 44 target, 20 px icon in `text-2`, hover `accent`; always an `aria-label` |
| **Selected chip / segmented option** | `active` bg, 1 px `accent` border, `accent-text` text |
| **Switch** (OSM reports, Radix) | track 36 × 20, off `elevated` + `border`, on `accent`; 16 px white thumb; 44 px touch area |
| **Select** (country, language) | like Button + chevron; options list on `elevated`, 12 radius |
| **Notice pill** | see chapter 5 |
| **Legend** | panel with H6 "LEGEND", one row per marker: shape + label |
| **Country row** (landing) | Country-style name, count in Numbers style, source in Caption; whole row is the link |
| **Detail card** (designed 2026-10-30) | floating `elevated` card, 1 px `border`, radius 12, card shadow; **desktop: 360–380 px, top-right of the map** (never covers the clicked marker), mobile: not designed yet. Header: badge ("Official · <source>" in comune green, or dashed "Not official · OpenStreetMap"), marker icon + title in H3, place line in `text-2`, close button 44 px. Body: dynamic rows in a 2-column `dl` (label Caption `text-2`, value 14/600 `tabular-nums`), empty rows hidden. Approximate positions add a dashed yellow box "Approximate position" + how it was computed + the original note quoted. Footer: source link · licence · "data as of <date>". The selected marker gets a 2.5–3.5 px `accent` outline |
| **Comune card** (Italy) | same shell; total "N registered devices without a position", 3 boxes Fixed / Mobile / Fixed or mobile, "+N more on the map at an approximate position", first 3 devices, "See all in the table", OSM note in a dashed box when OSM reports remain |

### Not designed yet (later)

- Detail card and region view on **mobile** and in **light** theme; the "may not be active" marker on a real map (NO, SE, ES).
- **Device table** (expanded): rows ≥ 44 px, `border-subtle` dividers, `tabular-nums`; the accessible alternative to the map.
- Search / filter inputs, checkboxes.

Design them on the canvas first, then add them here.

---

## 7. Logo

- **Concept: "Dapper Angled Top Hat".** A roadside speed-camera box on a pole, two round lenses (big and small), with a top hat tilted −9°. Friendly and calm: no flashes, bolts, sirens or warning shapes.
- **Drawing:** 32 × 32 viewBox, line only (`fill="none"`), `stroke="currentColor"`, round caps and joins.
- **Line weights (stroke hierarchy):** body + pole + brim **2**; crown **1.8**; big lens **1.6**; small lens + hat band **1.1**.
- **Reference SVG:**
  ```svg
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="7" y="13" width="18" height="11" rx="3"/>
    <circle cx="13" cy="18.5" r="3" stroke-width="1.6"/>
    <circle cx="20.5" cy="18.5" r="1.4" stroke-width="1.1"/>
    <path d="M16 24 V30"/>
    <g transform="rotate(-9 16 9)">
      <path d="M7.5 11.5 Q16 9.8 24.5 11.5"/>
      <path d="M11.5 10.6 V4 H20.5 V10.6" stroke-width="1.8"/>
      <path d="M11.5 8.2 H20.5" stroke-width="1.1"/>
    </g>
  </svg>
  ```
- **Sizes:** 64 · 32 · 16. Small sizes get slightly thicker lines so they don't fade:
  | Use | Body stroke | Notes |
  |---|---|---|
  | large (64 px) | 2 | reference SVG above |
  | header (26–30 px) | 2.2 | same drawing |
  | favicon (16 px) | 2.6 | simplified: **no small lens, no hat band**; crown 2.1, big lens 1.5 |
  Files: `logo.svg` (`currentColor`) and `favicon.svg` (light/dark colour inside the file).
- **Colours:** `accent` on dark (`#38BDF8`), `accent` on light (`#0284C7`), single colour for monochrome use.
- **Wordmark:** "VELOX MAP" in Tiny5 Duo, right of the icon (Logo style).
