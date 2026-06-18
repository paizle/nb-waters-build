# Interaction patterns

Cross-platform map and control behavior for New Brunswick Waters.

## Hover equals tap (reveal)

On **desktop**, pointer hover opens animated labels and secondary content (Nearest Waters list, GPS button labels, settings menu item labels).

On **touch**, there is no hover. Use the **first tap** on the same control to reveal the label/content. A **second tap** performs the primary action when the control is a toggle (Nearest Waters map arrows).

Implementation: [`MapControlButton`](../src/Components/Map/MapControlButton.jsx) with optional `actionOnFirstTap` for immediate actions (Lock to GPS, Move to my location).

## When to use `actionOnFirstTap`

| Pattern | Use when |
|---------|----------|
| `actionOnFirstTap={true}` | The button should act immediately (GPS pan, theme toggle) |
| Default (two-tap on touch) | Toggle or mode that shows extra UI before acting (Nearest Waters arrows) |

## Accessibility: `aria-label` over `title`

Controls that show a **custom animated label** should use `aria-label` on the icon button and **not** `title`. Native `title` tooltips duplicate the popper and feel redundant.

Keep `aria-label` descriptive for screen readers. Visible labels are for sighted users.

## Shared hover zone

Related UI (label + button + list) must live in one pointer target (e.g. `MapControlButton-zone`) so moving between parts does not fire `mouseout` and dismiss the popper.

## Map-specific touch

- **Water heat map** blobs: first tap opens popup; second tap on same cluster zooms or selects.
- **Viewport outlines**: tap selects; brief teal highlight on touch.
- **Nearest Waters** overlay: arrow and label are paired; hover or selection highlights both.
