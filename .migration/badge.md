# badge

2026-08-23. Transformation engine (shape follows the official Base UI
golden). Migrated cleanly.

## Changed
- `src/components/ui/badge.tsx`: `Slot`/`asChild` -> `useRender` +
  `mergeProps`. `data-slot` / `data-variant` are now supplied through
  `state: { slot: "badge", variant }`, which `getStateAttributesProps`
  renders as the same two attributes - this also sidesteps the documented
  mergeProps data-* excess-property pitfall. cva strings unchanged.
- leftover scan clean.

## Left alone
`PostList.astro` and `BlogPost.astro` only pass `variant` and
`data-pagefind-filter`; nothing on the consumer-props list.

## Behavior changes
None observed.

## Verify by hand
Open any post: the category badge (secondary) and the `#tag` badges
(outline) must keep their pill shape and border. Confirmed live:
`data-slot="badge"`, `data-variant="secondary"|"outline"`.
