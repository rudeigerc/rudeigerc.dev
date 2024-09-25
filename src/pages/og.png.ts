import type { APIContext, APIRoute } from "astro";

import { ImageResponse } from "@vercel/og";

export const GET: APIRoute = async ({ request }: APIContext) => {
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
                  tw: "flex leading-[1.1] text-[80px] font-bold",
                  children: "Yuchen Cheng",
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
