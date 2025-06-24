# UI Guidelines for Autism- & ADHD‑Friendly Pomodoro Timer

> **Purpose** – Ensure every screen, colour, and interaction in the timer supports calm focus for ADHD users and minimises sensory overload for autistic users.

---

## 1. Colour System

### 1.1 Preset Palettes (Hex)

| Role             | Sea Glass (default) | Nature‑Neutral |
| ---------------- | ------------------- | -------------- |
| Background       | `#F1F6F7`           | `#F5F4F1`      |
| Surface / Card   | `#E0ECEB`           | `#EDEAE5`      |
| Primary Text     | `#42545A`           | `#4B4E46`      |
| Accent (Buttons) | `#6FA8A8`           | `#7C9A80`      |
| Progress Ring    | `#4A6D7C`           | `#5D7160`      |
| Alert / End      | `#F5C48F`           | `#D7BA8C`      |

**Saturation cap:** ≤ 40 % on all UI colours to reduce visual fatigue.

### 1.2 Usage Rules

1. **Focus interval** → desaturated blue/teal (palette accent).
2. **Short break** → muted green.
3. **Long break** → soft lavender (`#E9E5F8`).
4. **Alert / session complete** → warm peach banner – never flashing red.
5. Avoid full‑white `#FFFFFF` and full‑black `#000000`; use off‑white `#FAFAF8` and deep slate `#121212` instead.

## 2. Contrast & Readability

- Maintain WCAG 2.2 AA contrast ≥ 4.5:1 for text ≥ 16 px.
- Headings ≥ 20 px, weight 600–700.
- Avoid colour‑only cues; pair colour with icons or text labels.

## 3. Typography

- Sans‑serif font family → Inter, Helvetica Neue, SF Pro (system stack fallback).
- Base body size 16 px; line‑height 1.5.
- Use typographic scale 16 / 20 / 24 / 32 / 40.

## 4. Layout & Spacing

- 8‑pt grid; minimum 16 px padding at screen edges.
- Group controls logically (Start/Stop, Skip Break) and separate with ≥ 24 px whitespace.
- Max 1 primary call‑to‑action per screen.

## 5. State → Colour Mapping

| Timer State | Ring Colour                        | Background Tint |
| ----------- | ---------------------------------- | --------------- |
| Work        | `#4A6D7C`                          | none            |
| Short Break | `#5D7160`                          | none            |
| Long Break  | `#8078B8` (dusty lavender)         | none            |
| Overtime    | ring pulses opacity 0.6→1 (≤ 2 Hz) |                 |

## 6. Motion & Animation

- **No flashing faster than 3 Hz.**
- Progress ring animates at fixed 60 fps, linear.
- Respect user’s `prefers‑reduced‑motion` → disable ring animation, show numeric countdown only.

## 7. Accessibility & Inclusivity

- High‑contrast toggle deepens text colour to `#2B2B2B` & outlines ring.
- Provide haptic feedback (100 ms vibration) when interval ends.
- All icons require `aria‑label` &/or visible text.
- Colour‑blind safe by default (no reliance on red/green coding).

## 8. Personalisation

- Theme Picker: Sea Glass (default), Nature‑Neutral, Create Custom.
- In Custom Theme: saturation slider hard‑clamped at 50 % max.

## 9. Core Components

### 9.1 Timer Display

- Large digits (min 64 px) centre‑aligned.
- Circular progress ring (stroke 6 px, radius ≥ 72 px).

### 9.2 Controls

- Primary Button: rounded 12 px, height 48 px, fills accent colour.
- Secondary Buttons: ghost style, 1 px border accent, text accent.

## 10. Audio / Haptics

- Optional soft marimba‑style chime (< 65 dB) on interval end.
- Provide sliders for volume 0–100 % and vibration on/off.

## 11. Implementation Notes

1. Store colours in **CSS custom properties** (`--clr‑background`, `--clr‑accent` …).
2. Export design tokens for both palettes; deliver via JSON + SCSS map.
3. Use semantic HTML (`<main>`, `<nav>`, `<button>`, `<progress>`).
4. ARIA live region (`role="status"`) announces "Break over, focus time".
5. Support light & dark mode (auto‑invert value pairs, keep saturation cap).

## 12. Testing & Compliance

- Usability test with ≥ 1 autistic & ≥ 1 ADHD participant per iteration.
- Complete WCAG 2.2 AA checklist before release.
- Run Lighthouse accessibility score ≥ 95.

---

_Last updated: 24 June 2025_
