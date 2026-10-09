# Network Hospital Finder

**Live site:** https://goutamkumarkoppolu.github.io/network-hospital-finder/

## What is this?

When a family member needs hospital admission, the first question is often: *"Is this hospital cashless under our insurance?"* Today you have to dig through each insurer's own website to find out, and there is no easy way to also see what's happening with that insurer.

This site puts both in one place:

- **Official hospital locator:** pick one of 12 major Indian health insurers and get a direct link to that insurer's own network hospital locator.
- **About the insurer:** IRDAI registration, ownership, official links and the step-by-step complaint path.
- **Latest news about the insurer:** recent headlines (good and bad) with links to the original articles, to help when choosing or reviewing a policy.

It is a free, unofficial hobby project: no login, no ads, no cookies; only an anonymous visitor count (Firebase Analytics). We keep no hospital lists of our own; we link to each insurer's official locator. It does not give insurance advice. Always confirm cashless eligibility with the hospital and your insurer before admission.

Full spec: [requirement.md](requirement.md).

## Run

Needs Node 22+.

```sh
npm install
npm run dev     # local site at http://localhost:5173
npm test        # unit tests
npm run build   # production build in dist/
```

## Update data

```sh
npm run update  # hospitals: data/raw/<id>.* → public/data/hospitals/<id>.json
npm run news    # headlines: Google News RSS → public/data/news/<id>.json
npm run stats   # says when IRDAI figures (claim ratio, solvency: public/data/insurer-stats.json) are due for a manual update
```

- `update` skips insurers with no adapter, and skips a file whose hash matches `data/state.json`.
- A new hospital file is written only if validation passes (at least 1 row, no more than a 30% drop, at least 80% with a pincode, no empty names). Otherwise the old file stays, a report is printed, and the exit code is 1.
- Manual corrections go in `pipeline/fixes.json`: `[{ "insurer": "star", "name": "<cleaned name>", "pincode": "500001", "patch": { "city": "Hyderabad" } }]`.
- IRDAI figures (health incurred claim ratio, solvency ratio) are entered by hand from the IRDAI Annual Report: irdai.gov.in blocks all bots in robots.txt, so nothing downloads it. `stats` only compares the year we have with when the next report is due, and the weekly workflow opens one issue with the steps when it is.
- GitHub Actions runs both every Monday 03:00 UTC (`.github/workflows/update-data.yml`), commits changes, and opens an issue if the hospital update fails. `deploy.yml` builds and publishes to GitHub Pages.

## Add an insurer (or turn one on)

Hospital data must come from the insurer's **own** official list, with permission or where robots.txt and terms clearly allow it. Never from aggregator sites. See section 3 of requirement.md.

1. Add or update the entry in `public/data/insurers.json` (`hospitalSourceUrl`, `download`, `newsQuery`, and a `note` recording the robots/terms/permission status). Add the id to `InsurerId` in `src/types.ts` if new.
2. Put the official file in `data/raw/<id>.<ext>` (manual download).
3. Print the first 20 rows and the column names, then write `pipeline/adapters/<id>.ts` exporting `parse(rawFilePath)` that only maps columns to `{ name, address, city, state, pincode }`. Cleaning lives in `pipeline/lib.ts`.
4. Add a 20-row fixture in `tests/fixtures/` and a test for the adapter.
5. Register the adapter in the `adapters` map in `pipeline/update.ts`, then run `npm run update`.

## Data status

Insurers do not allow automated download of their hospital lists, so the site keeps no copy of its own (decided 2026-10-09). For every insurer the page links to its official hospital locator (`hospitalSourceUrl`), opening in a new tab. Nothing is copied or embedded. News headlines work for all 12. Per-insurer robots/terms notes are in `public/data/insurers.json`.

## Contact and removal requests

Insurers, hospitals or publishers who want something corrected or removed: email **vibecodergk@gmail.com** or [open an issue](https://github.com/GoutamkumarKoppolu/network-hospital-finder/issues). Requests are handled promptly (removing an insurer = deleting its entry in `public/data/insurers.json`).

## License

MIT
