---
name: interface
description: Polish MiniLedger screens for hierarchy, touch targets, states, and the paper-ledger visual system. Use when changing the mobile UI, layout, styling, login, loan list, summary card, or entry form.
---

# MiniLedger interface

Warm paper ledger. Ink `#1C1915`, paper `#F3EEE4`, card `#FFFCF7`, green `#0F6E56`, overdue `#8E332C`. Fraunces for names and money. System sans for controls.

- The summary answers what is still out before the list. One primary action per screen.
- Targets are at least 44px. Every pressable has a pressed state. Saving disables the control and changes its label.
- Errors sit with the field that failed, use the overdue color, and set `accessibilityLiveRegion="polite"`.
- Overdue uses tint, border, and a text badge together. Repaid stays readable and offers no repay action.
- Loading, empty, error, and filtered-empty states are explicit. A failed load must not look like an empty ledger.
- Format money with the shared rupee helpers. Do not add a second display font, purple gradients, or glassmorphism.
