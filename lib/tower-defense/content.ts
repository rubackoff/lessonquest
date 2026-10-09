export type DefenseLessonId = 'seven' | 'linear' | 'fractions' | 'english-s'
export type DefenseExercise = {
  id: string; prompt: string; options: string[]; correctIndex: number; explanation: string
}
export const defenseLessons = [
  { id: 'seven' as const, title: 'Multiply by 7', goal: 'Find the product, unknown factor and solve problems involving multiplication by 7.' },
  { id: 'linear' as const, title: 'Linear equations', goal: 'Solve the equations ax + b = c and check the found value by substitution.' },
  { id: 'fractions' as const, title: 'Shares and fractions', goal: 'Find the fraction of a number and the whole number from a known fraction.' },
  { id: 'english-s' as const, title: 'English · he/she/it', goal: 'Choose the verb form with he, she and it in Present Simple affirmative sentences.' },
]
const factors = [6, 4, 8, 3, 9, 5, 8, 6, 9, 4, 7, 3]
const english = [
  ['She ___ tennis every Sunday.', 'play', 'plays', 'playing'],
  ['He ___ cartoons after school.', 'watch', 'watches', 'watching'],
  ['My cat ___ on the sofa.', 'sleep', 'sleeps', 'sleeping'],
  ['She ___ English at school.', 'study', 'studies', 'studying'],
  ['He ___ to school by bus.', 'go', 'goes', 'going'],
  ['The dog ___ a walk every morning.', 'need', 'needs', 'needing'],
  ['My sister ___ music.', 'like', 'likes', 'liking'],
  ['He ___ his homework after school.', 'do', 'does', 'doing'],
  ['She ___ her hands before lunch.', 'wash', 'washes', 'washing'],
  ['My brother ___ football on Friday.', 'play', 'plays', 'playing'],
  ['It ___ a lot in autumn.', 'rain', 'rains', 'raining'],
  ['My friend ___ hard for every test.', 'study', 'studies', 'studying'],
] as const

/** A recovery is a new item on the same skill, never the answer just revealed. */
export function defenseExercise(lesson: DefenseLessonId, homework: boolean, index: number, recovery = 0): DefenseExercise {
  const seed = index + (homework ? 6 : 0), id = `${lesson}-${homework ? 'home' : 'lesson'}-${index}`
  let prompt: string, explanation: string, values: string[], correct: string
  if (lesson === 'english-s') {
    const [sentence, base, inflected, participle] = english[(seed + recovery) % english.length]
    prompt = sentence; correct = inflected; values = [base, inflected, participle]
    explanation = `With he, she, it we add -s or -es to the verb. After the consonant + y, change y to -ies. Here: ${base} → ${inflected}. ${sentence.replace('___', inflected)}`
  } else if (lesson === 'linear') {
    const x = 2 + (seed + recovery) % 8, a = 2 + seed % 4, b = 1 + (seed + recovery * 2) % 9, c = a * x + b
    prompt = `${a}x + ${b} = ${c}. Find x.`; correct = String(x)
    values = [String(x - 1), correct, String(x + 1)]
    explanation = `Subtract ${b} from both parts: ${a}x = ${c - b}. Divide by ${a}: x = ${x}. Check: ${a} × ${x} + ${b} = ${c}.`
  } else if (lesson === 'fractions') {
    const d = 3 + seed % 4, n = 1 + seed % (d - 1), part = 3 + (seed + recovery) % 9, total = d * part
    const inverse = seed % 2 === 1
    prompt = inverse ? `1/${d} numbers is equal ${part}. Find the number.` : `Find ${n}/${d} from ${total}.`
    correct = String(inverse ? total : n * part)
    values = [String(Number(correct) - 1), correct, String(Number(correct) + 1)]
    explanation = inverse ? `One of ${d} equal parts ${part}. Whole number: ${part} × ${d} = ${total}.` : `One share: ${total} ÷ ${d} = ${part}. Let's take it ${n} such shares: ${part} × ${n} = ${n * part}.`
  } else {
    const n = 2 + (factors[seed % factors.length] - 2 + recovery) % 8, result = 7 * n
    const kind = seed % 3
    prompt = kind === 1 ? `7 × ? = ${result}` : kind === 2 ? `V ${n} boxes of 7 parts. How many parts are there in total?` : `7 × ${n} = ?`
    correct = String(kind === 1 ? n : result)
    values = kind === 1 ? [String(n + 1), correct, String(n - 1)] : [String(result - 7), correct, String(result + 7)]
    explanation = kind === 1
      ? `We are looking for how many times we need to take 7. ${result} ÷ 7 = ${n}, which means the unknown factor is ${n}. Check: 7× ${n} = ${result}.`
      : `Divide 7 by 5 + 2: 5 × ${n} = ${5 * n}, 2 × ${n} = ${2 * n}. Add it up: ${5 * n} + ${2 * n} = ${result}. So 7 × ${n} = ${result}.`
  }
  const rotation = (seed + recovery) % 3
  const options = [...values.slice(rotation), ...values.slice(0, rotation)]
  return { id, prompt, explanation, options, correctIndex: options.indexOf(correct) }
}
