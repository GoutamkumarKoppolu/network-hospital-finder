// News source is isolated here so it can be swapped later (requirement 7.4).
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { XMLParser } from "fast-xml-parser";
import type { Insurer, NewsFile, NewsItem } from "../src/types";
import { USER_AGENT } from "./lib";

const MAX = 15;

// Publishers that need a subscription or login to read (hard or metered paywall). Subdomains included.
// ponytail: hand-kept list; sites with only some locked articles (ET Prime, Moneycontrol Pro, TOI+) are kept.
const PAYWALLED = [
  "business-standard.com", "livemint.com", "thehindubusinessline.com", "thehindu.com", "fortuneindia.com",
  "the-ken.com", "themorningcontext.com", "linkedin.com",
  "bloomberg.com", "ft.com", "wsj.com", "nytimes.com", "economist.com", "washingtonpost.com", "barrons.com",
];

const isPaywalled = (sourceUrl: string) => {
  try {
    const host = new URL(sourceUrl).hostname;
    return PAYWALLED.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
};

/** `query` like "\"Star Health\"": headlines must contain the phrase (Google adds loose matches). */
export function parseRss(xml: string, query = ""): NewsItem[] {
  const phrase = query.replace(/"/g, "").trim().toLowerCase();
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, isArray: (n) => n === "item" });
  const items: any[] = parser.parse(xml).rss?.channel?.item ?? [];
  const seen = new Set<string>();
  return items
    .filter((it) => !isPaywalled(String(it.source?.["@_url"] ?? "")))
    .map((it) => {
      const source = String(it.source?.["#text"] ?? it.source ?? "").trim();
      const raw = String(it.title ?? "").trim();
      // Google News titles end with " - <publisher>"
      const title = source && raw.endsWith(` - ${source}`) ? raw.slice(0, -(source.length + 3)) : raw;
      const date = new Date(it.pubDate);
      return { title, source, publishedAt: isNaN(+date) ? "" : date.toISOString(), url: String(it.link ?? "") };
    })
    .filter((n) => n.title && n.title.toLowerCase().includes(phrase) && n.url.startsWith("https://") && !seen.has(n.title.toLowerCase()) && !!seen.add(n.title.toLowerCase()))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX);
}

async function main() {
  const insurers: Insurer[] = JSON.parse(fs.readFileSync("public/data/insurers.json", "utf8"));
  for (const { id, newsQuery } of insurers) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(newsQuery)}&hl=en-IN&gl=IN&ceid=IN:en`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = parseRss(await res.text(), newsQuery);
      if (!items.length) throw new Error("no items");
      const file: NewsFile = { insurer: id, fetchedAt: new Date().toISOString(), items };
      fs.writeFileSync(`public/data/news/${id}.json`, JSON.stringify(file, null, 2) + "\n");
      console.log(`${id}: ${items.length} headlines`);
    } catch (e) {
      console.error(`${id}: news fetch failed (${(e as Error).message}), kept old file`);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
