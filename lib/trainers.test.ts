import { afterEach, describe, expect, it, vi } from "vitest";
import { trainers, type Question, type TrainerSettings } from "./trainers";

const settings: TrainerSettings = {
  allowNegative: false,
  multiplicationOnly: true,
  tableMin: 2,
  tableMax: 10,
};

const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : Math.abs(a);
const numbers = (text: string) => (text.match(/-?\d+/g) ?? []).map(Number);
const value = (question: Question, index: number) => Number.parseFloat(question.visual.values![index].value);

function expectedAnswer(id: string, question: Question) {
  const [a, b] = numbers(question.prompt);
  switch (id) {
    case "addition-10": return String(a + b);
    case "subtraction-20": return String(a - b);
    case "addition-100":
    case "negative-integers": return String(question.prompt.includes(" + ") ? a + b : a - b);
    case "multiplication-table": return String(question.prompt.includes("×") ? a * b : a / b);
    case "division-table": return String(a / b);
    case "division-remainder": return String(a % b);
    case "powers": return String(a ** (question.prompt.includes("³") ? 3 : 2));
    case "fraction-reduction": return `${a / gcd(a, b)}/${b / gcd(a, b)}`;
    case "greatest-common-divisor": return String(gcd(a, b));
    case "least-common-multiple": return String(a * b / gcd(a, b));
    case "perimeter-area": return String(question.prompt.startsWith("S") ? value(question, 0) * value(question, 1) : 2 * (value(question, 0) + value(question, 1)));
    case "speed-formula":
    case "density-formula":
    case "ohm-law": return String(value(question, 0) / value(question, 1));
    case "vowels-and-consonants": return "AEIOU".includes(question.visual.note!) ? "vowel" : "consonant";
    case "subject-verb-agreement": return ({ she: "reads", they: "read", "the cat": "sleeps", "the cats": "sleep", "our lesson": "starts", "our lessons": "start" } as Record<string, string>)[question.visual.note!];
    case "word-stress": return ({ table: "TAble", doctor: "DOCtor", begin: "beGIN", happy: "HAPpy", hotel: "hoTEL", enjoy: "enJOY" } as Record<string, string>)[question.visual.note!];
    case "english-place-prepositions": return question.prompt.includes("chair") ? "under" : /table|wall/.test(question.prompt) ? "on" : "in";
    case "present-simple-continuous": return question.prompt.includes("Anna") ? "is reading" : question.prompt.includes("Tom") ? "walks" : question.prompt.includes("We") ? "are cooking" : question.prompt.includes("sister") ? "plays" : "is crying";
    case "irregular-verbs": return ({ go: "gone", see: "seen", write: "written", take: "taken", do: "done", speak: "spoken" } as Record<string, string>)[question.prompt.split(" ")[0]];
    default: throw new Error(`No answer check for ${id}`);
  }
}

afterEach(() => vi.restoreAllMocks());

describe("all trainer generators", () => {
  it.each(trainers)("$id produces correct, usable questions across settings", (trainer) => {
    let seed = 123456789;
    vi.spyOn(Math, "random").mockImplementation(() => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    });
    for (const tableMax of [5, 10, 12]) {
      for (const allowNegative of [false, true]) {
        for (const multiplicationOnly of [false, true]) {
          for (let index = 0; index < 80; index += 1) {
            const question = trainer.makeQuestion({ ...settings, tableMax, allowNegative, multiplicationOnly });
            expect(question.answer).toBe(expectedAnswer(trainer.id, question));
            expect(question.story.length).toBeGreaterThan(10);
            expect(question.hint).toBeTruthy();
            expect(question.explanation).toBeTruthy();
            expect(question.visual.title).toBeTruthy();
            if (trainer.inputType === "choice") {
              expect(question.choices).toContain(question.answer);
              expect(new Set(question.choices).size).toBe(question.choices!.length);
            } else {
              expect(question.answer).toMatch(trainer.inputType === "fraction" ? /^\d+\/[1-9]\d*$/ : /^-?\d+$/);
            }
            if (trainer.supportsNegative && !allowNegative) expect(Number(question.answer)).toBeGreaterThanOrEqual(0);
            if (trainer.id === "addition-100") expect(Math.abs(Number(question.answer))).toBeLessThanOrEqual(100);
            if (trainer.id === "multiplication-table" && multiplicationOnly) expect(question.prompt).toContain("×");
            if (trainer.supportsTableRange) {
              const [a, b] = numbers(question.prompt);
              if (question.prompt.includes("×")) {
                expect(a).toBeLessThanOrEqual(tableMax);
                expect(b).toBeLessThanOrEqual(tableMax);
              } else {
                expect(b).toBeLessThanOrEqual(tableMax);
                expect(a / b).toBeLessThanOrEqual(tableMax);
              }
            }
            if (question.visual.kind === "groups") expect(question.visual.tokens).toBe(Number(question.answer));
            if (question.visual.kind === "division" || question.visual.kind === "remainder") expect(question.visual.tokens).toBe(numbers(question.prompt)[0]);
            if (question.visual.kind === "remainder") expect(question.visual.remainder).toBe(Number(question.answer));
            if (question.visual.kind === "cubes") expect(question.visual.tokens! * question.visual.layers!).toBe(Number(question.answer));
          }
        }
      }
    }
  });
});
