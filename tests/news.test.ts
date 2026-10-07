import fs from "node:fs";
import { expect, it } from "vitest";
import { parseRss, topicOf } from "../pipeline/news";

const xml = fs.readFileSync("tests/fixtures/news-sample.xml", "utf8");

it("parses Google News RSS into NewsItem[], newest first, one item per story", () => {
  expect(parseRss(xml, '"Example Health"')).toEqual([
    {
      title: "Example Health Q1 profit jumps 25% to Rs 550 crore",
      source: "Free Daily",
      publishedAt: "2026-10-06T02:00:00.000Z",
      url: "https://news.google.com/rss/articles/FREE?oc=5",
      topic: "Results & finances",
    },
    {
      title: "Example Health reports quarterly results",
      source: "Sample Times",
      publishedAt: "2026-10-05T07:00:00.000Z",
      url: "https://news.google.com/rss/articles/AAA?oc=5",
      topic: "Results & finances",
    },
    {
      title: "Exclusive: Example Health board weighs merger talks",
      source: "The Ken",
      publishedAt: "2026-10-04T09:00:00.000Z",
      url: "https://news.google.com/rss/articles/KEN?oc=5",
      topic: "Expansion & partnerships",
      paywalled: true,
    },
    {
      title: "Older story about Example Health & more",
      source: "Demo News",
      publishedAt: "2026-10-02T10:30:00.000Z",
      url: "https://news.google.com/rss/articles/BBB?oc=5",
      topic: "Other",
    },
  ]);
});

it("without a query keeps every story", () => {
  expect(parseRss(xml).map((n) => n.title)).toContain("Unrelated story with no phrase");
});

it("labels headlines with a keyword topic", () => {
  const cases: [string, string][] = [
    ["Tata AIG rejects mediclaim saying policyholder hid a disease", "Claims & complaints"],
    ["Star Health data breach case reaches Supreme Court", "Legal & regulatory"],
    ["Ajay Shah succeeds Anuj Gulati as MD&CEO of Care Health insurance", "Leadership & people"],
    ["Niva Bupa Health Insurance Share Price Today Slides 5.03%", "Stock market"],
    ["Star Health PAT rises 25% to ₹550 crore in Q1FY27", "Results & finances"],
    ["ManipalCigna onboards actor Manoj Bajpayee as Brand Ambassador", "Brand & marketing"],
    ["Aditya Birla Health Insurance Partners With ICAI To Expand Institutional Reach", "Expansion & partnerships"],
    ["Bajaj General Insurance launches MHCP EDGE Plus", "Products & launches"],
    ["Care Health Insurance Urges Early Hepatitis Screening", "Health & awareness"],
    ["Tata AIG Number of Employees 2026", "Other"],
  ];
  for (const [title, topic] of cases) expect(topicOf(title), title).toBe(topic);
});
