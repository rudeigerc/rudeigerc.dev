"use client";

import * as React from "react";

import { ChevronDownIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { TocItem } from "@/lib/toc";
import { cn } from "@/lib/utils";

function TocList({ toc, depth = 0 }: { toc: TocItem[]; depth?: number }) {
  return (
    <ul className={cn("m-0 list-none", depth !== 0 && "mt-0.5 pl-3")}>
      {toc.map((heading) => (
        <li key={heading.slug} className="mt-0 py-0.5">
          <a
            href={`#${heading.slug}`}
            className={cn(
              "hover:text-foreground inline-block leading-snug no-underline transition-colors",
              depth === 0
                ? "text-muted-foreground text-sm"
                : "text-muted-foreground/60 hover:text-muted-foreground text-xs",
            )}
          >
            {heading.text}
          </a>
          {heading.children.length > 0 && (
            <TocList toc={heading.children} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function MobileTableOfContents({ toc }: { toc: TocItem[] }) {
  const [open, setOpen] = React.useState(false);

  if (toc.length === 0) {
    return null;
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-border mb-8 rounded-lg border xl:hidden"
    >
      <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-xs font-medium tracking-widest uppercase transition-colors">
        On This Page
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        keepMounted
        className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0"
      >
        <nav className="px-4 pt-1 pb-3">
          <TocList toc={toc} />
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
}
