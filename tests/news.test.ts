import fs from "node:fs";
import { expect, it } from "vitest";
import { parseRss } from "../pipeline/news";

const xml = fs.readFileSync("tests/fixtures/news-sample.xml", "utf8");

it("parses Google News RSS into NewsItem[], newest first, one item per story", () => {
  expect(parseRss(xml, '"Example Health"')).toEqual([
    {
      title: "Example Health Q1 profit jumps 25% to Rs 550 crore",
      source: "Free Daily",
      publishedAt: "2026-10-06T02:00:00.000Z",
      url: "https://news.google.com/rss/articles/FREE?oc=5",
    },
    {
      title: "Example Health reports quarterly results",
      source: "Sample Times",
      publishedAt: "2026-10-05T07:00:00.000Z",
      url: "https://news.google.com/rss/articles/AAA?oc=5",
    },
    {
      title: "Exclusive: Example Health board weighs merger talks",
      source: "The Ken",
      publishedAt: "2026-10-04T09:00:00.000Z",
      url: "https://news.google.com/rss/articles/KEN?oc=5",
      paywalled: true,
    },
    {
      title: "Older story about Example Health & more",
      source: "Demo News",
      publishedAt: "2026-10-02T10:30:00.000Z",
      url: "https://news.google.com/rss/articles/BBB?oc=5",
    },
  ]);
});

it("without a query keeps every story", () => {
  expect(parseRss(xml).map((n) => n.title)).toContain("Unrelated story with no phrase");
});
