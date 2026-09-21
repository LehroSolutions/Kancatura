# Instagram Story Marketing Video — Design Document

**Date:** 2026-06-07  
**Author:** Kilo (AI implementation)  
**Status:** Approved — ready for implementation  
**Goal:** Create a 9:16 portrait Hyperframes video that covers the full Kancatura user journey from local launch through PDF export, packaged in `Marketing Video/instagram-story/`.

---

## 1. Goal

A 1080×1920 Instagram Story video that tells the complete Kancatura story in a single coherent watch: local setup → onboarding → dashboard → builder stages → plan creation → financials → tasks → PDF export → CTA.

---

## 2. Visual Direction (Skin)

**Editorial warm-tech minimalism.** The composition should feel like a premium product cutaway, not a SaaS demo.

- **Base:** warm charcoal `#141210`, cream `#F5F0EB`.
- **Accent:** amber `#D97706` for highlights, progress, focus.
- **Type:** display in `Manrope`, code/log/monospace in `JetBrains Mono`.
- **Texture:** subtle grain + soft radial meshes, no purple gradients.
- **Memorability:** consistent phone-frame motif for app screens.

This contrasts directly with the existing 16:9 video, which is a flat corporate layout. The portrait version should feel telegenic and editorial.

---

## 3. Scene Architecture

12 scenes, 100s total, 1080×1920.

| # | Scene ID | Time | Core message |
|---|----------|------|--------------|
| 1 | `scene-01-hero` | 0–8s | Brand reveal + single value statement |
| 2 | `scene-02-setup` | 8–16s | Local launch in a terminal |
| 3 | `scene-03-welcome` | 16–24s | First app screen: welcome state |
| 4 | `scene-04-profile` | 24–34s | One-tap profile setup inside phone frame |
| 5 | `scene-05-dashboard` | 34–46s | Readiness signal cards + progress |
| 6 | `scene-06-stages` | 46–56s | Vertical stage timeline, not horizontal grid |
| 7 | `scene-07-editor` | 56–66s | Section workspace inside phone frame |
| 8 | `scene-08-financials` | 66–76s | Metrics + chart in phone frame |
| 9 | `scene-09-tasks` | 76–86s | Vertical task flow |
| 10 | `scene-10-pdf` | 86–96s | Document generation and download |
| 11 | `scene-11-value` | 96–104s | Three headline benefits stacked |
| 12 | `scene-12-cta` | 104–110s | Single CTA with clear path |

---

## 4. Portrait-Specific Changes from Existing 16:9 Video

1. Phone-frame motif replaces full-screen UI mockups. App content lives inside a device silhouette so vertical format feels native.
2. Vertical stage timeline replaces 6-column horizontal progress grid. Flow goes top-down like a checklist.
3. Single-column focused messaging. Each scene concentrates on 1 message rather than showing 4 cards side by side.
4. Larger display type. Portrait allows higher line-height and more expressive scale.
5. Stagger is anchored around center spine for readability on mobile preview before final render.

---

## 5. Reusable Pattern: Phone-Frame Component

A single inline CSS class `.phone-frame` renders an iPhone-style silhouette with inner bezel, notch, and home indicator. Inside it, a `.phone-screen` holds the mock UI. All app screens reuse this shell.

Benefits:
- Consistent brand feel across 5 scenes.
- Clear mental model for viewers familiar with mobile UIs.
- Constrains layout width automatically, preventing awkward over-wide content in 9:16.

---

## 6. Vertical Timeline Component

`.timeline` is a single-column vertical flow with accent dots and connectors between stages. Each `.stage-row` contains title, status badge, and completion meter. The whole element scrolls into frame as a unit.

---

## 7. Deliverables

```
Marketing Video/instagram-story/
  index.html        Composition (self-contained)
  style.css         All styles, keyframes, grain texture, typography
  hyperframes.json  Composition metadata
  meta.json         Video metadata
  README.md         Preview and render commands
```

No external image, video, or font dependencies. All visuals are generated with CSS/SVG/inline assets. GSAP is loaded via CDN if needed; otherwise CSS animations are preferred.

---

## 8. Quality Gates

- [ ] All visual output passes the AI Slop filter.
- [ ] Palette uses CSS custom properties, no inline color literals.
- [ ] No purple-to-blue gradient.
- [ ] At least one grid-breaking or asymmetric element.
- [ ] Typography pairing: Manrope + JetBrains Mono.
- [ ] Animation prefers CSS keyframes; JS used only for orchestration.
- [ ] Renders at 1080×1920, 30fps.
- [ ] All scenes have coherent start/duration and smooth transitions.
- [ ] CTA is actionable and primary.

---

## Decision Log

- **Why 100s instead of 90s or 120s?** Slower visual pace suits vertical format; 100s keeps attention without outlasting Instagram Story max attention span.
- **Why phone-frame instead of no frame?** Frame makes the product feel real and creates a stable visual anchor across scenes.
- **Why editorial minimalism?** Matches the existing brand and differentiates from typical purple-gradient AI videos.
- **Why CSS-first animation?** Keeps the composition simple and renderer-friendly. GSAP is available if complex sequencing requires it.
