"use client";

import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type {
  PagefindSearchFragment,
  PagefindSearchResult,
} from "@/types/pagefind";
import { NotebookTextIcon } from "lucide-react";
import { Separator } from "./ui/separator";

declare global {
  interface Window {
    pagefind?: Pagefind;
  }
}

export const SearchCommandDialog = () => {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<PagefindSearchFragment[]>([]);
  const [searchText, setSearchText] = React.useState("");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const onOpenChange = async (open: boolean) => {
    setOpen(open);

    setLoading(true);

    try {
      if (!window.pagefind) {
        const module = "/pagefind/pagefind.js";
        window.pagefind = (await import(/* @vite-ignore */ module)) as Pagefind;
        window.pagefind.init();
      }
    } catch (error) {
      // @ts-expect-error
      window.pagefind = {
        debouncedSearch: () =>
          Promise.resolve({
            results: [],
          }),
      };
    }

    setLoading(false);
  };

  const onValueChange = async (value: string) => {
    setSearchText(value);

    if (window.pagefind) {
      const searchResults = await window.pagefind.debouncedSearch(value);
      if (searchResults) {
        const data = await Promise.all(
          searchResults.results.map(
            async (result: PagefindSearchResult) => await result.data(),
          ),
        );
        console.log(data);
        setResults(data);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onOpenChange(true);
        }}
        className="focus-visible:ring-ring border-input hover:bg-accent hover:text-accent-foreground bg-muted/50 text-muted-foreground relative inline-flex h-8 w-full items-center justify-start rounded-[0.5rem] border px-4 py-2 text-sm font-normal whitespace-nowrap shadow-none transition-colors focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 sm:pr-12 md:w-40 lg:w-64"
      >
        <span className="inline-flex"> Search... </span>
        <kbd className="bg-muted pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={onOpenChange} showCloseButton>
        <CommandInput
          value={searchText}
          onValueChange={onValueChange}
          placeholder="Search posts..."
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading={`Found Posts (${results.length})`}>
              {results.map((result) => (
                <>
                  <CommandItem
                    key={result.url}
                    onSelect={() => {
                      window.location.href = result.url;
                    }}
                    className="font-medium text-sm"
                  >
                    <NotebookTextIcon />
                    <span className="min-w-0 truncate">
                      {result.meta.title}
                    </span>
                  </CommandItem>
                  {result.sub_results.slice(0, 3).map((subResult) => (
                    <CommandItem
                      key={subResult.url}
                      onSelect={() => {
                        window.location.href = subResult.url;
                      }}
                      className="text-muted-foreground flex flex-row items-center gap-2 p-2 text-start text-xs ps-8!"
                    >
                      <Separator
                        orientation="vertical"
                        className="absolute start-4 inset-y-0"
                      />
                      <span
                        className="min-w-0 truncate"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered content
                        dangerouslySetInnerHTML={{
                          __html: subResult.excerpt,
                        }}
                      />
                    </CommandItem>
                  ))}
                </>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
