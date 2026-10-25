# @aspire/rules-engine

Pure screening logic for ASPIRE. No I/O, no clock, no randomness: the same inputs always give the same result.

## Use

```ts
import { buildRuleSet, screen } from "@aspire/rules-engine";

const ruleSet = buildRuleSet(data, { programmeId: "umu-bsc-cs" });   // data = the four JSON files in data/rules
const result = screen(applicant, ruleSet);
// result.outcome: "ELIGIBLE" | "NOT_ELIGIBLE" | "ON_HOLD"
```

`buildRuleSet` compiles UMU's general entry rules (by level) plus the adopted programme rules into one `RuleSet`. For programmes with no mapping (diplomas, certificates), pass `programmeName` and `level`.

## Behaviour

1. **Academic stage first.** An applicant passes if any entry route passes (for example UACE, diploma, access programme).
2. **Definite failure is `NOT_ELIGIBLE`** and is never `ON_HOLD`, even if documents are also missing.
3. **Documents second.** Required documents depend on the route that passed. Missing documents give `ON_HOLD` with the list.
4. **Undecidable checks give `ON_HOLD` with reason `MANUAL_REVIEW`.** Examples: subject relevance for diploma entry, or no data to check a Maths credit. The engine never auto-approves or auto-rejects on a check it cannot decide.
5. **The weighted score is advisory.** It is returned for ranking and fit, never used for the outcome, and is not computed after a definite academic failure.

Every result carries the rule set's `status` (`official` or `adopted-proxy`), source, edition and approval.

## Options

`requireUceForDegrees` (default `false`): open decision, see `docs/DECISIONS.md` #11. When `true`, degrees also require 5 UCE passes at one sitting and exclude overall UCE grades 7, 9, X, Y, Z.

## Known limits (v1)

- "Or equivalent" qualifications are not evaluated.
- Subject names are matched case-insensitively with a few aliases. Replace with UNEB subject codes later.
- The required-documents list is an assumed default; UMU has not published one.
- "One or two better done" subjects are resolved by the cap of three weighted principal subjects.
- Kyambogo's "all Arts subjects" has no list in the source, so it is treated as all remaining subjects (the result carries a warning).
- Postgraduate levels are not supported.

## Develop

```bash
npm install
npm test            # vitest
npm run typecheck   # tsc --noEmit
```
