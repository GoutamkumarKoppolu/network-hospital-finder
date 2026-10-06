# Network Hospital Finder

Find an insurer's cashless network hospitals by pincode, plus recent news headlines about the insurer. Free, unofficial, static site (no backend, no login, no tracking). Full spec: [requirement.md](requirement.md).

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
| Care Health | not yet | Waiting for permission (site blocks automated access) |
| Niva Bupa | not yet | Waiting for permission (robots.txt disallows the network page) |
| Star Health | not yet | Waiting for permission (full list only via internal API) |

News headlines work for all three.

## License

MIT
