import { describe, expect, it } from "vitest";
import { screen } from "../src";
import { applicant, principal, rs, subsidiary, uce8, ALL_DOCS } from "./helpers";

const score = (a: ReturnType<typeof applicant>, id: string) => screen({ ...a, documents: ALL_DOCS }, rs(id)).score!;

describe("weighted score (hand-worked)", () => {
  it("BSc Computer Science: 18 + 15 + 8 + 2 + 1.8 = 44.8", () => {
    const a = applicant({
      uace: [principal("Mathematics", "A"), principal("Physics", "B"), principal("Economics", "C"),
        subsidiary("General Paper", "D1"), subsidiary("Computer Studies", "C4")],
      uce: uce8(),
    });
    const s = score(a, "umu-bsc-cs");
    expect(s.alevel).toBe(41);
    expect(s.desirable).toBe(2);
    expect(s.olevel).toBe(1.8);
    expect(s.total).toBe(44.8);
    expect(s.lines.filter((l) => l.category === "essential").map((l) => l.subject)).toEqual(["Mathematics", "Physics"]);
  });

  it("a subsidiary-level pass in a principal subject (grade O) can be Relevant but not Essential", () => {
    const a = applicant({ uace: [principal("Mathematics", "A"), principal("Physics", "O"), principal("Biology", "E")] });
    const s = score(a, "umu-bsc-cs");
    // Mathematics 6x3 + Biology 2x3 (essential) + Physics 1x2 (relevant)
    expect(s.total).toBe(18 + 6 + 2);
    expect(s.lines.find((l) => l.subject === "Physics")!.category).toBe("relevant");
  });

  it("weights at most three principal subjects", () => {
    const a = applicant({ uace: ["Mathematics", "Physics", "Chemistry", "Biology"].map((s) => principal(s, "A")) });
    const s = score(a, "umu-bsc-cs");
    expect(s.lines).toHaveLength(3);
    expect(s.total).toBe(18 + 18 + 12);
  });

  it("picks the best variant (BSc with Education: biological beats physical)", () => {
    const a = applicant({ uace: [principal("Biology", "A"), principal("Chemistry", "B"), principal("Physics", "C")] });
    const s = score(a, "umu-bsc-education");
    expect(s.variant).toBe("biological");
    expect(s.total).toBe(18 + 15 + 8);
  });

  it("O-level weight uses exact tenths", () => {
    const a = applicant({ uace: [principal("Mathematics", "A"), principal("Physics", "B")], uce: uce8() });
    expect(score(a, "umu-bsc-cs").olevel).toBe(1.8);
  });

  it("no score is produced for a definite academic failure", () => {
    const a = applicant({ uace: [principal("Mathematics", "A")], uce: uce8(), documents: ALL_DOCS });
    const r = screen(a, rs("umu-bsc-cs"));
    expect(r.outcome).toBe("NOT_ELIGIBLE");
    expect(r.score).toBeUndefined();
  });

  it("the score never changes the outcome", () => {
    const low = applicant({ uace: [principal("History", "E"), principal("Geography", "E")], documents: ALL_DOCS });
    const high = applicant({ uace: [principal("History", "A"), principal("Geography", "A")], documents: ALL_DOCS });
    const p = rs("umu-social-work");
    expect(screen(low, p).outcome).toBe("ELIGIBLE");
    expect(screen(high, p).outcome).toBe("ELIGIBLE");
    expect(screen(high, p).score!.total).toBeGreaterThan(screen(low, p).score!.total);
  });
});
