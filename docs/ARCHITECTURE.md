# Architecture

Derived from Sections 6 and 9 of the concept note. Technology choices marked (TBC) are open; see [DECISIONS.md](DECISIONS.md).

## 1. Overview

ASPIRE is a web application with a deterministic core and advisory ML services around it.

```
 Applicant / Staff browser
          │
     Web front end
          │
      API (Node.js)
  ┌───────┼────────────┬───────────────┐
  │       │            │               │
Rules   Matcher     Auth / RBAC     Audit log
engine  (TOPSIS+AHP)                   │
  │       │                            │
  └───────┴──────────┬─────────────────┘
                     │
                PostgreSQL
                     │
           ML service (Python)
     OCR · progress predictor · anomaly detector
```

## 2. Design rules

- **The rules engine is a pure function** with no database calls, clock or randomness. Same input, same output.
- **ML services are advisory.** Their outputs are stored and displayed but never feed the eligibility decision.
- **Every step stores inputs, rule set version and reasons**, so any past decision can be reproduced.
- **ML failure must not block screening.** If the ML service is down, screening still completes without advisory output.

## 3. Components

### Rules engine (`packages/rules-engine`)
Evaluates an applicant against a program's rule set and returns an outcome plus a trace of checks. See [RULES_ENGINE.md](RULES_ENGINE.md).

### Program matcher
Takes the programs open to an applicant and ranks them by best fit using TOPSIS, with criteria weights derived through AHP. Also reports near misses and diploma/certificate pathways.

### Document verifier
OCR extracts subjects and grades from uploaded slips. A classifier flags blurry, incomplete or suspicious uploads. Low-confidence extractions go to human review, with manual entry as a fallback. Extracted grades are compared with grades the applicant entered.

### Progress predictor (advisory)
Interpretable model estimating likelihood of progressing in each qualifying program. Excludes protected attributes. Shown as guidance with explanations, never as a promise.

### Anomaly detector (advisory)
Rules plus statistical outlier detection to flag mismatched grades, odd subject combinations and duplicate applications for officer review.

### Committee dashboard
Filters, explanations, flags, overrides (reason mandatory) and the audit trail. Role-based access.

### Auth and roles
Proposed roles: applicant, admissions officer, committee member, registrar (rule maintenance), administrator.

## 4. Screening flow

1. Applicant submits marks and uploads documents.
2. Document verifier extracts and checks; flags go to review.
3. Rules engine screens the applicant against each program.
4. Matcher ranks the open programs.
5. Advisory models add guidance.
6. Committee reviews and decides; overrides are logged with a reason.
7. If on hold, screening re-runs automatically when documents arrive.

## 5. Deployment

University server or modest cloud instance. CSV import is the fallback if integration is delayed. Final results must be verified against official UNEB records before any offer is made.
