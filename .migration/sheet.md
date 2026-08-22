# sheet

2026-08-23. Transformation engine. Migrated cleanly.

## Changed
- `src/components/ui/sheet.tsx`: import -> `@base-ui/react/dialog`;
  `Overlay` -> `Backdrop`, `Content` -> `Popup`; types ->
  `SheetPrimitive.<Part>.Props`; `data-[state=...]` -> `data-open:` /
  `data-closed:`. The per-side slide classes were KEPT as tw-animate
  utilities rather than rewritten to `data-starting-style:` /
  `data-ending-style:` as class-mapping.md suggests: the official Base UI
  sheet uses a different motion (a 2.5rem nudge plus fade), and this project
  should keep its full slide-in.
- `src/components/MobileNav.tsx`: `SheetTrigger asChild` -> `render`; both
  `SheetClose asChild` -> `render` + `nativeButton={false}` (they render
  `<a>`, and Base UI needs to be told the rendered element is not a button).
- leftover scan clean.

## Behavior changes
FLAGGED: on open, focus now lands on the first navigation link (with a
visible focus ring) instead of the close button. Both libraries auto-focus
the panel's first focusable element; the ring is more visible under Base UI.
Not patched - `initialFocus` on `SheetContent` would change it if wanted.

Exit animation is driven by tw-animate keyframes under Base UI's unmount
timing; worth watching for a clipped close.

## Verify by hand
At <768px: open the menu, confirm the panel slides in from the left, click a
nav link (it must navigate AND close), reopen and press Escape.
