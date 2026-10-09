import type { GameId } from '@/lib/activity-runtime'
import type {
  EditorDraft,
  ForceEditorDraft,
  GroupEditorDraft,
  MatchEditorDraft,
  MistakeEditorDraft,
  QuizEditorDraft,
  RecallEditorDraft,
} from '@/lib/editor-runtime'
import { validateEditorDraft } from '@/lib/editor-runtime'
import type { GeometryDiagramSpec } from '@/lib/geometry-diagrams'
import { generatedContentLibrary } from '@/lib/generated-content-library'

export type ContentLibraryItem = {
  id: string
  gameId: GameId
  title: string
  subject: string
  grade: string
  summary: string
  tags: string[]
  preview?: GeometryDiagramSpec
  draft: EditorDraft
  source: 'LessonQuest Editorial Board' | 'LessonQuest Generator'
}

const source = 'LessonQuest Editorial Board' as const

function diagram(kind: GeometryDiagramSpec['kind'], variant: string, label: string): GeometryDiagramSpec {
  return { kind, variant, label }
}

function matchItem(
  id: string,
  title: string,
  grade: string,
  summary: string,
  tags: string[],
  pairs: string[],
  visuals?: GeometryDiagramSpec[],
): ContentLibraryItem {
  const draft: MatchEditorDraft = {
    title,
    subject: 'Geometry',
    grade,
    teacherNote: 'The finished set can be shortened, supplemented, or reformulated to suit the student.',
    prompt: 'Match each diagram or concept with the correct answer.',
    pairsText: pairs.join('\n'),
    pairVisuals: visuals,
  }
  return { id, gameId: 'match-pairs', title, subject: draft.subject, grade, summary, tags, preview: visuals?.[0], draft, source }
}

function textMatchItem(
  id: string,
  title: string,
  subject: string,
  grade: string,
  summary: string,
  tags: string[],
  pairs: string[],
): ContentLibraryItem {
  const draft: MatchEditorDraft = {
    title,
    subject,
    grade,
    teacherNote: 'The set was created by the editors from scratch and is completely edited for a specific student.',
    prompt: 'Connect elements that relate to each other.',
    pairsText: pairs.join('\n'),
  }
  return { id, gameId: 'match-pairs', title, subject, grade, summary, tags, draft, source }
}

function groupItem(
  id: string,
  title: string,
  subject: string,
  grade: string,
  summary: string,
  tags: string[],
  groups: string[],
  items: string[],
): ContentLibraryItem {
  const draft: GroupEditorDraft = {
    title,
    subject,
    grade,
    teacherNote: 'After sorting, ask the student to explain one borderline example.',
    prompt: 'Drag the cards into the appropriate groups.',
    groupsText: groups.join('\n'),
    itemsText: items.join('\n'),
  }
  return { id, gameId: 'group-sort', title, subject, grade, summary, tags, draft, source }
}

function quizItem(
  id: string,
  title: string,
  subject: string,
  grade: string,
  summary: string,
  tags: string[],
  questions: string[],
): ContentLibraryItem {
  const draft: QuizEditorDraft = {
    title,
    subject,
    grade,
    teacherNote: 'Each question has a short explanation of the correct answer already added.',
    prompt: 'Select an answer and immediately understand the explanation.',
    questionsText: questions.join('\n'),
  }
  return { id, gameId: 'quiz-rush', title, subject, grade, summary, tags, draft, source }
}

function recallItem(
  id: string,
  title: string,
  subject: string,
  grade: string,
  summary: string,
  tags: string[],
  cards: string[],
): ContentLibraryItem {
  const draft: RecallEditorDraft = {
    title,
    subject,
    grade,
    teacherNote: 'The student first formulates the answer himself and only then turns over the card.',
    prompt: 'Remember the answer, open the card and honestly evaluate yourself.',
    cardsText: cards.join('\n'),
  }
  return { id, gameId: 'recall-deck', title, subject, grade, summary, tags, draft, source }
}

function mistakeItem(
  id: string,
  title: string,
  subject: string,
  grade: string,
  summary: string,
  tags: string[],
  tokensText: string,
  correctIndex: number,
  correctToken: string,
  rule: string,
  explanation: string,
): ContentLibraryItem {
  const draft: MistakeEditorDraft = {
    title,
    subject,
    grade,
    teacherNote: 'Ask the student not only to find the error, but also to say the rule.',
    prompt: 'Find one erroneous fragment in the recording.',
    tokensText,
    correctIndex: String(correctIndex),
    correctToken,
    rule,
    explanation,
  }
  return { id, gameId: 'mistake-arena', title, subject, grade, summary, tags, draft, source }
}

function forceItem(
  id: string,
  title: string,
  grade: string,
  summary: string,
  equation: string,
  answer: string,
  force: number,
  angle: number,
): ContentLibraryItem {
  const draft: ForceEditorDraft = {
    title,
    subject: 'Physics + algebra',
    grade,
    teacherNote: 'Relate the solution of the equation to the setting of the force vector on the stage.',
    equation,
    unknown: 'x',
    answer,
    lesson: 'Solve the equation, then adjust the force and angle to open the gate.',
    targetForce: String(force),
    targetAngle: String(angle),
    mass: '7',
    friction: '2',
    fieldForce: String(force + 2),
  }
  return { id, gameId: 'force-lab', title, subject: draft.subject, grade, summary, tags: ['physics', 'strength', 'equation'], draft, source }
}

const editorialContentLibrary: ContentLibraryItem[] = [
  matchItem(
    'geometry-area-formulas',
    'Areas of main figures',
    'Grade 7',
    'Four diagrams of figures and formulas for their areas.',
    ['geometry', 'area', 'formulas', 'figures'],
    ['Triangle | S = a h/2', 'Square | S = a²', 'Rectangle | S = a b', 'Circle | S = πr²'],
    [diagram('triangle', 'scalene', 'Triangle'), diagram('quadrilateral', 'square', 'Square'), diagram('quadrilateral', 'rectangle', 'Rectangle'), diagram('circle', 'radius', 'Circle')],
  ),
  matchItem(
    'geometry-perimeters',
    'Perimeters of figures',
    'Grade 5',
    'Schemes of quadrilaterals and perimeter formulas.',
    ['geometry', 'perimeter', 'formulas'],
    ['Square | P = 4a', 'Rectangle | P = 2(a + b)', 'Diamond | P = 4a', 'Trapezoid | P = a + b + c + d'],
    [diagram('quadrilateral', 'square', 'Square'), diagram('quadrilateral', 'rectangle', 'Rectangle'), diagram('quadrilateral', 'rhombus', 'Diamond'), diagram('quadrilateral', 'trapezoid', 'Trapezoid')],
  ),
  matchItem(
    'geometry-triangle-types',
    'Types of triangles',
    '5th–7th grade',
    'Recognizing triangles based on a pattern.',
    ['geometry', 'triangle', 'figures'],
    ['All sides are equal | Equilateral', 'Two sides are equal | Isosceles', 'All sides are different | Versatile', 'There is a 90° angle | Right-angled'],
    [diagram('triangle', 'equilateral', 'All sides are equal'), diagram('triangle', 'isosceles', 'Two sides are equal'), diagram('triangle', 'scalene', 'All sides are different'), diagram('triangle', 'right', 'There is a right angle')],
  ),
  matchItem(
    'geometry-angle-types',
    'Types of angles',
    'Grade 5',
    'Visual diagrams of acute, right, obtuse and straight angles.',
    ['geometry', 'angles', 'degrees'],
    ['Less than 90° | Acute angle', 'Exactly 90° | Right angle', 'From 90° to 180° | Obtuse angle', 'Exactly 180° | Full angle'],
    [diagram('angle', 'acute', 'Angle less than 90 degrees'), diagram('angle', 'right', 'Angle 90 degrees'), diagram('angle', 'obtuse', 'Angle greater than 90 degrees'), diagram('angle', 'straight', 'Angle 180 degrees')],
  ),
  matchItem(
    'geometry-quadrilaterals',
    'Quadrilaterals and properties',
    'Grade 8',
    'A figure is connected to its defining property.',
    ['geometry', 'quadrilaterals', 'properties'],
    ['Four equal sides and right angles | Square', 'Opposite sides are equal, angles are right | Rectangle', 'All sides are equal | Diamond', 'One pair of parallel sides | Trapezoid'],
    [diagram('quadrilateral', 'square', 'Square'), diagram('quadrilateral', 'rectangle', 'Rectangle'), diagram('quadrilateral', 'rhombus', 'Diamond'), diagram('quadrilateral', 'trapezoid', 'Trapezoid')],
  ),
  matchItem(
    'geometry-circle-elements',
    'Elements of a circle',
    'Grade 7',
    'Radius, diameter, chord and sector on clean diagrams.',
    ['geometry', 'circumference', 'circle'],
    ['From center to circumference | Radius', 'Through the center between two points of the circle | Diameter', 'Connects two points on a circle | Chord', 'Part of a circle between two radii | Sector'],
    [diagram('circle', 'radius', 'Segment from center'), diagram('circle', 'diameter', 'Segment through the center'), diagram('circle', 'chord', 'Chord'), diagram('circle', 'sector', 'Sector')],
  ),
  matchItem(
    'geometry-function-plots',
    'Function graphs',
    '8–9 grade',
    'Recognizing the basic function by the shape of the graph.',
    ['geometry', 'algebra', 'graphics', 'functions'],
    ['Increasing straight line | y = x', 'Descending line | y = −x', 'Parabola | y = x²', 'Hyperbole | y = 1/x'],
    [diagram('plot', 'linear-up', 'Increasing straight line'), diagram('plot', 'linear-down', 'Descending line'), diagram('plot', 'quadratic', 'Parabola'), diagram('plot', 'inverse', 'Hyperbole')],
  ),
  matchItem(
    'geometry-solids-volume',
    'Volume of spatial bodies',
    '9–10 grade',
    'Schemes of bodies and basic volume formulas.',
    ['geometry', 'stereometry', 'volume', 'formulas'],
    ['Cube | V = a³', 'Prism | V = Smain h', 'Cylinder | V = πr²h', 'Cone | V = πr²h / 3'],
    [diagram('solid', 'cube', 'Cube'), diagram('solid', 'prism', 'Prism'), diagram('solid', 'cylinder', 'Cylinder'), diagram('solid', 'cone', 'Cone')],
  ),
  textMatchItem('match-preschool-shapes', 'Figures and their characteristics', 'Preschool development', '5–7 years', 'Four basic figures and easily verifiable signs.', ['preschool development', 'figures', 'logic'], ['Circle | No corners', 'Triangle | Three sides', 'Square | Four equal sides', 'Rectangle | Four right angles']),
  textMatchItem('match-primary-units', 'Units and ratios', 'Primary School', '2–4 grade', 'Basic relationships of length, mass and time.', ['primary school', 'units of measurement', 'mathematics'], ['1 meter | 100 centimeters', '1 kilogram | 1000 grams', '1 hour | 60 minutes', '1 day | 24 hours']),
  textMatchItem('match-language-arts-parts-of-speech', 'Parts of speech', 'Language Arts', 'Grades 4–6', 'Match each word class to its role.', ['language arts', 'grammar'], ['Noun | Names a person, place, thing or idea', 'Verb | Describes an action or state', 'Adjective | Describes a noun', 'Adverb | Modifies a verb, adjective or another adverb']),
  textMatchItem('match-literature-devices', 'Means of expression', 'Literature', '5th–8th grade', 'The term is connected to its short definition.', ['literature', 'trails', 'expressiveness'], ['Metaphor | Hidden comparison', 'Epithet | Figurative definition', 'Personification | Properties of man and non-living things', 'Hyperbole | Artistic exaggeration']),
  textMatchItem('match-english-travel-core', 'Travel English: key words', 'English', 'A2–B1', 'Match travel words to their meanings.', ['English', 'travel', 'vocabulary'], ['departure | The act of leaving', 'arrival | Reaching your destination', 'receipt | A document proving payment', 'appointment | An arranged meeting']),
  textMatchItem('match-german-articles', 'Articles of German nouns', 'German language', 'A1', 'Four frequency nouns and regular articles.', ['German', 'articles', 'A1'], ['Tisch | der', 'Tür | die', 'Fenster | das', 'Bücher | die']),
  textMatchItem('match-french-greetings', 'French politeness phrases', 'French language', 'A1', 'Short phrases to start communication.', ['French', 'greetings', 'A1'], ['bonjour | hello', 'merci | thank you', "s'il vous plaît | please", 'au revoir | goodbye']),
  textMatchItem('match-spanish-greetings', 'Spanish politeness phrases', 'Spanish language', 'A1', 'Basic phrases for everyday communication.', ['Spanish', 'greetings', 'A1'], ['hola | hi', 'gracias | thank you', 'por favor | please', 'hasta luego | see you soon']),
  textMatchItem('match-chinese-greetings', 'Chinese phrases and reading', 'Chinese language', 'Entry level', 'The characters are combined with pinyin and translation.', ['Chinese', 'pinyin', 'greetings'], ['你好 | nǐ hǎo - hello', '谢谢 | xièxie - thank you', '再见 | zàijiàn - goodbye', '请 | qǐng - please']),
  textMatchItem('match-arithmetic-fractions', 'Common and decimal fractions', 'Arithmetic', '5th–6th grade', 'Four frequency fractions in two notation forms.', ['arithmetic', 'fractions', 'decimals'], ['1/2 | 0,5', '1/4 | 0,25', '3/4 | 0,75', '1/5 | 0,2']),
  textMatchItem('match-algebra-identities', 'Abbreviated multiplication formulas', 'Algebra', 'Grade 7', 'Four basic algebraic identities.', ['algebra', 'formulas', 'identity'], ['(a + b)² | a² + 2ab + b²', '(a − b)² | a² − 2ab + b²', 'a² − b² | (a − b)(a + b)', 'a(b + c) | ab + ac']),
  textMatchItem('match-probability-basics', 'Probability: Basic Properties', 'Probability and Statistics', '7–9 grade', 'Numerical values and meaning of probabilistic events.', ['probability', 'events', 'statistics'], ['P = 0 | Impossible event', 'P = 1 | Reliable event', 'P = 0.5 | Equal chances', 'P(A) + P(not A) | 1']),
  textMatchItem('match-calculus-derivatives', 'Basic derivatives', 'Mathematical analysis', '10–11 grade, university', 'A function is combined with its derivative.', ['mathematical analysis', 'derivative', 'functions'], ["xⁿ | n · xⁿ⁻¹", 'sin x | cos x', 'cos x | −sin x', 'eˣ | eˣ']),
  textMatchItem('match-informatics-core', 'Basic concepts of computer science', 'Computer Science', '5th–8th grade', 'Data units and program elements.', ['computer science', 'data', 'algorithms'], ['Bit | Value 0 or 1', 'Byte | Eight bits', 'Algorithm | Final sequence of commands', 'Variable | Named place for value']),
  textMatchItem('match-physics-si-units', 'Physical quantities and SI units', 'Physics', '7–9 grade', 'The quantity is connected to the base unit of measurement.', ['physics', 'SI', 'units of measurement'], ['Strength | newton', 'Energy | joule', 'Power | watt', 'Speed | meter per second']),
  textMatchItem('match-chemistry-symbols', 'Chemical elements and symbols', 'Chemistry', '7th–8th grade', 'Names of common elements and symbols.', ['chemistry', 'elements', 'symbols'], ['Oxygen | O', 'Hydrogen | H', 'Iron | Fe', 'Sodium | Na']),
  textMatchItem('match-biology-organelles', 'Cell organelles and functions', 'Biology', '6–8 grade', 'The organoid connects to the main function.', ['biology', 'cell', 'organoids'], ['Core | Storage of hereditary information', 'Mitochondria | Cellular respiration and ATP synthesis', 'Ribosome | Protein synthesis', 'Cell membrane | Selective transport of substances']),
  textMatchItem('match-ecology-food-chain', 'Roles in the food chain', 'Ecology', '6–8 grade', 'The organism connects to its role in the ecosystem.', ['ecology', 'food chain', 'ecosystem'], ['Birch | Producer', 'Hare | Consumer of the first order', 'Fox | Second-order consumer', 'Soil bacteria | Decomposer']),
  textMatchItem('match-astronomy-planets', 'Planets and characteristic features', 'Astronomy', '5–9 grade', 'The planet connects with a stable distinctive feature.', ['astronomy', 'planets', 'solar system'], ['Mercury | Closest planet to the Sun', 'Earth | Liquid water on the surface', 'Jupiter | The largest planet', 'Saturn | Pronounced ring system']),
  textMatchItem('match-geography-map-lines', 'Lines on the map', 'Geography', '5th–7th grade', 'Map terms and their exact meaning.', ['geography', 'map', 'coordinates'], ['Equator | 0° latitude', 'Prime meridian | 0° longitude', 'Isobar | Same atmospheric pressure', 'Horizontal | Same absolute altitude']),
  textMatchItem('match-history-dates', 'Key historical dates', 'History', '6–10 grade', 'Events are connected to commonly used dates.', ['history', 'dates', 'chronology'], ['Fall of the Western Roman Empire | 476', 'Columbus\'s first voyage to America | 1492', 'Abolition of serfdom in Russia | 1861', 'End of World War II | 1945']),
  textMatchItem('match-social-institutions', 'Public institutions', 'Social Studies', '6–9 grade', 'The institution is connected to the main social function.', ['social studies', 'society', 'institutions'], ['Family | Primary socialization', 'State | Public power', 'Education | Transfer of knowledge and culture', 'Market | Exchange of goods and services']),
  textMatchItem('match-economics-terms', 'Basic Economic Concepts', 'Economics', '8–11 grade, adults', 'Four Terms for Financial Literacy.', ['economics', 'financial literacy', 'terms'], ['Demand | Desire and ability to buy', 'Offer | Products that are ready to sell', 'Inflation | Sustained growth in the general price level', 'Budget | Income and Expense Plan']),
  textMatchItem('match-law-branches', 'Branches of law and relations', 'Law', 'Grades 8–11', 'General areas of regulation without reference to a specific article of law.', ['law', 'branches of law', 'social studies'], ['Civil law | Property and personal non-property relations', 'Labor Law | Employee-employer relations', 'Family Law | Marriage and family relations', 'Criminal Law | Crimes and Punishments']),
  textMatchItem('match-art-techniques', 'Types and techniques of art', 'fine arts', '5th–9th grade, adults', 'Artistic technique is connected to the working principle.', ['art', 'ISO', 'technology'], ['Watercolor | Water based paint', 'Engraving | Impression from processed form', 'Sculpture | Volumetric art form', 'Collage | Composition of connected fragments']),
  textMatchItem('match-music-terms', 'Musical notations', 'Music', '5th–9th grade, adults', 'The designation is connected with the nature of the performance.', ['music', 'tempo', 'dynamics'], ['Allegro | Fast', 'Adagio | Slowly', 'Crescendo | Gradually louder', 'Diminuendo | Gradually quieter']),
  textMatchItem('match-professional-communication', 'Work communication terms', 'Professional courses', 'Adults', 'Modern business vocabulary without cliché.', ['professional courses', 'communication', 'adults'], ['Deadline | Latest time a task must be finished', 'Agenda | List of meeting topics', 'Feedback | Comments that help improve work', 'Stakeholder | Person or group affected by a project']),
  groupItem('group-geometry-lines', 'Lines and relative position', 'Geometry', 'Grade 7', 'Sort pairs of lines by type.', ['geometry', 'straight'], ['Parallel', 'Perpendicular', 'Intersecting'], ['Rails | Parallel', 'Sides of right angles | Perpendicular', 'Diagonals of a square | Perpendicular', 'Clock hands at 12:00 | Matching', 'Two roads at the crossroads | Intersecting'].filter((line) => !line.endsWith('Matching'))),
  groupItem('group-triangles', 'Triangles by their angles', 'Geometry', 'Grade 7', 'Classification according to the size of the angles.', ['geometry', 'triangles', 'angles'], ['Acute-angled', 'Right-angled', 'Obtuse'], ['60°, 60°, 60° | Acute-angled', '30°, 60°, 90° | Right-angled', '25°, 35°, 120° | Obtuse', '50°, 60°, 70° | Acute-angled', '45°, 45°, 90° | Right-angled', '20°, 40°, 120° | Obtuse']),
  groupItem('group-english-time', 'Time markers', 'English', 'B1, adults', 'Past Simple, Present Perfect and Future.', ['English', 'time', 'grammar'], ['Past Simple', 'Present Perfect', 'Future'], ['yesterday | Past Simple', 'already | Present Perfect', 'next week | Future', 'in 2020 | Past Simple', 'yet | Present Perfect', 'tomorrow | Future']),
  groupItem('group-biology', 'Groups of animals', 'Biology', 'Grade 6', 'Vertebrates by main classes.', ['biology', 'animals'], ['Mammals', 'Birds', 'Pisces'], ['Dolphin | Mammals', 'Bat | Mammals', 'Owl | Birds', 'Penguin | Birds', 'Shark | Pisces', 'Scat | Pisces']),
  quizItem('quiz-geometry-angles', 'Angles and sum of angles', 'Geometry', 'Grade 7', 'A short check of the calculations.', ['geometry', 'angles'], ['The sum of the angles of a triangle is... | 90° ; 180° ; 360° | 2 | In Euclidean geometry, the sum of the interior angles of a triangle is 180°.', 'One angle of the triangle is 90°, the other is 35°. The third is equal to... | 45°; 55°; 65° | 2 | 180° − 90° − 35° = 55°.', 'Adjacent angles add up to... | 90° ; 180° ; 360° | 2 | The sides of adjacent angles form an extended angle of 180°.']),
  quizItem('quiz-geometry-area', 'Squares without a hint', 'Geometry', 'Grade 7', 'Three problems to choose a formula.', ['geometry', 'area'], ['The area of ​​a square with side 6 is... | 12; 24; 36 | 3 | S = a² = 36.', 'The area of a 5 × 8 rectangle is... | 13; 26; 40 | 3 | S = a · b = 40.', 'The area of a triangle with base 10 and height 4 is... | 20 ; 40 ; 14 | 1 | S = a h / 2 = 20.']),
  quizItem('quiz-english-meetings', 'English for meetings', 'English', 'B1, adults', 'Natural phrases for business communication.', ['English', 'business english'], ['How to politely ask for clarification? | Could you clarify that? ; Repeat. ; Say again now. | 1 | Could you clarify that? sounds neutral and professional.', 'How to suggest returning to the topic later? | Let us park this for now. ; Forget it. ; It is finished. | 1 | To park a topic means to temporarily postpone discussion.', 'How to confirm the agreement? | We are on the same page. ; I am on a page. ; The page is done. | 1 | The same page means the same understanding of the situation.']),
  quizItem('quiz-history-peter', 'Peter\'s transformations', 'History', 'Grade 8', 'Causes and consequences of reforms.', ['history', 'Peter the Great'], ['What is one of the purposes of the Grand Embassy? | Find allies; Eliminate taxes; Move the capital to Moscow | 1 | The embassy looked for allies and studied European experience.', 'Which city became the new capital? | Kazan; Saint Petersburg ; Novgorod | 2 | St. Petersburg became the capital in 1712.', 'What did the introduction of the Table of Ranks change? | Service promotion; Calendar ; Alphabet | 1 | The report card linked promotion to service and rank.']),
  recallItem('recall-geometry-formulas', 'Area formulas', 'Geometry', 'Grade 7', 'Quick review before the test.', ['geometry', 'formulas', 'area'], ['Area of ​​a triangle | S = a · h / 2 | The height must be drawn to the selected base.', 'Area of ​​a parallelogram | S = a · h | The height is perpendicular to the base.', 'Area of ​​a trapezoid | S = (a + b) h / 2 | a and b are parallel bases.', 'Area of ​​a circle | S = πr² | Don\'t confuse radius with diameter.']),
  recallItem('recall-geometry-theorems', 'Triangle theorems', 'Geometry', 'Grade 8', 'Formulations and conditions of use.', ['geometry', 'theorems', 'triangle'], ['Pythagorean Theorem | c² = a² + b² | Only works for right triangle.', 'Inverse Pythagorean theorem | If c² = a² + b², the angle opposite c to the straight line | Side c should be the largest.', 'Sum of triangle angles | 180° | Useful for finding an unknown angle.']),
  recallItem('recall-english-travel', 'English for travel', 'English', 'A2–B1, adults', 'Phrases for airport and hotel.', ['English', 'travel'], ['Could I check in early? | Is it possible to check in earlier? | Polite question from the hotel reception.', 'Where is the departure gate? | Where is the departure gate? | Departure gate - departure gate.', 'Is breakfast included? | Is breakfast included? | Clarification of booking conditions.', 'I would like to change my booking. | I would like to change my booking. | After would like the infinitive is used.']),
  recallItem('recall-chemistry', 'Acids and bases', 'Chemistry', 'Grade 8', 'Terms, indicators and examples.', ['chemistry', 'acids', 'grounds'], ['Acid | Electrolyte forming H⁺ in solution | For example, HCl or H₂SO₄.', 'Base | Compound with hydroxo group OH | For example, NaOH or Ca(OH)₂.', 'Litmus in acid | Red | In alkali, litmus turns blue.', 'Neutralization | Acid + base → salt + water | Exchange reaction.']),
  mistakeItem('mistake-geometry-area', 'Area of a triangle', 'Geometry', 'Grade 7', 'Find the incorrect divisor in the formula.', ['geometry', 'area'], 'S = a · h / 1', 7, '2', 'The area of ​​a triangle is equal to half the product of the base and the height.', 'You need to divide by two: S = a h / 2.'),
  mistakeItem('mistake-algebra-brackets', 'Minus sign before parentheses', 'Algebra', 'Grade 7', 'Checking for sign changes.', ['algebra', 'brackets'], '7 − ( x − 3 ) = 7 − x − 3', 12, '+', 'When opening the parentheses after the minus sign, the signs inside change.', 'The last sign should become a plus: 7 − x + 3.'),
  mistakeItem('mistake-language-arts', 'Subject-verb agreement', 'Language Arts', 'Grade 7', 'Find and repair an agreement error.', ['language arts', 'grammar'], 'She walk to school daily', 2, 'walks', 'A third-person singular subject takes walks.', 'Correct: She walks to school daily.'),
  mistakeItem('mistake-english', 'Present Perfect', 'English', 'B1, adults', 'Find the wrong form of the verb.', ['English', 'present perfect'], 'I have went there twice', 3, 'gone', 'After have, the third form of the semantic verb is used.', 'Correct: I have gone there twice.'),
  forceItem('force-linear', 'Linear equation balance', 'Grade 7', 'Solving the equation and fine-tuning the vector.', '2x + 4 = 16', '6', 8, 24),
  forceItem('force-brackets', 'Parentheses and power reserves', 'Grade 7', 'Opening the brackets on a heavier stage.', '3(x − 2) = 12', '6', 11, 32),
  forceItem('force-fraction', 'Fractional coefficient', '7th–8th grade', 'Equation with fraction and tight angle tolerance.', 'x / 2 + 5 = 11', '12', 13, 18),
]

export const contentLibrary: ContentLibraryItem[] = [...editorialContentLibrary, ...generatedContentLibrary]

assertContentLibraryIntegrity(contentLibrary)

function assertContentLibraryIntegrity(items: ContentLibraryItem[]) {
  const ids = new Set<string>()

  items.forEach((item) => {
    if (ids.has(item.id)) throw new Error(`Duplicate material id: ${item.id}`)
    ids.add(item.id)

    const errors = validateEditorDraft(item.gameId, item.draft)
    if (errors.length > 0) {
      throw new Error(`Material ${item.id} failed validation: ${errors.join(' ')}`)
    }
  })
}

function normalize(value: string) {
  return value.toLocaleLowerCase('ru').replaceAll('e', 'e').trim()
}

export function searchContentLibrary(gameId: GameId, query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean)

  return contentLibrary.filter((item) => {
    if (item.gameId !== gameId) return false
    if (terms.length === 0) return true
    const haystack = normalize([
      item.title,
      item.subject,
      item.grade,
      item.summary,
      ...item.tags,
    ].join(' '))
    return terms.every((term) => haystack.includes(term))
  })
}
