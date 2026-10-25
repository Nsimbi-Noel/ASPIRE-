# ASPIRE

**Applicant Screening and Program Intelligence Recommendation Engine**

> A hybrid rule-based and machine learning decision support system for explainable university admission screening and program recommendation.

**Author:** Nsimbi Noel Frederick, Bsc. Computer Science, Uganda Martyrs University
**Type:** Final-year project
**Status:** Planning, concept note approved for build (October 2026)

---

## What ASPIRE does

ASPIRE screens university applicants against the institution's published admission standards, checks their documents and results, and shows each eligible applicant the programs they qualify for, ranked by best fit.

- A **deterministic rules engine** makes every eligibility decision.
- **Machine learning is advisory only**: reading and checking documents, estimating likelihood of progressing in each program, and flagging unusual applications.
- The **admissions committee** receives eligible applicants and makes the final decision. Every override is logged with a reason.

## Guiding principles

1. **Rules decide, ML advises.** ML never determines eligibility.
2. **Every outcome is explained.** Each step stores its inputs and reasons.
3. **A person makes the final decision.** The system is decision support.
4. **Rules are data.** Registrars can update program requirements without code changes.
5. **Fair by design.** Protected characteristics are not used as inputs for fit or progress predictions, and outcomes are tested across gender and region.
6. **Simple beats complex unless proven otherwise.** Every ML component must beat a simple baseline or it is dropped and reported as a finding.

## Screening outcomes

| Academic requirements met | All required documents submitted | Outcome |
| --- | --- | --- |
| No | Any | **Not eligible** |
| Yes | Yes | **Eligible**, forwarded to the admissions committee |
| Yes | No | **On hold**, with the missing documents listed |

Failing academics takes precedence over missing documents, so such applicants are never placed on hold. Eligibility is decided **per program**.

## Modules

| Module | Purpose | Technique |
| --- | --- | --- |
| Rules engine | Decides eligible / not eligible / on hold, and which programs are open | Rules held as data, typed evaluator |
| Document verifier | Reads slips and certificates, extracts grades, flags problems | OCR and image classification, with human review of flags |
| Program matcher | Ranks qualifying programs and shows near misses | Weighted scoring with TOPSIS, weights set through AHP |
| Progress predictor (advisory) | Estimates likelihood of progressing in each program | Interpretable models (logistic regression, gradient boosting) with explanations |
| Anomaly detector (advisory) | Flags inconsistent or duplicate applications | Rules and statistical outlier detection |
| Committee dashboard | Results, reasons, flags, overrides, audit trail | Web app with role-based access |

**Flow:** applicant submits marks and documents → verifier extracts and checks → rules engine screens per program → matcher ranks open programs → advisory models add guidance → committee reviews and decides.

## Advisory models

Both advisory models run **after** the rules engine and never change an eligibility outcome.

**Progress predictor**
- Estimates the likelihood that an eligible applicant progresses in a given program. "Progress" must be defined precisely with the registrar (for example, passing year 1 without a retake or withdrawal).
- Inputs: entry grades, weighted points, program, level and intake. Protected attributes are excluded.
- Models: logistic regression as the interpretable primary model and baseline; gradient boosting as a challenger, kept only if it clearly beats the baseline. A control using aggregate points alone is always reported.
- Output: a calibrated probability shown as a support-need band with the main contributing factors, worded as guidance and never as a prediction of failure.
- Limits: outcomes exist only for admitted students (selection bias), so it is weak for borderline cases. Validation uses earlier intakes for training and later intakes for testing, with error rates and calibration checked by gender and region. It needs real anonymised outcome data; synthetic data cannot validate it.

**Anomaly detector**
- Rules plus statistical outlier checks flag mismatched grades, unusual subject combinations and duplicate applications for officer review.

## Rule sources

UMU's brochure provides the general entry rules by level and the programme catalogue. For subject weighting and programme-specific conditions, ASPIRE adopts the public-universities weighting system (2026/2027 edition, as published for Makerere) for similar programmes. Those rules are labelled `adopted-proxy` until UMU's admissions office approves them. See [docs/RULE_SOURCES.md](docs/RULE_SOURCES.md).

## Scope

**In scope:** undergraduate and diploma/certificate applicants; screening against academic requirements and required documents; program recommendation; committee dashboard; evaluation on historical or synthetic data.

**Out of scope for v1:** automatic admission offers, payment processing, scholarships and bursaries, integration with national systems beyond file import.

## Proposed tech stack

_Proposed in the concept note; items marked (TBC) are not yet decided. See [docs/DECISIONS.md](docs/DECISIONS.md)._

| Layer | Choice |
| --- | --- |
| Backend | Node.js (language: TypeScript, TBC) |
| ML / OCR services | Python with scikit-learn and an open-source OCR library |
| Database | PostgreSQL (applicants, rules, decisions, audit log) |
| Rules | JSON rule set stored in the database, with effective dates |
| Front end | Web app for applicants and staff, role-based access |
| Deployment | University server or modest cloud instance; CSV import as fallback |

## Documentation

| Document | Contents |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, components, data flow |
| [docs/RULES_ENGINE.md](docs/RULES_ENGINE.md) | Rules engine specification and rule types |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Database entities and relationships |
| [docs/ETHICS_AND_PRIVACY.md](docs/ETHICS_AND_PRIVACY.md) | Data protection, fairness, approvals |
| [docs/EVALUATION.md](docs/EVALUATION.md) | How the system will be measured |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Five-month workplan and build order |
| [docs/RULE_SOURCES.md](docs/RULE_SOURCES.md) | Where the admission rules come from and what is adopted |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Open questions and decision log |
| [TODO.md](TODO.md) | Working task list |

## Repository structure (proposed)

```
aspire/
├── README.md
├── docs/
├── apps/
│   ├── api/            # Node.js backend (auth, screening, dashboard API)
│   └── web/            # Applicant and committee web app
├── packages/
│   └── rules-engine/   # Pure screening logic, no I/O
├── services/
│   └── ml/             # Python: OCR, progress predictor, anomaly detector
├── data/
│   └── synthetic/      # Generated test data (never real applicant data)
└── db/
    └── migrations/
```

## Getting started

The rules engine is the first working piece.

```bash
cd packages/rules-engine
npm install
npm test            # 32 tests
npm run typecheck
```

See [packages/rules-engine/README.md](packages/rules-engine/README.md) for usage.

## Data and privacy

Development uses **anonymous or synthetic data only**. Real applicant data requires written approval from the registrar, the admissions office and the university's research or ethics body. The design aims to comply with Uganda's Data Protection and Privacy Act, 2019. See [docs/ETHICS_AND_PRIVACY.md](docs/ETHICS_AND_PRIVACY.md).

## References

Each source below was checked against its publisher, journal or repository page on 22 October 2026. Checking that a source exists does not confirm it supports the claim you attach to it, so re-read each one before citing.

| # | Reference | Link |
| --- | --- | --- |
| 1 | Algarni, S., & Sheldon, F. (2023). Systematic review of recommendation systems for course selection. *Machine Learning and Knowledge Extraction, 5*(2), 560-596. | https://doi.org/10.3390/make5020033 |
| 2 | Ndlovu, B., Migioni, Z. T., Dube, S., & Nyoni, P. (2023). Betr Selektr: A university program recommender system utilising personality type and academic results. *The Barcelona Conference on Education 2023: Official Conference Proceedings.* ISSN 2435-9467. | https://doi.org/10.22492/issn.2435-9467.2023.55 |
| 3 | Mokarrama, M. J., Khatun, S., & Arefin, M. S. (2020). A content-based recommender system for choosing universities. *Turkish Journal of Electrical Engineering and Computer Sciences, 28*(4), 2128-2142. | https://doi.org/10.3906/elk-1911-37 |
| 4 | Karimi-Haghighi, M., Castillo, C., Hernandez-Leo, D., & Moreno Oliver, V. (2021). Predicting early dropout: Calibration and algorithmic fairness considerations. arXiv preprint arXiv:2103.09068. | https://arxiv.org/abs/2103.09068 |
| 5 | Aguti, J. N., Nakibuuka, D., & Kajumbula, R. (2009). Determinants of student dropout from two external degree programmes of Makerere University, Kampala, Uganda. *Malaysian Journal of Distance Education, 11*(2). | https://nru.uncst.go.ug/handle/123456789/6900 |
| 6 | Kamenetz, A. (2016, October 30). How one university used big data to boost graduation rates. *NPR.* | https://www.npr.org/sections/ed/2016/10/30/499200614/how-one-university-used-big-data-to-boost-graduation-rates |

### Notes on use

- **Reference 3** appears in the concept note without authors or a year, and with "in Bangladesh" added to the title. Update the concept note to match the entry above.
- **Reference 4** is a preprint. I found no peer-reviewed version, so cite it as one. Its models use demographics and high school as inputs, whereas ASPIRE excludes protected attributes, so cite it for its fairness and calibration methods rather than as a model to match.
- **Reference 5** studies dropout from distance-education programs, and its abstract attributes dropout mainly to socio-cultural and financial factors. Do not use it to support a claim about limited career guidance at the point of program choice unless the full text says so.
- **Reference 6** is a news article. It reports that the early-warning system was built by the consulting firm EAB, and that Georgia State also hired 42 more advisers, so the graduation gains should not be credited to predictions alone.
