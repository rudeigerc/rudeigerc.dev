// @ts-check
import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";
import partytown from "@astrojs/partytown";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

import { rehypeShiki } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import remarkMath from "remark-math";
import remarkGithubAlerts from "remark-github-alerts";
import { transformerTitle } from "@rudeigerc/shiki-transformer-title";

// https://astro.build/config
export default defineConfig({
  site: "https://rudeigerc.dev",
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    mdx(),
    sitemap(),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkMath, remarkGithubAlerts],
    rehypePlugins: [
      rehypeKatex,
      rehypeMermaid,
      [
        rehypeShiki,
        {
          theme: "github-dark",
          transformers: [transformerTitle()],
        },
      ],
    ],
    syntaxHighlight: false,
  },
});
