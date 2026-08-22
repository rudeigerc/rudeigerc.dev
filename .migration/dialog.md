# dialog

2026-08-23. Transformation engine, structure cross-checked against the
official Base UI golden. Migrated cleanly.

## Changed
- `src/components/ui/dialog.tsx`: import -> `@base-ui/react/dialog`;
  `Overlay` -> `Backdrop`, `Content` -> `Popup` (centered modal, so no
  Positioner); types -> `DialogPrimitive.<Part>.Props`;
  `data-[state=open|closed]:` -> `data-open:` / `data-closed:`;
  `DialogFooter`'s `Close asChild` -> `render={<Button variant="outline" />}`.
  All class strings otherwise unchanged, including the tw-animate
  utilities (the official Base UI golden keeps them too).
- `src/components/ui/command.tsx`: `CommandDialog` props narrowed to
  `Omit<..., "children"> & { children: React.ReactNode }`.
- `src/components/SearchCommandDialog.tsx`: `DialogTrigger asChild` ->
  `render={<Button .../>}`, with the button's inner markup moved to the
  trigger's children.
- leftover scan clean.

## Left alone
cmdk internals (`Command`, `CommandInput`, ...) - not radix.

## Behavior changes
None observed. Focus, Escape and backdrop-dismiss all still work.

## Verify by hand
Cmd+K and the header search button both open the dialog; the input takes
focus; typing returns results; Escape and the X close it. Confirmed live:
59 Pagefind hits for "kubernetes".
