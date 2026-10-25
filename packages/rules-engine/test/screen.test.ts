import { describe, expect, it } from "vitest";
import { screen } from "../src";
import { ALL_DOCS, applicant, principal, rs, rsUnmapped, subsidiary, uceSubject, uce8 } from "./helpers";

const csDocs = ["NATIONAL_ID", "UACE_RESULT_SLIP"];
const twoPasses = [principal("Mathematics", "A"), principal("Physics", "B")];

describe("two-stage order and outcomes (bachelors)", () => {
  it("ELIGIBLE when academics pass and documents are complete", () => {
    const r = screen(applicant({ uace: twoPasses, documents: csDocs }), rs("umu-bsc-cs"));
    expect(r.outcome).toBe("ELIGIBLE");
    expect(r.academic.passedRoute).toBe("UACE_DIRECT");
    expect(r.documents.missing).toEqual([]);
  });

  it("ON_HOLD with the missing list when academics pass but documents are missing", () => {
    const r = screen(applicant({ uace: twoPasses, documents: ["NATIONAL_ID"] }), rs("umu-bsc-cs"));
    expect(r.outcome).toBe("ON_HOLD");
    expect(r.holdReasons).toEqual(["MISSING_DOCUMENTS"]);
    expect(r.documents.missing).toEqual(["UACE_RESULT_SLIP"]);
  });

  it("NOT_ELIGIBLE, never ON_HOLD, when academics fail and documents are also missing", () => {
    const r = screen(applicant({ uace: [principal("Mathematics", "A")], documents: [] }), rs("umu-bsc-cs"));
    expect(r.outcome).toBe("NOT_ELIGIBLE");
    expect(r.holdReasons).toEqual([]);
    expect(r.documents.missing).toEqual([]);
    const check = r.academic.routes.find((x) => x.routeId === "UACE_DIRECT")!.checks[0]!;
    expect(check.gap).toBe(1);
  });

  it("does not count principal passes spread across sittings", () => {
    const a = applicant({ uace: [principal("Mathematics", "A", "2024"), principal("Physics", "B", "2025")], documents: csDocs });
    const r = screen(a, rs("umu-bsc-cs"));
    expect(r.outcome).toBe("NOT_ELIGIBLE");
    expect(r.academic.nearestRoute).toBeDefined();
  });

  it("a principal subject at grade O or F is not a principal pass", () => {
    const a = applicant({ uace: [principal("Mathematics", "A"), principal("Physics", "O")], documents: csDocs });
    expect(screen(a, rs("umu-bsc-cs")).outcome).toBe("NOT_ELIGIBLE");
  });
});

describe("entry routes", () => {
  const diplomaHolder = (classification: "CREDIT" | "PASS_CLASS") =>
    applicant({ qualifications: [{ type: "DIPLOMA", classification }],
      documents: ["NATIONAL_ID", "DIPLOMA_CERTIFICATE", "DIPLOMA_TRANSCRIPT"] });

  it("qualifies through the DIPLOMA route with no UACE results", () => {
    const r = screen(diplomaHolder("CREDIT"), rs("umu-bsc-cs"));
    expect(r.outcome).toBe("ELIGIBLE");
    expect(r.academic.passedRoute).toBe("DIPLOMA");
    expect(r.score).toBeUndefined();
  });

  it("a pass-class diploma does not qualify", () => {
    expect(screen(diplomaHolder("PASS_CLASS"), rs("umu-bsc-cs")).outcome).toBe("NOT_ELIGIBLE");
  });

  it("required documents follow the route that passed", () => {
    const a = applicant({ qualifications: [{ type: "DIPLOMA", classification: "CREDIT" }], documents: ["NATIONAL_ID"] });
    const r = screen(a, rs("umu-bsc-cs"));
    expect(r.outcome).toBe("ON_HOLD");
    expect(r.documents.missing).toEqual(["DIPLOMA_CERTIFICATE", "DIPLOMA_TRANSCRIPT"]);
  });

  it("qualifies through the access programme route", () => {
    const a = applicant({ qualifications: [{ type: "HEAC", classification: "CREDIT" }], documents: ["NATIONAL_ID", "HEAC_CERTIFICATE"] });
    expect(screen(a, rs("umu-bsc-cs")).academic.passedRoute).toBe("HIGHER_EDUCATION_ACCESS");
  });
});

describe("programme conditions adopted from the public-university rules", () => {
  const base = { uace: twoPasses, documents: csDocs };
  it("Accounting and Finance fails without a Maths credit", () => {
    const a = applicant({ ...base, uce: [uceSubject("Mathematics", "P8")] });
    expect(screen(a, rs("umu-acct-finance")).outcome).toBe("NOT_ELIGIBLE");
  });
  it("passes with a UCE Mathematics credit", () => {
    const a = applicant({ ...base, uce: [uceSubject("Mathematics", "C5")] });
    expect(screen(a, rs("umu-acct-finance")).outcome).toBe("ELIGIBLE");
  });
  it("passes with a Sub-Maths credit at A-level", () => {
    const a = applicant({ ...base, uace: [...twoPasses, subsidiary("Sub-Maths", "C4")] });
    expect(screen(a, rs("umu-acct-finance")).outcome).toBe("ELIGIBLE");
  });
  it("goes ON_HOLD for manual review when there is no data to check", () => {
    const r = screen(applicant(base), rs("umu-acct-finance"));
    expect(r.outcome).toBe("ON_HOLD");
    expect(r.holdReasons).toContain("MANUAL_REVIEW");
  });
});

describe("other levels use UMU general entry only", () => {
  const dipIt = () => rsUnmapped("umu-dip-it", "Diploma in Information Technology", "diploma");
  const diplomaApplicant = applicant({
    uace: [principal("Mathematics", "D"), subsidiary("General Paper", "C4"), subsidiary("Sub-Maths", "C6")],
    uce: ["English", "Mathematics", "Physics", "Biology", "History"].map((s) => uceSubject(s, "C5")),
    documents: ["NATIONAL_ID", "UACE_RESULT_SLIP", "UCE_RESULT_SLIP"],
  });

  it("diploma: counts pass, but relevance of subjects needs manual review", () => {
    const r = screen(diplomaApplicant, dipIt());
    expect(r.outcome).toBe("ON_HOLD");
    expect(r.holdReasons).toEqual(["MANUAL_REVIEW"]);
    expect(r.ruleSet.status).toBe("official");
  });
  it("diploma: too few subsidiary passes is a definite failure", () => {
    const a = { ...diplomaApplicant, uace: [principal("Mathematics", "D")] };
    expect(screen(a, dipIt()).outcome).toBe("NOT_ELIGIBLE");
  });
  it("certificate: 5 UCE passes at one sitting", () => {
    const cert = rsUnmapped("umu-cert-ca", "Certificate in Computer Applications", "certificate");
    const five = ["English", "Mathematics", "Physics", "Biology", "History"].map((s) => uceSubject(s, "P8"));
    expect(screen(applicant({ uce: five, documents: ["NATIONAL_ID", "UCE_RESULT_SLIP"] }), cert).outcome).toBe("ELIGIBLE");
    expect(screen(applicant({ uce: five.slice(0, 4), documents: [] }), cert).outcome).toBe("NOT_ELIGIBLE");
    const split = [...five.slice(0, 3), ...five.slice(3).map((r) => ({ ...r, sitting: "2024" }))];
    expect(screen(applicant({ uce: split }), cert).outcome).toBe("NOT_ELIGIBLE");
  });
});

describe("open decision: 5 UCE passes for degrees (option)", () => {
  const four = ["English", "Mathematics", "Physics", "Biology"].map((s) => uceSubject(s, "C5"));
  const a = applicant({ uace: twoPasses, uce: four, documents: csDocs });
  it("is not required by default (matches the UMU brochure)", () => {
    expect(screen(a, rs("umu-bsc-cs")).outcome).toBe("ELIGIBLE");
  });
  it("is enforced when the option is on", () => {
    expect(screen(a, rs("umu-bsc-cs", { requireUceForDegrees: true })).outcome).toBe("NOT_ELIGIBLE");
  });
  it("excludes overall UCE grade 9 when the option is on", () => {
    const six = [...four, uceSubject("History", "C5"), uceSubject("Geography", "C6")];
    const r = screen({ ...a, uce: six, uceOverallGrade: "9", documents: [...csDocs, "UCE_RESULT_SLIP"] }, rs("umu-bsc-cs", { requireUceForDegrees: true }));
    expect(r.outcome).toBe("NOT_ELIGIBLE");
  });
});

describe("rule set provenance", () => {
  it("adopted rules are labelled adopted-proxy with approval pending", () => {
    const r = screen(applicant({ uace: twoPasses, documents: csDocs }), rs("umu-bsc-cs"));
    expect(r.ruleSet.status).toBe("adopted-proxy");
    expect(r.ruleSet.approval).toMatch(/pending/i);
    expect(r.ruleSet.edition).toBe("2026/2027");
  });
});

describe("invariants", () => {
  const sittings = ["2024", "2025"];
  const grid = [] as ReturnType<typeof applicant>[];
  for (const n of [0, 1, 2, 3])
    for (const split of [false, true])
      for (const docs of [[], ["NATIONAL_ID"], ALL_DOCS])
        for (const dip of [false, true]) {
          const uace = Array.from({ length: n }, (_, i) =>
            principal(["Mathematics", "Physics", "Economics"][i]!, "C", split ? sittings[i % 2]! : "2025"));
          grid.push(applicant({ uace, documents: docs,
            qualifications: dip ? [{ type: "DIPLOMA", classification: "CREDIT" }] : [] }));
        }
  const programmes = ["umu-bsc-cs", "umu-acct-finance", "umu-llb", "umu-bsc-education"].map((id) => rs(id));

  it("is deterministic", () => {
    for (const a of grid) for (const p of programmes)
      expect(screen(a, p)).toEqual(screen(a, p));
  });

  it("a definite academic failure is never ON_HOLD and has at least one failed check", () => {
    for (const a of grid) for (const p of programmes) {
      const r = screen(a, p);
      if (r.outcome === "NOT_ELIGIBLE") {
        expect(r.holdReasons).toEqual([]);
        expect(r.academic.routes.some((rt) => rt.checks.some((c) => c.status === "FAIL"))).toBe(true);
      }
    }
  });

  it("ON_HOLD for documents has a non-empty missing list; ELIGIBLE has none", () => {
    for (const a of grid) for (const p of programmes) {
      const r = screen(a, p);
      if (r.holdReasons.includes("MISSING_DOCUMENTS")) expect(r.documents.missing.length).toBeGreaterThan(0);
      if (r.outcome === "ELIGIBLE") expect(r.documents.missing).toEqual([]);
    }
  });

  it("adding documents never worsens an outcome", () => {
    const rank = { NOT_ELIGIBLE: 0, ON_HOLD: 1, ELIGIBLE: 2 } as const;
    for (const a of grid) for (const p of programmes) {
      const before = screen(a, p).outcome;
      const after = screen({ ...a, documents: ALL_DOCS }, p).outcome;
      expect(rank[after]).toBeGreaterThanOrEqual(rank[before]);
    }
  });
});

describe("every mapped programme compiles and screens", () => {
  it("does not throw for the standard applicant", async () => {
    const { data } = await import("./helpers");
    const a = applicant({ uace: [...twoPasses, subsidiary("General Paper", "C4")], uce: uce8(), documents: ALL_DOCS });
    for (const m of data.mapping.mapped) {
      const r = screen(a, rs(m.id));
      expect(["ELIGIBLE", "NOT_ELIGIBLE", "ON_HOLD"]).toContain(r.outcome);
    }
  });
});
