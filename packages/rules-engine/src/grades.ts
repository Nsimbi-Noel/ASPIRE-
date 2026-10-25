import type { Applicant, Classification, UaceResult } from "./types";

export const PRINCIPAL_PASS = new Set(["A", "B", "C", "D", "E"]);
export const O_PASS = new Set(["D1", "D2", "C3", "C4", "C5", "C6", "P7", "P8"]);
/** Distinction or Credit. Also the "subsidiary pass" range in the 2026/27 notes. */
export const CREDIT_OR_BETTER = new Set(["D1", "D2", "C3", "C4", "C5", "C6"]);
/** O-level grade weights in tenths, to keep arithmetic exact. */
export const O_WEIGHT_TENTHS: Record<string, number> = {
  D1: 3, D2: 3, C3: 2, C4: 2, C5: 2, C6: 2, P7: 1, P8: 1, F9: 0,
};

const ALIASES: Record<string, string> = {
  maths: "mathematics", math: "mathematics",
  "subsidiary mathematics": "sub-maths", "sub maths": "sub-maths", "sub-math": "sub-maths",
  "subsidiary ict": "computer studies", "sub-ict": "computer studies", ict: "computer studies",
  gp: "general paper",
};

/** Lower-case, trim, and map common aliases. Replace with UNEB subject codes later. */
export function normSubject(s: string): string {
  const k = s.trim().toLowerCase();
  return ALIASES[k] ?? k;
}

export function principalPasses(a: Applicant): UaceResult[] {
  return a.uace.filter((r) => r.level === "PRINCIPAL" && PRINCIPAL_PASS.has(r.grade));
}

export function subsidiaryPassCount(a: Applicant): number {
  const subsidiary = a.uace.filter((r) => r.level === "SUBSIDIARY" && CREDIT_OR_BETTER.has(r.grade)).length;
  const principalAtO = a.uace.filter((r) => r.level === "PRINCIPAL" && r.grade === "O").length;
  return subsidiary + principalAtO;
}

/** The largest number of items from any single sitting. */
export function bestSittingCount<T extends { sitting: string }>(items: T[]): { count: number; sitting?: string } {
  const bySitting = new Map<string, number>();
  for (const i of items) bySitting.set(i.sitting, (bySitting.get(i.sitting) ?? 0) + 1);
  let best = { count: 0 } as { count: number; sitting?: string };
  for (const [sitting, count] of [...bySitting.entries()].sort()) {
    if (count > best.count) best = { count, sitting };
  }
  return best;
}

export const CREDIT_CLASSES: Classification[] = ["DISTINCTION", "CREDIT", "FIRST_CLASS", "SECOND_CLASS"];
export const HEAC_CLASSES: Classification[] = ["DISTINCTION", "CREDIT"];
