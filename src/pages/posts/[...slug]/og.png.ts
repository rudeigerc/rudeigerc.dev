import { getCollection, getEntry } from "astro:content";
import type { APIContext, APIRoute, GetStaticPaths } from "astro";

import { html } from "@/lib/html";
import { ImageResponse } from "@vercel/og";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = (
    await getCollection(
      "blog",
      ({ data }) =>
        !data.external && (import.meta.env.PROD ? !data.draft : true),
    )
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return posts.map((post) => ({
    params: { slug: post.id },
    props: post,
  }));
};

export const GET: APIRoute = async ({ params, request }: APIContext) => {
  const post = await getEntry("blog", params.slug as string);
  const postURL = request.url.replace(/\/og\.png$/, "");

  const element = html`
    <div tw="flex w-full h-full" style=${{ backgroundColor: "#0a0a0b" }}>
      <div tw="flex w-1 h-full" style=${{ backgroundColor: "#2E5C6E" }}></div>
      <div tw="flex flex-col justify-between flex-1 px-20 py-16">
        <div tw="flex flex-col">
          <div tw="flex items-center mb-4">
            ${post?.data.categories?.map(
              (cat: string) =>
                html`<span tw="text-white text-xs font-semibold px-3 py-1 rounded uppercase tracking-wide mr-2" style=${{ backgroundColor: "#2E5C6E" }}>${cat}</span>`,
            )}
          </div>
          <h1 tw="text-6xl font-extrabold leading-tight text-white mt-2 mb-0">${post?.data.title}</h1>
          ${post?.data.description ? html`<p tw="text-lg mt-4 leading-relaxed" style=${{ color: "#888" }}>${post.data.description}</p>` : ""}
        </div>
        <div tw="flex items-center justify-between w-full">
          <span tw="text-base font-medium" style=${{ color: "#555" }}>${postURL}</span>
          <div tw="flex items-center">
            <svg width="28" height="28" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon stroke="#2E5C6E" stroke-width="60" points="512 49 945.012702 280.666667 945.012702 744 512 975.666667 78.9872981 744 78.9872981 280.666667"></polygon>
              <line x1="512" y1="512" x2="512" y2="965" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="512" y1="512" x2="91" y2="291" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="512" y1="512" x2="927" y2="291" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="538" y1="640" x2="915" y2="437" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="621" y1="481" x2="621" y2="880" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
            </svg>
            <span tw="ml-2 text-base font-semibold" style=${{ color: "#7BAEBF" }}>Yu-Chen Cheng</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // @ts-ignore
  return new ImageResponse(element, {
    width: 1200,
    height: 630,
  });
};
