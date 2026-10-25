import type {
  Applicant, CheckStatus, HoldReason, Outcome, RouteResult, RuleSet, ScreeningResult,
} from "./types";
import { evaluateRule } from "./checks";
import { computeWeightedScore } from "./weighting";

function routeStatus(statuses: CheckStatus[]): CheckStatus {
  if (statuses.includes("FAIL")) return "FAIL";
  if (statuses.includes("REVIEW")) return "REVIEW";
  return "PASS";
}

/**
 * Screen one applicant against one programme's rule set.
 * Pure: no I/O, clock or randomness. The same inputs always give the same result.
 *
 * Order: academic stage first (any route may pass), then documents.
 * A definite academic failure is NOT_ELIGIBLE and never ON_HOLD.
 * Checks that cannot be decided automatically put the applicant ON_HOLD for manual review.
 */
export function screen(applicant: Applicant, ruleSet: RuleSet): ScreeningResult {
  const routes: RouteResult[] = ruleSet.routes.map((route) => {
    const checks = route.rules.map((rule) => evaluateRule(rule, applicant));
    return { routeId: route.id, status: routeStatus(checks.map((c) => c.status)), checks };
  });

  const passed = routes.find((r) => r.status === "PASS");
  const review = routes.find((r) => r.status === "REVIEW");
  const academicStatus: CheckStatus = passed ? "PASS" : review ? "REVIEW" : "FAIL";

  const base = {
    programmeId: ruleSet.programmeId,
    programmeName: ruleSet.programmeName,
    ruleSet: ruleSet.meta,
  };

  if (academicStatus === "FAIL") {
    const nearest = [...routes].sort((x, y) => failCount(x) - failCount(y))[0];
    return {
      ...base,
      outcome: "NOT_ELIGIBLE",
      academic: { status: "FAIL", routes, ...(nearest ? { nearestRoute: nearest.routeId } : {}) },
      documents: { required: [], missing: [] },
      holdReasons: [],
    };
  }

  const chosen = passed ?? review!;
  const required = [...new Set([...ruleSet.documents.common, ...(ruleSet.documents.byRoute[chosen.routeId] ?? [])])];
  const submitted = new Set(applicant.documents);
  const missing = required.filter((d) => !submitted.has(d));

  const holdReasons: HoldReason[] = [];
  if (academicStatus === "REVIEW") holdReasons.push("MANUAL_REVIEW");
  if (missing.length > 0) holdReasons.push("MISSING_DOCUMENTS");
  const outcome: Outcome = holdReasons.length > 0 ? "ON_HOLD" : "ELIGIBLE";

  return {
    ...base,
    outcome,
    academic: { status: academicStatus, routes, ...(passed ? { passedRoute: passed.routeId } : {}) },
    documents: { required, missing },
    holdReasons,
    ...(ruleSet.weighting && applicant.uace.length > 0 ? { score: computeWeightedScore(applicant, ruleSet.weighting) } : {}),
  };
}

function failCount(r: RouteResult): number {
  return r.checks.filter((c) => c.status === "FAIL").length;
}

/** Screen one applicant against many programmes. Eligibility is per programme. */
export function screenAll(applicant: Applicant, ruleSets: RuleSet[]): ScreeningResult[] {
  return ruleSets.map((rs) => screen(applicant, rs));
}
