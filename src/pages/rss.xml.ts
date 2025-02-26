import { getCollection } from "astro:content";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/consts";
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";

const parser = new MarkdownIt();

export const GET: APIRoute = async (context) => {
  const posts = await getCollection("blog");

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site ?? "",
    items: posts.map((post) => ({
      link: `/posts/${post.id}/`,
      content: sanitizeHtml(parser.render(post.body ?? ""), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
      }),
      ...post.data,
    })),
    customData: "<language>zh-Hans</language>",
  });
};
