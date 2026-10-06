/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { strings } from "./src/render";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default defineConfig({
  base: "./", // works at <user>.github.io/network-hospital-finder/
  appType: "mpa", // missing data files must 404 in dev, like on GitHub Pages
  plugins: [
    {
      // Fill static text from `strings` at build time (no layout shift, works without JS)
      name: "static-strings",
      transformIndexHtml: (html) =>
        html
          .replace(/(<[^>]*\bdata-s="(\w+)"[^>]*>)(?=<\/)/g, (_, open: string, key: keyof typeof strings) => open + esc(strings[key] as string))
          .replace('<ul id="disclaimers"></ul>', `<ul id="disclaimers">${strings.disclaimers.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`),
    },
  ],
  test: { passWithNoTests: true },
});
