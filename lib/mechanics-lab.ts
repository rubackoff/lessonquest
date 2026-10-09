export const mechanics = [
  { id: 'balance', title: 'Weights of equations', subject: 'Algebra', audience: '6–8 grade', action: 'Change both sides of the scale until only one unknown remains.', question: 'Is it interesting to look for a shorter solution?' },
  { id: 'machine', title: 'Function machine', subject: 'Algebra', audience: '6–9 grade', action: 'Create a chain of operations that will fulfill all orders.', question: 'Do you want to rearrange operations and test a hypothesis?' },
  { id: 'bridge', title: 'Two spans', subject: 'Geometry', audience: '5th–7th grade', action: 'Distribute the limited supply of parts between two bridges.', question: 'Are there interesting choices when supplies are limited?' },
  { id: 'plot', title: 'Platform and fence', subject: 'Geometry', audience: '5th–8th grade', action: 'Build a platform out of cages and stock up on the fence stock.', question: 'Is it interesting to change the shape while maintaining the area?' },
  { id: 'case', title: 'Bureau of Investigation', subject: 'English', audience: 'A2–B1 teenagers and adults', action: 'Question the witnesses and prove your conclusion with two facts.', question: 'Do you want to find out history by reading in English?' },
  { id: 'dispatch', title: 'Order Manager', subject: 'English', audience: 'A2–B1 teenagers and adults', action: 'Distribute rooms, meals and delivery according to customer requests.', question: 'Is it fun to look for a plan that suits everyone?' },
  { id: 'route', title: 'Guide and Explorer', subject: 'Geometry + English', audience: '5th–8th grade · together', action: 'The tutor knows the obstacles. The student draws up a route based on his explanation.', question: 'Is a useful conversation emerging rather than dictating an answer?' },
  { id: 'repair', title: 'Find the breakdown', subject: 'Algebra', audience: '7–11 grade · basic level', action: 'Find the first mistake in someone else\'s solution and fix the chain.', question: 'Is testing reasoning more exciting than a typical example?' },
] as const
export type MechanicId = typeof mechanics[number]['id']
export type Check = { ok: boolean; message: string }

export const scenarios: Record<MechanicId, { story: string; chapters: string[]; briefs: string[]; endings: string[] }> = {
  balance: { story: 'The cargo lift stopped. To send a team to the lighthouse, you need to determine the mass of unknown batteries at three weighing posts.', chapters: ['Lower platform', 'Counter cargo', 'Sensor calibration'], briefs: ['Three batteries and a 6 kg load balance 21 kg. There are 3 actions to try; cancellation returns the charge.', 'Both bowls have the same batteries. Release the unknown in 3 actions or less.', 'The sensor takes into account containers with a minus sign. 4 steps are enough for calibration.'], endings: ['The battery mass has been found. The lower platform missed the load.', 'The counter load is calculated. The lift reached the next post.', 'The last sensor has been calibrated. The team reached the lighthouse.'] },
  machine: { story: 'The station receives distorted signals. Your task is to assemble a handler that transforms the entire stream, rather than guessing just one answer.', chapters: ['First signal', 'Remove offset', 'Eco mode'], briefs: ['The three sensors report different values. Build a common handler from two modules.', 'After switching the antenna, the coefficient and offset changed. The old order of modules is no longer suitable.', 'The new antenna operates with less power. There are three sockets, but you don\'t have to connect them all.'], endings: ['The three sensors are matched. The first antenna is working.', 'Bias has been removed for the entire range. Communication has been restored.', 'The station receives signals in economy mode. All channels have been restored.'] },
  bridge: { story: 'The expedition carries equipment through two road breaks. The team has a limited supply of sections and fastenings; an unsuccessful design can be dismantled.', chapters: ['Road to the river', 'Washed area', 'Last transition'], briefs: ['It is necessary to cover 6 and 8 meters. Choose which span to collect first: they have a common supply.', 'The new section has spans of 7 and 9 meters. Think about who to give the longest details to.', 'There are 9 and 11 meters left to cover the camp. There are five mounts available, but there are still only two sections of each length.'], endings: ['Both spans passed the test. The equipment was transported to the river.', 'The washed area was restored, the team took the next load.', 'The road is open all the way to the camp. All equipment has been delivered.'] },
  plot: { story: 'The camp needs fenced areas. Material is limited: a large, elongated figure may require too much fencing.', chapters: ['General camp', 'Nursery', 'Spare warehouse'], briefs: ['Place 12 square meters and fit within 14 meters of fence. Start with any shape.', 'The nursery needs 8 m², but only 12 m of fencing remains. Various forms are possible.', 'The warehouse requires 10 m² and no more than 14 m of fencing. Cell transfer changes the boundary even if the area remains the same.'], endings: ['The camp is ready: there is enough space, the fence is closed.', 'The nursery is fenced. All cells are connected, no extra material is needed.', 'The warehouse is completed. Three sites were built within reserves.'] },
  case: { story: 'You open a small lost and found office. Witnesses speak English, remember different things, and sometimes talk about similar but foreign objects.', chapters: ['Parcel L7', 'The missing key', 'Change of plans'], briefs: ['Find out where the package ended up after the goods were moved. Choose two related pieces of evidence.', 'Check the key return time and the rules for storing it. One similar clue in the reading is not enough.', 'The old prompt conflicts with the new condition. Decide which meeting place is open today.'], endings: ['The package has been found. The client has been given an address with confirmation.', 'The key was found by return time, not by guesswork.', 'The group received an actual meeting place. The bureau closed all three cases.'] },
  dispatch: { story: 'You run the service of a small guest house: check in guests, collect lunches and schedule deliveries. There will be enough resources for everyone only with an agreed plan.', chapters: ['Check-in', 'Lunch shift', 'Delivery windows'], briefs: ['Three rooms, three requests. Before sending the plan, assignments can be changed without loss.', 'Sam has a choice, but Jo has a strict limitation. One convenient solution could leave another customer without lunch.', 'Each courier\'s time is available once. Look at the narrowest intervals first.'], endings: ['The guests are settled, everyone has received a suitable room.', 'Everyone received a suitable lunch. The single portion was not promised twice.', 'Couriers are assigned to appropriate windows. The work shift is over.'] },
  route: { story: 'The researcher goes to the radio station. The guide has a map of obstacles, the student has a route remote control. It will not be possible to pass without an exchange of information.', chapters: ['First connection', 'Long wall', 'Bypassing a dead end'], briefs: ['The guide describes the target and dangerous cells. The student draws up and checks his plan.', 'The direct path is blocked by a wall. Find out where its edge is and keep it within eight teams.', 'A short direction leads to a dead end. Sometimes you first need to move away from your goal in order to reach it.'], endings: ['The researcher reached the first repeater.', 'The wall is bypassed, the connection with the conductor is preserved.', 'The radio station has been found. The plan was drawn up by the student, the guide helped with information.'] },
  repair: { story: 'The automatic checker messed up the calculations for three mechanisms. Finding the wrong answer is not enough: you need to detect the first broken transition and restore the reasoning.', chapters: ['Invalid transfer', 'Hidden parenthesis', 'Last step'], briefs: ['The first lines may be correct. Find the moment when equality ceased to exist.', 'The error applies to all further calculations. Don\'t treat just the last line.', 'This time almost all the decisions are correct. Check the last transition and the result by substitution.'], endings: ['The first mechanism received the correct calculation.', 'The error in opening parentheses has been corrected at the source.', 'All calculations have been restored. You checked both the solution and the answer.'] },
}

export type Equation = { a: number; b: number; c: number; d: number }
export const balances: Equation[] = [{ a: 3, b: 6, c: 0, d: 21 }, { a: 2, b: 5, c: 1, d: 11 }, { a: 5, b: -4, c: 2, d: 8 }]
export function transformEquation(e: Equation, op: string, n: number, term: string): Equation | null {
  if (!Number.isInteger(n) || n < 1 || n > 20) return null
  const next = { ...e }, sign = op === 'subtract' ? -1 : 1
  if (op === 'add' || op === 'subtract') {
    if (term === 'x') { next.a += sign * n; next.c += sign * n } else { next.b += sign * n; next.d += sign * n }
  } else if (op === 'multiply' || op === 'divide') {
    for (const key of ['a', 'b', 'c', 'd'] as const) next[key] *= op === 'divide' ? 1 / n : n
  } else return null
  if (Object.values(next).some(v => Math.abs(v) > 10000 || Math.abs(v - Math.round(v)) > 1e-8)) return null
  return Object.fromEntries(Object.entries(next).map(([k, v]) => [k, Math.round(v)])) as Equation
}
export const isolated = (e: Equation) => e.a === 1 && e.b === 0 && e.c === 0 || e.c === 1 && e.d === 0 && e.a === 0
export function expression(a: number, b: number) {
  const variable = a === 0 ? '' : a === 1 ? 'x' : a === -1 ? '−x' : `${a}x`
  return !variable ? String(b) : !b ? variable : `${variable} ${b > 0 ? '+' : '−'} ${Math.abs(b)}`
}

export const operations = [
  { id: 'add2', label: '+ 2', apply: (x: number) => x + 2 }, { id: 'mul3', label: '× 3', apply: (x: number) => x * 3 },
  { id: 'sub4', label: '− 4', apply: (x: number) => x - 4 }, { id: 'mul2', label: '× 2', apply: (x: number) => x * 2 },
  { id: 'sub3', label: '− 3', apply: (x: number) => x - 3 }, { id: 'add4', label: '+ 4', apply: (x: number) => x + 4 },
  { id: 'div2', label: '÷ 2', apply: (x: number) => x / 2 }, { id: 'sub1', label: '− 1', apply: (x: number) => x - 1 },
]
export const machineOrders = [
  { inputs: [1, 2, 4], outputs: [9, 12, 18], slots: 2, bank: ['add2', 'mul3', 'sub4', 'mul2'], hint: 'The difference between adjacent inputs triples. But what should you do before multiplying?' },
  { inputs: [1, 3, 5], outputs: [-1, 3, 7], slots: 2, bank: ['mul2', 'sub3', 'add2', 'div2'], hint: 'When the input increases by 2, the output increases by 4. After scaling, a shift is needed.' },
  { inputs: [2, 6, 10], outputs: [2, 4, 6], slots: 3, bank: ['add4', 'div2', 'sub1', 'mul3', 'sub4'], hint: 'Try adding 4, halving and then subtracting 1. Check each input.' },
]
export const machineValue = (input: number, chain: string[]) => chain.reduce((x, id) => operations.find(o => o.id === id)!.apply(x), input)
export function checkMachine(round: number, chain: string[]): Check {
  const task = machineOrders[round]
  if (!chain.length || chain.length > task.slots || new Set(chain).size !== chain.length || chain.some(id => !task.bank.includes(id))) return { ok: false, message: 'Assemble a chain of available parts within the number of nests.' }
  const i = task.inputs.findIndex((x, i) => Math.abs(machineValue(x, chain) - task.outputs[i]) > .00001)
  return i < 0 ? { ok: true, message: 'All three orders were completed in one chain. The order of operations has been found.' } : { ok: false, message: `To login ${task.inputs[i]} received the car ${machineValue(task.inputs[i], chain)}, and the order requires ${task.outputs[i]}. Check the order of operations.` }
}

export const bridgeTasks = [{ goals: [6, 8], limit: 4 }, { goals: [7, 9], limit: 4 }, { goals: [9, 11], limit: 5 }]
export const bridgeStock = [2, 3, 4, 5, 6]
export function checkBridge(round: number, spans: number[][]): Check {
  const { goals, limit } = bridgeTasks[round], used = spans.flat()
  if (used.some(n => !bridgeStock.includes(n)) || bridgeStock.some(n => used.filter(v => v === n).length > 2)) return { ok: false, message: 'There are only two parts available for each length.' }
  const wrong = goals.findIndex((g, i) => spans[i].reduce((a, b) => a + b, 0) !== g)
  if (wrong >= 0) return { ok: false, message: `Span ${wrong + 1}: now ${spans[wrong].reduce((a, b) => a + b, 0)} m, need ${goals[wrong]} m. Move or replace parts.` }
  return used.length <= limit ? { ok: true, message: 'Both spans converge with supports, there are enough fastenings. You can pass!' } : { ok: false, message: `Lengths are correct but used ${used.length} details with limit ${limit}. Find an assembly with fewer joints.` }
}

export const plotTasks = [{ area: 12, fence: 14 }, { area: 8, fence: 12 }, { area: 10, fence: 14 }]
export function plotMetrics(cells: number[]) {
  const set = new Set(cells.filter(n => Number.isInteger(n) && n >= 0 && n < 25))
  const neighbors = (n: number) => [n % 5 > 0 ? n - 1 : -1, n % 5 < 4 ? n + 1 : -1, n >= 5 ? n - 5 : -1, n < 20 ? n + 5 : -1]
  const perimeter = [...set].reduce((sum, n) => sum + neighbors(n).filter(v => !set.has(v)).length, 0)
  const seen = new Set<number>(), pending = set.size ? [set.values().next().value!] : []
  while (pending.length) { const n = pending.pop()!; if (seen.has(n)) continue; seen.add(n); for (const next of neighbors(n)) if (set.has(next) && !seen.has(next)) pending.push(next) }
  return { area: set.size, perimeter, connected: seen.size === set.size && set.size > 0 }
}
export function checkPlot(round: number, cells: number[], prediction: number): Check {
  const target = plotTasks[round], actual = plotMetrics(cells)
  if (!actual.connected) return { ok: false, message: 'The cells must be connected by sides into one area. Touching the corners is not enough.' }
  if (actual.area !== target.area) return { ok: false, message: `Area now ${actual.area} m², but needed ${target.area} m². Each cell is 1 m².` }
  if (actual.perimeter !== prediction) return { ok: false, message: `Bypassing the border gives ${actual.perimeter} m. The inner sides of neighboring cells are not included in the fence. Recalculate your forecast.` }
  return actual.perimeter <= target.fence ? { ok: true, message: `Area ${actual.area} m², fence ${actual.perimeter} m. The conditions are met, your form is suitable.` } : { ok: false, message: `Needed ${actual.perimeter} m fence, available ${target.fence}. Make the shape more compact while maintaining the area.` }
}

export type CaseClue = { source: string; question: string; text: string }
export const cases: { title: string; goal: string; options: string[]; answer: number; required: number[]; clues: CaseClue[]; hint: string }[] = [
  { title: 'Parcel L7', goal: 'It is 2 pm. Where is parcel L7 now?', options: ['At the lighthouse', 'In the workshop', 'At the port'], answer: 1, required: [0, 4], hint: 'Connect location L7 before noon with the rule for moving parcels after noon.', clues: [
    { source: 'Port clerk', question: 'What happened to L7?', text: 'L7 is the blue parcel. It stayed at the port until noon.' },
    { source: 'Port clerk', question: 'When did the ferry arrive?', text: 'The ferry arrived at 9 am with two parcels.' },
    { source: 'Driver', question: 'Which parcel did you deliver?', text: 'I delivered the red parcel M2 to the lighthouse.' },
    { source: 'Driver', question: 'Did you move the blue parcel?', text: 'No. I only moved the red parcel before noon.' },
    { source: 'Keeper', question: 'What changed after noon?', text: 'At 1 pm, all parcels still at the port were moved into the workshop.' },
    { source: 'Keeper', question: 'Is the lighthouse open?', text: 'The lighthouse is open until 6 pm.' },
  ] },
  { title: 'The missing key', goal: 'It is noon. Where should we look for key K3?', options: ['In the blue box', 'In the desk drawer', 'In the guest room'], answer: 0, required: [1, 2], hint: 'The K3 return time determines which retention rule to apply.', clues: [
    { source: 'Receptionist', question: 'Who borrowed K3?', text: 'Rita borrowed K3 in the morning.' },
    { source: 'Receptionist', question: 'When was K3 returned?', text: 'Rita returned K3 at 11 am today.' },
    { source: 'Cleaner', question: 'Where do returned keys go?', text: 'Keys returned after 10 am go into the blue box. Earlier returns go into the desk drawer.' },
    { source: 'Cleaner', question: 'When do you clean rooms?', text: 'I clean the guest rooms at 9 am.' },
    { source: 'Guest', question: 'Did you see a key?', text: 'I saw K1 in the desk drawer at 8 am.' },
    { source: 'Guest', question: 'Are you staying tonight?', text: 'No, I am leaving this afternoon.' },
  ] },
  { title: 'A change of plan', goal: 'The forecast is confirmed. Where will the reading group meet today?', options: ['In the garden', 'In the library', 'In the laboratory'], answer: 1, required: [0, 5], hint: 'Find the conditional rule of the meeting and today\'s forecast. The old invitation may not take the weather into account.', clues: [
    { source: 'Host', question: 'What is the plan for bad weather?', text: 'If it rains, we meet in the library. Otherwise, we meet in the garden.' },
    { source: 'Host', question: 'When does the group meet?', text: 'The group meets after the laboratory closes at 3 pm.' },
    { source: 'Old invitation', question: 'Where was the original meeting?', text: 'Written last week: please come to the garden.' },
    { source: 'Old invitation', question: 'What should we bring?', text: 'Bring a book you would like to discuss.' },
    { source: 'Weather desk', question: 'What was the weather yesterday?', text: 'Yesterday was warm and sunny.' },
    { source: 'Weather desk', question: 'Will it rain today?', text: 'Yes. Rain is expected throughout this afternoon.' },
  ] },
]
export function checkCase(round: number, answer: number, evidence: number[]): Check {
  const task = cases[round]
  if (answer !== task.answer) return { ok: false, message: 'The conclusion contradicts the information. Check the time, subject and condition: a similar fact could relate to another case.' }
  return evidence.length === 2 && task.required.every(id => evidence.includes(id)) ? { ok: true, message: 'The conclusion is confirmed by two necessary facts. This is a rationale, not a lucky guess.' } : { ok: false, message: 'The conclusion is appropriate, but the chosen facts do not prove it. Two links are needed: the initial state and the rule or change.' }
}

export const dispatches = [
  { title: 'Guest house', resources: ['Harbour: twin beds, quiet, £60', 'Garden: double bed, garden view, £60', 'Loft: single bed, private bathroom, £45'], clients: [
    { name: 'Ana and Leo', request: 'We need separate beds and a quiet room.', allowed: [0] },
    { name: 'Ben', request: 'I am travelling alone. I need my own bathroom and can spend at most £50.', allowed: [2] },
    { name: 'Carla', request: 'I would like a double bed and a view of the garden.', allowed: [1] },
  ], hint: 'Twin beds - separate beds; double bed - one double bed. At most specifies the upper bound.' },
  { title: 'Lunch service', resources: ['Salad: vegetarian, no milk', 'Pasta: vegetarian, contains milk', 'Chicken rice: contains meat, no milk'], clients: [
    { name: 'Sam', request: 'Any vegetarian meal is fine for me.', allowed: [0, 1] },
    { name: 'Jo', request: 'I do not eat meat or dairy products.', allowed: [0] },
    { name: 'Kim', request: 'I would like a meal with chicken.', allowed: [2] },
  ], hint: 'Start with the most stringent request. If you give the only dish without meat and milk to Sam, what will be left for Jo?' },
  { title: 'Delivery schedule', resources: ['10:00 delivery', '12:00 delivery', '15:00 delivery'], clients: [
    { name: 'Lea', request: 'Please arrive before 1 pm.', allowed: [0, 1] },
    { name: 'Noor', request: 'I will only be home after 2 pm.', allowed: [2] },
    { name: 'Alex', request: 'Come after 11 am but before 1 pm.', allowed: [1] },
  ], hint: 'First select the Alex window, then Noor. Before and after do not include a named boundary.' },
]
export function checkDispatch(round: number, choices: number[]): Check {
  const task = dispatches[round]
  if (choices.length !== 3 || choices.some(n => n < 0 || n > 2)) return { ok: false, message: 'Assign an option to each client.' }
  if (new Set(choices).size !== 3) return { ok: false, message: 'One resource is assigned to multiple clients. Each room, portion or delivery is available once.' }
  const wrong = task.clients.findIndex((c, i) => !c.allowed.includes(choices[i]))
  return wrong < 0 ? { ok: true, message: 'All three requests completed simultaneously. Resources do not overlap.' } : { ok: false, message: `${task.clients[wrong].name}: re-read "${task.clients[wrong].request}" The assigned option does not satisfy this condition.` }
}

export type Point = [number, number]
export const directions = { N: [0, 1], E: [1, 0], S: [0, -1], W: [-1, 0] } as const
export type Direction = keyof typeof directions
export const routes: { start: Point; end: Point; blocked: Point[]; max: number }[] = [
  { start: [0, 0], end: [4, 2], blocked: [[2, 0], [2, 1]], max: 8 },
  { start: [0, 2], end: [4, 2], blocked: [[2, 1], [2, 2], [2, 3]], max: 8 },
  { start: [1, 0], end: [3, 4], blocked: [[1, 2], [2, 2], [3, 2], [4, 2]], max: 8 },
]
export function checkRoute(round: number, program: Direction[]) {
  const task = routes[round], path: Point[] = [[...task.start]], same = (a: Point, b: Point) => a[0] === b[0] && a[1] === b[1]
  if (!program.length || program.length > task.max) return { ok: false, message: `Need a program from 1 to ${task.max} steps.`, path }
  for (let i = 0; i < program.length; i++) {
    const delta = directions[program[i]], previous = path.at(-1)!
    if (!delta) return { ok: false, message: 'Unknown direction.', path }
    const next: Point = [previous[0] + delta[0], previous[1] + delta[1]]
    if (next.some(v => v < 0 || v > 4)) return { ok: false, message: `Step ${i + 1} goes out of the field. The program is saved: correct the command.`, path }
    if (task.blocked.some(p => same(p, next))) return { ok: false, message: `On the move ${i + 1} obstacle in (${next.join('; ')}). Discuss the workaround and correct the program.`, path }
    path.push(next)
  }
  return same(path.at(-1)!, task.end) ? { ok: true, message: 'The route reached its destination without collisions. The tutor transferred the data, the student built the program.', path } : { ok: false, message: `Stayed at (${path.at(-1)!.join('; ')}). Check the coordinates of the target with the guide.`, path }
}

export const repairs = [
  { task: '2(x + 3) = 14', steps: ['2x + 6 = 14', '2x = 20', 'x = 10'], wrong: 1, solution: 4, hint: 'To remove +6 on the left, you also need to subtract 6 from the right side.' },
  { task: '5(x − 2) = 15', steps: ['5x − 2 = 15', '5x = 17', 'x = 3,4'], wrong: 0, solution: 5, hint: 'The factor in front of the parentheses applies to each term inside them.' },
  { task: '4x + 8 = 2x + 20', steps: ['2x + 8 = 20', '2x = 12', 'x = 8'], wrong: 2, solution: 6, hint: 'Up to the last line the equalities are true. What happens when you divide both sides by 2?' },
]
export function checkRepair(round: number, row: number, a: number, b: number, right: number, answer: number): Check {
  const task = repairs[round]
  if (row !== task.wrong) return { ok: false, message: 'The first erroneous line is needed. The later line may only continue the earlier error.' }
  if (![a, b, right, answer].every(Number.isFinite) || a === 0 || Math.abs(a * task.solution + b - right) > .0001) return { ok: false, message: 'The location of the breakdown has been found. But the new equality must preserve the solution to the original equation. Check the action with both parts.' }
  return Math.abs(answer - task.solution) < .0001 ? { ok: true, message: 'The first error was found, equality was restored, and the final value was checked.' } : { ok: false, message: 'Corrected equality is fine. Now recalculate the final x and substitute it into the original condition.' }
}
