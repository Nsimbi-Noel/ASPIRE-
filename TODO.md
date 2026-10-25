# ASPIRE: Task List

Order of work: **build the working system first**, send one email to start the slow approvals, and park everything that needs data, approvals or a finished system. Items marked **(blocker)** hold up later work. Working list tied to [docs/ROADMAP.md](docs/ROADMAP.md).

## Build now (in this order)

### 1. Foundations
- [ ] Create the Git repository and commit the README, docs, data and rules engine
- [ ] Set up the apps (`apps/api`, `apps/web`); leave `services/ml` empty for now
- [ ] Set up PostgreSQL and the migration tool
- [ ] Write the first schema from [docs/DATA_MODEL.md](docs/DATA_MODEL.md), including the rule set `status`, `source`, `edition` and `approval` fields
- [ ] Add authentication and roles: applicant, officer, committee, registrar, administrator

### 2. Data the system needs
- [ ] Build the programme catalogue file from the brochure and spot-check it against the PDF
- [ ] Check the two entries that affect eligibility (`must-15`, `mak-91`) against the PDF
- [ ] Build the synthetic applicant generator (for testing and demos only)
- [ ] Pick the first demo programmes (suggested: BSc Computer Science, BSc Information Technology, BBAM)

### 3. Core flow
- [ ] Build rule set storage with versions and effective dates
- [ ] Build the API layer that calls the engine and stores results
- [ ] Store `input_snapshot` and the check trace for every screening run
- [ ] Build the applicant form: marks entry with a canonical subject list (replaces name matching), and document records with manual entry and a review flag (no OCR yet)
- [ ] Build the committee dashboard: filters, reasons, flags, with `REVIEW` checks shown clearly
- [ ] Add overrides with a mandatory reason
- [ ] Add the append-only audit log
- [ ] Build the hold workflow: auto re-screen, deadlines, notifications

### 4. Matching
- [ ] Implement program matching (TOPSIS) and derive weights with AHP
- [ ] Implement near-miss detection and diploma/certificate pathways
- [ ] **Milestone M1:** rules engine passes its tests on 2-3 real programs
- [ ] **Milestone M2:** staff can view ranked programs and reasons, and log an override

## Send once, then wait

Cheap to do now, slow to come back. Send one email, then work on the system while waiting.

- [ ] Send one email to the admissions office covering everything under "Waiting on replies" below, and ask for a meeting
- [ ] **(blocker)** Ask the supervisor how past-intake data can be obtained
- [ ] Start written approvals: registrar, admissions office, research / ethics body

### Waiting on replies
- [ ] **(blocker)** UMU's approval to use the adopted rules, or UMU's own programme-specific requirements
- [ ] Confirmation of the 30 programme mappings
- [ ] Decision on whether degrees require 5 UCE passes (the engine has a switch; default is off)
- [ ] Confirmation of no minimum weighted score or cut-offs
- [ ] Document list per entry route
- [ ] Subject list for "relevant to programme" at diploma level (otherwise manual review stays)
- [ ] How "or equivalent" qualifications are recorded
- [ ] 10-20 real anonymised applicant outcomes as golden test cases
- [ ] Anonymised past-intake data: results, program, decision, year-1 outcome
- [ ] Sample result slips for the document verifier

## Parked (until the system runs or data arrives)

### Machine learning and OCR
- [ ] Add OCR to the document verifier and a human review path for low confidence
- [ ] Build the baseline progress model (aggregate points only)
- [ ] Train logistic regression, then a gradient boosting challenger
- [ ] Add calibration and per-prediction explanations
- [ ] Build the anomaly detector
- [ ] Agree a precise definition of "progress" with the registrar
- [ ] **Milestone M3:** slips extracted with confidence flags
- [ ] **Milestone M4:** advisory models compared against baselines

### Evaluation and write-up
- [ ] Compare engine outcomes with past committee decisions and analyse every disagreement
- [ ] Measure extraction accuracy at field level
- [ ] Evaluate the progress predictor out-of-time against the baseline
- [ ] Check error rates and calibration by gender and region
- [ ] Time the screening process against the manual process
- [ ] Test with admissions staff and record their feedback
- [ ] Run a short usability session with staff and a small group of applicants
- [ ] Fill in the results log in [docs/EVALUATION.md](docs/EVALUATION.md)
- [ ] **Milestone M5:** all measures reported
- [ ] Write the final report and prepare the demo
- [ ] Hand over documentation and deployment notes

### Literature
- [ ] Re-read references 1-6 and confirm each supports the claim it is cited for
- [ ] Check reference 5 (Aguti et al.) full text before using it for any career-guidance claim
- [ ] Find a peer-reviewed source on ML progress prediction to sit alongside reference 4
- [ ] Review related work on rules-based admission screening
- [ ] Fix reference 3 (Bangladesh paper) in the concept note itself (bundle with the addendum to the supervisor)

### Other
- [ ] Check the remaining entries in `data/rules/programme-weights.2026-27.json` against the PDF (scores are advisory, so errors only affect ranking)
- [ ] Clarify how "one or two better done" subjects are weighted (the engine already resolves it with the three-subject cap)
- [ ] Set up linting, formatting and a project board
- [ ] **Checkpoint, end of Month 2:** if real data is still unavailable, reframe the progress predictor as a demonstrated pipeline and agree this with the supervisor

## Done

- [x] Collected UMU's general entry requirements (2026-27 brochure) and the public-universities weighting document
- [x] Decided: no minimum weighted score or cut-offs (private university); still to confirm with the admissions office
- [x] Decided: TypeScript for the backend and engine (recommended; confirm)
- [x] Decided: JSON rule set, not Prolog
- [x] Define the rule types against the brochure and adopted rules (v1; revisit when UMU confirms)
- [x] Implement `screen()` with the two-stage order: academics first, then documents
- [x] Write tests for mapped and unmapped programmes (32 tests passing)
- [x] Write the invariant tests listed in [docs/RULES_ENGINE.md](docs/RULES_ENGINE.md) section 8
- [x] Build the weighted score function and test it on hand-worked examples
- [x] Add `status`, `source`, `edition` and `approval` to the engine's rule set

## Ongoing

- [ ] Update [docs/DECISIONS.md](docs/DECISIONS.md) whenever a decision is made
- [ ] Meet the supervisor regularly and note the feedback
- [ ] Keep the README and docs in step with the code
- [ ] Never commit real applicant data to the repository
