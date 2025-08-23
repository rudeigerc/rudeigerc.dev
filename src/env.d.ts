/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module "@pagefind/default-ui" {
  declare class PagefindUI {
    // biome-ignore lint/suspicious/noExplicitAny: third-party
    constructor(arg: any);
  }
}

declare class Pagefind {
  debouncedSearch: (
    query: string,
    options?: PagefindSearchOptions,
    duration?: number,
  ) => Promise<PagefindSearchResults>;
  destroy: () => Promise<void>;
  filters: () => Promise<PagefindFilterCounts>;
  init: () => Promise<void>;
  mergeIndex: (
    indexPath: string,
    options?: Record<string, unknown>,
  ) => Promise<void>;
  options: (options: PagefindIndexOptions) => Promise<void>;
  preload: (term: string, options?: PagefindIndexOptions) => Promise<void>;
  search: (
    term: string,
    options?: PagefindSearchOptions,
  ) => Promise<PagefindSearchResults>;
}
