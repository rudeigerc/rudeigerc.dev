/*
 * Source: https://github.com/withastro/starlight/blob/main/packages/starlight/utils/generateToC.ts
 */

import type { MarkdownHeading } from "astro";

export interface TocItem extends MarkdownHeading {
  children: TocItem[];
}

interface TocOpts {
  minHeadingLevel: number;
  maxHeadingLevel: number;
}

/** Convert the flat headings array generated by Astro into a nested tree structure. */
export function generateToC(
  headings: MarkdownHeading[],
  { minHeadingLevel, maxHeadingLevel }: TocOpts,
) {
  // biome-ignore lint/style/noParameterAssign: third-party
  headings = headings.filter(
    ({ depth }) => depth >= minHeadingLevel && depth <= maxHeadingLevel,
  );
  const toc: Array<TocItem> = [];
  for (const heading of headings)
    injectChild(toc, { ...heading, children: [] });
  return toc;
}

/** Inject a ToC entry as deep in the tree as its `depth` property requires. */
function injectChild(items: TocItem[], item: TocItem): void {
  const lastItem = items.at(-1);
  if (!lastItem || lastItem.depth >= item.depth) {
    if (item.slug !== "footnote-label") {
      items.push(item);
    }
  } else {
    // biome-ignore lint/correctness/noVoidTypeReturn: third-party
    return injectChild(lastItem.children, item);
  }
}
