import type { ContentLibraryItem } from '@/lib/content-library'
import type { MistakeEditorDraft, QuizEditorDraft } from '@/lib/editor-runtime'

type BuiltQuestion = {
  prompt: string
  correct: string
  distractors: string[]
  explanation: string
}

type QuizBlueprint = {
  id: string
  title: string
  subject: string
  grade: string
  tags: string[]
  build: (seed: number) => BuiltQuestion
}

type BuiltMistake = {
  tokensText: string
  correctIndex: number
  correctToken: string
  rule: string
  explanation: string
}

type MistakeBlueprint = {
  id: string
  title: string
  subject: string
  grade: string
  tags: string[]
  build: (seed: number) => BuiltMistake
}

export const generatedQuizVariantsPerBlueprint = 40
export const generatedMistakeVariantsPerBlueprint = 24

const source = 'LessonQuest Generator' as const

const quizBlueprints: QuizBlueprint[] = [
  {
    id: 'percent-of-number',
    title: 'Percentage of number',
    subject: 'Mathematics',
    grade: '5th–8th grade, adults',
    tags: ['mathematics', 'interest', 'mental counting'],
    build(seed) {
      const percents = [10, 20, 25, 50, 75]
      const percent = percents[value(seed, 1, 0, percents.length - 1)]
      const base = 20 * value(seed, 2, 3, 25)
      const answer = (base * percent) / 100
      return {
        prompt: `How much is ${percent}% of ${base}?`,
        correct: String(answer),
        distractors: [String(base - answer), String(answer + percent), String(answer * 10)],
        explanation: `${percent}% of ${base} = ${base} · ${percent} / 100 = ${answer}.`,
      }
    },
  },
  {
    id: 'linear-equation',
    title: 'Linear equations',
    subject: 'Algebra',
    grade: '6–8 grade',
    tags: ['algebra', 'equations', 'calculations'],
    build(seed) {
      const x = value(seed, 3, 2, 30)
      const addend = value(seed, 4, 2, 24)
      const result = x + addend
      return {
        prompt: `Solve the equation x + ${addend} = ${result}.`,
        correct: String(x),
        distractors: [String(x + 1), String(x - 1), String(result)],
        explanation: `Subtract ${addend} from both parts: x = ${result} − ${addend} = ${x}.`,
      }
    },
  },
  {
    id: 'rectangle-area',
    title: 'Area of a rectangle',
    subject: 'Geometry',
    grade: '4–7 grade',
    tags: ['geometry', 'area', 'rectangle'],
    build(seed) {
      const width = value(seed, 5, 3, 16)
      const height = value(seed, 6, 2, 14)
      const area = width * height
      return {
        prompt: `Sides of a rectangle ${width} cm and ${height} cm. What is the area?`,
        correct: `${area} cm²`,
        distractors: [`${2 * (width + height)} cm²`, `${width + height} cm²`, `${area + width} cm²`],
        explanation: `The area of a rectangle is equal to the product of the sides: ${width} · ${height} = ${area} cm².`,
      }
    },
  },
  {
    id: 'speed',
    title: 'Speed, path and time',
    subject: 'Physics',
    grade: '6–8 grade',
    tags: ['physics', 'speed', 'tasks'],
    build(seed) {
      const speed = value(seed, 7, 3, 20)
      const time = value(seed, 8, 2, 12)
      const distance = speed * time
      return {
        prompt: `The body has passed ${distance} m for ${time} s. What is its speed?`,
        correct: `${speed} m/s`,
        distractors: [`${time} m/s`, `${distance - time} m/s`, `${speed + 2} m/s`],
        explanation: `Speed equals distance divided by time: ${distance} / ${time} = ${speed} m/s.`,
      }
    },
  },
  {
    id: 'probability',
    title: 'Classical probability',
    subject: 'Mathematics',
    grade: '7–9 grades, adults',
    tags: ['mathematics', 'probability', 'tasks'],
    build(seed) {
      const total = value(seed, 9, 10, 20)
      let favorable = value(seed, 10, 2, total - 2)
      if (favorable * 2 === total) favorable += 1
      return {
        prompt: `In a box ${total} tokens, of which ${favorable} blue What is the probability of getting a blue token?`,
        correct: `${favorable}/${total}`,
        distractors: [`${favorable + 1}/${total}`, `${favorable}/${total + 1}`, `${total - favorable}/${total}`],
        explanation: `Favorable outcomes ${favorable}, all equally possible outcomes ${total}, so P = ${favorable}/${total}.`,
      }
    },
  },
  {
    id: 'fraction-of-number',
    title: 'Fraction of a number',
    subject: 'Mathematics',
    grade: '5th–7th grade, adults',
    tags: ['mathematics', 'fractions', 'calculations'],
    build(seed) {
      const denominators = [2, 3, 4, 5, 8]
      const denominator = denominators[value(seed, 11, 0, denominators.length - 1)]
      const numerator = value(seed, 12, 1, denominator - 1)
      const base = denominator * value(seed, 13, 3, 18)
      const answer = (base / denominator) * numerator
      return {
        prompt: `Find ${numerator}/${denominator} from the number ${base}.`,
        correct: String(answer),
        distractors: [String(base / denominator), String(base - answer), String(answer + denominator)],
        explanation: `${base} / ${denominator} · ${numerator} = ${answer}.`,
      }
    },
  },
]

const mistakeBlueprints: MistakeBlueprint[] = [
  {
    id: 'addition',
    title: 'Addition error',
    subject: 'Mathematics',
    grade: '2–5 grade',
    tags: ['mathematics', 'addition', 'find the mistake'],
    build(seed) {
      const left = value(seed, 20, 18, 89)
      const right = value(seed, 21, 12, 79)
      const correct = left + right
      const wrong = correct + nonZeroDelta(seed)
      return {
        tokensText: `${left} + ${right} = ${wrong}`,
        correctIndex: 5,
        correctToken: String(correct),
        rule: 'When adding, it is convenient to check the units and tens separately.',
        explanation: `${left} + ${right} = ${correct}, so the number ${wrong} written down incorrectly.`,
      }
    },
  },
  {
    id: 'multiplication',
    title: 'Multiplication error',
    subject: 'Mathematics',
    grade: '3–6 grade',
    tags: ['mathematics', 'multiplication', 'find the mistake'],
    build(seed) {
      const left = value(seed, 22, 3, 12)
      const right = value(seed, 23, 3, 12)
      const correct = left * right
      const wrong = correct + nonZeroDelta(seed + 5)
      return {
        tokensText: `${left} · ${right} = ${wrong}`,
        correctIndex: 5,
        correctToken: String(correct),
        rule: 'Check the product by inverse action or expansion of one factor.',
        explanation: `${left} · ${right} = ${correct}, not ${wrong}.`,
      }
    },
  },
  {
    id: 'equation-transfer',
    title: 'Error in solving equation',
    subject: 'Algebra',
    grade: '6–8 grade',
    tags: ['algebra', 'equations', 'find the mistake'],
    build(seed) {
      const x = value(seed, 24, 2, 25)
      const addend = value(seed, 25, 3, 20)
      const result = x + addend
      const wrong = result + addend
      return {
        tokensText: `x + ${addend} = ${result} → x = ${wrong}`,
        correctIndex: 9,
        correctToken: String(x),
        rule: 'To find the unknown term, you need to subtract the known term from the sum.',
        explanation: `x = ${result} − ${addend} = ${x}. Addition was incorrectly performed in the recording.`,
      }
    },
  },
  {
    id: 'speed-formula',
    title: 'Error in speed calculation',
    subject: 'Physics',
    grade: '7th–8th grade',
    tags: ['physics', 'speed', 'find the mistake'],
    build(seed) {
      const speed = value(seed, 26, 3, 18)
      const time = value(seed, 27, 2, 12)
      const distance = speed * time
      const wrong = speed + nonZeroDelta(seed + 11)
      return {
        tokensText: `v = ${distance} / ${time} = ${wrong} m/s`,
        correctIndex: 7,
        correctToken: String(speed),
        rule: 'Speed is found by dividing the path by time: v = S / t.',
        explanation: `${distance} / ${time} = ${speed}, so the correct speed is ${speed} m/s.`,
      }
    },
  },
  {
    id: 'present-perfect',
    title: 'Error in Present Perfect',
    subject: 'English',
    grade: 'A2–B1, adults',
    tags: ['English', 'Present Perfect', 'find the mistake'],
    build(seed) {
      const subjects = [
        { subject: 'I', auxiliary: 'have' },
        { subject: 'We', auxiliary: 'have' },
        { subject: 'She', auxiliary: 'has' },
      ]
      const verbs = [
        { past: 'went', participle: 'gone', tail: 'home' },
        { past: 'saw', participle: 'seen', tail: 'this film' },
        { past: 'wrote', participle: 'written', tail: 'the email' },
        { past: 'took', participle: 'taken', tail: 'the train' },
        { past: 'did', participle: 'done', tail: 'the task' },
        { past: 'chose', participle: 'chosen', tail: 'a route' },
        { past: 'spoke', participle: 'spoken', tail: 'to them' },
        { past: 'began', participle: 'begun', tail: 'the lesson' },
      ]
      const actor = subjects[seed % subjects.length]
      const verb = verbs[Math.floor(seed / subjects.length) % verbs.length]
      return {
        tokensText: `${actor.subject} ${actor.auxiliary} ${verb.past} ${verb.tail}`,
        correctIndex: 3,
        correctToken: verb.participle,
        rule: 'The Present Perfect is formed with have or has and the third form of the semantic verb.',
        explanation: `After ${actor.auxiliary} need a form ${verb.participle}, not ${verb.past}.`,
      }
    },
  },
]

export const generatedParametricQuizMaterialsCount = quizBlueprints.length * generatedQuizVariantsPerBlueprint
export const generatedMistakeMaterialsCount = mistakeBlueprints.length * generatedMistakeVariantsPerBlueprint

export const generatedParametricQuizLibrary: ContentLibraryItem[] = quizBlueprints.flatMap((blueprint, blueprintIndex) =>
  Array.from({ length: generatedQuizVariantsPerBlueprint }, (_, variantIndex) => {
    const questions = Array.from({ length: 3 }, (_, questionIndex) => {
      const seed = variantIndex * 3 + questionIndex + blueprintIndex * 127
      const question = blueprint.build(seed)
      const correctIndex = ((variantIndex + questionIndex) % 3) + 1
      const options = arrangeOptions(question.correct, question.distractors, correctIndex)
      return `${question.prompt} | ${options.join(' ; ')} | ${correctIndex} | ${question.explanation}`
    })
    const number = variantNumber(variantIndex)
    const title = `${blueprint.title}: option ${number}`
    const draft: QuizEditorDraft = {
      title,
      subject: blueprint.subject,
      grade: blueprint.grade,
      teacherNote: 'The numbers are generated using a verifiable formula. You can change any question or answer option before class.',
      prompt: 'Solve three short problems. After answering, analyze the calculation.',
      questionsText: questions.join('\n'),
    }

    return {
      id: `generated-parametric-${blueprint.id}-${number}`,
      gameId: 'quiz-rush',
      title,
      subject: blueprint.subject,
      grade: blueprint.grade,
      summary: `Three parametric problems on the topic "${blueprint.title}"with explanations.`,
      tags: [...blueprint.tags, 'generated set', 'computational quiz'],
      draft,
      source,
    }
  }),
)

export const generatedMistakeLibrary: ContentLibraryItem[] = mistakeBlueprints.flatMap((blueprint, blueprintIndex) =>
  Array.from({ length: generatedMistakeVariantsPerBlueprint }, (_, variantIndex) => {
    const built = blueprint.build(variantIndex + blueprintIndex * generatedMistakeVariantsPerBlueprint)
    const number = variantNumber(variantIndex)
    const title = `${blueprint.title}: round ${number}`
    const draft: MistakeEditorDraft = {
      title,
      subject: blueprint.subject,
      grade: blueprint.grade,
      teacherNote: 'After selecting the erroneous token, ask the student to recite the rule and reconstruct the correct entry.',
      prompt: 'Find one erroneous fragment and replace it with the correct one.',
      tokensText: built.tokensText,
      correctIndex: String(built.correctIndex),
      correctToken: built.correctToken,
      rule: built.rule,
      explanation: built.explanation,
    }

    return {
      id: `generated-mistake-${blueprint.id}-${number}`,
      gameId: 'mistake-arena',
      title,
      subject: blueprint.subject,
      grade: blueprint.grade,
      summary: `One short analysis of a typical mistake on the topic “${blueprint.title}».`,
      tags: [...blueprint.tags, 'generated set'],
      draft,
      source,
    }
  }),
)

function arrangeOptions(correct: string, candidates: string[], correctIndex: number) {
  const distractors = [...new Set(candidates.filter((candidate) => candidate !== correct))]
  let fallbackIndex = 1
  while (distractors.length < 2) {
    const fallback = `${correct} (${fallbackIndex + 1})`
    if (fallback !== correct && !distractors.includes(fallback)) distractors.push(fallback)
    fallbackIndex += 1
  }

  const options = distractors.slice(0, 2)
  options.splice(correctIndex - 1, 0, correct)
  return options
}

function value(seed: number, salt: number, min: number, max: number) {
  return min + (((seed + 1) * 37 + salt * 17) % (max - min + 1))
}

function nonZeroDelta(seed: number) {
  const deltas = [-3, -2, -1, 1, 2, 3]
  return deltas[value(seed, 28, 0, deltas.length - 1)]
}

function variantNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}
