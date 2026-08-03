# Agent Office Design System

## 1. Atmosphere & Identity

Agent Office is a dark operations room for a working AI team. The signature is a dense, lit office map embedded inside a precise SaaS shell: muted graphite surfaces, cool glass panels, quiet blue-violet interaction accents, and status color only where state matters.

## 2. Color

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Canvas | --ao-bg | #08090a | App background |
| Panel | --ao-panel | #0f1011 | Sidebar and chat shells |
| Surface | --ao-surface | #191a1b | Cards, controls, office panels |
| Surface soft | --ao-surface-soft | rgba(255,255,255,0.04) | Low emphasis controls |
| Border | --ao-border | rgba(255,255,255,0.08) | Panels and cards |
| Border subtle | --ao-border-subtle | rgba(255,255,255,0.05) | Inner separators |
| Text | --ao-text | #f7f8f8 | Primary text |
| Text muted | --ao-muted | #8a8f98 | Secondary text |
| Accent | --ao-accent | #7170ff | Selected, focus, primary actions |
| Accent hover | --ao-accent-hover | #828fff | Hover state |
| Success | --ao-success | #27a644 | Working/healthy |
| Warning | --ao-warning | #f59e0b | Reviewing/attention |
| Danger | --ao-danger | #ef4444 | Blocked/failure |
| Info | --ao-info | #0ea5e9 | Supportive state |

Rules: the UI is dark-mode native. Accent color is not decoration; it marks selection, active controls, and important workflow state.

## 3. Typography

Primary: Inter Variable, Pretendard, Apple SD Gothic Neo, Noto Sans KR, system-ui, sans-serif. Mono: Berkeley Mono, ui-monospace, SFMono-Regular, Menlo, monospace.

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 20px | 590 | 1.2 | App and panel titles |
| H2 | 15px | 590 | 1.35 | Card headings |
| Body | 13px | 400 | 1.5 | Main UI text |
| Small | 12px | 510 | 1.45 | Secondary UI |
| Micro | 10px | 510 | 1.4 | Labels, metadata |

## 4. Spacing & Layout

Base unit: 4px. Primary shell: 300px sidebar, fluid stage, 360px chat panel. Main office surfaces use 8px radius or less unless representing furniture. Layout must stay usable at 1280px and collapse side panels at narrow widths.

## 5. Components

### Agent card
- Structure: button/card with avatar mark, role, status badge, task, zone, description.
- States: default, hover, selected, focus.
- Accessibility: real button for selection; visible focus ring.

### Operations stage
- Structure: stage shell, zone panels, furniture layer, agent layer, details popover.
- States: work, meeting, selected agent, active speaker.
- Motion: transform/opacity only; position transitions for agent routing.

### Furniture object
- Structure: data-driven object with role-specific subparts.
- Variants: workstation, meeting table, board, rack, sofa, rug, plant.
- Rule: no furniture is a plain unlabeled rectangle.

### Agent avatar
- Structure: live DOM/SVG shape with body, head, tool badge, status dot, label, tooltip.
- States: idle, working, reviewing, meeting, blocked, speaking, selected.

## 6. Motion & Interaction

Micro: 140ms ease-out. Standard: 240ms ease-in-out. Agent routing: 900-1100ms ease-in-out per leg. Reduced motion disables bobbing and walking animations while keeping state changes visible.

## 7. Depth & Surface

Strategy: mixed tonal shift plus subtle borders. Office zones use translucent dark panels, faint rugs, rim light, and one consistent top-left lighting direction. Shadows are tinted black with occasional blue/violet glow only for active state.
