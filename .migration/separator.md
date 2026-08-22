# separator

2026-08-23. Transformation engine. Migrated cleanly.

## Changed
- `src/components/ui/separator.tsx`: import -> `@base-ui/react/separator`;
  the primitive is callable, so `SeparatorPrimitive.Root` -> `SeparatorPrimitive`;
  props -> `SeparatorPrimitive.Props`; `decorative` prop removed (dropped by
  Base UI). Class string unchanged - see the orientation finding in
  project.md, `data-[orientation=...]` is still correct on 1.7.0.
- leftover scan clean.

## Left alone
`MobileNav.tsx` renders its own `<div role="separator">` rather than this
component; untouched.

## Behavior changes
FLAGGED: Radix rendered these with `decorative={true}`, which exposes them as
`role="none"` to assistive tech. Base UI has no `decorative` prop and always
renders `role="separator"`, so the search dialog's divider is now announced.
Not patched.

## Verify by hand
Open the search dialog: the vertical divider next to the shortcut hints must
still be 1px wide and full height (measured live at 32px).
