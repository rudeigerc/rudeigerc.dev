# scroll-area

2026-08-23. Transformation engine. Migrated cleanly. An earlier revision of
this report called the missing scrollbar a Base UI regression; that was a
misdiagnosis and is corrected below.

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
- `src/layouts/BlogPost.astro`: `<ScrollArea>` -> `<ScrollArea client:visible>`
- leftover scan: clean

## The real defect (pre-existing, not caused by this migration)

`ScrollArea` is a JS-driven component but was used from `.astro` with no
`client:*` directive, so it was rendered to static HTML and never hydrated.
Base UI's effects, ResizeObserver and thumb measurement therefore never ran,
`hiddenState` stayed at its SSR default, and `Scrollbar` returned null.
`grep -c scroll-area-scrollbar` on the built page: 0.

The same was true under Radix, and it was worse there. Fetched from the live
site, which still runs the pre-migration build:

- Radix: viewport inline style `overflow-x:hidden;overflow-y:hidden`
  -> a table of contents taller than the viewport could NOT be scrolled
- Base UI: viewport inline style `overflow:scroll`
  -> it scrolls

Neither version ever rendered a custom scrollbar (0 occurrences in both).
So the migration improved this component; it did not regress it.

Adding `client:visible` fixes the remaining half. Verified in the production
build with the ToC overflowing (viewport 190px / content 468px):

- root gains `data-has-overflow-y`, `data-overflow-y-start`, `data-overflow-y-end`
- scrollbar renders 10x230
- thumb is 76.3px tall with `visibility: visible`

Cost: the `scroll-area` island chunk is 12.7 KB uncompressed, loaded only on
post pages and only once the ToC scrolls into view. The React runtime is
already on every page for the search dialog.

## Left alone

No prop on the `consumer-props.md` list is used at the call site (notably
`type`, which Base UI drops, was never passed).

## Behavior changes

The ToC is now scrollable where it previously was not, and it now shows the
styled scrollbar it was always supposed to have.

## Verify by hand

1. Open a long post at >=1280px wide so the right-hand ToC shows.
2. Shrink the window height until the ToC overflows.
3. The thin scrollbar must appear on the right of the ToC and the thumb must
   track the wheel.
