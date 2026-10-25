# Roadmap

Based on the five-month workplan in Section 10 of the concept note.

| Month | Activities and deliverables |
| --- | --- |
| 1 | Study admission rules and past intakes; agree scope with the admissions office; request data and approvals; review related work |
| 2 | Model rules and program requirements; build rules engine and database; set up anonymous or synthetic test data |
| 3 | Build program matcher, applicant form and committee dashboard; begin document verification |
| 4 | Train and evaluate advisory models; add explanations and audit log; test with admissions staff |
| 5 | Run evaluation against past intakes; fix issues; write up results; prepare demo and handover |

## Build order

ML comes last on purpose. If time gets tight, a complete and defensible screening system still exists.

1. Foundations: repo, database schema, auth and roles
2. Rules engine with tests and a synthetic applicant generator
3. Program matcher (TOPSIS + AHP)
4. Applicant form and committee dashboard (filters, reasons, overrides, audit trail)
5. Hold workflow: auto re-screen, deadlines, notifications
6. Document verifier (manual entry with confidence flag first, then OCR)
7. Advisory models: progress predictor and anomaly detector, each against a baseline
8. Evaluation and write-up

## Month 1 actions (critical path)

- [ ] Obtain the university's published admission requirements
- [ ] Meet the admissions office to confirm the design points in [RULES_ENGINE.md](RULES_ENGINE.md)
- [ ] Request anonymised past-intake data and sample result slips
- [ ] Start the written approvals in [ETHICS_AND_PRIVACY.md](ETHICS_AND_PRIVACY.md)
- [ ] Set up the repository and project board

## Milestones

| Milestone | Done when |
| --- | --- |
| M1 Rules engine v1 | Passes invariant tests on sample applicants for at least 2-3 real programs |
| M2 Matcher + dashboard | Staff can view ranked programs and reasons, and log an override |
| M3 Document pipeline | Slips extracted with confidence flags and human review path |
| M4 Advisory models | Compared against baselines, explanations shown |
| M5 Evaluation complete | All measures in [EVALUATION.md](EVALUATION.md) reported |
