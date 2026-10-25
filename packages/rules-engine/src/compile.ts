import type { Level, Route, Rule, RuleSet, Selector, Weighting, WeightVariant } from "./types";
import { CREDIT_CLASSES, HEAC_CLASSES } from "./grades";

// ---- Shapes of the JSON files in data/rules (only the parts the compiler reads) ----
interface RawRule { type: string; [k: string]: unknown }
interface RawRoute { id: string; rules: RawRule[] }
export interface RulesData {
  entry: { id: string; source: { document: string }; levels: Record<string, { routes: RawRoute[] }> };
  weightingSystem: {
    id: string; status: string; approval: string;
    category_weights: { essential: number; relevant: number; desirable: number };
    alevel_points: Record<string, number>;
    source: { title: string };
  };
  programmeWeights: { rules: RawWeightRule[] };
  mapping: { mapped: { id: string; umu_programme: string; level: string; rules: { rule: string; role: string }[] }[] };
}
interface RawWeightRule {
  id: string; programme: string;
  source: { institution: string; edition: string; section: string };
  essential?: Selector[]; relevant?: Selector[]; desirable?: string[];
  variants?: { id: string; essential: Selector[]; relevant: Selector[]; desirable: string[] }[];
  special_requirements: { type: string; text?: string }[];
}

export interface BuildOptions {
  /**
   * Open decision (see docs/DECISIONS.md #11). The brochure states 5 UCE passes only for diploma and certificate.
   * When true, degree programmes also require 5 UCE passes at one sitting and exclude overall grades 7, 9, X, Y, Z.
   */
  requireUceForDegrees?: boolean;
}

const SUPPORTED_LEVELS: Level[] = ["bachelors", "diploma", "certificate", "higher_education_certificate"];

const DEFAULT_DOCUMENTS: Record<Level, { common: string[]; byRoute: Record<string, string[]> }> = {
  bachelors: { common: ["NATIONAL_ID"], byRoute: {
    UACE_DIRECT: ["UACE_RESULT_SLIP"], DIPLOMA: ["DIPLOMA_CERTIFICATE", "DIPLOMA_TRANSCRIPT"], HIGHER_EDUCATION_ACCESS: ["HEAC_CERTIFICATE"] } },
  diploma: { common: ["NATIONAL_ID"], byRoute: {
    UACE: ["UACE_RESULT_SLIP", "UCE_RESULT_SLIP"], CERTIFICATE_HOLDER: ["CERTIFICATE", "UCE_RESULT_SLIP"] } },
  certificate: { common: ["NATIONAL_ID"], byRoute: { UCE: ["UCE_RESULT_SLIP"] } },
  higher_education_certificate: { common: ["NATIONAL_ID"], byRoute: { UACE: ["UACE_RESULT_SLIP", "UCE_RESULT_SLIP"] } },
};

function translateRoute(raw: RawRoute): Route {
  const sameSittingFlag = raw.rules.some((r) => r.type === "SAME_SITTING");
  const rules: Rule[] = [];
  raw.rules.forEach((r, i) => {
    const id = `${raw.id}:${r.type}:${i}`;
    switch (r.type) {
      case "SAME_SITTING": return; // folded into MIN_PRINCIPAL_PASSES
      case "MIN_PRINCIPAL_PASSES":
        rules.push({ id, type: r.type, count: r["count"] as number, sameSitting: sameSittingFlag }); return;
      case "MIN_SUBSIDIARY_PASSES":
        rules.push({ id, type: r.type, count: r["count"] as number }); return;
      case "MIN_UCE_PASSES":
        rules.push({ id, type: r.type, count: r["count"] as number, sameSitting: r["same_sitting"] === true }); return;
      case "UCE_OR_EQUIVALENT":
        rules.push({ id, type: "HAS_UCE_RESULTS" }); return;
      case "SUBJECTS_RELEVANT_TO_PROGRAMME":
        rules.push({ id, type: r.type }); return;
      case "DIPLOMA_CLASS_AT_LEAST":
        rules.push({ id, type: "QUALIFICATION_CLASS_AT_LEAST", qualification: "DIPLOMA", accepted: CREDIT_CLASSES,
          label: String(r["min"]), requireRelated: false }); return;
      case "CERTIFICATE_CLASS_AT_LEAST":
        rules.push({ id, type: "QUALIFICATION_CLASS_AT_LEAST", qualification: "CERTIFICATE", accepted: CREDIT_CLASSES,
          label: `${String(r["min"])} in a related field`, requireRelated: true }); return;
      case "HEAC_GRADE_AT_LEAST":
        rules.push({ id, type: "QUALIFICATION_CLASS_AT_LEAST", qualification: "HEAC", accepted: HEAC_CLASSES,
          label: String(r["min"]), requireRelated: false }); return;
      default:
        throw new Error(`Unsupported rule type in route ${raw.id}: ${r.type}`);
    }
  });
  return { id: raw.id, rules };
}

export function buildRuleSet(
  data: RulesData,
  args: { programmeId: string; programmeName?: string; level?: Level; options?: BuildOptions },
): RuleSet {
  const options = args.options ?? {};
  const mapped = data.mapping.mapped.find((m) => m.id === args.programmeId);
  const name = mapped?.umu_programme ?? args.programmeName;
  const level = (mapped?.level ?? args.level) as Level | undefined;
  if (!name || !level) throw new Error(`Unknown programme "${args.programmeId}": pass programmeName and level`);
  if (!SUPPORTED_LEVELS.includes(level))
    throw new Error(`Level "${level}" is not supported yet (postgraduate screening is out of scope for v1)`);

  const rawLevel = data.entry.levels[level];
  if (!rawLevel) throw new Error(`No entry requirements for level "${level}"`);
  const routes = rawLevel.routes.map(translateRoute);
  const notes: string[] = [
    "Required documents are an assumed default; UMU has not published a document list.",
  ];
  const documents = structuredClone(DEFAULT_DOCUMENTS[level]);

  // Programme-specific rules adopted from the public-universities system.
  const primary = mapped?.rules.find((r) => r.role === "primary");
  const weightRule = primary ? data.programmeWeights.rules.find((w) => w.id === primary.rule) : undefined;
  const uaceDirect = routes.find((r) => r.id === "UACE_DIRECT");

  if (weightRule) {
    for (const s of weightRule.special_requirements) {
      if (s.type === "MATHS_CREDIT_REQUIREMENT" && uaceDirect)
        uaceDirect.rules.push({ id: `UACE_DIRECT:MATHS_CREDIT_REQUIREMENT:programme`, type: "MATHS_CREDIT_REQUIREMENT" });
      else if (s.type === "PRE_ENTRY_EXAM")
        notes.push(`Not enforced: ${s.text ?? "pre-entry examination"}`);
    }
    const sourceNote = weightRule.source.institution + " " + weightRule.source.edition;
    if (weightRule.source.edition !== "2026/2027") notes.push(`Weights from an older edition: ${sourceNote}`);
  }

  if (options.requireUceForDegrees && level === "bachelors" && uaceDirect) {
    uaceDirect.rules.push(
      { id: "UACE_DIRECT:MIN_UCE_PASSES:adopted", type: "MIN_UCE_PASSES", count: 5, sameSitting: true },
      { id: "UACE_DIRECT:OLEVEL_OVERALL_GRADE_NOT_IN:adopted", type: "OLEVEL_OVERALL_GRADE_NOT_IN", grades: ["7", "9", "X", "Y", "Z"] },
    );
    documents.byRoute["UACE_DIRECT"] = [...(documents.byRoute["UACE_DIRECT"] ?? []), "UCE_RESULT_SLIP"];
    notes.push("Adopted (not in UMU brochure): 5 UCE passes at one sitting and overall UCE grade exclusions for degrees.");
  }

  let weighting: Weighting | undefined;
  if (weightRule) {
    const variants: WeightVariant[] = weightRule.variants
      ? weightRule.variants
      : [{ id: "default", essential: weightRule.essential ?? [], relevant: weightRule.relevant ?? [], desirable: weightRule.desirable ?? [] }];
    weighting = {
      ruleId: weightRule.id,
      system: { category_weights: data.weightingSystem.category_weights, alevel_points: data.weightingSystem.alevel_points },
      variants,
    };
  }

  const adopted = weightRule !== undefined;
  return {
    programmeId: args.programmeId,
    programmeName: name,
    level,
    meta: {
      id: `${args.programmeId}:${adopted ? weightRule!.id : data.entry.id}`,
      status: adopted ? "adopted-proxy" : "official",
      source: adopted
        ? `${data.entry.source.document}; ${data.weightingSystem.source.title} (${weightRule!.source.institution}, ${weightRule!.source.section})`
        : data.entry.source.document,
      edition: "2026/2027",
      approval: adopted ? data.weightingSystem.approval : "published by UMU",
    },
    routes,
    documents,
    ...(weighting ? { weighting } : {}),
    notes,
  };
}
