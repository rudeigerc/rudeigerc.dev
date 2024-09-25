import { getCollection, getEntry } from "astro:content";
import type { APIContext, APIRoute, GetStaticPaths } from "astro";

import { ImageResponse } from "@vercel/og";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = (
    await getCollection("blog", ({ data }) =>
      import.meta.env.PROD ? !data.draft : true,
    )
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return posts.map((post) => ({
    params: { slug: post.slug },
    props: post,
  }));
};

export const GET: APIRoute = async ({ params, request }: APIContext) => {
  const post = await getEntry("blog", params.slug as string);

  const html = {
    type: "div",
    props: {
      tw: "flex relative flex-col p-12 w-full h-full items-start",
      style: {
        background: "white",
      },
      children: [
        {
          type: "div",
          props: {
            tw: "flex flex-col flex-1 py-10",
            children: [
              {
                type: "div",
                props: {
                  tw: "flex text-xl uppercase font-bold tracking-tight",
                  style: {
                    fontWeight: "normal",
                  },
                  children: post?.data.categories?.join(" · "),
                },
              },
              {
                type: "div",
                props: {
                  tw: "flex leading-[1.1] text-[80px] font-bold",
                  children: post?.data.title,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            tw: "flex items-center w-full justify-between",
            children: [
              {
                type: "div",
                props: {
                  tw: "flex text-xl items-center",
                  children: request.url.replace(/\/og\.png$/, ""),
                },
              },
              {
                type: "div",
                props: {
                  tw: "flex items-center text-xl font-bold",
                  children: [
                    {
                      type: "div",
                      props: {
                        tw: "flex ml-2",
                        children: "Yuchen Cheng",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };

  // @ts-ignore
  return new ImageResponse(html, {
    width: 1200,
    height: 630,
  });
};
