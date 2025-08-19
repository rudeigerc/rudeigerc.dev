/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module "@pagefind/default-ui" {
  declare class PagefindUI {
    // biome-ignore lint/suspicious/noExplicitAny: third-party
    constructor(arg: any);
  }
}
