/** @type {import("prettier").Config & import('prettier-plugin-tailwindcss').PluginOptions & import('prettier-plugin-astro-organize-imports').Options} */
export default {
  plugins: [
    "prettier-plugin-astro",
    "prettier-plugin-tailwindcss",
    "prettier-plugin-astro-organize-imports",
  ],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
  ],
};
