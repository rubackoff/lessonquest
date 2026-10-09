import type { ContentLibraryItem } from '@/lib/content-library'
import type { GroupEditorDraft } from '@/lib/editor-runtime'

type Category = {
  title: string
  items: [string, string, string, string]
}

type CategoryBank = {
  id: string
  title: string
  subject: string
  grade: string
  tags: string[]
  categories: [Category, Category, Category]
}

export const generatedGroupVariantsPerBank = 24

const source = 'LessonQuest Generator' as const

const categoryBanks: CategoryBank[] = [
  {
    id: 'parts-of-speech',
    title: 'Parts of speech',
    subject: 'Language Arts',
    grade: '3–6 grade',
    tags: ['language arts', 'parts of speech', 'morphology'],
    categories: [
      { title: 'Nouns', items: ['a journey', 'the silence', 'a lantern', 'the team'] },
      { title: 'Verbs', items: ['to explore', 'to notice', 'to smile', 'to compare'] },
      { title: 'Adjectives', items: ['careful', 'accurate', 'seasonal', 'brave'] },
    ],
  },
  {
    id: 'english-time-markers',
    title: 'English tense markers',
    subject: 'English',
    grade: 'A2–B1, adults',
    tags: ['English', 'times', 'grammar'],
    categories: [
      { title: 'Past Simple', items: ['yesterday', 'last week', 'two days ago', 'in 2020'] },
      { title: 'Present Perfect', items: ['already', 'just', 'ever', 'since Monday'] },
      { title: 'Future Simple', items: ['tomorrow', 'next month', 'soon', 'in a year'] },
    ],
  },
  {
    id: 'german-noun-gender',
    title: 'Gender of nouns in German',
    subject: 'German language',
    grade: 'A1–A2, adults',
    tags: ['German language', 'articles', 'nouns'],
    categories: [
      { title: 'der', items: ['Tisch', 'Apfel', 'Sommer', 'Lehrer'] },
      { title: 'die', items: ['Schule', 'Zeitung', 'Blume', 'Familie'] },
      { title: 'das', items: ['Kind', 'Fenster', 'Buch', 'Mädchen'] },
    ],
  },
  {
    id: 'algebra-polynomials',
    title: 'Expressions based on the number of terms',
    subject: 'Algebra',
    grade: '7th–8th grade',
    tags: ['algebra', 'polynomials', 'expressions'],
    categories: [
      { title: 'Monomials', items: ['5x', '−3ab', '7y²', '0,4mn'] },
      { title: 'Binomials', items: ['x + 4', '3a − b', 'm² + 2m', '7 − 5y'] },
      { title: 'Trinomials', items: ['x² + 2x + 1', 'a + b − c', '2m² − m + 5', 'p + q + r'] },
    ],
  },
  {
    id: 'angle-types',
    title: 'Types of angles',
    subject: 'Geometry',
    grade: '5th–7th grade',
    tags: ['geometry', 'angles', 'degree measure'],
    categories: [
      { title: 'Acute', items: ['18°', '35°', '62°', '89°'] },
      { title: 'Direct', items: ['90°', '¼ full turn', 'half a straight angle', 'angle between axes Ox and Oy'] },
      { title: 'Dumb', items: ['105°', '124°', '150°', '179°'] },
    ],
  },
  {
    id: 'physics-sections',
    title: 'Sections of physics',
    subject: 'Physics',
    grade: '7–9 grade',
    tags: ['physics', 'terms', 'sections of physics'],
    categories: [
      { title: 'Mechanics', items: ['acceleration', 'impulse', 'friction', 'trajectory'] },
      { title: 'Electricity', items: ['current strength', 'voltage', 'resistance', 'electric charge'] },
      { title: 'Thermal phenomena', items: ['evaporation', 'melting', 'thermal conductivity', 'condensation'] },
    ],
  },
  {
    id: 'inorganic-compounds',
    title: 'Classes of inorganic substances',
    subject: 'Chemistry',
    grade: '8–9 grade',
    tags: ['chemistry', 'formulas', 'classes of substances'],
    categories: [
      { title: 'Acids', items: ['HCl', 'H₂SO₄', 'HNO₃', 'H₃PO₄'] },
      { title: 'Reasons', items: ['NaOH', 'Ca(OH)₂', 'KOH', 'Ba(OH)₂'] },
      { title: 'Salts', items: ['NaCl', 'CaCO₃', 'K₂SO₄', 'Cu(NO₃)₂'] },
    ],
  },
  {
    id: 'vertebrate-classes',
    title: 'Vertebrate classes',
    subject: 'Biology',
    grade: '5th–7th grade',
    tags: ['biology', 'animals', 'classification'],
    categories: [
      { title: 'Mammals', items: ['dolphin', 'bat', 'hedgehog', 'tiger'] },
      { title: 'Birds', items: ['ostrich', 'penguin', 'swallow', 'owl'] },
      { title: 'Pisces', items: ['pike', 'shark', 'stingray', 'perch'] },
    ],
  },
  {
    id: 'ecology-factors',
    title: 'Environmental factors',
    subject: 'Ecology',
    grade: '7–10 grade',
    tags: ['ecology', 'environmental factors', 'nature'],
    categories: [
      { title: 'Abiotic', items: ['air temperature', 'water salinity', 'illumination', 'soil moisture'] },
      { title: 'Biotic', items: ['species competition', 'predation', 'parasitism', 'symbiosis'] },
      { title: 'Anthropogenic', items: ['deforestation', 'dam construction', 'river pollution', 'creation of a reserve'] },
    ],
  },
  {
    id: 'geography-objects',
    title: 'Geographical objects',
    subject: 'Geography',
    grade: '5th–7th grade',
    tags: ['geography', 'objects', 'map'],
    categories: [
      { title: 'Mountain systems', items: ['Alps', 'Himalayas', 'Andes', 'Caucasus'] },
      { title: 'Plains', items: ['East European Plain', 'West Siberian Plain', 'Amazonian lowland', 'Great Plains'] },
      { title: 'Water bodies', items: ['Baikal', 'Neil', 'Caspian Sea', 'Amazon'] },
    ],
  },
  {
    id: 'society-spheres',
    title: 'Spheres of public life',
    subject: 'Social Studies',
    grade: '6–9 grade',
    tags: ['social studies', 'society', 'spheres of life'],
    categories: [
      { title: 'Economic', items: ['production of goods', 'family budget', 'purchase of a service', 'bank work'] },
      { title: 'Political', items: ['presidential elections', 'work of parliament', 'political party', 'state power'] },
      { title: 'Spiritual', items: ['scientific discovery', 'theatrical premiere', 'school education', 'religious rite'] },
    ],
  },
  {
    id: 'personal-budget',
    title: 'Personal budget',
    subject: 'Financial literacy',
    grade: '7–11 grade, adults',
    tags: ['financial literacy', 'budget', 'economics'],
    categories: [
      { title: 'Income', items: ['salary', 'scholarship', 'fee', 'interest on deposit'] },
      { title: 'Mandatory expenses', items: ['rental housing', 'electricity payment', 'tax', 'loan payment'] },
      { title: 'Optional expenses', items: ['coffee to go', 'new decor', 'movie subscription', 'souvenir'] },
    ],
  },
  {
    id: 'color-temperature',
    title: 'Color groups',
    subject: 'fine arts',
    grade: '4th–9th grade, adults',
    tags: ['ISO', 'color', 'painting'],
    categories: [
      { title: 'Warm', items: ['scarlet', 'orange', 'ocher', 'coral'] },
      { title: 'Cold', items: ['ultramarine', 'turquoise', 'purple', 'emerald'] },
      { title: 'Neutral', items: ['white', 'gray', 'black', 'beige'] },
    ],
  },
  {
    id: 'music-instruments',
    title: 'Families of musical instruments',
    subject: 'Music',
    grade: '4th–8th grade, adults',
    tags: ['music', 'tools', 'orchestra'],
    categories: [
      { title: 'Strings', items: ['violin', 'cello', 'harp', 'double bass'] },
      { title: 'Brass', items: ['flute', 'clarinet', 'pipe', 'bassoon'] },
      { title: 'Drums', items: ['timpani', 'xylophone', 'drum', 'plates'] },
    ],
  },
]

export const generatedGroupMaterialsCount = categoryBanks.length * generatedGroupVariantsPerBank

const pairs: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
]

export const generatedGroupContentLibrary: ContentLibraryItem[] = categoryBanks.flatMap((bank, bankIndex) =>
  Array.from({ length: generatedGroupVariantsPerBank }, (_, variantIndex) => {
    const selected = bank.categories.map((category, categoryIndex) => {
      const pairIndex = categoryIndex === 0
        ? variantIndex % pairs.length
        : categoryIndex === 1
          ? Math.floor(variantIndex / pairs.length) % pairs.length
          : (variantIndex * 5 + bankIndex) % pairs.length
      return pairs[pairIndex].map((itemIndex) => category.items[itemIndex])
    })

    const itemsText = [0, 1]
      .flatMap((itemIndex) => bank.categories.map((category, categoryIndex) => `${selected[categoryIndex][itemIndex]} | ${category.title}`))
      .join('\n')
    const number = variantNumber(variantIndex)
    const title = `${bank.title}: sorting ${number}`
    const draft: GroupEditorDraft = {
      title,
      subject: bank.subject,
      grade: bank.grade,
      teacherNote: 'The set contains two unique cards for each category. All fields can be changed to suit the student or topic of the lesson.',
      prompt: 'Drag each card into the appropriate group and explain one of the choices.',
      groupsText: bank.categories.map((category) => category.title).join('\n'),
      itemsText,
    }

    return {
      id: `generated-group-${bank.id}-${number}`,
      gameId: 'group-sort',
      title,
      subject: bank.subject,
      grade: bank.grade,
      summary: `Six cards for distribution into three categories of the topic "${bank.title}».`,
      tags: [...bank.tags, 'generated set', 'sorting'],
      draft,
      source,
    }
  }),
)

function variantNumber(index: number) {
  return String(index + 1).padStart(2, '0')
}
