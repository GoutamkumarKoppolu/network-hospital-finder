import fs from "node:fs";
import { expect, it } from "vitest";
import { parseRss } from "../pipeline/news";

it("parses Google News RSS into NewsItem[], newest first, without duplicates or paywalled sites", () => {
  const items = parseRss(fs.readFileSync("tests/fixtures/news-sample.xml", "utf8"));
  expect(items).toEqual([
    { title: "Newest story", source: "Demo News", publishedAt: "2026-10-06T01:00:00.000Z", url: "https://news.google.com/rss/articles/CCC?oc=5" },
    { title: "Example Health reports quarterly results", source: "Sample Times", publishedAt: "2026-10-05T07:00:00.000Z", url: "https://news.google.com/rss/articles/AAA?oc=5" },
    { title: "Older story & more", source: "Demo News", publishedAt: "2026-10-02T10:30:00.000Z", url: "https://news.google.com/rss/articles/BBB?oc=5" },
  ]);
});

it("keeps only headlines containing the query phrase", () => {
  const items = parseRss(fs.readFileSync("tests/fixtures/news-sample.xml", "utf8"), '"Example Health"');
  expect(items.map((i) => i.title)).toEqual(["Example Health reports quarterly results"]);
});
