# Future work

Ideas checked against the hard rules in [requirement.md](requirement.md) section 3 (official sources only, facts plus source and date, no advice, no ranking, no sentiment). Done so far: insurer facts, official links and the complaint path (the "About" panel, data in `public/data/insurers.json`).

## Rules for everything below

- Every number shows its source link and the year or quarter it covers.
- Show one insurer at a time. No ranking, no "best", no green/red colouring.
- Enter numbers by hand from the official document. No scraping of aggregators.
- Keep it in one file, e.g. `public/data/insurer-stats.json`, with `source`, `period`, `fetchedAt` per value.
- Requirement 2 lists "No policy comparison" as a non-goal. These are insurer-level facts, not policy comparison, but confirm before building items 1-5.

## Insurer numbers (yearly, manual)

| # | What | Source |
|---|---|---|
| 1 | Health claims settled, repudiated and pending (by count and amount) | IRDAI Annual Report / Handbook on Indian Insurance Statistics (irdai.gov.in) |
| 2 | Health incurred claim ratio | Same IRDAI reports |
| 3 | Complaints per 10,000 policies, and how many were resolved | IRDAI Annual Report, grievance tables |
| 4 | Complaints and awards at the Insurance Ombudsman | Council for Insurance Ombudsmen annual reports (cioins.co.in) |
| 5 | Solvency ratio (regulatory minimum 1.5) | Each insurer's quarterly public disclosures (required by IRDAI); or just link the disclosures page |

## Static pages (no data feed)

| # | What | Source |
|---|---|---|
| 9 | "Your rights" section: cashless decision within 1 hour, discharge approval within 3 hours, pre-existing disease waiting period at most 3 years, 5-year moratorium, portability | IRDAI Master Circular on Health Insurance (2024); link it and quote only the rule |
| 10 | Glossary: co-pay, room-rent limit, sub-limits, restoration, no-claim bonus, waiting periods, plus a neutral "things to check in any policy" list | Own wording, no product names |
| 12 | Links to government hospital lists (PM-JAY, CGHS) | Official government portals |

## Optional

| # | What | Source | Note |
|---|---|---|---|
| 11 | Premium written / market share | General Insurance Council monthly statistics (gicouncil.in) | Size is not quality; word it carefully or skip |

## Not doing

- Scores or counts from our own news topics (e.g. "complaint headlines this quarter"): this is sentiment, against requirement 2.
- Anything from PolicyBazaar, PolicyX or similar aggregators (requirement 3.1).

## Code fixes noted in the 2026-10-08 review

- ~~update-data.yml news skipped when hospital update fails~~: fixed 2026-10-08 (`if: always()`, deploy runs after any data run).
- `insurers.json` could carry `hasHospitals` so the page stops requesting a hospital file that 404s.
- `pipeline/validate.ts` repeats the pincode regex; reuse `isValidPincode` from `src/search.ts`.
- The "About" panel facts (registration no., listed status) were checked on 2026-10-08. Re-check yearly, and fill the empty links (Aditya Birla docs/claims, Care and ICICI docs, ICICI and New India claims) once confirmed on the insurer's site.
