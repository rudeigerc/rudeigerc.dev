"use client";

import * as React from "react";

import { CornerDownLeftIcon, NotebookTextIcon } from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/animate-ui/icons/search";
import type {
  PagefindSearchFragment,
  PagefindSearchResult,
} from "@/types/pagefind";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    pagefind?: Pagefind;
  }
}

const CommandInput = ({
  className,
  isLoading = false,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  isLoading?: boolean;
}) => (
  <div
    data-slot="command-input-wrapper"
    className="flex h-9 items-center gap-2 border-b px-3"
  >
    <Search animate={isLoading} className="size-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      data-slot="command-input"
      className={cn(
        "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
);

function CommandMenuKbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "bg-background text-muted-foreground pointer-events-none flex h-5 items-center justify-center gap-1 rounded border px-1 font-sans text-[0.7rem] font-medium select-none [&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  );
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
  };

  const onValueChange = async (value: string) => {
    setSearchText(value);

    if (window.pagefind) {
      setLoading(true);

      const searchResults = await window.pagefind.debouncedSearch(value);
      if (searchResults) {
        const data = await Promise.all(
          searchResults.results.map(
            async (result: PagefindSearchResult) => await result.data(),
          ),
        );
        setResults(data);
      }

      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button
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
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 pb-11">
          <DialogHeader className="sr-only">
            <DialogTitle>Search...</DialogTitle>
            <DialogDescription>
              Search for a command to run...
            </DialogDescription>
          </DialogHeader>
          <Command
            shouldFilter={false}
            className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          >
            <CommandInput
              value={searchText}
              onValueChange={onValueChange}
              placeholder="Search posts..."
              isLoading={isLoading}
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
          </Command>
          <div className="text-muted-foreground absolute inset-x-0 bottom-0 z-20 flex h-10 items-center gap-2 rounded-b-xl border-t border-t-neutral-100 bg-neutral-50 px-4 text-xs font-medium dark:border-t-neutral-700 dark:bg-neutral-800">
            <div className="flex items-center gap-2">
              <CommandMenuKbd>
                <CornerDownLeftIcon />
              </CommandMenuKbd>
              Go to Page
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
