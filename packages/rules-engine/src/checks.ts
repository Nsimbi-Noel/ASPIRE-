import type { Applicant, Check, Rule } from "./types";
import {
  CREDIT_OR_BETTER, O_PASS, bestSittingCount, normSubject, principalPasses, subsidiaryPassCount,
} from "./grades";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "es"}`;

function countCheck(rule: Rule, expected: number, actual: number, label: string, detail = ""): Check {
  return {
    ruleId: rule.id,
    type: rule.type,
    status: actual >= expected ? "PASS" : "FAIL",
    expected: `at least ${expected} ${label}`,
    actual: `${actual} ${label}${detail}`,
    gap: Math.max(0, expected - actual),
  };
}

export function evaluateRule(rule: Rule, a: Applicant): Check {
  switch (rule.type) {
    case "MIN_PRINCIPAL_PASSES": {
      const passes = principalPasses(a);
      if (rule.sameSitting) {
        const best = bestSittingCount(passes);
        return countCheck(rule, rule.count, best.count, "principal passes at one sitting",
          best.sitting ? ` (${best.sitting})` : "");
      }
      return countCheck(rule, rule.count, passes.length, "principal passes");
    }
    case "MIN_SUBSIDIARY_PASSES":
      return countCheck(rule, rule.count, subsidiaryPassCount(a), "subsidiary passes");
    case "MIN_UCE_PASSES": {
      const passes = a.uce.filter((r) => O_PASS.has(r.grade));
      if (rule.sameSitting) {
        const best = bestSittingCount(passes);
        return countCheck(rule, rule.count, best.count, "UCE passes at one sitting",
          best.sitting ? ` (${best.sitting})` : "");
      }
      return countCheck(rule, rule.count, passes.length, "UCE passes");
    }
    case "HAS_UCE_RESULTS":
      return {
        ruleId: rule.id, type: rule.type,
        status: a.uce.length > 0 ? "PASS" : "FAIL",
        expected: "UCE results", actual: a.uce.length > 0 ? "UCE results present" : "no UCE results",
      };
    case "QUALIFICATION_CLASS_AT_LEAST": {
      const q = a.qualifications.find((x) => x.type === rule.qualification);
      const base = { ruleId: rule.id, type: rule.type, expected: rule.label };
      if (!q) return { ...base, status: "FAIL", actual: `no ${rule.qualification.toLowerCase()} held` };
      if (!rule.accepted.includes(q.classification))
        return { ...base, status: "FAIL", actual: q.classification };
      if (rule.requireRelated) {
        if (q.relatedToProgramme === undefined)
          return { ...base, status: "REVIEW", actual: `${q.classification}; relevance to programme not yet judged` };
        if (!q.relatedToProgramme)
          return { ...base, status: "FAIL", actual: `${q.classification}; not in a related field` };
      }
      return { ...base, status: "PASS", actual: q.classification };
    }
    case "SUBJECTS_RELEVANT_TO_PROGRAMME":
      return {
        ruleId: rule.id, type: rule.type, status: "REVIEW",
        expected: "passes in subjects relevant to the programme",
        actual: "cannot be checked automatically: no subject list for this programme",
      };
    case "MATHS_CREDIT_REQUIREMENT": {
      const subMaths = a.uace.find((r) => r.level === "SUBSIDIARY" && normSubject(r.subject) === "sub-maths");
      const uceMaths = a.uce.find((r) => normSubject(r.subject) === "mathematics");
      const expected = "Credit or better in Sub-Maths (A-level) or Mathematics (UCE)";
      const ok = (subMaths && CREDIT_OR_BETTER.has(subMaths.grade)) || (uceMaths && CREDIT_OR_BETTER.has(uceMaths.grade));
      if (ok) return { ruleId: rule.id, type: rule.type, status: "PASS", expected, actual: "requirement met" };
      if (a.uce.length === 0 && !subMaths)
        return { ruleId: rule.id, type: rule.type, status: "REVIEW", expected, actual: "no UCE or Sub-Maths results to check" };
      return {
        ruleId: rule.id, type: rule.type, status: "FAIL", expected,
        actual: `Sub-Maths ${subMaths ? subMaths.grade : "not taken"}; UCE Mathematics ${uceMaths ? uceMaths.grade : "not taken"}`,
      };
    }
    case "OLEVEL_OVERALL_GRADE_NOT_IN": {
      const expected = `overall UCE grade not in ${rule.grades.join(", ")}`;
      if (a.uceOverallGrade === undefined)
        return { ruleId: rule.id, type: rule.type, status: "REVIEW", expected, actual: "overall UCE grade not recorded" };
      const bad = rule.grades.includes(a.uceOverallGrade.toUpperCase());
      return { ruleId: rule.id, type: rule.type, status: bad ? "FAIL" : "PASS", expected, actual: `overall grade ${a.uceOverallGrade}` };
    }
  }
}
