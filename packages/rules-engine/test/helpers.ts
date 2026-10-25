import type { Applicant, OLevelGrade, PrincipalGrade, RuleSet, UaceResult, UceResult } from "../src";
import { buildRuleSet } from "../src";
import type { BuildOptions, RulesData } from "../src";
import entry from "../../../data/rules/entry-requirements.umu-2026-27.json";
import weightingSystem from "../../../data/rules/weighting-system.public-universities-2026-27.json";
import programmeWeights from "../../../data/rules/programme-weights.2026-27.json";
import mapping from "../../../data/rules/programme-mapping.umu.json";

export const data = { entry, weightingSystem, programmeWeights, mapping } as unknown as RulesData;

export const principal = (subject: string, grade: PrincipalGrade, sitting = "2025"): UaceResult =>
  ({ subject, level: "PRINCIPAL", grade, sitting });
export const subsidiary = (subject: string, grade: OLevelGrade, sitting = "2025"): UaceResult =>
  ({ subject, level: "SUBSIDIARY", grade, sitting });
export const uceSubject = (subject: string, grade: OLevelGrade, sitting = "2023"): UceResult =>
  ({ subject, grade, sitting });

export function applicant(over: Partial<Applicant> = {}): Applicant {
  return { id: "a1", uce: [], uace: [], qualifications: [], documents: [], ...over };
}

export const ALL_DOCS = ["NATIONAL_ID", "UACE_RESULT_SLIP", "UCE_RESULT_SLIP", "DIPLOMA_CERTIFICATE", "DIPLOMA_TRANSCRIPT", "HEAC_CERTIFICATE", "CERTIFICATE"];

export const rs = (programmeId: string, options?: BuildOptions): RuleSet =>
  buildRuleSet(data, { programmeId, ...(options ? { options } : {}) });

export const rsUnmapped = (programmeId: string, programmeName: string, level: RuleSet["level"]): RuleSet =>
  buildRuleSet(data, { programmeId, programmeName, level });

/** Eight UCE subjects: 3 distinctions, 4 credits, 1 pass = 1.8 O-level weight. */
export const uce8 = (): UceResult[] => [
  uceSubject("English", "D1"), uceSubject("Mathematics", "D1"), uceSubject("Physics", "D2"),
  uceSubject("Biology", "C3"), uceSubject("Chemistry", "C4"), uceSubject("History", "C5"),
  uceSubject("Geography", "C6"), uceSubject("Agriculture", "P7"),
];
