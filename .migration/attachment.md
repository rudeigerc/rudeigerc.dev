# attachment

2026-08-23. Transformation engine (shape follows the official Base UI
golden). Migrated cleanly.

## Changed
- `src/components/ui/attachment.tsx`: `AttachmentTrigger`'s `Slot`/`asChild`
  -> `useRender` + `mergeProps`, with `state: { slot: "attachment-trigger" }`
  and `type: render ? type : (type ?? "button")`. Every other part is a
  plain div/span and was untouched.
- leftover scan clean.

## Left alone
`src/components/SocialLinks.astro` needs no change: it composes Attachment
parts as children and never used `asChild` (which does not work from `.astro`
anyway, since Astro passes children as static HTML).

## Behavior changes
None observed.

## Verify by hand
Open /about: the four link cards and the WeChat QR card must render with
their icons, titles and descriptions intact.
