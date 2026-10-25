# Evaluation Plan

Derived from Section 11 of the concept note.

| Measure | How it is assessed |
| --- | --- |
| Rule correctness | Compare engine outcomes with committee decisions on past intakes; review every disagreement |
| Hold accuracy | Share of applicants correctly placed on hold with the right missing-document list |
| Document extraction | Field-level accuracy on real or realistic result slips |
| Progress prediction | Out-of-time test: train on earlier intakes, test on later ones, against a baseline using aggregate points alone |
| Fairness | Error rates and calibration compared across gender and region |
| Efficiency | Time to screen an applicant compared with the manual process |
| Usability | Feedback from admissions staff and a small group of applicants |

## Principles

- If an ML component does not beat its baseline, **report that as a finding** and keep the simpler method.
- Disagreements between the engine and past committee decisions are analysed, not hidden: they may reveal rule errors, rule changes between intakes, or committee discretion.

## Data caveat

Synthetic data is suitable for testing the rules engine and the pipeline. A model trained on synthetic outcomes only learns the relationship built into the generator, so it cannot validate the progress predictor or the fairness results. Those need real anonymised past-intake data. See [DECISIONS.md](DECISIONS.md).

## Results log

_Fill in as evaluation runs happen._

| Date | Measure | Dataset | Result | Notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
