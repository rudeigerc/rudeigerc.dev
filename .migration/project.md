# project

2026-08-23. Whole-project Radix -> Base UI migration, transformation engine
(legacy style: `new-york` has no `base-new-york` counterpart, so the golden
pair could not be replayed; our own files were rewired and every class string
was preserved verbatim).

Baseline before the migration: `astro check` 0 errors / 0 warnings / 3 hints,
`astro build` exit 0, 37 pages. Same numbers after.

## Dependency swap

- `+ @base-ui/react@1.7.0`
- `- radix-ui@1.4.3` (removed only after the last wrapper was migrated)
- `grep -rn "radix-ui\|@radix-ui" src/` -> zero hits

## Wrappers migrated (8)

button, badge, separator, scroll-area, dialog, sheet, dropdown-menu,
attachment. All were byte-identical to the registry goldens before the
migration, so no user customizations had to be replayed.

## Left alone

- `command.tsx` - cmdk, not radix (hard rule). Only its `CommandDialog`
  props type was narrowed (`Omit<..., "children">`), matching what the
  official Base UI registry does, because Base UI widens `children` to
  include a render function and cmdk's `Command` does not accept one.
- `card.tsx`, `pagination.tsx` - never used a radix primitive.

## App-code sweep (consumer-props.md)

- `SearchCommandDialog.tsx` - `DialogTrigger asChild` -> `render`
- `MobileNav.tsx` - `SheetTrigger asChild` -> `render`; two `SheetClose
  asChild` -> `render` + `nativeButton={false}` (they render `<a>`)
- `ModeToggle.tsx` - `DropdownMenuTrigger asChild` -> `render`, and the
  manual `onClick` that toggled the controlled `open` state was removed:
  Base UI's trigger already drives `onOpenChange`, so keeping both
  double-toggled and the menu never opened. Verified in the browser.

## Deviation from the reference files (verified against node_modules)

`class-mapping.md` and the base-nova goldens rewrite orientation classes to
`data-horizontal:` / `data-vertical:`. On `@base-ui/react@1.7.0` that is
WRONG for this project: `SeparatorDataAttributes` and
`ScrollAreaScrollbarDataAttributes` both declare `orientation =
"data-orientation"`, and `getStateAttributesProps` emits
`data-orientation="horizontal"` when no custom mapping is registered
(scroll-area's mapping does not cover orientation). Our existing
`data-[orientation=...]` classes were therefore KEPT. Confirmed live: the
search dialog's vertical separator measures 32px, which only happens if the
class matches.

Animations were NOT rewritten to `data-starting-style:` /
`data-ending-style:`; the official Base UI dialog/dropdown goldens keep the
tw-animate utilities and only rename the selector, which also preserves this
project's exact motion.

## Verified in the browser (production build via `astro preview`)

Theme menu opens/positions/selects and closes; theme actually switches and
persists. Search dialog opens with backdrop, cmdk input autofocuses, a query
for "kubernetes" returns 59 Pagefind results. Mobile sheet slides in from the
left, its links are real `<a>` elements with correct hrefs. Badges carry
`data-slot` / `data-variant`.

## Open regression

scroll-area: see `.migration/scroll-area.md`. Scrolling works; the custom
scrollbar never renders. Not resolved.
