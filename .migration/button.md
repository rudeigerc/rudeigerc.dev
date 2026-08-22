# button

2026-08-23. Transformation engine. Migrated cleanly.

## Changed
- `src/components/ui/button.tsx`: `Slot` + `asChild` -> the real
  `@base-ui/react/button` primitive (per universal-patterns.md, button.tsx
  must NOT become a hand-rolled useRender wrapper). Props type ->
  `ButtonPrimitive.Props`; `React` import dropped. cva strings, `data-slot`,
  `data-variant`, `data-size` unchanged.
- leftover scan clean.

## Left alone
Call sites that pass `buttonVariants(...)` to plain `<a>` elements
(`Header.astro`, `MobileNav.tsx`, `SocialLinks.astro`) need no change: they
never used `asChild`.

## Behavior changes
`asChild` is gone from the public API; polymorphism is now `render`. Any
future `render={<a/>}` needs `nativeButton={false}`.

## Verify by hand
Click the theme toggle, the search field and the mobile menu button; all
three are Buttons driven through a trigger's `render`.
