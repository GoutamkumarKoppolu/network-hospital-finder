# Network Hospital Finder

**Live site:** https://goutamkumarkoppolu.github.io/network-hospital-finder/

## What is this?

When a family member needs hospital admission, the first question is often: *"Is this hospital cashless under our insurance?"* Today you have to dig through each insurer's own website to find out, and there is no easy way to also see what's happening with that insurer.

This site puts both in one place:

- **Network hospitals by pincode:** pick one of 12 major Indian health insurers, enter your 6-digit pincode, and see the cashless network hospitals there, with nearby ones if there are only a few.
- **Latest news about the insurer:** recent headlines (good and bad) with links to the original articles, to help when choosing or reviewing a policy.

It is a free, unofficial hobby project: no login, no ads, no cookies; only an anonymous visitor count (Cloudflare Web Analytics). Hospital data comes only from each insurer's official list and is refreshed weekly. It does not give insurance advice. Always confirm cashless eligibility with the hospital and your insurer before admission.

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
```

- `update` skips insurers with no adapter, and skips a file whose hash matches `data/state.json`.
- A new hospital file is written only if validation passes (at least 1 row, no more than a 30% drop, at least 80% with a pincode, no empty names). Otherwise the old file stays, a report is printed, and the exit code is 1.
- Manual corrections go in `pipeline/fixes.json`: `[{ "insurer": "star", "name": "<cleaned name>", "pincode": "500001", "patch": { "city": "Hyderabad" } }]`.
- GitHub Actions runs both every Monday 03:00 UTC (`.github/workflows/update-data.yml`), commits changes, and opens an issue if the hospital update fails. `deploy.yml` builds and publishes to GitHub Pages.

## Add an insurer (or turn one on)

Hospital data must come from the insurer's **own** official list, with permission or where robots.txt and terms clearly allow it. Never from aggregator sites. See section 3 of requirement.md.

1. Add or update the entry in `public/data/insurers.json` (`hospitalSourceUrl`, `download`, `newsQuery`, and a `note` recording the robots/terms/permission status). Add the id to `InsurerId` in `src/types.ts` if new.
2. Put the official file in `data/raw/<id>.<ext>` (manual download).
3. Print the first 20 rows and the column names, then write `pipeline/adapters/<id>.ts` exporting `parse(rawFilePath)` that only maps columns to `{ name, address, city, state, pincode }`. Cleaning lives in `pipeline/lib.ts`.
4. Add a 20-row fixture in `tests/fixtures/` and a test for the adapter.
5. Register the adapter in the `adapters` map in `pipeline/update.ts`, then run `npm run update`.

## Data status

| Insurer | Hospital list | Why |
|---|---|---|
| Care Health | not yet | Permission requested (site blocks automated access) |
| Niva Bupa | not yet | Permission requested (robots.txt disallows the network page) |
| Star Health | not yet | Permission requested (full list only via internal API) |
| Aditya Birla Health, Bajaj General, Galaxy Health, HDFC ERGO, ICICI Lombard, ManipalCigna, New India Assurance, SBI General, Tata AIG | not yet | Not contacted yet (no official downloadable list found) |

Until an insurer's list is available, the page links to that insurer's official hospital locator (`hospitalSourceUrl`), opening in a new tab. Nothing is copied or embedded. News headlines work for all 12. Per-insurer robots/terms notes are in `public/data/insurers.json`.

## Contact and removal requests

Insurers, hospitals or publishers who want something corrected or removed: email **vibecodergk@gmail.com** or [open an issue](https://github.com/GoutamkumarKoppolu/network-hospital-finder/issues). Requests are handled promptly (removing an insurer = deleting its entry in `public/data/insurers.json`).

## License

MIT
