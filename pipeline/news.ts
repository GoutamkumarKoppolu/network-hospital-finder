// News source is isolated here so it can be swapped later (requirement 7.4).
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { XMLParser } from "fast-xml-parser";
import type { Insurer, NewsFile, NewsItem } from "../src/types";
import { USER_AGENT } from "./lib";

const MAX = 15;

// Publishers that hide the whole article behind a subscription or login. Subdomains included.
// Sites that show part of the article (Business Standard, Mint, ET Prime, ...) are fine.
// ponytail: hand-kept list; extend when a hard paywall shows up in the feed.
const HARD_PAYWALL = [
  "the-ken.com", "themorningcontext.com", "theinformation.com", "linkedin.com",
  "bloomberg.com", "ft.com", "wsj.com", "nytimes.com", "economist.com", "washingtonpost.com", "barrons.com",
];

const isPaywalled = (sourceUrl: string) => {
  try {
    const host = new URL(sourceUrl).hostname;
    return HARD_PAYWALL.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
};

const STOP = new Set("the a an and or of to in on for with at by from as is are was be its it this that after over into amid says".split(" "));
const words = (s: string, skip: Set<string>) =>
  new Set(s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1 && !STOP.has(w) && !skip.has(w)));

/** Two headlines are the same story when most words of the shorter one appear in the other. */
function sameStory(a: Set<string>, b: Set<string>) {
  const shared = [...a].filter((w) => b.has(w)).length;
  return shared >= 3 && shared / Math.min(a.size, b.size) >= 0.6;
}

/**
 * `query` like "\"Star Health\"": headlines must contain the phrase (Google adds loose matches).
 * Same story from several publishers → one item, preferring a free-to-read one. A story only
 * available behind a hard paywall is still shown, marked `paywalled`.
 */
export function parseRss(xml: string, query = ""): NewsItem[] {
  const phrase = query.replace(/"/g, "").trim().toLowerCase();
  const phraseWords = words(phrase, new Set());
  const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, isArray: (n) => n === "item" });
  const items: any[] = parser.parse(xml).rss?.channel?.item ?? [];

  const all = items
    .map((it) => {
      const source = String(it.source?.["#text"] ?? it.source ?? "").trim();
      const raw = String(it.title ?? "").trim();
      // Google News titles end with " - <publisher>"
      const title = source && raw.endsWith(` - ${source}`) ? raw.slice(0, -(source.length + 3)) : raw;
      const date = new Date(it.pubDate);
      const item: NewsItem = { title, source, publishedAt: isNaN(+date) ? "" : date.toISOString(), url: String(it.link ?? "") };
      if (isPaywalled(String(it.source?.["@_url"] ?? ""))) item.paywalled = true;
      return item;
    })
    .filter((n) => n.title && n.title.toLowerCase().includes(phrase) && n.url.startsWith("https://"))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const stories: { key: Set<string>; item: NewsItem }[] = [];
  for (const item of all) {
    const key = words(item.title, phraseWords);
    const story = stories.find((s) => sameStory(s.key, key));
    if (!story) stories.push({ key, item });
    else if (story.item.paywalled && !item.paywalled) story.item = item; // free version of the same story
  }
  return stories
    .map((s) => s.item)
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
