export const luggagePeople = ['Maya', 'Sam', 'Leo', 'Noor', 'Unclaimed']
export const luggageFacts = ['Colour', 'Size', 'Wheels', 'Strap', 'Sticker', 'Inside the front pocket']
export const luggageBags = [
  { colour: 'blue', size: 'small', wheels: 2, strap: 'red', sticker: 'moon', pocket: 'a yellow scarf' },
  { colour: 'blue', size: 'large', wheels: 4, strap: 'red', sticker: 'star', pocket: 'a green notebook' },
  { colour: 'green', size: 'small', wheels: 2, strap: 'yellow', sticker: 'moon', pocket: 'blue gloves' },
  { colour: 'blue', size: 'small', wheels: 4, strap: 'yellow', sticker: 'sun', pocket: 'a red notebook' },
  { colour: 'red', size: 'large', wheels: 4, strap: 'black', sticker: 'star', pocket: 'a white hat' },
]
export const luggageClaims = [
  { owner: 0, bag: 0, collector: 0, brief: 'My case is small and blue, with a red strap. Please check the front pocket with me before handing it over.', translation: 'My suitcase is small and blue, with a red strap. Check the front pocket with me before issuing.', replies: ['There is a yellow scarf in the front pocket. You may open that pocket to check.', 'I will collect it myself. My name is Maya.', 'It has two wheels and a moon sticker.'] },
  { owner: 1, bag: 1, collector: 1, brief: 'Mine is blue with a red strap too, but larger than Maya’s. The loose labels may have been mixed up. Please identify the case before printing a new label.', translation: 'Mine is also blue with a red belt, but larger than the Maya suitcase. The removable tags may have gotten mixed up. Identify the suitcase before printing a new tag.', replies: ['There is a green notebook in the front pocket. You may check it.', 'I am Sam, and I will collect my own case.', 'Mine has four wheels and a star sticker.'] },
  { owner: 2, bag: 2, collector: 3, brief: 'My small green case is a sealed gift. Do not open its pockets: check the two wheels and moon sticker. My friend will collect it — ask who. Keep my name, Leo, as the owner.', translation: 'The little green suitcase is a sealed gift. Pockets must not be opened: check the two wheels and the moon sticker. A friend will pick it up - find out who. The owner on the tag must remain Leo.', replies: ['It is a sealed gift. Please leave the pockets closed; use the wheels and sticker instead.', 'Noor will collect it for me. I am still the owner: Leo.', 'It has two wheels and a moon sticker.'] },
]
export const luggageQuestions = ['What is inside the front pocket?', 'Who will collect the case?', 'What other details can you describe?']
export type LuggageState = {
  phase: number; done: boolean; mode: string; partner: boolean; claim: number; selected: number;
  positions: number[]; tags: number[]; belt: number; inspected: number[]; pockets: number[];
  asked: number[]; question: number; evidence: number[]; verified: number; label: number; collector: number;
  delivered: number[]; moving: boolean; transfer: number; feedback: string; attempts: number;
}
export const initialLuggage: LuggageState = {
  phase: 0, done: false, mode: 'solo', partner: false, claim: 0, selected: -1,
  positions: [0, 0, 0, 0, 0], tags: [0, 1, 2, 3, 4], belt: 0, inspected: [], pockets: [],
  asked: [], question: -1, evidence: [], verified: -1, label: -1, collector: -1,
  delivered: [], moving: false, transfer: 0, feedback: '', attempts: 0,
}
const change = (a: number[], i: number, v: number) => a.map((n, j) => i === j ? v : n)
const add = (a: number[], n: number) => [...new Set([...a, n])]
const locked = (s: LuggageState) => s.phase === 0 || s.done || s.partner || s.moving
export function luggageValues(bag: number) {
  const b = luggageBags[bag]
  return [b.colour, b.size, String(b.wheels), b.strap, b.sticker, b.pocket]
}
export function luggageOnBelt(s: LuggageState) {
  const available = s.positions.map((position, i) => position === 0 ? i : -1).filter(i => i >= 0)
  return available.length ? [...available.slice(s.belt % available.length), ...available.slice(0, s.belt % available.length)].slice(0, 3) : []
}
export function takeLuggage(s: LuggageState, bag: number): LuggageState {
  if (locked(s) || s.positions[bag] === 3 || bag < 0 || bag >= luggageBags.length) return s
  const positions = s.positions.map(p => p === 1 ? 0 : p)
  return { ...s, positions: change(positions, bag, 1), selected: bag, transfer: 0, evidence: [], verified: -1, label: -1, feedback: 'The case is on your inspection desk. Compare it with the owner’s description.' }
}
export function storeLuggage(s: LuggageState, hold: boolean): LuggageState {
  if (locked(s) || s.selected < 0) return s
  return { ...s, positions: change(s.positions, s.selected, hold ? 2 : 0), selected: -1, evidence: [], verified: -1, feedback: hold ? 'The case is on the holding shelf. You can compare it with another one and come back.' : 'The case is back on the belt. Your observations stay in the notebook.' }
}
export function inspectLuggage(s: LuggageState): LuggageState {
  if (locked(s) || s.selected < 0) return s
  return { ...s, inspected: add(s.inspected, s.selected), feedback: 'You turned the case around. Count the wheels and check the sticker; the loose label alone is not proof.' }
}
export function askLuggage(s: LuggageState, question: number): LuggageState {
  if (locked(s) || question < 0 || question > 2) return s
  return s.mode === 'coop' ? { ...s, question, partner: true } : { ...s, question, asked: add(s.asked, question), feedback: luggageClaims[s.claim].replies[question] }
}
export function answerLuggage(s: LuggageState): LuggageState {
  if (!s.partner || s.question < 0) return { ...s, partner: false }
  return { ...s, partner: false, asked: add(s.asked, s.question), feedback: luggageClaims[s.claim].replies[s.question] }
}
export function openLuggagePocket(s: LuggageState): LuggageState {
  if (locked(s) || s.selected < 0) return s
  if (s.claim === 2) return { ...s, attempts: s.attempts + 1, feedback: 'Leo asked you to leave the gift sealed. Compare the wheels and sticker instead; the pocket stays closed.' }
  if (!s.asked.includes(0)) return { ...s, feedback: 'Ask the owner what is inside first. A description of the contents gives you something to compare.' }
  return { ...s, pockets: add(s.pockets, s.selected), feedback: `Inside the front pocket: ${luggageBags[s.selected].pocket}. Does that match what the owner said?` }
}
export function markLuggageFact(s: LuggageState, fact: number): LuggageState {
  if (locked(s) || s.selected < 0 || fact < 0 || fact > 5) return s
  if ((fact === 5 && (s.claim === 2 || !s.pockets.includes(s.selected))) || ([2, 4].includes(fact) && !s.inspected.includes(s.selected))) return s
  const evidence = s.evidence.includes(fact) ? s.evidence.filter(n => n !== fact) : [...s.evidence.slice(-1), fact]
  return { ...s, evidence, verified: -1 }
}
export function verifyLuggage(s: LuggageState): LuggageState {
  if (locked(s) || s.selected < 0) return s
  if (s.claim === 2) {
    if (s.evidence.length !== 2 || ![2, 4].every(i => s.evidence.includes(i)) || !s.inspected.includes(s.selected)) return { ...s, feedback: 'Keep the gift sealed. Leo described two visible details: the wheels and the sticker. Inspect and compare both.' }
  } else {
    if (s.evidence.length !== 2 || !s.evidence.includes(5) || !s.asked.includes(0) || !s.pockets.includes(s.selected)) return { ...s, feedback: 'Compare one visible detail and the contents of the front pocket. Choose both as evidence.' }
    if (s.evidence.some(i => [2, 4].includes(i)) && !s.asked.includes(2)) return { ...s, feedback: 'You have inspected those details. Ask the owner to describe them too, so you can compare both accounts.' }
  }
  const expected = luggageValues(luggageClaims[s.claim].bag), actual = luggageValues(s.selected)
  if (s.evidence.some(i => actual[i] !== expected[i])) return { ...s, verified: -1, attempts: s.attempts + 1, feedback: 'Those details do not both match the owner’s description. Keep your notes and compare another case.' }
  return { ...s, verified: s.selected, feedback: 'Both observed details match the description. Now check the owner’s label and the person collecting it.' }
}
export function labelLuggage(s: LuggageState): LuggageState {
  if (locked(s) || s.selected < 0 || s.verified !== s.selected || s.label < 0) return s
  return { ...s, tags: change(s.tags, s.selected, s.label), feedback: `New label attached: ${luggagePeople[s.label]}. The owner and the person collecting may be different people.` }
}
export function sendLuggage(s: LuggageState): LuggageState {
  if (locked(s) || s.selected < 0) return s
  const claim = luggageClaims[s.claim]
  let feedback = ''
  if (s.verified !== s.selected) feedback = 'Identify this case using the owner’s description and your observations first.'
  else if (s.tags[s.selected] !== claim.owner) feedback = 'The case matches, but its label names a different owner. Correct the label before sending it.'
  else if (s.claim === 2 && !s.asked.includes(1)) feedback = 'Leo is not here. Confirm who is collecting the case before you send it.'
  else if (s.collector !== claim.collector) feedback = 'The person at the collection point is not the person the owner named. Check the message again.'
  return feedback ? { ...s, feedback, attempts: s.attempts + 1 } : { ...s, moving: true, transfer: 0, feedback: 'The case is travelling to the collection point.' }
}
export function luggageTransferStep(s: LuggageState): LuggageState {
  if (!s.moving || s.done || s.partner) return s
  if (s.transfer < 2) return { ...s, transfer: s.transfer + 1 }
  const delivered = [...s.delivered, s.selected], positions = change(s.positions, s.selected, 3), complete = s.claim > 0
  return { ...s, delivered, positions, moving: false, transfer: 3, done: complete, selected: -1, verified: -1,
    claim: complete ? s.claim : 1, tags: complete ? s.tags : change(change(s.tags, 1, 3), 3, 1), asked: [], question: -1, evidence: [], label: -1, collector: -1,
    feedback: complete ? s.claim === 2 ? 'Noor collected Leo’s case. Leo stayed the owner on the label; the collection record names Noor.' : 'Maya and Sam received their own cases. You corrected the mixed label using evidence.' : 'Maya has her case. A trolley jolts the rack: two loose labels get mixed up. Sam’s case looks similar — compare the cases, not just their labels.' }
}
export function continueLuggage(s: LuggageState): LuggageState {
  if (!s.done || s.claim !== 1) return s
  return { ...s, phase: 2, claim: 2, done: false, transfer: 0, feedback: 'Leo sends a message. His friend is coming to collect a case; the remaining bags and labels are exactly where you left them.' }
}
