import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().default(""),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      cover: image().optional(),
      draft: z.boolean().optional().default(false),
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      series: z.array(z.string()).optional(),
      external: z.boolean().optional().default(false),
      canonicalURL: z.string().url().optional(),
    }),
});

export const collections = { blog };
