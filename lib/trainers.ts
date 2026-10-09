export type Subject = "math" | "physics" | "language-arts" | "english";

export type Accent = "blue" | "green" | "orange" | "purple" | "pink" | "yellow" | "teal" | "sky";

export type VisualKind =
  | "groups"
  | "number-line"
  | "division"
  | "remainder"
  | "geometry"
  | "fraction"
  | "road"
  | "formula"
  | "circuit"
  | "cubes"
  | "scale"
  | "word";

export type QuestionVisual = {
  kind: VisualKind;
  title: string;
  columns?: number;
  fill?: number;
  note?: string;
  token?: string;
  tokens?: number;
  remainder?: number;
  layers?: number;
  min?: number;
  max?: number;
  values?: Array<{ label: string; value: string }>;
};

export type Question = {
  prompt: string;
  answer: string;
  choices?: string[];
  explanation: string;
  story: string;
  hint: string;
  tag?: string;
  unit?: string;
  visual: QuestionVisual;
};

export type Trainer = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  subject: Subject;
  grade: string;
  level: "start" | "easy" | "medium" | "hard";
  accent: Accent;
  icon: string;
  xpTarget: number;
  supportsNegative?: boolean;
  supportsTableRange?: boolean;
  supportsMultiplicationOnly?: boolean;
  inputType?: "integer" | "fraction" | "choice";
  makeQuestion: (settings: TrainerSettings) => Question;
};

export type TrainerSettings = {
  allowNegative: boolean;
  multiplicationOnly: boolean;
  tableMax: number;
  tableMin: number;
};

const pick = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const maybeNegative = (value: number, enabled: boolean) =>
  enabled && Math.random() > 0.55 ? -value : value;

const asSigned = (value: number) => (value < 0 ? `(${value})` : String(value));

const plural = (value: number, forms: [string, string, string]) => value === 1 ? forms[0] : forms[2];

const superscript = (value: number) => {
  const chars: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };

  return String(value)
    .split("")
    .map((char) => chars[char] ?? char)
    .join("");
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x || 1;
};

const shuffle = <T,>(items: T[]) =>
  items
    .map((item) => ({ item, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);

const tableNumber = ({ tableMax, tableMin }: TrainerSettings) => {
  const max = clamp(tableMax, 2, 12);
  return pick(clamp(tableMin, 2, max), max);
};

export const trainers: Trainer[] = [
  {
    id: "addition-10",
    title: "Addition within 10",
    subtitle: "Counting objects from a picture",
    category: "Oral counting",
    subject: "math",
    grade: "Grade 1",
    level: "start",
    accent: "green",
    icon: "+",
    xpTarget: 100,
    makeQuestion: () => {
      const a = pick(1, 6);
      const b = pick(1, 10 - a);

      return {
        prompt: `${a} + ${b} =`,
        answer: String(a + b),
        explanation: `${a} + ${b} = ${a + b}`,
        story: `The corgi had ${a} ${plural(a, ["token", "tokens", "tokens"])} and found ${b} more. How many tokens does he have now?`,
        hint: "Count all the tokens in the picture.",
        tag: "count to 10",
        visual: {
          kind: "groups",
          title: "Corgi dog tags",
          columns: 5,
          tokens: a + b,
          token: "●",
          values: [
            { label: "it was", value: String(a) },
            { label: "added", value: String(b) },
          ],
        },
      };
    },
  },
  {
    id: "subtraction-20",
    title: "Subtraction within 20",
    subtitle: "Removing some items",
    category: "Oral counting",
    subject: "math",
    grade: "Grade 1",
    level: "easy",
    accent: "blue",
    icon: "-",
    xpTarget: 120,
    makeQuestion: () => {
      const a = pick(8, 20);
      const b = pick(1, Math.min(9, a));

      return {
        prompt: `${a} - ${b} =`,
        answer: String(a - b),
        explanation: `${a} - ${b} = ${a - b}`,
        story: `There were ${a} bones on the path. The corgi carried away ${b}. How many are left?`,
        hint: "Move backwards along the number track.",
        tag: "subtraction",
        visual: {
          kind: "number-line",
          title: "Number track",
          min: 0,
          max: 20,
          fill: Math.round(((a - b) / 20) * 100),
          note: `Start at ${a}, move back ${b}`,
          values: [
            { label: "start", value: String(a) },
            { label: "step", value: `-${b}` },
          ],
        },
      };
    },
  },
  {
    id: "addition-100",
    title: "Addition and subtraction up to 100",
    subtitle: "Two-digit numbers without a column",
    category: "Numeric Expressions",
    subject: "math",
    grade: "Grade 2",
    level: "easy",
    accent: "orange",
    icon: "=",
    xpTarget: 160,
    supportsNegative: true,
    makeQuestion: ({ allowNegative }) => {
      const isMinus = Math.random() > 0.5;
      const a = maybeNegative(pick(24, 90), allowNegative);
      const limit = isMinus && !allowNegative ? Math.min(35, a) : Math.min(35, 100 - Math.abs(a));
      const b = maybeNegative(pick(1, limit), allowNegative);
      const answer = isMinus ? a - b : a + b;

      return {
        prompt: `${a} ${isMinus ? "-" : "+"} ${asSigned(b)} =`,
        answer: String(answer),
        explanation: `${a} ${isMinus ? "-" : "+"} ${asSigned(b)} = ${answer}`,
        story: "Build the expression from the cards and calculate its value.",
        hint: "First look at the sign, then work with tens and ones.",
        tag: "up to 100",
        visual: {
          kind: "formula",
          title: "Expression Cards",
          values: [
            { label: "first", value: String(a) },
            { label: "sign", value: isMinus ? "−" : "+" },
            { label: "second", value: String(b) },
          ],
        },
      };
    },
  },
  {
    id: "multiplication-table",
    title: "Multiplication table",
    subtitle: "Instant input without Enter",
    category: "Multiplication and division",
    subject: "math",
    grade: "Grade 2",
    level: "easy",
    accent: "blue",
    icon: "×",
    xpTarget: 300,
    supportsMultiplicationOnly: true,
    supportsTableRange: true,
    makeQuestion: (settings) => {
      const a = tableNumber(settings);
      const b = pick(1, clamp(settings.tableMax, 2, 12));
      const useDivision = !settings.multiplicationOnly && Math.random() > 0.55;

      if (useDivision) {
        const product = a * b;

        return {
          prompt: `${product} ÷ ${a} =`,
          answer: String(b),
          explanation: `${product} ÷ ${a} = ${b}, because ${a} × ${b} = ${product}`,
          story: `Arrange ${product} tokens equally in ${a} rows. How many tokens will be in each row?`,
          hint: "Division is checked by inverse multiplication.",
          tag: `${a} × table`,
          visual: {
            kind: "division",
            title: "Equal rows",
            columns: a,
            tokens: product,
            token: "●",
            values: [
              { label: "total", value: String(product) },
              { label: "rows", value: String(a) },
            ],
          },
        };
      }

      return {
        prompt: `${a} × ${b} =`,
        answer: String(a * b),
        explanation: `${a} × ${b} = ${a * b}`,
        story: `There are ${a} rows of ${b} cards on the shelf. How many cards are there in total?`,
        hint: "You can think of it as adding like groups together.",
        tag: `${a} × table`,
        visual: {
          kind: "groups",
          title: "Rows of cards",
          columns: b,
          tokens: a * b,
          token: "●",
          values: [
            { label: "rows", value: String(a) },
            { label: "in a row", value: String(b) },
          ],
        },
      };
    },
  },
  {
    id: "division-table",
    title: "Division table",
    subtitle: "Whole answers via table",
    category: "Division",
    subject: "math",
    grade: "Grade 3",
    level: "medium",
    accent: "pink",
    icon: "÷",
    xpTarget: 260,
    supportsTableRange: true,
    makeQuestion: (settings) => {
      const divisor = tableNumber(settings);
      const answer = pick(2, clamp(settings.tableMax, 2, 12));
      const dividend = divisor * answer;

      return {
        prompt: `${dividend} ÷ ${divisor} =`,
        answer: String(answer),
        explanation: `${dividend} ÷ ${divisor} = ${answer}`,
        story: `${dividend} ${plural(dividend, ["sticker", "stickers", "stickers"])} need to be distributed evenly. Envelopes: ${divisor}. How many stickers are in each?`,
        hint: "Choose a number that, when multiplied by a divisor, will give the dividend.",
        tag: "division table",
        visual: {
          kind: "division",
          title: "Identical envelopes",
          columns: divisor,
          tokens: dividend,
          token: "●",
          values: [
            { label: "divisible", value: String(dividend) },
            { label: "divider", value: String(divisor) },
          ],
        },
      };
    },
  },
  {
    id: "division-remainder",
    title: "Division with remainder",
    subtitle: "We find the remainder separately",
    category: "Division",
    subject: "math",
    grade: "Grade 3",
    level: "medium",
    accent: "purple",
    icon: "÷",
    xpTarget: 220,
    makeQuestion: () => {
      const divisor = pick(3, 9);
      const quotient = pick(2, 8);
      const remainder = pick(1, divisor - 1);
      const dividend = divisor * quotient + remainder;

      return {
        prompt: `${dividend} ÷ ${divisor}: remainder =`,
        answer: String(remainder),
        explanation: `${dividend} = ${divisor} × ${quotient} + ${remainder}`,
        story: `Share ${dividend} bones equally among ${divisor} bowls. How many bones are left over?`,
        hint: "Find the closest smaller product of the divisor.",
        tag: "remainder",
        visual: {
          kind: "remainder",
          title: "Bowls and remainder",
          columns: divisor,
          tokens: dividend,
          remainder,
          token: "●",
          values: [
            { label: "bowls", value: String(divisor) },
            { label: "will remain", value: "?" },
          ],
        },
      };
    },
  },
  {
    id: "perimeter-area",
    title: "Perimeter and area",
    subtitle: "Rectangle according to the diagram",
    category: "Geometry",
    subject: "math",
    grade: "Grade 4",
    level: "medium",
    accent: "purple",
    icon: "□",
    xpTarget: 240,
    makeQuestion: () => {
      const width = pick(3, 9);
      const height = pick(2, 8);
      const askArea = Math.random() > 0.5;
      const answer = askArea ? width * height : 2 * (width + height);

      return {
        prompt: `${askArea ? "S" : "P"} =`,
        answer: String(answer),
        explanation: askArea
          ? `S = ${width} × ${height} = ${answer}`
          : `P = 2 × (${width} + ${height}) = ${answer}`,
        story: `A rectangular platform has sides ${width} m and ${height} m. Find ${askArea ? "area" : "perimeter"}.`,
        hint: askArea ? "The area is equal to the length times the width." : "The perimeter is equal to the sum of all sides.",
        tag: askArea ? "area" : "perimeter",
        unit: askArea ? "m²" : "m",
        visual: {
          kind: "geometry",
          title: "Venue",
          values: [
            { label: "length", value: `${width} m` },
            { label: "width", value: `${height} m` },
          ],
        },
      };
    },
  },
  {
    id: "powers",
    title: "Powers of number",
    subtitle: "Squares and cubes without confusion",
    category: "Degrees",
    subject: "math",
    grade: "Grade 5",
    level: "medium",
    accent: "yellow",
    icon: "²",
    xpTarget: 260,
    makeQuestion: () => {
      const base = pick(2, 9);
      const power = Math.random() > 0.68 ? 3 : 2;
      const answer = base ** power;

      return {
        prompt: `${base}${superscript(power)} =`,
        answer: String(answer),
        explanation: `${base}${superscript(power)} = ${Array.from({ length: power }, () => base).join(" × ")} = ${answer}`,
        story: power === 2
          ? `The square is made up of ${base} rows by ${base} small squares. How many small squares are there in total?`
          : `The cube consists of ${base} layers. In every layer ${base} rows by ${base} cubes. How many cubes are there in total?`,
        hint: power === 2 ? "The square of a number is obtained by multiplying the number by itself." : "The cube of a number contains three identical factors.",
        tag: power === 2 ? "square" : "cube",
        visual: {
          kind: "cubes",
          title: power === 2 ? "Square" : "One layer cube",
          columns: base,
          tokens: base * base,
          layers: power === 3 ? base : 1,
          token: "■",
          values: [
            { label: "base", value: String(base) },
            { label: "degree", value: String(power) },
          ],
        },
      };
    },
  },
  {
    id: "negative-integers",
    title: "Negative numbers",
    subtitle: "Adding and subtracting integers",
    category: "Integers",
    subject: "math",
    grade: "Grade 6",
    level: "medium",
    accent: "teal",
    icon: "−",
    xpTarget: 220,
    supportsNegative: true,
    makeQuestion: ({ allowNegative }) => {
      let a = pick(-18, 18);
      let b = pick(-12, 12);
      const op = Math.random() > 0.5 ? "+" : "-";
      let answer = op === "+" ? a + b : a - b;

      if (!allowNegative && answer < 0) {
        a = -a;
        b = -b;
        answer = -answer;
      }

      return {
        prompt: `${a} ${op} ${asSigned(b)} =`,
        answer: String(answer),
        explanation: `${a} ${op} ${asSigned(b)} = ${answer}`,
        story: "On a number line, the corgi takes steps left and right.",
        hint: "A minus in front of a negative number changes the direction of the step.",
        tag: "integers",
        visual: {
          kind: "number-line",
          title: "Number line",
          min: -30,
          max: 30,
          fill: Math.round(((answer + 30) / 60) * 100),
          note: `${a} ${op} ${b}`,
          values: [
            { label: "start", value: String(a) },
            { label: "finish", value: "?" },
          ],
        },
      };
    },
  },
  {
    id: "fraction-reduction",
    title: "Reducing Fractions",
    subtitle: "Answer via /, for example 3/5",
    category: "Fractions",
    subject: "math",
    grade: "Grade 6",
    level: "hard",
    accent: "orange",
    icon: "◔",
    xpTarget: 240,
    inputType: "fraction",
    makeQuestion: () => {
      const baseNumerator = pick(1, 8);
      const baseDenominator = pick(baseNumerator + 1, 12);
      const factor = pick(2, 6);
      const numerator = baseNumerator * factor;
      const denominator = baseDenominator * factor;
      const divider = gcd(numerator, denominator);
      const answer = `${numerator / divider}/${denominator / divider}`;

      return {
        prompt: `${numerator}/${denominator} =`,
        answer,
        explanation: `Divide the numerator and denominator by ${divider}: ${answer}`,
        story: `Reduce the fraction ${numerator}/${denominator}, so that parts of the picture remain the same.`,
        hint: "Find the common divisor of the numerator and denominator.",
        tag: "reduction",
        visual: {
          kind: "fraction",
          title: "Share of the whole",
          fill: Math.round((numerator / denominator) * 100),
          values: [
            { label: "numerator", value: String(numerator) },
            { label: "denominator", value: String(denominator) },
          ],
        },
      };
    },
  },
  {
    id: "greatest-common-divisor",
    title: "Greatest common divisor",
    subtitle: "GCD of two natural numbers",
    category: "GCD and NOC",
    subject: "math",
    grade: "Grade 6",
    level: "medium",
    accent: "teal",
    icon: "∩",
    xpTarget: 240,
    makeQuestion: () => {
      const common = pick(2, 8);
      const a = common * pick(2, 7);
      const b = common * pick(2, 7);
      const answer = gcd(a, b);

      return {
        prompt: `GCD(${a}, ${b}) =`,
        answer: String(answer),
        explanation: `Greatest common divisor of numbers ${a} and ${b} equals ${answer}.`,
        story: `Find the largest whole number that divides both ${a} and ${b} with no remainder.`,
        hint: "Factor both numbers into prime factors and take the common part.",
        tag: "GCD",
        visual: {
          kind: "formula",
          title: "Common factors",
          values: [
            { label: "first number", value: String(a) },
            { label: "second number", value: String(b) },
          ],
        },
      };
    },
  },
  {
    id: "least-common-multiple",
    title: "Least common multiple",
    subtitle: "LCM of two natural numbers",
    category: "GCD and NOC",
    subject: "math",
    grade: "Grade 6",
    level: "hard",
    accent: "yellow",
    icon: "∪",
    xpTarget: 260,
    makeQuestion: () => {
      const a = pick(3, 12);
      const b = pick(3, 12);
      const answer = Math.abs(a * b) / gcd(a, b);

      return {
        prompt: `LCM(${a}, ${b}) =`,
        answer: String(answer),
        explanation: `LCM(${a}, ${b}) = ${answer}. It is the first common multiple of two numbers.`,
        story: `Find the smallest positive whole number divisible by both ${a} and ${b}.`,
        hint: "Write down several multiples of each number and find the first match.",
        tag: "LCM",
        visual: {
          kind: "formula",
          title: "Two rows of multiples",
          values: [
            { label: `multiples ${a}`, value: `${a}, ${a * 2}, ${a * 3}…` },
            { label: `multiples ${b}`, value: `${b}, ${b * 2}, ${b * 3}…` },
          ],
        },
      };
    },
  },
  {
    id: "vowels-and-consonants",
    title: "Vowels and consonants",
    subtitle: "Recognize letters in the English alphabet",
    category: "Letters and sounds",
    subject: "language-arts",
    grade: "Grade 1",
    level: "start",
    accent: "green",
    icon: "A",
    xpTarget: 120,
    inputType: "choice",
    makeQuestion: () => {
      const vowels = ["A", "E", "I", "O", "U"];
      const consonants = ["B", "C", "D", "F", "G", "H", "J", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "X", "Z"];
      const isVowel = Math.random() > 0.5;
      const letter = isVowel ? vowels[pick(0, vowels.length - 1)] : consonants[pick(0, consonants.length - 1)];
      const answer = isVowel ? "vowel" : "consonant";
      return {
        prompt: 'The letter "' + letter + '" is a...', answer,
        choices: ["vowel", "consonant"],
        explanation: letter + " is a " + answer + " letter.",
        story: "Sort this letter into its English alphabet group.",
        hint: "A, E, I, O and U are vowel letters. Y depends on the word and is left out of this round.",
        tag: "alphabet", visual: { kind: "word", title: "Letter of the day", note: letter },
      };
    },
  },
  {
    id: "subject-verb-agreement",
    title: "Make the verb agree",
    subtitle: "Match present-simple verbs to their subjects",
    category: "Grammar",
    subject: "language-arts",
    grade: "Grade 5",
    level: "medium",
    accent: "teal",
    icon: "Vs",
    xpTarget: 220,
    inputType: "choice",
    makeQuestion: () => {
      const items = [
        { text: "She ___ every day.", answer: "reads", wrong: "read", subject: "she" },
        { text: "They ___ every day.", answer: "read", wrong: "reads", subject: "they" },
        { text: "The cat ___ under the chair.", answer: "sleeps", wrong: "sleep", subject: "the cat" },
        { text: "The cats ___ under the chair.", answer: "sleep", wrong: "sleeps", subject: "the cats" },
        { text: "Our lesson ___ at nine.", answer: "starts", wrong: "start", subject: "our lesson" },
        { text: "Our lessons ___ at nine.", answer: "start", wrong: "starts", subject: "our lessons" },
      ];
      const item = items[pick(0, items.length - 1)];
      return {
        prompt: item.text, answer: item.answer, choices: shuffle([item.answer, item.wrong]),
        explanation: item.text.replace("___", item.answer),
        story: "Choose the present-simple verb that agrees with the subject.",
        hint: "With he, she, it or one named thing, a regular present-simple verb usually ends in -s.",
        tag: "subject-verb agreement",
        visual: { kind: "word", title: "Find the subject", note: item.subject },
      };
    },
  },
  {
    id: "word-stress",
    title: "Word stress",
    subtitle: "Find the stressed syllable",
    category: "Pronunciation",
    subject: "language-arts",
    grade: "Grade 5",
    level: "medium",
    accent: "orange",
    icon: "Aa",
    xpTarget: 220,
    inputType: "choice",
    makeQuestion: () => {
      const items = [
        { word: "table", answer: "TAble", wrong: "taBLE" },
        { word: "doctor", answer: "DOCtor", wrong: "docTOR" },
        { word: "begin", answer: "beGIN", wrong: "BEgin" },
        { word: "happy", answer: "HAPpy", wrong: "hapPY" },
        { word: "hotel", answer: "hoTEL", wrong: "HOtel" },
        { word: "enjoy", answer: "enJOY", wrong: "ENjoy" },
      ];
      const item = items[pick(0, items.length - 1)];
      return {
        prompt: "Which syllable is stressed in this word?", answer: item.answer,
        choices: shuffle([item.answer, item.wrong]), explanation: "Say " + item.answer + ". The capital letters mark the stressed syllable.",
        story: "Read the word aloud and choose its usual English stress pattern.",
        hint: "Emphasize the syllable shown in capital letters.", tag: "word stress",
        visual: { kind: "word", title: "Read aloud", note: item.word },
      };
    },
  },
  {
    id: "english-place-prepositions",
    title: "In, on or under",
    subtitle: "Prepositions of place in short phrases",
    category: "Prepositions of place",
    subject: "english",
    grade: "Grade 2",
    level: "easy",
    accent: "sky",
    icon: "in",
    xpTarget: 160,
    inputType: "choice",
    makeQuestion: () => {
      const items = [
        { prompt: "The keys are ___ the bag.", answer: "in", clue: "The keys are inside the bag." },
        { prompt: "The cup is ___ the table.", answer: "on", clue: "The cup is on the table surface." },
        { prompt: "The cat is ___ the chair.", answer: "under", clue: "The cat is below the chair." },
        { prompt: "The picture is ___ the wall.", answer: "on", clue: "The picture hangs on the wall." },
        { prompt: "The shoes are ___ the box.", answer: "in", clue: "The shoes are inside the box." },
      ];
      const item = items[pick(0, items.length - 1)];

      return {
        prompt: item.prompt,
        answer: item.answer,
        choices: ["in", "on", "under"],
        explanation: `${item.prompt.replace("___", item.answer)} ${item.clue}`,
        story: "Choose a preposition that accurately describes the position of the object.",
        hint: "in - inside, on - on the surface, under - under the object.",
        tag: "prepositions",
        visual: {
          kind: "word",
          title: "Place words",
          note: "in · on · under",
        },
      };
    },
  },
  {
    id: "present-simple-continuous",
    title: "Present Simple or Continuous",
    subtitle: "Habit or action right now",
    category: "Grammar",
    subject: "english",
    grade: "Grade 5",
    level: "medium",
    accent: "green",
    icon: "am",
    xpTarget: 240,
    inputType: "choice",
    makeQuestion: () => {
      const items = [
        { prompt: "Look! Anna ___ a book now.", answer: "is reading", wrong: "reads", clue: "now shows an action in progress" },
        { prompt: "Tom usually ___ to school.", answer: "walks", wrong: "is walking", clue: "usually shows habit" },
        { prompt: "We ___ dinner at the moment.", answer: "are cooking", wrong: "cook", clue: "at the moment indicates action now" },
        { prompt: "My sister ___ tennis every Friday.", answer: "plays", wrong: "is playing", clue: "every Friday shows regularity" },
        { prompt: "Listen! The baby ___ .", answer: "is crying", wrong: "cries", clue: "Listen! pays attention to the action now" },
      ];
      const item = items[pick(0, items.length - 1)];

      return {
        prompt: item.prompt,
        answer: item.answer,
        choices: shuffle([item.answer, item.wrong]),
        explanation: `${item.prompt.replace("___", item.answer)} — ${item.clue}.`,
        story: "Define: this is a regular action or something that is happening right now.",
        hint: "usually/every — Present Simple; now/look/listen — Present Continuous.",
        tag: "present tenses",
        visual: {
          kind: "word",
          title: "Time marker",
          note: item.prompt.match(/now|usually|at the moment|every Friday|Listen/)?.[0] ?? "context",
        },
      };
    },
  },
  {
    id: "irregular-verbs",
    title: "Irregular verbs",
    subtitle: "Three forms without cramming a list",
    category: "Grammar",
    subject: "english",
    grade: "Grade 5",
    level: "hard",
    accent: "yellow",
    icon: "V3",
    xpTarget: 260,
    inputType: "choice",
    makeQuestion: () => {
      const items = [
        { prompt: "go — went — ?", answer: "gone", distractors: ["goed", "going"] },
        { prompt: "see — saw — ?", answer: "seen", distractors: ["seed", "seeing"] },
        { prompt: "write — wrote — ?", answer: "written", distractors: ["writed", "wrote"] },
        { prompt: "take — took — ?", answer: "taken", distractors: ["taked", "took"] },
        { prompt: "do — did — ?", answer: "done", distractors: ["did", "doed"] },
        { prompt: "speak — spoke — ?", answer: "spoken", distractors: ["speaked", "spoke"] },
      ];
      const item = items[pick(0, items.length - 1)];

      return {
        prompt: item.prompt,
        answer: item.answer,
        choices: shuffle([item.answer, ...item.distractors]),
        explanation: `${item.prompt.replace("?", item.answer)}`,
        story: "Choose the third form of the irregular verb.",
        hint: "The third form is used after have/has and in the passive voice.",
        tag: "irregular verbs",
        visual: {
          kind: "word",
          title: "Verb forms",
          note: item.prompt,
        },
      };
    },
  },
  {
    id: "speed-formula",
    title: "Speed: v=s/t",
    subtitle: "Word problems for movement",
    category: "Formulas",
    subject: "physics",
    grade: "Grade 7",
    level: "easy",
    accent: "sky",
    icon: "▰",
    xpTarget: 180,
    makeQuestion: () => {
      const speed = pick(2, 18);
      const time = pick(2, 9);
      const distance = speed * time;

      return {
        prompt: "v =",
        answer: String(speed),
        explanation: `v = s / t = ${distance} / ${time} = ${speed} m/s`,
        story: `The corgi ran ${distance} m in ${time} s. Find the speed.`,
        hint: "Speed ​​equals distance divided by time.",
        tag: "movement",
        unit: "m/s",
        visual: {
          kind: "road",
          title: "Path",
          fill: 72,
          values: [
            { label: "way", value: `${distance} m` },
            { label: "time", value: `${time} s` },
          ],
        },
      };
    },
  },
  {
    id: "density-formula",
    title: "Density: ρ = m/V",
    subtitle: "Mass, volume, density",
    category: "Formulas",
    subject: "physics",
    grade: "Grade 7",
    level: "medium",
    accent: "teal",
    icon: "⚖",
    xpTarget: 200,
    makeQuestion: () => {
      const density = pick(2, 12);
      const volume = pick(2, 8);
      const mass = density * volume;

      return {
        prompt: "ρ =",
        answer: String(density),
        explanation: `ρ = m / V = ${mass} / ${volume} = ${density} kg/m³`,
        story: `The sample has a mass of ${mass} kg and a volume of ${volume} m³. Find its density.`,
        hint: "Divide the mass by the volume.",
        tag: "density",
        unit: "kg/m³",
        visual: {
          kind: "scale",
          title: "Mass and volume",
          values: [
            { label: "m", value: `${mass} kg` },
            { label: "V", value: `${volume} m³` },
          ],
        },
      };
    },
  },
  {
    id: "ohm-law",
    title: "Ohm's Law: I = U / R",
    subtitle: "Current through voltage and resistance",
    category: "Electricity",
    subject: "physics",
    grade: "Grade 8",
    level: "medium",
    accent: "yellow",
    icon: "I",
    xpTarget: 220,
    makeQuestion: () => {
      const current = pick(1, 12);
      const resistance = pick(2, 12);
      const voltage = current * resistance;

      return {
        prompt: "I =",
        answer: String(current),
        explanation: `I = U / R = ${voltage} / ${resistance} = ${current} A`,
        story: `The circuit has a voltage of ${voltage} V and a resistance of ${resistance} Ω. Find the current.`,
        hint: "According to Ohm's law, current is equal to voltage divided by resistance.",
        tag: "Ohm's law",
        unit: "A",
        visual: {
          kind: "circuit",
          title: "Electric circuit",
          values: [
            { label: "U", value: `${voltage} V` },
            { label: "R", value: `${resistance} Ω` },
          ],
        },
      };
    },
  },
];

export const subjects: Array<{ id: Subject | "all"; label: string }> = [
  { id: "all", label: "All subjects" },
  { id: "math", label: "Mathematics" },
  { id: "language-arts", label: "Language Arts" },
  { id: "english", label: "English" },
  { id: "physics", label: "Physics" },
];

export const grades = [
  "All",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
];

export const durationOptions = [
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "15 min", value: 900 },
  { label: "20 min", value: 1200 },
];

export const questionTimeOptions = [
  { label: "Without timer", value: 0 },
  { label: "5 sec", value: 5 },
  { label: "8 sec", value: 8 },
  { label: "12 sec", value: 12 },
  { label: "15 sec", value: 15 },
  { label: "30 sec", value: 30 },
];

export const tableRangeOptions = [
  { label: "2-5", value: 5 },
  { label: "2-10", value: 10 },
  { label: "2-12", value: 12 },
];
