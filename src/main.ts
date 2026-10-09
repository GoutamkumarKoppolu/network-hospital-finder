import "./style.css";
import type { Insurer, InsurerId, NewsFile, StatsFile } from "./types";
import { aboutInsurer, newsGroups, strings } from "./render";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>("search-form");
const select = $<HTMLSelectElement>("insurer");
const locator = $<HTMLAnchorElement>("locator");
const formError = $("form-error");
const hospitalsSection = $("hospitals");
const status = $("hospital-status");
const newsSection = $("news");
const newsHeading = $("news-heading");
const newsStatus = $("news-status");
const newsList = $("news-list");

let insurers: Insurer[] = [];
let stats: StatsFile | null = null;
const cache = new Map<InsurerId, Promise<NewsFile | null>>(); // null = not published yet

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

function loadNews(id: InsurerId): Promise<NewsFile | null> {
  if (!cache.has(id)) {
    const p = getJson<NewsFile>(`data/news/${id}.json`);
    p.catch(() => cache.delete(id)); // allow retry
    cache.set(id, p);
  }
  return cache.get(id)!;
}

const current = () => insurers.find((i) => i.id === select.value);

async function showNews(ins: Insurer) {
  newsSection.hidden = false;
  newsHeading.textContent = strings.newsHeading(ins.displayName);
  newsList.replaceChildren();
  newsStatus.textContent = strings.loading;
  try {
    const news = await loadNews(ins.id);
    if (current() !== ins) return;
    newsStatus.textContent = news?.items.length ? "" : strings.noNews;
    newsList.replaceChildren(...newsGroups(news?.items ?? []));
  } catch {
    if (current() === ins) newsStatus.textContent = strings.loadError;
  }
}

async function runSearch() {
  const ins = current();
  formError.textContent = ins ? "" : strings.chooseInsurer;
  if (!ins) return;
  history.replaceState(null, "", `#insurer=${ins.id}`);
  $("intro").hidden = true;
  $("about").hidden = false;
  $("about-heading").textContent = strings.aboutHeading(ins.displayName);
  $("about-body").replaceChildren(...aboutInsurer(ins, stats));
  showNews(ins);
  // We keep no hospital lists of our own (decided 2026-10-09): point to the insurer's official locator
  hospitalsSection.hidden = false;
  status.textContent = strings.notAvailable(ins.displayName);
  locator.hidden = !ins.hospitalSourceUrl;
  locator.textContent = strings.locator(ins.displayName);
  locator.href = ins.hospitalSourceUrl;
}

// Picking an insurer only prepares the form; results (hospitals, about, news) appear on Search.
select.addEventListener("change", () => {
  formError.textContent = "";
  hospitalsSection.hidden = $("about").hidden = newsSection.hidden = true; // results of the previous insurer
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch();
});

(async () => {
  try {
    insurers = (await getJson<Insurer[]>("data/insurers.json")) ?? [];
    stats = await getJson<StatsFile>("data/insurer-stats.json").catch(() => null); // optional: the page works without it
  } catch {
    formError.textContent = strings.loadError;
    return;
  }
  select.append(...insurers.map((i) => new Option(i.displayName, i.id)));
  const params = new URLSearchParams(location.hash.slice(1));
  const id = params.get("insurer");
  if (id && insurers.some((i) => i.id === id)) {
    select.value = id;
    select.dispatchEvent(new Event("change"));
    runSearch(); // a shared link opens with results
  }
})();
