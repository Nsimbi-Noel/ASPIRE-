import type { Applicant, ScoreLine, Selector, SubjectList, UaceResult, WeightedScore, Weighting, WeightVariant } from "./types";
import { CREDIT_OR_BETTER, O_WEIGHT_TENTHS, PRINCIPAL_PASS, normSubject } from "./grades";

const MAX_WEIGHTED_PRINCIPALS = 3;
const MAX_ESSENTIAL = 2;

interface Candidate { r: UaceResult; points: number }

/**
 * Combined weight under the adopted public-universities system. Advisory: used for ranking and fit,
 * never for eligibility (UMU has no cut-off).
 */
export function computeWeightedScore(a: Applicant, w: Weighting): WeightedScore {
  const results = w.variants.map((v) => scoreVariant(a, w, v));
  // Best variant wins (for example BSc Education has biological, physical and economics options).
  results.sort((x, y) => y.total - x.total);
  const best = results[0]!;
  if (w.variants.length > 1) best.warnings.push(`Best of ${w.variants.length} variants: ${best.variant}`);
  return best;
}

function scoreVariant(a: Applicant, w: Weighting, v: WeightVariant): WeightedScore {
  const { category_weights: cw, alevel_points: pts } = w.system;
  const warnings: string[] = [];
  const lines: ScoreLine[] = [];
  const used = new Set<string>();
  let essentialCount = 0;
  let weighted = 0;

  const principals: Candidate[] = a.uace
    .filter((r) => r.level === "PRINCIPAL")
    .map((r) => ({ r, points: pts[r.grade] ?? 0 }))
    .filter((c) => c.points > 0);

  const isPass = (c: Candidate) => PRINCIPAL_PASS.has(c.r.grade); // essential needs a principal pass
  const key = (c: Candidate) => normSubject(c.r.subject);

  const pool = (from: SubjectList, eligible: (c: Candidate) => boolean): Candidate[] => {
    let list = principals.filter((c) => !used.has(key(c)) && eligible(c));
    if (Array.isArray(from)) {
      const names = new Set(from.map(normSubject));
      list = list.filter((c) => names.has(key(c)));
    } else if (from === "REMAINING_EXCLUDING_FINE_ART") {
      list = list.filter((c) => key(c) !== "fine art");
    } else if (from === "ALL_ARTS_SUBJECTS") {
      warnings.push("ALL_ARTS_SUBJECTS treated as all remaining subjects: no arts subject list in the source");
    }
    return list.sort((x, y) => y.points - x.points || key(x).localeCompare(key(y)));
  };

  const take = (c: Candidate, category: "essential" | "relevant") => {
    used.add(key(c));
    weighted += 1;
    if (category === "essential") essentialCount += 1;
    const weight = cw[category];
    lines.push({ subject: c.r.subject, grade: c.r.grade, category, points: c.points, weight, contribution: c.points * weight });
  };

  // Essential: principal passes only, at most two subjects.
  for (const s of v.essential) {
    const room = Math.min(MAX_ESSENTIAL - essentialCount, MAX_WEIGHTED_PRINCIPALS - weighted);
    if (room <= 0) break;
    for (const c of pickFor(s, room, pool, isPass)) take(c, "essential");
  }
  // Relevant: a subsidiary-level pass in a principal subject (grade O) may count here.
  for (const s of v.relevant) {
    const room = MAX_WEIGHTED_PRINCIPALS - weighted;
    if (room <= 0) break;
    for (const c of pickFor(s, room, pool, () => true)) take(c, "relevant");
  }

  // Desirable: one point for each Distinction or Credit in a listed subsidiary subject.
  const desirableNames = new Set(v.desirable.map(normSubject));
  let desirable = 0;
  for (const r of a.uace) {
    if (r.level === "SUBSIDIARY" && desirableNames.has(normSubject(r.subject)) && CREDIT_OR_BETTER.has(r.grade)) {
      desirable += 1;
      lines.push({ subject: r.subject, grade: r.grade, category: "desirable", points: 1, weight: cw.desirable, contribution: cw.desirable });
    }
  }

  const alevel = lines.filter((l) => l.category !== "desirable").reduce((s, l) => s + l.contribution, 0);
  const olevelTenths = a.uce.reduce((s, r) => s + (O_WEIGHT_TENTHS[r.grade] ?? 0), 0);
  const olevel = olevelTenths / 10;
  const total = Math.round((alevel + desirable * cw.desirable) * 10 + olevelTenths) / 10;
  return { total, alevel, desirable, olevel, variant: v.id, lines, warnings };
}

function pickFor(
  s: Selector,
  room: number,
  pool: (from: SubjectList, eligible: (c: Candidate) => boolean) => Candidate[],
  eligible: (c: Candidate) => boolean,
): Candidate[] {
  switch (s.type) {
    case "REQUIRED":
      return pool(s.subjects, eligible).slice(0, room);
    case "ANY_OR_BOTH":
      return pool(s.subjects, eligible).slice(0, Math.min(2, room));
    case "BEST_OF": {
      // "One or two better done" is resolved by the cap of three weighted principals overall.
      const n = s.n ?? s.n_max ?? 1;
      return pool(s.from, eligible).slice(0, Math.min(n, room));
    }
  }
}
