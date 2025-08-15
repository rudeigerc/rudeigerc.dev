import { getImage } from "astro:assets";
import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import MarkdownIt from "markdown-it";
import { parse } from "node-html-parser";
import sanitizeHtml from "sanitize-html";

import { SITE_DESCRIPTION, SITE_TITLE } from "@/consts";

const parser = new MarkdownIt();

const imagesGlob = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/**/*.{jpeg,jpg,png,gif,webp}",
);

export const GET: APIRoute = async (context) => {
  const posts = await Promise.all(
    (await getCollection("blog"))
      .filter((post) => !post.data.draft)
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map(async (post) => {
        const content = parser.render(post.body ?? "");
        const html = parse(content);
        const imgs = html.querySelectorAll("img");

        for (const img of imgs) {
          const src = img.getAttribute("src");
          if (!src?.startsWith("../../assets/")) continue;

          const assetPath = src.replace("../../assets/", "");
          const imageKey = `/src/assets/${assetPath}`;

          try {
            const imageModule = await imagesGlob[imageKey]?.();
            if (imageModule) {
              const optimizedImg = await getImage({ src: imageModule.default });
              const optimizedUrl = new URL(
                optimizedImg.src.replace("/", ""),
                context.site,
              );
              img.setAttribute("src", optimizedUrl.toString());
            }
          } catch (error) {
            console.warn(`Failed to optimize image: ${src}`, error);
          }
        }

        return { ...post, html };
      }),
  );

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site ?? "",
    items: posts.map((post) => ({
      link: `/posts/${post.id}/`,
      content: sanitizeHtml(post.html.toString(), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
      }),
      ...post.data,
    })),
    customData: `
      <language>zh-Hans</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <generator>@astrojs/rss</generator>
      <copyright>© ${new Date().getFullYear()} Yuchen Cheng. This site is licensed under a Creative Commons Attribution 4.0 International license.</copyright>
      <follow_challenge>
        <feedId>117292072638883840</feedId>
        <userId>55130729149045760</userId>
      </follow_challenge>
    `,
  });
};
