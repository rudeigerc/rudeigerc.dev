import type { APIContext, APIRoute } from "astro";

import { html } from "@/lib/html";
import { ImageResponse } from "@vercel/og";

export const GET: APIRoute = async ({ request }: APIContext) => {
  const siteURL = request.url.replace(/\/og\.png$/, "");

  const element = html`
    <div tw="flex w-full h-full" style=${{ backgroundColor: "#0a0a0b" }}>
      <div tw="flex w-1 h-full" style=${{ backgroundColor: "#2E5C6E" }}></div>
      <div tw="flex flex-col justify-between flex-1 px-20 py-16">
        <div tw="flex flex-col">
          <div tw="flex items-center mb-8">
            <svg width="36" height="36" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon stroke="#2E5C6E" stroke-width="60" points="512 49 945.012702 280.666667 945.012702 744 512 975.666667 78.9872981 744 78.9872981 280.666667"></polygon>
              <line x1="512" y1="512" x2="512" y2="965" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="512" y1="512" x2="91" y2="291" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="512" y1="512" x2="927" y2="291" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="538" y1="640" x2="915" y2="437" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
              <line x1="621" y1="481" x2="621" y2="880" stroke="#2E5C6E" stroke-width="60" stroke-linecap="square"></line>
            </svg>
            <span tw="ml-3 text-sm font-medium tracking-widest uppercase" style=${{ color: "#7BAEBF" }}>Yu-Chen Cheng</span>
          </div>
          <h1 tw="text-7xl font-extrabold text-white mt-4 leading-tight">Yu-Chen Cheng</h1>
          <p tw="text-xl mt-6" style=${{ color: "#7BAEBF" }}>Software Engineer · AI/LLM Infrastructure · Kubernetes</p>
        </div>
        <div tw="flex items-center justify-between w-full">
          <span tw="text-base font-medium" style=${{ color: "#555" }}>${siteURL}</span>
          <svg width="120" height="120" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg" style=${{ opacity: 0.08 }}>
            <polygon stroke="#2E5C6E" stroke-width="50" points="512 49 945.012702 280.666667 945.012702 744 512 975.666667 78.9872981 744 78.9872981 280.666667"></polygon>
            <line x1="512" y1="512" x2="512" y2="965" stroke="#2E5C6E" stroke-width="50" stroke-linecap="square"></line>
            <line x1="512" y1="512" x2="91" y2="291" stroke="#2E5C6E" stroke-width="50" stroke-linecap="square"></line>
            <line x1="512" y1="512" x2="927" y2="291" stroke="#2E5C6E" stroke-width="50" stroke-linecap="square"></line>
            <line x1="538" y1="640" x2="915" y2="437" stroke="#2E5C6E" stroke-width="50" stroke-linecap="square"></line>
            <line x1="621" y1="481" x2="621" y2="880" stroke="#2E5C6E" stroke-width="50" stroke-linecap="square"></line>
          </svg>
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
