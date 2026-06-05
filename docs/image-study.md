# Kancatura Source Image Study

Source: `docs/assets/kancatura.png`

## What The Image Communicates

The source image shows a business plan dashboard for an SMB-focused planning product. The interface is not a marketing page. It is an operational workbench with persistent navigation, progress tracking, business-plan sections, key highlights, financial indicators, tasks, and document management.

## Extracted Design DNA

```json
{
  "source_mode": "image",
  "source": "local reference image",
  "refusal": "ok",
  "macrostructure": "Workbench / operational dashboard",
  "macrostructure_alt": "Analytics cockpit",
  "nav": {
    "archetype": "fixed left rail",
    "knobs": {
      "brand_position": "top-left",
      "section_count": "dense",
      "support_panel": "bottom tip card"
    }
  },
  "hero": {
    "archetype": "none",
    "knobs": {
      "reason": "first screen is the product workspace"
    }
  },
  "pitch": {
    "archetype": "dashboard cards",
    "knobs": {
      "primary_panel": "plan progress ring",
      "secondary_panels": "highlights, metrics, tasks, documents"
    }
  },
  "display_role": "neutral grotesque, heavy dashboard heading",
  "display_face": null,
  "body_role": "neutral grotesque",
  "body_face": null,
  "label_role": "compact uppercase or small dashboard labels",
  "label_face": null,
  "pairing_logic": "single family with weight contrast",
  "paper_band": "light >85",
  "paper_value": null,
  "paper_hue": "neutral-cool",
  "accent_hue_band": "cyan-blue with green, orange, and violet data accents",
  "accent_value": null,
  "accent_footprint": "recurring 5-15%",
  "density": "medium-dense",
  "asymmetry": "asymmetric-grid",
  "treatments": [
    "dark left navigation rail",
    "light analytics canvas",
    "thin borders",
    "progress ring",
    "compact card grid",
    "document and task rows"
  ],
  "reveal": "not-visible",
  "motion_library": null,
  "anti_patterns": [
    "dashboard could become generic if copied directly",
    "sample metrics must stay labelled until backed by real data"
  ]
}
```

## Kancatura Translation

Kancatura keeps the image's business-plan information architecture and mirrors the visible reference closely for the dashboard screen. The application becomes a founder/operator workbench:

- Plan sections are first-class records with readiness, evidence status, and review state.
- Financial readiness is visible without forcing the user into a spreadsheet first.
- Tasks and documents remain adjacent to the plan, because business plans are workflows, not static documents.
- The UI should be dense enough for repeat work, but still readable for non-technical founders.
- The first viewport follows the provided dashboard reference closely, including the Kancatura brand lockup, Kancatura workspace profile chip, export placement, dashboard card grid, and capability strip.
- The first viewport is the actual workspace: no landing hero, no marketing copy block, and no decorative-only card grid.
- The image's chart density is translated into lightweight SVG/CSS visuals rather than a charting dependency.

## Product Meaning

Kancatura is a business plan application that helps a user turn scattered market notes, operating assumptions, financial projections, and documents into a structured plan that can be reviewed, exported, and improved over time.

## Implemented UI Reading

The implementation keeps the dark fixed rail, light planning canvas, task/document rows, financial signals, and capability strip from the source image, but the first screen is no longer a cramped status replica. Kancatura now uses a Founder Studio layout with a dominant guided builder lane, stage track, readiness blockers, evidence coverage, export checkpoints, and calmer support panels. The rail items remain real stateful tabs, with each non-dashboard item backed by a production content surface rather than an inert anchor.
