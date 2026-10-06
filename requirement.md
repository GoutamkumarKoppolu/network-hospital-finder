# Requirements: Health Insurance Network Hospital Finder (Version 1)

> This file is the single source of truth for building the project with Claude.
> Read it fully before writing code. Build **phase by phase** (section 12). Do not skip ahead.

---

## 1. Problem Statement

When a family member is admitted to a hospital, people only check the one insurer they already have. There is no simple place to:

1. See which **hospitals are in an insurer's cashless network** near a pincode.
2. See **recent news** (good and bad) about that insurer, to help choose a policy.

Existing sites cover only hospital search (PolicyX, PolicyBazaar, cashlesshospitals.in). None combine it with news. This project fills that gap.

**Hobby project. $0 budget. No backend. No login. No money goal** (AdSense may be added at the very end, only if wanted).

---

## 2. Goals and Non-Goals

### Goals (Version 1)
- Single page website.
- Dropdown to choose an insurer (start with **Care Health, Niva Bupa, Star Health**).
- Input for **6-digit pincode**.
- Show the insurer's network hospitals for that pincode (with fallback to nearby, see 6.3).
- Show latest **news headlines** for the chosen insurer (title, source, date, link only).
- Disclaimers on the page.
- Data refreshed **once a week** by an automatic job.
- Hosted free (GitHub Pages).

### Non-Goals (do NOT build in Version 1)
- No user accounts, no database, no server/API of our own.
- No AI summaries of news (cost + risk of wrong facts). Headlines only.
- No positive/negative sentiment tags.
- No policy comparison, premium calculator, or "best policy" advice.
- No maps, no GPS "near me" button.
- No scraping of aggregator sites (PolicyX, PolicyBazaar, cashlesshospitals.in, etc.).
- No AdSense in Version 1.

---

## 3. Legal and Safety Rules (HARD CONSTRAINTS)

Claude must follow these while building. I am not a lawyer; these are risk-reduction rules.

1. **Hospital data source = the insurer's own official website/files only.** Never copy from aggregator or comparison sites.
2. Every insurer record stores `sourceUrl` and `fetchedAt`. Show "Source: <insurer> official list, last updated <date>" on the page.
3. Before writing a downloader for an insurer, check that site's **robots.txt and terms**. If automated download is not allowed, use **manual download** (a human downloads the file, commits it to `data/raw/`). Note this in `insurers.json`.
4. Download politely: max once a week, send a clear `User-Agent` (project name + contact), no parallel hammering.
5. **News:** show only title, source name, publish date, and link to the original. Never copy article body text or images.
6. **No advice.** No wording like "best", "recommended", "buy this". Facts and links only.
7. Disclaimers (section 8) must be visible. They are not optional.
8. No personal data collected. No cookies. The only analytics allowed is anonymous visit counting with GoatCounter (cookieless, no personal data; added 2026-10-06), mentioned in the footer.

---

## 4. Tech Stack (keep it boring and small)

| Part | Choice | Why |
|---|---|---|
| Language | TypeScript (Node 22+) | Owner knows it |
| Frontend | **Vite + vanilla TypeScript** (no React/Vue) | One page, tiny, no framework needed |
| Styling | Plain CSS (one file) | Enough for one page |
| Data pipeline | Node scripts run with `tsx` | Same language as the site |
| Excel/CSV parsing | `xlsx` (SheetJS) | Handles .xlsx/.xls/.csv |
| PDF table parsing | `pdfjs-dist` text extraction first; fall back to a Python `pdfplumber` script only if needed | Many lists are PDF |
| RSS parsing | `fast-xml-parser` | Tiny, no heavy deps |
| Tests | `vitest` | Fast, TS-native |
| Hosting | GitHub Pages | Free |
| Automation | GitHub Actions (cron) | Free |

Rule: **add a new dependency only if it saves real effort.** Prefer built-in `fetch`, `fs`, `crypto`.

---

## 5. Repository Layout

```
/
├─ requirement.md
├─ README.md
├─ package.json
├─ vite.config.ts
├─ index.html
├─ src/                      # frontend
│  ├─ main.ts                # wires UI
│  ├─ search.ts              # pincode search logic (pure functions)
│  ├─ render.ts              # builds DOM
│  ├─ types.ts               # shared types (also used by pipeline)
│  └─ style.css
├─ public/
│  └─ data/                  # generated, committed, served as static files
│     ├─ insurers.json       # list for dropdown + metadata
│     ├─ hospitals/
│     │  ├─ care.json
│     │  ├─ niva.json
│     │  └─ star.json
│     └─ news/
│        ├─ care.json
│        ├─ niva.json
│        └─ star.json
├─ pipeline/                 # runs offline / in GitHub Actions
│  ├─ update.ts              # entry: download → clean → validate → write
│  ├─ news.ts                # fetch RSS → news/*.json
│  ├─ adapters/
│  │  ├─ care.ts
│  │  ├─ niva.ts
│  │  └─ star.ts
│  ├─ validate.ts            # safety checks
│  ├─ lib.ts                 # pincode regex, name cleaner, hash
│  └─ fixes.json             # manual corrections
├─ data/
│  ├─ raw/                   # downloaded source files (committed for history/hash)
│  └─ state.json             # last file hash per insurer
├─ tests/
└─ .github/workflows/
   ├─ update-data.yml        # weekly job
   └─ deploy.yml             # build + publish to GitHub Pages
```

---

## 6. Data Design

### 6.1 Common hospital shape (every adapter must output this)

```ts
export type InsurerId = "care" | "niva" | "star";

export type Hospital = {
  insurer: InsurerId;
  name: string;      // cleaned, Title Case, trimmed, no double spaces
  address: string;   // single line
  city: string;
  state: string;     // "" if unknown
  pincode: string;   // exactly 6 digits, or "" if not found
};

export type HospitalFile = {
  insurer: InsurerId;
  sourceUrl: string;
  fetchedAt: string;      // ISO date
  count: number;
  hospitals: Hospital[];
};

export type NewsItem = {
  title: string;
  source: string;         // publisher name
  publishedAt: string;    // ISO date
  url: string;            // link to original
};

export type NewsFile = {
  insurer: InsurerId;
  fetchedAt: string;
  items: NewsItem[];      // newest first, max 15
};

export type Insurer = {
  id: InsurerId;
  displayName: string;       // "Care Health Insurance"
  officialSite: string;
  hospitalSourceUrl: string; // where list comes from
  download: "auto" | "manual";
  newsQuery: string;         // e.g. "Care Health Insurance"
};
```

### 6.2 Cleaning rules (in `pipeline/lib.ts`)

- **Pincode:** extract with `/\b[1-9]\d{5}\b/`. Prefer the pincode column; else take the **last** match in the address. If none, `""`.
- **Name:** trim, collapse spaces, convert ALL CAPS to Title Case, remove trailing punctuation.
- **Dedupe:** key = `lowercase(name) + pincode`. Keep first.
- **City/state:** trim, Title Case. Do not guess. Leave `""` if unknown.
- **Manual fixes:** `pipeline/fixes.json` is an array of `{ insurer, name, pincode, patch: {...} }`. Apply after adapters.
- Never invent data. If unsure, leave blank and let validation report it.

### 6.3 Search behaviour (in `src/search.ts`, pure functions, unit tested)

Input: insurer id, pincode string.

1. Validate pincode with `/^[1-9]\d{5}$/`. If invalid, show an error message. Do not search.
2. **Exact match:** hospitals whose `pincode === input`.
3. If fewer than 5 results, **nearby:** same first 3 digits (same postal region). Mark these as "Nearby".
4. If still fewer than 5, **same city** as the exact-match hospitals if known (optional in v1).
5. Sort: exact first, then nearby; inside a group, alphabetical by name.
6. Cap display to 50 with a "Show more" button.
7. If nothing found, show: "No hospitals found for this pincode in the list we have. Try a nearby pincode and confirm with your insurer."

---

## 7. Pipeline Design

### 7.1 `pipeline/update.ts` flow

```
for each insurer in insurers.json:
  1. download file (if download = "auto") OR read data/raw/<insurer>.* (if "manual")
  2. hash the file; if same as data/state.json → skip (no change)
  3. run adapter → Hospital[]
  4. apply fixes.json, clean, dedupe
  5. validate (7.3)
  6. if validation fails → keep OLD json, record failure, continue to next insurer
  7. write public/data/hospitals/<id>.json, update state.json
exit code != 0 if ANY insurer failed (so the workflow opens an issue)
```

### 7.2 Adapter contract

```ts
// pipeline/adapters/<id>.ts
export async function parse(rawFilePath: string): Promise<Omit<Hospital, "insurer">[]>;
```

- One adapter per insurer. Adapters only **read and map columns**. Cleaning lives in `lib.ts`, not in adapters.
- Each adapter has a test using a **small sample fixture** (20 real-looking rows) in `tests/fixtures/`.

### 7.3 Validation (`pipeline/validate.ts`)

A new file is accepted only if ALL pass:

- `count >= 1` and not more than **30% fewer** than the previous version.
- At least **80%** of hospitals have a valid 6-digit pincode.
- No hospital has an empty `name`.
- Print a report: total, with pincode %, duplicates removed, 5 random sample rows.

If any check fails: do NOT overwrite the old data. Exit non-zero.

### 7.4 News (`pipeline/news.ts`)

- For each insurer, fetch Google News RSS:
  `https://news.google.com/rss/search?q=<url-encoded newsQuery>&hl=en-IN&gl=IN&ceid=IN:en`
- Parse with `fast-xml-parser`. Map to `NewsItem`. Keep newest 15. Remove duplicate titles.
- Free-to-read only: skip publishers that need a subscription or login (hand-kept `PAYWALLED` list in `news.ts`). Added 2026-10-06.
- Fetch on the server side (in Actions), **not in the browser** (CORS would block it).
- If the fetch fails, keep the old `news/<id>.json`.
- Use a clear `User-Agent`. Max one request per insurer per run.
- Risk note: Google News RSS terms can change. Keep news code isolated in `news.ts` so the source can be swapped later.

---

## 8. Frontend Requirements

### 8.1 Page layout (single page)

```
┌──────────────────────────────────────────────┐
│ Header: "Network Hospital Finder"            │
│ Small line: "Free, unofficial information"   │
├──────────────────────────────────────────────┤
│ [ Insurer ▼ ]  [ Pincode ______ ]  [Search]  │
├──────────────────────────────────────────────┤
│ Section 1: Hospitals                         │
│   "Source: <insurer> official list,          │
│    last updated <date>"                      │
│   list of hospital cards                     │
├──────────────────────────────────────────────┤
│ Section 2: Latest news about <insurer>       │
│   title – source – date  (link, new tab)     │
├──────────────────────────────────────────────┤
│ Footer: disclaimers (always visible)         │
└──────────────────────────────────────────────┘
```

### 8.2 Behaviour

- On load: fetch `data/insurers.json`, fill dropdown. Do **not** load hospital files yet.
- When an insurer is chosen: lazy-load `hospitals/<id>.json` and `news/<id>.json`; cache in memory.
- Show news as soon as insurer is selected (even before pincode is entered).
- Pincode input: numeric only, max 6 digits, `inputmode="numeric"`, Enter key submits.
- Show loading and error states (file failed to load → friendly message).
- Hospital card: name (bold), address, "Nearby" badge when applicable.
- News link: `target="_blank" rel="noopener noreferrer nofollow"`.
- URL state: `#insurer=care&pincode=500001` so results can be shared. Read on load, update on search. (Hash, not query: the hash is never sent to any server, so pincodes stay out of logs and analytics. Old `?` links are converted.)
- Escape all text before inserting into the DOM (use `textContent`, never `innerHTML` with data).

### 8.3 Disclaimers (exact text can be edited, meaning must stay)

Show in the footer **and** a short one directly above the hospital results:

1. **Hospital list:** "This is unofficial information collected from each insurer's published network list. Network lists change often. Always confirm cashless eligibility with the hospital and your insurer **before admission**."
2. **News:** "Headlines are shown from public news sources with links to the original article. We do not write, verify, or endorse them."
3. **No advice:** "This site does not give insurance advice and does not recommend any policy or insurer."
4. **Affiliation:** "Not affiliated with any insurer or hospital. Names belong to their respective owners."

### 8.4 Quality requirements

- Works on mobile first (most users will be on phones); readable at 360px width.
- Keyboard accessible; labels on inputs; visible focus; colour contrast AA.
- Page weight: initial load under 100 KB (excluding data files). No frameworks.
- Lighthouse targets: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 90.
- Basic SEO: `<title>`, meta description, semantic HTML, `lang="en"`.
- Language: English only in v1 (keep text in one `strings` object so Telugu/Hindi can be added later).

---

## 9. Automation (GitHub Actions)

### 9.1 `update-data.yml`
- Triggers: `schedule` (weekly, Monday 03:00 UTC) and `workflow_dispatch`.
- Steps: checkout → setup Node 22 → `npm ci` → `npm run update` → `npm run news` → commit changes in `data/` and `public/data/` if any → push.
- News can run on its own schedule (e.g. daily) as a separate job if wanted.
- If `npm run update` exits non-zero: **do not commit**, and open a GitHub Issue titled `Data update failed <date>` with the validation report. (Use `gh issue create` with `GITHUB_TOKEN`.)
- Permissions: `contents: write`, `issues: write`.

### 9.2 `deploy.yml`
- Trigger: push to `main`.
- Steps: `npm ci` → `npm test` → `npm run build` → deploy `dist/` to GitHub Pages.

### 9.3 npm scripts

```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "test": "vitest run",
  "update": "tsx pipeline/update.ts",
  "news": "tsx pipeline/news.ts"
}
```

---

## 10. Testing Requirements

Keep it small but real. Each item below must have at least one test.

| Area | Test |
|---|---|
| `lib.ts` | pincode extraction (valid, none, two numbers in address, 5-digit false match), name cleaning, dedupe |
| `search.ts` | exact match, nearby fallback by first 3 digits, invalid pincode, empty result, sort order |
| Each adapter | sample fixture → expected first rows + total count |
| `validate.ts` | passes good data; fails on >30% drop; fails on <80% pincodes |
| `news.ts` | parses a saved sample RSS XML into `NewsItem[]` |

Manual checks before release: search 3 real pincodes per insurer; test on a phone; open every news link once.

---

## 11. Acceptance Criteria (Definition of Done for v1)

- [ ] Dropdown lists Care, Niva Bupa, Star.
- [ ] Valid pincode returns hospitals; invalid pincode shows an error.
- [ ] Empty result shows the helpful "no hospitals" message.
- [ ] News headlines load for each insurer, open the original in a new tab.
- [ ] "Source" and "last updated" visible with hospital results.
- [ ] All four disclaimers visible.
- [ ] Shareable URL works (`#insurer=...&pincode=...`).
- [ ] Weekly Action runs, and a failed validation does **not** overwrite good data.
- [ ] All tests pass; Lighthouse targets met.
- [ ] README explains how to run, update data, and add a new insurer.

---

## 12. Build Phases (give Claude ONE phase at a time)

**Phase 0: Setup**
Create repo skeleton from section 5, `package.json`, TypeScript config, Vite, Vitest, `types.ts`.
*Done when:* `npm run dev`, `npm test`, `npm run build` all run (even with empty tests).

**Phase 1: Source discovery (human + Claude)**
For each of Care, Niva Bupa, Star: find the **official** hospital list (file link or official page), check robots.txt/terms, decide `auto` or `manual`, and fill `insurers.json`. Save one raw sample file per insurer in `data/raw/`.
*Done when:* `insurers.json` is filled with real `hospitalSourceUrl` and `download` values.
Candidate starting points (verify each is official and allowed): Star Health city pages under `starhealth.in/network-hospitals/`, Care Health's cashless page on `careinsurance.com`, Niva Bupa's official site / `rules.nivabupa.com` provider-network pages.

**Phase 2: First adapter (easiest insurer first, prefer Excel/CSV)**
Implement `lib.ts`, one adapter, fixtures, tests, `validate.ts`, and `update.ts` for that insurer.
*Done when:* `npm run update` writes `public/data/hospitals/<id>.json` and passes validation with a printed report.

**Phase 3: Frontend (using real data from Phase 2)**
Build `search.ts` (with tests) first, then UI per section 8.
*Done when:* user can pick the insurer, enter a pincode, and see results with disclaimers.

**Phase 4: News**
Implement `news.ts` with test, render news section.
*Done when:* headlines show for the insurer with working links.

**Phase 5: Remaining insurers**
Add adapters #2 and #3 using the same contract. Do not change the shared types unless needed.
*Done when:* all three work end to end.

**Phase 6: Automation + Deploy**
Add both workflows, issue-on-failure, GitHub Pages deploy.
*Done when:* a manual `workflow_dispatch` run updates data and the live site shows it.

**Phase 7: Polish**
Accessibility, Lighthouse, README, share-URL, final disclaimer review.

**Phase 8 (optional, later): AdSense**
Only after real traffic exists. Needs a privacy policy page and consent banner. Out of scope until then.

---

## 13. Instructions for Claude (how to work on this repo)

1. Read this whole file first. Work on **one phase at a time** and stop at the "Done when" line.
2. Prefer the simplest solution. No framework, no new dependency without a clear reason, no abstractions "for later".
3. Show the plan for the phase in 5 bullets, then build it.
4. Write tests with the code, not after.
5. When a source file is messy, **print the first 20 rows and the column names** before writing the adapter. Never guess column names.
6. Never fetch data from aggregator sites (see section 3).
7. When unsure about a legal or data-source question, **stop and ask me**.
8. After each phase: list what changed, how to run it, and what is next.
9. Keep explanations short and in simple English.

---

## 14. Open Questions (decide during the build)

- Exact official source and download method for each insurer (Phase 1).
- Whether Google News RSS is acceptable long-term or should be replaced.
- Whether to add more insurers after v1 (adding one = one new adapter + one entry in `insurers.json`).
- Domain name (GitHub Pages default URL is fine for now).
