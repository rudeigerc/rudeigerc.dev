import { getCollection, getEntry } from "astro:content";
import type { APIContext, APIRoute, GetStaticPaths } from "astro";

import { ImageResponse } from "@vercel/og";
import { html } from "@/lib/html";

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = (
    await getCollection("blog", ({ data }) =>
      import.meta.env.PROD ? !data.draft : true,
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
    <div tw="flex flex-col justify-between w-full h-full bg-white p-16 rounded-2xl border border-gray-200 shadow-xl relative">
      <div tw="absolute inset-0 flex items-center justify-end pr-32 opacity-5">
        <svg width="400" height="400" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon stroke="#2E5C6E" stroke-width="60" points="512 49 945.012702 280.666667 945.012702 744 512 975.666667 78.9872981 744 78.9872981 280.666667"></polygon>
          <line x1="512" y1="512" x2="512" y2="965" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
          <line x1="512" y1="512" x2="91" y2="291" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
          <line x1="512" y1="512" x2="927" y2="291" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
          <line x1="538" y1="640" x2="915" y2="437" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
          <line x1="621" y1="481" x2="621" y2="880" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
        </svg>
      </div>
      <div tw="flex flex-col relative z-10">
        <div tw="flex flex-col">
          <div tw="flex items-center">
            ${post?.data.categories?.map(
              (cat: string) =>
                html`<span tw="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">${cat}</span>`,
            )}
          </div>
        </div>
        <h1 tw="text-6xl font-extrabold leading-tight text-gray-900 mt-4 mb-2">${post?.data.title}</h1>
      </div>
      <div tw="flex items-center justify-between w-full mt-10 pt-8 border-t border-gray-100 relative z-10">
        <span tw="text-lg text-gray-500 font-medium">${postURL}</span>
        <div tw="flex items-center">
          <span tw="flex items-center">
            <svg width="32" height="32" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon stroke="#2E5C6E" stroke-width="60" points="512 49 945.012702 280.666667 945.012702 744 512 975.666667 78.9872981 744 78.9872981 280.666667"></polygon>
              <line x1="512" y1="512" x2="512" y2="965" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="512" y1="512" x2="91" y2="291" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="512" y1="512" x2="927" y2="291" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="538" y1="640" x2="915" y2="437" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="621" y1="481" x2="621" y2="880" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
            </svg>
            <span tw="ml-2 text-lg font-semibold text-gray-800">Yuchen Cheng</span>
          </span>
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
