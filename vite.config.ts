/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { strings } from "./src/render";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const built = new Date().toISOString().slice(0, 10);
const url = "https://goutamkumarkoppolu.github.io/network-hospital-finder/";
// Structured data for search engines and AI answer engines
const jsonLd = [
  { "@context": "https://schema.org", "@type": "WebSite", name: strings.title, url, description: strings.lead, inLanguage: "en-IN", dateModified: built },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: strings.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  },
];

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
          .replace('<ul id="disclaimers"></ul>', `<ul id="disclaimers">${strings.disclaimers.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`)
          .replace('<div id="faq-list"></div>', strings.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join(""))
          .replace("<!--updated-->", esc(strings.updated(built)))
          .replace("<!--json-ld-->", `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`),
    },
  ],
  test: { passWithNoTests: true },
});
