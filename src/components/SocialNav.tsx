"use client";

import { Mail, Rss } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Icons } from "./Icons";

const socialLinks = [
  {
    href: "https://github.com/rudeigerc",
    label: "GitHub",
    icon: <Icons.github className="h-4 w-4" />,
    className: "",
  },
  {
    href: "https://x.com/yuchenrcheng",
    label: "X",
    icon: <Icons.x className="h-4 w-4" />,
    className: "",
  },
  {
    href: "mailto:rudeigerc@gmail.com",
    label: "Mail",
    icon: <Mail className="h-4 w-4" />,
    className: "hidden md:inline-flex",
  },
  {
    href: "/rss.xml",
    label: "RSS",
    icon: <Rss className="h-4 w-4" />,
    className: "hidden md:inline-flex",
  },
] as const;

export function SocialNav() {
  return (
    <TooltipProvider delay={400}>
      {socialLinks.map((link) => (
        <Tooltip key={link.href}>
          <TooltipTrigger
            render={
              // biome-ignore lint/a11y/useAnchorContent: Base UI injects the icon as children; the accessible name comes from aria-label
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-9 w-9 px-0",
                  link.className,
                )}
              />
            }
          >
            {link.icon}
          </TooltipTrigger>
          <TooltipContent>{link.label}</TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  );
}
