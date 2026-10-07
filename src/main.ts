import "./style.css";
import type { HospitalFile, Insurer, InsurerId, NewsFile } from "./types";
import { isValidPincode, search, type Result } from "./search";
import { formatDate, hospitalCard, newsGroups, strings } from "./render";

const PAGE = 50;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>("search-form");
const select = $<HTMLSelectElement>("insurer");
const pinInput = $<HTMLInputElement>("pincode");
const formError = $("form-error");
const hospitalsSection = $("hospitals");
const source = $<HTMLAnchorElement>("source");
const status = $("hospital-status");
const list = $("hospital-list");
const showMore = $<HTMLButtonElement>("show-more");
const locator = $<HTMLAnchorElement>("locator");
const newsSection = $("news");
const newsHeading = $("news-heading");
const newsStatus = $("news-status");
const newsList = $("news-list");

let insurers: Insurer[] = [];
type Data = { hospitals: HospitalFile | null; news: NewsFile | null }; // null = not published yet
const cache = new Map<InsurerId, Promise<Data>>();

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

function load(id: InsurerId): Promise<Data> {
  if (!cache.has(id)) {
    const p = Promise.all([
      getJson<HospitalFile>(`data/hospitals/${id}.json`),
      getJson<NewsFile>(`data/news/${id}.json`),
    ]).then(([hospitals, news]) => ({ hospitals, news }));
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
    const { news } = await load(ins.id);
    if (current() !== ins) return;
    newsStatus.textContent = news?.items.length ? "" : strings.noNews;
    newsList.replaceChildren(...newsGroups(news?.items ?? []));
  } catch {
    if (current() === ins) newsStatus.textContent = strings.loadError;
  }
}

let results: Result[] = [];
let shown = 0;

function renderMore() {
  list.append(...results.slice(shown, shown + PAGE).map(hospitalCard));
  shown += PAGE;
  showMore.hidden = shown >= results.length;
}

async function runSearch() {
  const ins = current();
  const pin = pinInput.value;
  formError.textContent = !ins ? strings.chooseInsurer : !isValidPincode(pin) ? strings.invalidPincode : "";
  if (!ins || !isValidPincode(pin)) return;

  history.replaceState(null, "", `#insurer=${ins.id}&pincode=${pin}`);
  hospitalsSection.hidden = false;
  list.replaceChildren();
  showMore.hidden = source.hidden = locator.hidden = true;
  status.textContent = strings.loading;
  try {
    const { hospitals: file } = await load(ins.id);
    if (current() !== ins || pinInput.value !== pin) return;
    if (!file) {
      status.textContent = strings.notAvailable(ins.displayName);
      if (ins.hospitalSourceUrl) {
        locator.textContent = strings.locator(ins.displayName);
        locator.href = ins.hospitalSourceUrl;
        locator.hidden = false;
      }
      return;
    }
    source.textContent = strings.source(ins.displayName, formatDate(file.fetchedAt));
    source.href = file.sourceUrl;
    source.hidden = false;
    results = search(file.hospitals, pin) ?? [];
    const nearby = results.filter((r) => r.nearby).length;
    status.textContent = results.length ? strings.found(results.length - nearby, nearby) : strings.noHospitals;
    shown = 0;
    renderMore();
  } catch {
    if (current() === ins) status.textContent = strings.loadError;
  }
}

select.addEventListener("change", () => {
  const ins = current();
  if (!ins) return;
  $("intro").hidden = true;
  showNews(ins);
  if (isValidPincode(pinInput.value)) runSearch();
  else {
    hospitalsSection.hidden = false;
    list.replaceChildren();
    showMore.hidden = source.hidden = locator.hidden = true;
    status.textContent = strings.enterPincode;
  }
});
pinInput.addEventListener("input", () => (pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 6)));
form.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch();
});
showMore.addEventListener("click", renderMore);

(async () => {
  try {
    insurers = (await getJson<Insurer[]>("data/insurers.json")) ?? [];
  } catch {
    formError.textContent = strings.loadError;
    return;
  }
  select.append(...insurers.map((i) => new Option(i.displayName, i.id)));
  const params = new URLSearchParams(location.hash.slice(1));
  const id = params.get("insurer");
  if (id && insurers.some((i) => i.id === id)) {
    select.value = id;
    pinInput.value = (params.get("pincode") ?? "").replace(/\D/g, "").slice(0, 6);
    select.dispatchEvent(new Event("change"));
  }
})();
