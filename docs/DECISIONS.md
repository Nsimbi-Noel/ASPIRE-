# Open Questions and Decision Log

## Open questions

| # | Question | Owner | Status |
| --- | --- | --- | --- |
| 1 | Backend language: JavaScript or TypeScript? | Nsimbi | The engine is written in TypeScript (recommended); confirm |
| 2 | Rules format: JSON rule set or Prolog? (concept note allows either) | Nsimbi | Open |
| 3 | Which real programs to model first? | Nsimbi + admissions office | Open |
| 4 | Is an overall applicant-level outcome needed, or per-program only? | Admissions office | Open |
| 5 | Hold deadline length and notification channel | Admissions office | Open |
| 6 | Source of real anonymised past-intake data and approval timeline | Supervisor / registrar | Open |
| 7 | If real data is unavailable, reframe the progress predictor as a demonstrated pipeline rather than a validated result? | Nsimbi + supervisor | Open |
| 8 | Front-end framework | Nsimbi | Open |
| 9 | OCR library to evaluate | Nsimbi | Open |
| 10 | Will UMU's admissions office approve the adopted public-university rules, or supply its own? | Admissions office | Open |
| 11 | Should degrees require 5 UCE passes? (public-university rules do; UMU's brochure states it only for diploma and certificate) | Admissions office | Open |
| 12 | Minimum weighted score for eligibility | Nsimbi | Decided: none, because UMU is private and has no cut-offs; admissions office to confirm |
| 13 | Confirm each UMU-to-source programme mapping (30 mapped; 5 partial) | Admissions office / faculties | Open |
| 14 | How are "one or two better done" subjects weighted (Business Administration, Accounting)? | Admissions office | Open |
| 15 | Which variants of BSc with Education and BSc General does UMU offer? | Faculty of Education / Science | Open |
| 16 | Which documents does UMU require, and does the list differ by entry route? (engine uses an assumed default) | Admissions office | Open |
| 17 | Which subjects count as "relevant to the programme" for diploma entry? (engine sends these to manual review) | Admissions office / faculties | Open |
| 18 | How are "or equivalent" qualifications (foreign or other) recorded and judged? | Admissions office | Open |
| 19 | Is ON_HOLD with a manual-review reason the right outcome for checks the engine cannot decide? | Supervisor / admissions office | Open |

## Decision log

Record each decision with its reason, so the write-up can explain the design.

| Date | Decision | Reason | Alternatives considered |
| --- | --- | --- | --- |
| Oct 2026 | Rules engine decides eligibility; ML is advisory only | Explainability, auditability, fairness (concept note) | ML-driven eligibility |
| Oct 2026 | Rules stored as data with effective dates | Registrar can update without code; reproducible past decisions (concept note) | Rules hard-coded |
| Oct 2026 | Adopt the public-universities weighting system (Makerere's published tables) for similar UMU programmes, labelled `adopted-proxy` until UMU approves | UMU publishes no programme-specific rules; the system is a national public-university standard; rules stay data, so they can be swapped | Wait for UMU rules; screen on the 2-principal-pass rule only |
| Oct 2026 | Use 2026/27 Ministry document as the source, not the 2019/20 edition | Rules changed between editions (for example Computer Science essential subjects) | Use the older edition found first |
| Oct 2026 | Use the weighting system for ranking and fit; eligibility stays with UMU general entry plus programme conditions | The weighting was designed for competitive placement and has no published UMU threshold | Treat a minimum weighted score as an eligibility rule |
| Oct 2026 | No minimum weighted score or cut-offs; eligibility is general entry plus programme conditions plus documents | UMU is a private university with no published cut-offs; cut-offs come from competition for government places | Enforce a minimum weighted score |
| Oct 2026 | Rules engine v1 in TypeScript as a pure package with JSON rule data | Typed rules and results catch mistakes; purity makes it testable and reproducible | Plain JavaScript; Prolog |
| Oct 2026 | Undecidable checks put the applicant ON_HOLD (MANUAL_REVIEW); definite failures are NOT_ELIGIBLE | The engine must never auto-approve or auto-reject on something it cannot decide | Treat as pass; treat as fail |
