import { TOPICS, type Insurer, type NewsItem, type StatsFile } from "./types";

// All page text lives here so other languages can be added later.
export const strings = {
  title: "Network Hospital Finder",
  tagline: "Free, unofficial information",
  lead: "Find your insurer's official hospital locator, key facts, and the latest news, all in one place.",
  step1: "Choose your insurer",
  step2: "Open its official hospital locator",
  step3: "Read the latest news about it",
  disclaimerHeading: "Please read",
  contact:
    "Contact: Insurer, hospital or publisher and want something corrected or removed? Write to us and we will act on it promptly:",
  contactGithub: "open a GitHub issue",
  insurerLabel: "Insurer",
  choose: "Choose an insurer",
  search: "Search",
  hospitalsHeading: "Network hospitals",
  subscription: "Subscription",
  loading: "Loading…",
  chooseInsurer: "Please choose an insurer.",
  loadError: "Sorry, the data could not be loaded. Please try again later.",
  noNews: "No recent headlines found.",
  shortDisclaimer:
    "Always confirm cashless eligibility with the hospital and your insurer before admission.",
  disclaimers: [
    "Hospitals: We link to each insurer's official hospital locator. We do not keep our own copy. Network lists change often. Always confirm cashless eligibility with the hospital and your insurer before admission.",
    "News: Headlines are shown from public news sources with links to the original article. We do not write, verify, or endorse them.",
    "No advice: This site does not give insurance advice and does not recommend any policy or insurer.",
    "Affiliation: Not affiliated with any insurer or hospital. Names belong to their respective owners.",
  ],
  notAvailable: (insurer: string) =>
    `${insurer} keeps its network hospital list on its own website. Search it there for the latest list.`,
  locator: (insurer: string) => `Search on ${insurer}'s official hospital locator`,
  newsHeading: (insurer: string) => `Latest news about ${insurer}`,
  aboutHeading: (insurer: string) => `About ${insurer}`,
  regNo: "IRDAI registration no.",
  kind: "Type",
  sector: "Ownership",
  listed: "Listed on stock exchange",
  yes: "Yes",
  no: "No",
  checkIrdai: "Check it on IRDAI's list of insurers",
  statsHeading: "Figures from IRDAI",
  icr: (year: string) => `Health incurred claim ratio, FY ${year}`,
  solvency: (period: string) => `Solvency ratio on 31 March 20${period.slice(5)}`,
  notReported: "Not reported",
  statsExplained:
    "Incurred claim ratio: claims incurred as a percentage of premium earned (IRDAI's health figure includes personal accident). Solvency ratio: the capital an insurer holds compared with what IRDAI requires; the minimum allowed is 1.50.",
  statsNote:
    "All figures are from IRDAI (Insurance Regulatory and Development Authority of India) and are shown as published. They describe the insurer as a whole, not any single policy or claim.",
  statsSource: (source: string) => `Read the official ${source} on IRDAI's website`,
  lastUpdated: (when: string) => `Last updated here: ${when}`,
  usefulLinks: "Official links",
  docs: "Policy wordings and brochures",
  claims: "How to make a claim",
  grievance: "Grievance redressal",
  escalationHeading: "If you have a complaint",
  escalation: [
    ["Complain to the insurer first, through its grievance team.", ""],
    [
      "Not resolved within 15 days? Complain to IRDAI on the Bima Bharosa portal, or call 155255 (toll-free).",
      "https://bimabharosa.irdai.gov.in/",
    ],
    [
      "Still not satisfied? Go to the Insurance Ombudsman. It is free. Apply within 1 year of the insurer's reply.",
      "https://www.cioins.co.in/",
    ],
  ],
};

export const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) + " IST";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = "") {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

function extLink(text: string, url: string, className = "") {
  const a = el("a", className, text);
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer nofollow";
  return a;
}

const IRDAI_LIST = "https://irdai.gov.in/list-of-general-insurers";

/** IRDAI figures for one insurer, or nothing if we have none. */
function insurerStats(ins: Insurer, stats: StatsFile | null): HTMLElement[] {
  const s = stats?.insurers[ins.id];
  if (!stats || !s) return [];
  const facts = el("dl", "facts");
  const fact = (k: string, v: string) => facts.append(el("dt", "", k), el("dd", "", v));
  for (const [year, v] of Object.entries(s.healthIcr)) fact(strings.icr(year), v === null ? strings.notReported : `${v.toFixed(2)}%`);
  fact(strings.solvency(stats.period), s.solvency.toFixed(2));
  const source = el("p", "meta");
  source.append(extLink(strings.statsSource(stats.source), stats.sourceUrl));
  return [
    el("h3", "", strings.statsHeading),
    facts,
    el("p", "meta", strings.statsExplained),
    el("p", "meta", strings.statsNote),
    source,
    el("p", "meta", strings.lastUpdated(formatDateTime(stats.updatedAt))),
  ];
}

/** Facts, IRDAI figures, official links and the complaint path for one insurer. Links we could not confirm are "" and skipped. */
export function aboutInsurer(ins: Insurer, stats: StatsFile | null): HTMLElement[] {
  const facts = el("dl", "facts");
  const fact = (k: string, v: string) => facts.append(el("dt", "", k), el("dd", "", v));
  fact(strings.regNo, ins.irdaiRegNo);
  fact(strings.kind, ins.kind);
  fact(strings.sector, ins.sector);
  fact(strings.listed, ins.listed ? strings.yes : strings.no);

  const links = el("ul", "links");
  for (const [text, url] of [
    [strings.docs, ins.docsUrl],
    [strings.claims, ins.claimsUrl],
    [strings.grievance, ins.grievanceUrl],
  ])
    if (url) {
      const li = el("li");
      li.append(extLink(text, url));
      links.append(li);
    }

  const steps = el("ol", "escalation");
  for (const [text, url] of strings.escalation) {
    const href = url || ins.grievanceUrl || ins.officialSite; // step 1 points at the insurer
    const li = el("li", "", text + " ");
    li.append(extLink(new URL(href).hostname.replace(/^www\./, ""), href));
    steps.append(li);
  }

  const check = el("p", "meta");
  check.append(extLink(strings.checkIrdai, IRDAI_LIST));
  const out: HTMLElement[] = [facts, check, ...insurerStats(ins, stats)];
  if (links.childElementCount) out.push(el("h3", "", strings.usefulLinks), links);
  out.push(el("h3", "", strings.escalationHeading), steps);
  return out;
}

export function newsItem(n: NewsItem): HTMLLIElement {
  const li = el("li");
  const a = extLink(n.title, n.url);
  const meta = el("span", "meta", [n.source, formatDate(n.publishedAt)].filter(Boolean).join(" · "));
  if (n.paywalled) meta.append(" ", el("span", "badge", strings.subscription));
  li.append(a, meta);
  return li;
}

/** One section per topic (TOPICS order), newest first inside each. */
export function newsGroups(items: NewsItem[]): HTMLElement[] {
  return TOPICS.flatMap((topic) => {
    const group = items.filter((n) => (n.topic ?? "Other") === topic);
    if (!group.length) return [];
    const section = el("section", "news-group");
    section.append(el("h3", "", `${topic} (${group.length})`), el("ul", "news"));
    section.lastElementChild!.append(...group.map(newsItem));
    return [section];
  });
}
