import type { Activity, WorkshopMission } from './mission-workshop'
import { investigationCases } from './mission-investigations'

type Sort = Extract<Activity, { kind: 'sort' }>
type Proof = Extract<Activity, { kind: 'proof' }>
type Sequence = Extract<Activity, { kind: 'sequence' }>
// These language missions run meaningful procedures rather than treating individual words as machines.
const procedures: Record<string, { brief: string; cards: string[] }> = {
  'eng-hotel': { brief: 'The night desk processes arrivals. Read the booking, confirm late arrival, issue the courtyard room key, then record the check-in.', cards: ['Read the booking', 'Confirm late arrival', 'Issue the courtyard room key', 'Record the check-in'] },
  'eng-luggage': { brief: 'The returns desk must identify the case and confirm the owner before handing it over. Use the messages to check colour and label.', cards: ["Read the owner’s message", 'Match the blue case and red label', 'Ask the owner to confirm', 'Hand over the case'] },
  'eng-interview': { brief: 'Check Room B before preparing it. Invite the candidate only after preparation; record the interview afterwards.', cards: ['Check Room B', 'Prepare the room', 'Invite the candidate', 'Record the interview'] },
  'ela-sign': { brief: 'The navigation service issues a sign: first it checks the floor according to the plan, then draws up an inscription, checks it and installs a sign.', cards: ['Check the floor according to the plan', 'Write the inscription: “Reading room - second floor”', 'Check the inscription at the address', 'Set pointer'] },
  'ela-library': { brief: 'Prepare a route card: read the context of the word “spring”, choose the meaning, mark the object on the diagram and only then issue the card.', cards: ['Read the phrase about water', 'Choose the meaning “water source”', 'Mark the spring on the diagram', 'Issue a route card'] },
}
export type PlayScenario = { mission: WorkshopMission; kind: 'dispatch'; sort: Sort } | { mission: WorkshopMission; kind: 'investigation'; proof: Proof } | { mission: WorkshopMission; kind: 'assembly'; sequence: Sequence; proof: Proof }
const textKinds = new Set(['sequence', 'sort', 'proof'])
export function playScenario(mission: WorkshopMission): PlayScenario | null {
  if (mission.stages.filter(a => textKinds.has(a.kind)).length < 2) return null
  const sort = mission.stages.find((a): a is Sort => a.kind === 'sort')
  const proof = mission.stages.find((a): a is Proof => a.kind === 'proof')
  const sequence = mission.stages.find((a): a is Sequence => a.kind === 'sequence')
  if (investigationCases[mission.id] && proof) return { kind: 'investigation', mission, proof: { ...proof, ...investigationCases[mission.id].proof } }
  if (sort) return { kind: 'dispatch', mission, sort: mission.id === 'math-census' ? { ...sort, brief: 'Prepare an observation log. Take into account measurements, separate gaps and repeated frames. Then count the different birds and choose a location for your backup camera.', groups: ['Take into account', 'Pass', 'Repeat'], cards: [
    { text: 'North · 08:00 · marks A, B, C', group: 0, why: 'The camera was working: this is surveillance with three different tags.' },
    { text: 'North · 08:00 · another shot of bird A', group: 2, why: 'Mark A was already in this series: the second frame does not mean a new bird.' },
    { text: 'Lake · 09:00 · marks B, D', group: 0, why: 'This is a new observation. Check later to see if mark B was found in another area.' },
    { text: 'Forest · 09:00 · camera off', group: 1, why: 'There is no measurement. It cannot be concluded from this that there were no birds.' },
    { text: 'Meadow · 09:00 · camera was working, no birds', group: 0, why: 'The zero birds on the record are the result of an active observation.' },
    { text: 'Copy of the lake file · same B, D and time', group: 2, why: 'A copy of the same record does not add new observations.' },
  ] } : sort }
  if (sequence && proof) { const procedure = procedures[mission.id]; return { kind: 'assembly', mission, sequence: procedure ? { ...sequence, ...procedure, orders: [procedure.cards.map((_, i) => i)] } : sequence, proof } }
  return proof ? { kind: 'investigation', mission, proof } : null
}
export const playNames = { dispatch: 'marshalling yard', investigation: 'Field expertise', assembly: 'Working workshop' }
export const playLoops = {
  dispatch: 'Recognize the cargo → build a route → deliver → restore the station after a jam',
  investigation: 'Explore the archive → bring evidence → connect evidence → deliver a confirmed case',
  assembly: 'Check the materials → assemble a working line → launch → fix the stop and release the batch',
}
export type PlayState = {
  phase: number; done: boolean; mode: string; partner: boolean; autoRun: boolean; pos: number; selected: number;
  program: number[]; cursor: number; running: boolean; tracks: number[]; delivered: number[];
  battery: number; barrier: boolean; repaired: boolean; seen: number[]; bag: number[]; filed: number[];
  links: number[]; checked: number[]; approved: number[]; chain: number[]; power: number[]; product: number; stage: number;
  finished: number[]; feedback: string; fault: number; attempts: number; tick: number;
}
export function initialPlay(game: PlayScenario): PlayState {
  return { phase: 0, done: false, mode: 'solo', partner: false, autoRun: false, pos: 10, selected: -1, program: [], cursor: 0, running: false, tracks: [10], delivered: [], battery: 10, barrier: false, repaired: false, seen: [], bag: [], filed: [], links: game.kind === 'dispatch' ? [] : game.proof.facts.map(() => -1), checked: [], approved: [], chain: [], power: game.kind === 'assembly' ? game.sequence.cards.map(() => 1) : [], product: 0, stage: 0, finished: [], feedback: '', fault: -1, attempts: 0, tick: 0 }
}
export function neighbor(cell: number, dir: number): number | null {
  const x = cell % 5, y = Math.floor(cell / 5)
  if (!Number.isInteger(dir) || dir < 0 || dir > 3 || (dir === 0 && y === 0) || (dir === 1 && x === 4) || (dir === 2 && y === 4) || (dir === 3 && x === 0)) return null
  return cell + [-5, 1, 5, -1][dir]
}
export const docks = [4, 14, 24, 9]
export const sourceCells = [2, 18, 21, 8, 16, 0]
const unique = (a: number[]) => [...new Set(a)]
// Reuse a solved route instead of asking learners to enter it again.
export function fieldRoute(start: number, target: number, allowed: number[] = Array.from({ length: 25 }, (_, i) => i)) {
  const queue = [{ cell: start, route: [] as number[] }], seen = new Set([start])
  while (queue.length) {
    const { cell, route } = queue.shift()!
    if (cell === target) return route
    for (let dir = 0; dir < 4; dir++) {
      const next = neighbor(cell, dir)
      if (next !== null && allowed.includes(next) && !seen.has(next)) { seen.add(next); queue.push({ cell: next, route: [...route, dir] }) }
    }
  }
  return null
}
export function returnDispatch(s: PlayState): PlayState {
  if (s.running || s.selected >= 0 || s.pos === 10) return s
  const program = fieldRoute(s.pos, 10, s.tracks.filter(c => !(c === 12 && s.barrier && !s.repaired)))
  if (!program) return { ...s, feedback: 'The familiar path is blocked. Open a repair passage or create a bypass, then call for a return again.' }
  return { ...s, program, cursor: 0, running: true, fault: -1, feedback: 'The cart returns along the already constructed path.' }
}
export function dispatchOnBuiltRoute(s: PlayState, port: number): PlayState {
  if (s.running || s.selected < 0) return s
  const target = docks[port]
  const program = fieldRoute(s.pos, target, s.tracks.filter(c => !(c === 12 && s.barrier && !s.repaired) && (!docks.includes(c) || c === target || c === s.pos)))
  if (!program?.length) return { ...s, feedback: 'There is no open familiar path to this port yet. First, plot the route using arrows; the following cargo can be sent via it with one command.' }
  return { ...s, program, cursor: 0, running: true, fault: -1, attempts: s.attempts + 1, feedback: 'The cargo travels to the port of your choice along a familiar route.' }
}
export function investigationRoute(game: Extract<PlayScenario, { kind: 'investigation' }>, s: PlayState, target: number): PlayState {
  if (s.running || s.done) return s
  const sealed = caseSealed(game, s)
  if (target === 24 && !sealed) return { ...s, feedback: 'First check the evidence for the final solution.' }
  const program = fieldRoute(s.pos, target, Array.from({ length: 25 }, (_, i) => i).filter(i => i !== 24 || sealed))
  if (!program?.length) return s
  return { ...s, program, cursor: 0, running: true, feedback: 'I go to the chosen place. Documents and decisions are saved.' }
}
export function investigationDestination(game: Extract<PlayScenario, { kind: 'investigation' }>) {
  return game.mission.id === 'eng-news' ? 'Editorial' : game.mission.id === 'hist-sources' ? 'Historical Council' : 'Publishing house'
}
export function dispatchStep(game: Extract<PlayScenario, { kind: 'dispatch' }>, s: PlayState): PlayState {
  if (!s.running || s.cursor >= s.program.length) return { ...s, running: false }
  const pos = neighbor(s.pos, s.program[s.cursor]), blocked = s.barrier && !s.repaired && pos === 12
  if (pos === null || blocked) return { ...s, running: false, fault: s.pos, feedback: blocked ? 'The collapse blocked the central cell. Create a bypass or restore an already built area.' : 'The cart rested on the edge of the field. Correct the route; the cargo remained in place.' }
  const cost = s.tracks.includes(pos) ? 0 : 1
  if (s.battery < cost) return { ...s, running: false, feedback: 'The charge has run out. Use the paved paths or return the cargo to the warehouse for a new try.' }
  const next = { ...s, pos, battery: s.battery - cost, cursor: s.cursor + 1, tracks: unique([...s.tracks, pos]), tick: s.tick + 1, fault: -1 }
  if (s.selected >= 0 && docks.slice(0, game.sort.groups.length).includes(pos)) {
    const item = game.sort.cards[s.selected], target = docks[item.group]
    if (pos !== target) return { ...next, running: false, fault: pos, feedback: `Acceptance is closed for this cargo. ${item.why} The trolley remains at the wrong compartment - correct the path.` }
    const delivered = unique([...s.delivered, s.selected]), barrier = delivered.length >= 2
    return { ...next, delivered, selected: -1, running: false, program: [], cursor: 0, barrier, feedback: `Cargo accepted: ${item.text}. ${delivered.length === game.sort.cards.length ? 'All cargo has been distributed. Return the cart with one command to close out the shift.' : barrier && !s.barrier ? 'There is a collapse at the station: the center is closed. The old rails and the delivered goods have been preserved.' : 'You can return an empty cart with one command along familiar rails.'}` }
  }
  if (pos === 10 && s.selected < 0) {
    const sorted = s.delivered.length === game.sort.cards.length, census = game.mission.id === 'math-census'
    return { ...next, running: false, battery: 10, program: [], cursor: 0, done: sorted && !census, phase: sorted && census ? 2 : s.phase, feedback: sorted ? census ? 'The log has been cleared. Now count the different birds and decide where to restore the observation.' : 'All the goods are in the right compartments, the trolley has returned to the warehouse.' : 'The warehouse has loaded the cart. Select the next load; constructed paths consume zero charge.' }
  }
  const running = next.cursor < next.program.length
  return { ...next, running, program: running ? next.program : [], cursor: running ? next.cursor : 0, feedback: running ? 'The cart follows the route.' : 'The route is completed. You can add commands from the current cell.' }
}
export function moveInvestigator(game: Extract<PlayScenario, { kind: 'investigation' }>, s: PlayState, dir: number): PlayState {
  const pos = neighbor(s.pos, dir)
  if (pos === null) return s
  const sealed = caseSealed(game, s)
  if (pos === 24 && !sealed) return { ...s, fault: 24, feedback: 'The final decision is not yet supported by all the evidence.' }
  const source = sourceCells.indexOf(pos), found = source >= 0 && source < game.proof.sources.length
  const next = { ...s, pos, tick: s.tick + 1, tracks: unique([...s.tracks, pos]), fault: -1, feedback: found ? 'The source has been found. Examine the document and decide whether it is needed for output.' : 'The researcher moved.' }
  if (pos === 10) return { ...next, battery: 10, filed: unique([...s.filed, ...s.bag]), bag: [], feedback: 'The documents are transferred to the evidence board. The power reserve has been restored.' }
  return { ...next, done: pos === 24 && sealed, feedback: pos === 24 && sealed ? investigationCases[game.mission.id].outcome : next.feedback }
}
export function examineLink(game: Exclude<PlayScenario, { kind: 'dispatch' }>, s: PlayState): PlayState {
  const fact = s.checked.length, source = s.links[fact], doc = game.proof.sources[source]
  const price = unique(s.links.filter(i => i >= 0)).reduce((sum, i) => sum + (game.proof.sources[i]?.cost ?? 0), 0)
  if (price > game.proof.budget) return { ...s, running: false, feedback: `It is worth checking the selected sources ${price}, budget ${game.proof.budget}. One document can confirm several facts: reassemble the connections.` }
  if (!doc || !s.filed.includes(source)) return { ...s, running: false, fault: fact, feedback: `For "${game.proof.facts[fact]}"We need a source delivered to the archive. Opening the text alone is not enough.` }
  if (s.mode === 'coop' && !s.approved.includes(source)) return { ...s, running: false, fault: fact, feedback: 'The partner has not yet verified this document. Discuss its contents and request permission.' }
  if (!doc.supports.includes(fact)) return { ...s, running: false, fault: fact, feedback: `The connection is broken: "${doc.name}"does not confirm"${game.proof.facts[fact]}" Correct the link, the remaining documents remain in the file.` }
  const checked = [...s.checked, fact], complete = checked.length === game.proof.facts.length
  return { ...s, checked, tick: s.tick + 1, fault: -1, running: !complete, feedback: complete ? game.kind === 'assembly' ? 'Materials have been verified. Now you can run the assembled line.' : 'The grounds have been verified. Now select the output that you can sign.' : `Fact confirmed: ${game.proof.facts[fact]}. The next node is waiting for verification.` }
}
export function assemblyStep(game: Extract<PlayScenario, { kind: 'assembly' }>, s: PlayState): PlayState {
  if (!s.running) return s
  const order = game.sequence.orders.find(o => s.chain.every((item, i) => item === o[i]))
  const part = s.chain[s.stage]
  if (part === undefined) return { ...s, running: false, fault: s.stage, feedback: 'The line goes dead. Add the missing operation.' }
  const prefixOK = game.sequence.orders.some(o => s.chain.slice(0, s.stage + 1).every((item, i) => item === o[i]))
  if (!prefixOK) return { ...s, running: false, fault: s.stage, feedback: `Stop before "${game.sequence.cards[part]}": the semantic or temporal condition is not met. Rearrange the stations; operations that have already passed will be preserved if their order is not changed.` }
  const needed = s.product === 1 && s.stage === 1 ? 2 : 1
  if (s.power[part] < needed) return { ...s, running: false, fault: s.stage, feedback: 'The second batch took two jobs at this station. Transfer here a free worker or a worker from an already completed station.' }
  if (s.stage === 0 && s.checked.length !== game.proof.facts.length) return { ...s, running: false, fault: 0, feedback: 'The input material has not been verified. Confirm all order conditions with sources.' }
  const stage = s.stage + 1, complete = order && stage === order.length
  if (complete) {
    const product = s.product + 1, done = product === 2
    return { ...s, product, stage: done ? stage : 0, finished: [...s.finished, s.product], running: false, done, fault: -1, tick: s.tick + 1, feedback: done ? 'Both parties followed your line. Proven materials, order and workspaces worked together.' : 'The first issue is ready. The line has been preserved. In the second release, station 2 requires two workers: redistribute the team and start again.' }
  }
  return { ...s, stage, fault: -1, tick: s.tick + 1, feedback: `Done: ${game.sequence.cards[part]}. The result was sent to the next station.` }
}
export function playStep(game: PlayScenario, s: PlayState): PlayState {
  if (game.kind === 'dispatch') return dispatchStep(game, s)
  if (game.kind === 'investigation' && s.running && s.cursor < s.program.length) {
    const next = moveInvestigator(game, s, s.program[s.cursor]), cursor = s.cursor + 1
    const running = !next.done && cursor < s.program.length && next.pos !== s.pos
    return { ...next, cursor: running ? cursor : 0, program: running ? s.program : [], running }
  }
  if (game.kind === 'assembly' && s.checked.length === game.proof.facts.length) return assemblyStep(game, s)
  if (s.checked.length < game.proof.facts.length && s.running) return examineLink(game, s)
  return { ...s, running: false }
}

export function caseSealed(game: Extract<PlayScenario, { kind: 'investigation' }>, s: PlayState) {
  return s.checked.length === game.proof.facts.length && s.product === 1
}
export function finishCensus(game: PlayScenario, s: PlayState): PlayState {
  if (game.kind !== 'dispatch' || game.mission.id !== 'math-census' || s.phase !== 2 || s.delivered.length !== game.sort.cards.length) return s
  if (s.chain[0] !== 4) return { ...s, feedback: 'Count different marks, not pictures and not the sum by area: B is found both in the north and near the lake.', attempts: s.attempts + 1 }
  if (s.selected !== 2) return { ...s, feedback: 'A zero result from a working camera is a known observation. Where was there no measurement at all? The backup camera is needed exactly there.', attempts: s.attempts + 1 }
  return { ...s, done: true, feedback: 'There are at least 4 different birds in the magazine. The forest has not yet been observed: the backup camera has been sent there. The miss did not become a false zero, and the repeats did not inflate the number of birds.' }
}
export function submitCase(game: Extract<PlayScenario, { kind: 'investigation' }>, s: PlayState): PlayState {
  if (s.checked.length !== game.proof.facts.length) return { ...s, feedback: 'First, back up your reasons with documents.' }
  const entry = investigationCases[game.mission.id]
  if (s.selected !== entry.answer) return { ...s, product: 0, feedback: entry.why, attempts: s.attempts + 1 }
  return { ...s, product: 1, feedback: 'The conclusion has been signed. Transfer the matter to the recipient on the card.' }
}
