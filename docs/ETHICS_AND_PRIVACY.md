# Ethics, Privacy and Safeguards

Derived from Sections 7, 8 and 12 of the concept note.

## Data use

- Use **anonymous records** for development.
- Obtain **written approval** from the registrar, the admissions office and the university's research or ethics body before any real applicant data is used.
- Verify final results against **official UNEB records** before any offer is made.

## Legal compliance

Design for compliance with Uganda's **Data Protection and Privacy Act, 2019**:

- collect only what is needed,
- restrict access by role,
- set retention limits,
- encrypt data at rest and in transit.

## Fairness safeguards

- Protected characteristics (gender, region, school, family income) are **not inputs** to fit or progress predictions.
- Test outcomes for differences across **gender and region** before any live use.
- Compare error rates and calibration across groups.
- Models are kept only if they beat a simple baseline.

## Human oversight

- ASPIRE is decision support. The **committee decides**.
- Every override is logged with a reason.
- Applicants get a clear explanation of any outcome and a route to **appeal or correct** information.

## Known limitations to state in the write-up

- **Selection bias:** outcomes exist only for admitted students, so the progress predictor is weak guidance for borderline cases.
- **Over-reliance risk:** predictions are shown as guidance with explanations, never as promises.
- **Scan quality:** low-confidence extractions need human review.

## Checklist before using real data

- [ ] Written approval: registrar
- [ ] Written approval: admissions office
- [ ] Written approval: research / ethics body
- [ ] Data anonymised
- [ ] Access roles configured
- [ ] Retention period defined
- [ ] Audit log active
