import { Mail, Menu, Rss } from "lucide-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Icons } from "./Icons";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/posts", label: "Blog" },
  { href: "/about", label: "About" },
] as const;

const socialLinks = [
  {
    href: "https://github.com/rudeigerc",
    label: "GitHub",
    icon: <Icons.github className="h-4 w-4" />,
    external: true,
  },
  {
    href: "https://x.com/yuchenrcheng",
    label: "X",
    icon: <Icons.x className="h-4 w-4" />,
    external: true,
  },
  {
    href: "mailto:rudeigerc@gmail.com",
    label: "Mail",
    icon: <Mail className="h-4 w-4" />,
    external: true,
  },
  {
    href: "/rss.xml",
    label: "RSS",
    icon: <Rss className="h-4 w-4" />,
    external: true,
  },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-3.5 min-h-[44px] min-w-[44px]"
            aria-label="Open navigation menu"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation links
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {navLinks.map((link) => (
            <SheetClose
              key={link.href}
              nativeButton={false}
              render={
                <a
                  href={link.href}
                  className="text-foreground/80 hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                />
              }
            >
              {link.label}
            </SheetClose>
          ))}
        </nav>
        <div role="separator" className="bg-border mx-4 h-px" />
        <nav className="flex items-center gap-1 px-4">
          {socialLinks.map((link) => (
            <SheetClose
              key={link.href}
              nativeButton={false}
              render={
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 px-0",
                  )}
                />
              }
            >
              <span className="sr-only">{link.label}</span>
              {link.icon}
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
