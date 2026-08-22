# scroll-area

2026-08-23. Transformation engine. Migrated, but with an UNRESOLVED
regression: the custom scrollbar no longer renders.

## Changed

- `src/components/ui/scroll-area.tsx`
  - import -> `@base-ui/react/scroll-area`
  - `ScrollAreaScrollbar` -> `Scrollbar`, `ScrollAreaThumb` -> `Thumb`
  - types -> `ScrollAreaPrimitive.Root.Props` / `.Scrollbar.Props`
  - added `ScrollAreaPrimitive.Content` inside the Viewport (Base UI's
    anatomy is Root > Viewport > Content; the official base-nova golden
    omits it)
  - class strings unchanged; this wrapper used JS conditionals rather than
    `data-[orientation=...]`, so no class rewrite applied
- leftover scan: `grep -n "radix-ui\|@radix-ui" src/components/ui/scroll-area.tsx` -> clean

## Left alone

Consumer `src/layouts/BlogPost.astro` (`<ScrollArea className="h-full pb-10">`)
was not touched; no prop on the `consumer-props.md` list is used here
(notably `type`, which Base UI drops, was never passed).

## Behavior changes

The scrollbar element is not rendered at all. Measured in the production
build with the table of contents overflowing (viewport 260px / content
468px, later 340px / 468px after a real window resize):

- root carries no `data-has-overflow-y`, i.e. Base UI computes
  hasOverflowY = false despite the real overflow
- `ScrollAreaScrollbar` returns null when hidden and `keepMounted` is false,
  so nothing mounts
- forcing `keepMounted` mounts a 10x300 track whose thumb stays
  `visibility:hidden` with `--scroll-area-thumb-height: 0px`, including
  after a genuine ResizeObserver-triggering window resize

`keepMounted` was therefore reverted rather than shipping an empty track.

Native scrolling of the table of contents is UNAFFECTED (scrollTop applies,
content reachable). The Radix version only showed its scrollbar on hover, so
the visible difference is small, but this is a real unresolved defect and is
reported as such, not as a successful migration.

## Verify by hand

1. Open a long post at >=1280px so the right-hand table of contents shows.
2. Shrink the window until the ToC overflows.
3. Hover the ToC: no scrollbar appears (regression).
4. Scroll with the wheel over the ToC: content must still scroll.
