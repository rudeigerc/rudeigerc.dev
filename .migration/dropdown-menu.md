# dropdown-menu

2026-08-23. Transformation engine, structure cross-checked against the
official Base UI golden. Migrated cleanly.

## Changed
- `src/components/ui/dropdown-menu.tsx`: the primitive is RENAMED - import
  `Menu as MenuPrimitive` from `@base-ui/react/menu`. Part mapping applied:
  `Content` -> `Portal > Positioner > Popup`, `Label` -> `GroupLabel`,
  `ItemIndicator` -> `CheckboxItemIndicator` / `RadioItemIndicator`,
  `Sub` -> `SubmenuRoot`, `SubTrigger` -> `SubmenuTrigger`, and
  `SubContent` rebuilt as a delegation to `DropdownMenuContent` with
  right-side defaults.
  `DropdownMenuContent` now declares, destructures AND forwards
  `align`/`alignOffset`/`side`/`sideOffset` to the Positioner (the "Pick
  means FORWARD" rule; leaving them in `...props` would silently break
  positioning). CSS vars rewritten to `--available-height` /
  `--transform-origin`; `data-[state=...]` -> `data-open:` / `data-closed:`;
  the SubTrigger open marker -> `data-popup-open:`. Item classes, including
  `focus:bg-accent`, unchanged - the official Base UI golden keeps `focus:`
  too.
- `src/components/ModeToggle.tsx`: `DropdownMenuTrigger asChild` -> `render`,
  and the redundant manual `onClick` removed (see project.md).
- leftover scan clean.

## Behavior changes
FLAGGED (from consumer-props.md, not exercised here): `closeOnClick`
defaults to false on CheckboxItem/RadioItem in Base UI. This project only
uses plain `DropdownMenuItem`, which still closes on select - verified live.

## Verify by hand
Click the theme toggle: the menu must open below-right of the trigger,
arrow keys must move the highlight, Enter/click must apply the theme and
close the menu. Confirmed live: Light/Dark/System present, selecting Light
flipped `documentElement.className` from `dark` to light and persisted it.
