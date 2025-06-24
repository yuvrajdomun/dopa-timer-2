# ADHD & Autism-Friendly Pomodoro Timer – Feature Backlog

## ✨ Phase 1 – Core MVP

- [x] 25 / 5 default timer with **Start / Pause / Reset**
- [x] Inline **task input** shown during the session
- [x] **Low-stim theme** (pastel palette, large mono digits, zero flashing)
- [x] **Responsive** layout (mobile ↔ desktop) with keyboard shortcuts
  - Space = start/pause R = reset
- [x] Local **persistence** (localStorage) for task, theme, and session lengths
- [ ] **Affiliate shelf** with 3 Pomodoro books (Amazon Associate links)

## ♿ Phase 2 – Accessibility & Neuro-inclusivity

- [ ] **Adjustable session lengths** (work & break sliders)
- [ ] "**Micro-sprint**" 5- or 10-minute quick start button
- [ ] **Prefers-reduced-motion** guard (disable ring animation if set)
- [ ] High-contrast **dark mode** toggle
- [ ] **Adjustable font size** (sm / md / lg) saved per user
- [ ] Optional **discrete audio cues** instead of visual colour shifts
- [ ] **Consistent, predictable layout** (no content jumps)

## 🔄 Phase 3 – Engagement & Motivation

- [ ] **Progress ring** with colour drift in last 60 s
- [ ] **Soft fade overlay** in last 5 s ("wind-down")
- [ ] **Streak counter** + gentle confetti on completed focus slices
- [ ] **Hard-stop break** toggle (disable Start for first 30 s of break)
- [ ] Rewarded **ambient-sound packs** (one free, more via upsell)
- [ ] **Body-doubling rooms** (public 2-6-person video/co-work)

## 💸 Phase 4 – Monetisation

- [ ] Replace hard-coded links with **Amazon PA-API** (dynamic ISBNs)
- [ ] **Affiliate disclosure** banner (GDPR/FTC compliant)
- [ ] Marketplace for **coach-led focus sessions** (stripe checkout)
- [ ] **Pro tier** unlocks unlimited history + private rooms
- [ ] **Team plan** with seat-based pricing & focus analytics export

## ☁️ Phase 5 – Server-side Expansion

- [ ] Node/Express **countdown stream** via WebSocket (multi-tab sync)
- [ ] User **auth** (email + magic-link or OAuth)
- [ ] DB for **stats & streaks** (PostgreSQL / Supabase)
- [ ] **Settings API** (save themes, fonts, timers per user)
- [ ] **Weekly email report** (completed sprints, best focus hour)

## 🚀 Phase 6 – Stretch / Future

- [ ] **Cross-device cloud sync** (desktop PWA + iOS/Android)
- [ ] **Calendar integration** (block time in Google Cal / Outlook)
- [ ] **AI task-chunker** (paste goal → 25-min chunks)
- [ ] **White-label SDK / API** for embedding the timer in other apps
- [ ] **Research-mode**: anonymised usage data for academic partners
