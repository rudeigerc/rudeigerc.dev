import { rehypeShiki } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import partytown from "@astrojs/partytown";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import rehypeFigure from "@microflash/rehype-figure";
import { transformerCopyButton } from "@rudeigerc/shiki-transformer-copy-button";
import { transformerTitle } from "@rudeigerc/shiki-transformer-title";
import {
  transformerMetaHighlight,
  transformerNotationDiff,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import rehypeSlug from "rehype-slug";
import remarkGithubAlerts from "remark-github-alerts";
import remarkMath from "remark-math";
import devtoolsJson from "vite-plugin-devtools-json";

// https://astro.build/config
export default defineConfig({
  site: "https://rudeigerc.dev",
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes("/search/"),
    }),
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
      rehypeFigure,
      [
        rehypeShiki,
        {
          theme: "github-dark",
          transformers: [
            {
              // https://github.com/shikijs/shiki/issues/3#issuecomment-2272168959
              preprocess(code) {
                return code.endsWith("\n") ? code.slice(0, -1) : code;
              },
            },
            {
              span(node) {
                if (!node.children || node.children.length === 0) {
                  node.children = [{ type: "text", value: " " }];
                }
              },
            },
            transformerCopyButton(),
            transformerNotationHighlight(),
            transformerMetaHighlight(),
            transformerNotationDiff(),
            transformerTitle(),
          ],
        },
      ],
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          content: /** @type {Array<ElementContent>} */ (
            fromHtmlIsomorphic(
              '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>',
              { fragment: true },
            ).children
          ),
          behavior: "append",
          properties: { ariaHidden: true, tabIndex: -1, className: "anchor" },
        },
      ],
    ],
    syntaxHighlight: false,
  },
  vite: {
    plugins: [devtoolsJson(), tailwindcss()],
    build: {
      rollupOptions: {
        external: ["/pagefind/pagefind.js"],
      },
    },
  },
});
