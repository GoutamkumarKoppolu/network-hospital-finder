import { TOPICS, type NewsItem } from "./types";
import type { Result } from "./search";

// All page text lives here so other languages can be added later.
export const strings = {
  title: "Network Hospital Finder",
  tagline: "Free, unofficial information",
  lead: "Find cashless network hospitals near you, and see the latest news about your insurer.",
  step1: "Choose your insurer",
  step2: "Find its network hospitals",
  step3: "Read the latest news about it",
  disclaimerHeading: "Please read",
  contact:
    "Contact: Insurer, hospital or publisher and want something corrected or removed? Write to us and we will act on it promptly:",
  contactGithub: "open a GitHub issue",
  insurerLabel: "Insurer",
  choose: "Choose an insurer",
  pincodeLabel: "Pincode",
  search: "Search",
  hospitalsHeading: "Hospitals",
  showMore: "Show more",
  nearby: "Nearby",
  subscription: "Subscription",
  loading: "Loading…",
  chooseInsurer: "Please choose an insurer.",
  invalidPincode: "Please enter a valid 6-digit pincode.",
  enterPincode: "Enter a pincode to see network hospitals.",
  loadError: "Sorry, the data could not be loaded. Please try again later.",
  noHospitals:
    "No hospitals found for this pincode in the list we have. Try a nearby pincode and confirm with your insurer.",
  noNews: "No recent headlines found.",
  shortDisclaimer:
    "Unofficial list. Always confirm cashless eligibility with the hospital and your insurer before admission.",
  disclaimers: [
    "Hospital list: This is unofficial information collected from each insurer's published network list. Network lists change often. Always confirm cashless eligibility with the hospital and your insurer before admission.",
    "News: Headlines are shown from public news sources with links to the original article. We do not write, verify, or endorse them.",
    "No advice: This site does not give insurance advice and does not recommend any policy or insurer.",
    "Affiliation: Not affiliated with any insurer or hospital. Names belong to their respective owners.",
  ],
  notAvailable: (insurer: string) =>
    `We don't have the hospital list for ${insurer} yet. You can search it on their official website.`,
  locator: (insurer: string) => `Search on ${insurer}'s official hospital locator`,
  newsHeading: (insurer: string) => `Latest news about ${insurer}`,
  source: (insurer: string, date: string) => `Source: ${insurer} official list, last updated ${date}`,
  found: (exact: number, nearby: number) =>
    `${exact} hospital${exact === 1 ? "" : "s"} at this pincode` + (nearby ? `, ${nearby} nearby` : ""),
};

export const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = "") {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

export function hospitalCard(h: Result): HTMLLIElement {
  const li = el("li", "card");
  const name = el("strong", "", h.name);
  li.append(name);
  if (h.nearby) li.append(" ", el("span", "badge", strings.nearby));
  if (h.address) li.append(el("p", "addr", h.address));
  const meta = [h.city, h.state, h.pincode].filter(Boolean).join(", ");
  if (meta && !h.address.includes(h.pincode)) li.append(el("p", "meta", meta));
  return li;
}

export function newsItem(n: NewsItem): HTMLLIElement {
  const li = el("li");
  const a = el("a", "", n.title);
  a.href = n.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer nofollow";
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
