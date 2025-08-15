import type { APIContext, APIRoute } from "astro";

import { html } from "@/lib/html";
import { ImageResponse } from "@vercel/og";

export const GET: APIRoute = async ({ request }: APIContext) => {
  const siteURL = request.url.replace(/\/og\.png$/, "");

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
        <h1 tw="text-6xl font-extrabold leading-tight text-gray-900 mt-4 mb-2">Yuchen Cheng</h1>
      </div>
      <div tw="flex items-center justify-between w-full mt-10 pt-8 border-t border-gray-100 relative z-10">
        <span tw="text-lg text-gray-500 font-medium">${siteURL}</span>
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
