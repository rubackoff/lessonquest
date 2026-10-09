import { plotMetrics } from './mechanics-lab'

export const missionCatalog = [
  { id: 'expedition', title: 'Crossing after the storm', subject: 'Mathematics · 5th–7th grade', loop: 'Exploration → design → loading → rerouting', hook: 'The shortcut is flooded. The upper pass requires a transfer. What kind of crossing will you build?' },
  { id: 'station', title: 'Last reserve', subject: 'Algebra · 6th–8th grade', loop: 'Diagnostics → program → network → three emergency moves', hook: 'Starting up the reactor consumes fuel, which will still be needed to survive the solar storm.' },
  { id: 'city', title: 'Meet me after the rain', subject: 'English · A2–B1', loop: 'Conversation → route → rescheduling → message', hook: 'The meeting location and conditions change. Agree, get there and stay within the overall budget.' },
  { id: 'district', title: 'Quarter by the river', subject: 'Geometry · 5th–8th grade', loop: 'Site plan → estimate → paths → rain protection', hook: 'The shape of the building determines the price. After a rainstorm, you will have to protect the path or build a bypass.' },
  { id: 'museum', title: 'Museum: The Lost Route', subject: 'English + logic A2–B1', loop: 'Evidence → timeline → version check → navigation', hook: 'The camera rushes, the readings diverge. Restore the history and guide the courier to the exhibit.' },
  { id: 'transit', title: 'A city on two lines', subject: 'Mathematics · 6th–9th grade', loop: 'Network → passengers → departure → road closure', hook: 'The two routes share carriages and budgets. After the bridge is closed, passengers still need to get home.' },
] as const
export type MissionId = typeof missionCatalog[number]['id']
export type Result = { ok: boolean; message: string }
const result = (ok: boolean, message: string): Result => ({ ok, message })
export const sum = (items: number[]) => items.reduce((a, b) => a + b, 0)

export const cargo = [{ name: 'Water', weight: 4 }, { name: 'Food', weight: 3 }, { name: 'Tools', weight: 3 }, { name: 'Walkie Talkie', weight: 2 }]
export function bridgeSpec(route: number, storm: boolean) { return { span: route === 0 && !storm ? 6 : 8, budget: 14, sleds: route === 1 && storm ? 3 : 2 } }
export function checkExpeditionBridge(route: number, storm: boolean, beams: number[], anchors: number, prediction: number): Result {
  if (!beams.length) return result(false, 'There is no bridge between the banks yet. Select the beams and connect the banks.')
  const spec = bridgeSpec(route, storm), cost = sum(beams) + 2 * anchors
  if (!beams.length || beams.some(n => ![2, 3, 4].includes(n)) || [2, 3, 4].some(n => beams.filter(v => v === n).length > 2)) return result(false, 'There are only two beams in stock, 2, 3 and 4 m long.')
  if (sum(beams) !== spec.span) return result(false, `Span ${spec.span} m, and the design ${sum(beams)} m. Remove the extra beam or add the missing one.`)
  if (anchors < 0 || anchors > 2 || !Number.isInteger(anchors) || cost > spec.budget) return result(false, 'The estimate has been exceeded: a meter of beam costs 1, fastening costs 2. Budget 14.')
  if (prediction !== 2 + anchors * 2) return result(false, 'Loading capacity of one trolley: 2 kg + 2 kg for each fastening. Count it.')
  if (prediction < 6 && !(route === 1 && storm)) return result(false, 'Four boxes weigh 12 kg. Two trolleys with such a carrying capacity are not enough. Strengthen the bridge.')
  return result(true, `Bridge accepted: ${spec.span} m, ${cost} from 14 materials. The trolley can withstand ${prediction} kg.`)
}
export function checkCargo(route: number, storm: boolean, anchors: number, slots: number[], predictions: number[]): Result {
  const count = bridgeSpec(route, storm).sleds, limit = route === 1 && storm ? 5 : 2 + anchors * 2
  if (slots.length !== 4 || slots.some(n => !Number.isInteger(n) || n < 0 || n >= count)) return result(false, 'Place each of the four drawers on the cart.')
  const weights = Array.from({ length: count }, (_, i) => sum(cargo.filter((_, j) => slots[j] === i).map(c => c.weight)))
  if (weights.some((w, i) => predictions[i] !== w)) return result(false, 'The statement contains incorrect amounts. Stack the masses of boxes on each cart.')
  if (weights.some(w => w > limit)) return result(false, `The cart is overloaded. Now is the limit ${limit} kg; redistribute the boxes.`)
  return result(true, `Cargo distributed: ${weights.join(' / ')} kg. All boxes will arrive.`)
}

export const operations = ['+2', '×3', '−2', '×2']
export function runReactor(input: number, chain: number[]) { return chain.reduce((v, op) => op === 0 ? v + 2 : op === 1 ? v * 3 : op === 2 ? v - 2 : v * 2, input) }
export function checkReactor(chain: number[]): Result {
  if (chain.length !== 2) return result(false, 'The reactor has two nests. Complete both.')
  for (const input of [2, 4, 6]) { const actual = runReactor(input, chain), target = (input + 2) * 3; if (actual !== target) return result(false, `Test x = ${input}: received ${actual}, need ${target}. Change the order or the modules themselves.`) }
  return result(true, 'Three tests passed. The reactor again does y = 3(x + 2).')
}
export function stationReserve(fuel: number, wiring: number, allocations: number[]) { return runReactor(fuel, [0, 1]) - (wiring === 0 ? 4 : 2) - sum(allocations) + (8 - fuel - wiring) * 4 }
export function checkPower(fuel: number, wiring: number, allocations: number[]): Result {
  if (allocations.length !== 3 || allocations.some(n => !Number.isInteger(n) || n < 0)) return result(false, 'Select whole non-negative energy units.')
  if (allocations.some((n, i) => n < [6, 4, 4][i])) return result(false, 'To start you need: oxygen 6, communication 4, shield 4. You cannot cut off power to one compartment for the sake of another.')
  if (sum(allocations) > runReactor(fuel, [0, 1]) - (wiring === 0 ? 4 : 2)) return result(false, 'As much energy does not flow through the selected network. Reduce the excess or change the scheme.')
  if (stationReserve(fuel, wiring, allocations) < 12) return result(false, 'Three emergency moves will require a minimum of 12. Leave more energy in reserve: excess launch is not returned.')
  return result(true, `The compartments are running. Storm reserve: ${stationReserve(fuel, wiring, allocations)}.`)
}
export function stormTurn(turn: number, reserve: number, oxygen: number, shield: number): Result {
  if (![oxygen, shield].every(n => Number.isInteger(n) && n >= 0)) return result(false, 'Distribute whole units of energy.')
  if (oxygen + shield > reserve) return result(false, 'There is less energy in reserve. Review your current move.')
  if (oxygen < 2 || shield < [1, 3, 2][turn]) return result(false, 'The test run is stopped: there is not enough oxygen or protection. No energy wasted.')
  const future = [3, 5, 4].slice(turn + 1).reduce((a, b) => a + b, 0)
  if (reserve - oxygen - shield < future) return result(false, 'We will survive this move, but not the next one. Look at the forecast and remove the excess supply.')
  return result(true, `Move ${turn + 1} passed Spent ${oxygen + shield}, left ${reserve - oxygen - shield}.`)
}

export const travel = [{ name: 'Bus', price: 3, minutes: 30, accessible: true }, { name: 'Taxi', price: 8, minutes: 15, accessible: true }, { name: 'Metro', price: 2, minutes: 20, accessible: false }]
export function checkTravel(method: number, cost: number, arrival: number): Result {
  const option = travel[method]
  if (!option) return result(false, 'Choose transport.')
  if (!option.accessible) return result(false, 'Maya: “I cannot use stairs with the trolley.” The metro elevator is closed today. Find an accessible route.')
  if (cost !== 12 - option.price || arrival !== option.minutes) return result(false, 'Check the money after the trip and the minutes of the journey. Starts at 14:00, budget £12.')
  return result(true, `You arrived at 14:${option.minutes}. £ left${cost}. There is a new announcement on the gallery door...`)
}
export function checkRebooking(method: number, transfer: number, venue: number, slot: number): Result {
  const money = 12 - travel[method].price, now = travel[method].minutes + 15
  if (venue !== 0) return result(false, 'Roof Café is located upstairs without an elevator, Library Hall is on the ground floor. Consider the Maya cart.')
  if (transfer === 1 && money < 5) return result(false, 'Shuttle costs £5. After the first trip there is not enough money; You can walk for 20 minutes on a flat path.')
  const arrival = now + (transfer === 0 ? 20 : 5)
  if (slot < arrival || slot > 70) return result(false, `Arrive at ${formatTime(arrival)}. The place must be reserved no earlier than arrival and no later than 15:10.`)
  return result(true, `Library Hall, ${formatTime(slot)}. Balance £${money - (transfer === 1 ? 5 : 0)}. Now tell Maya the new plan.`)
}
export function formatTime(minutes: number) { return `${14 + Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}` }

export const buildingBlocked = [7, 17, 20]
export function districtMetrics(cells: number[], roads: number[], drain: boolean) {
  const { area, perimeter, connected } = plotMetrics(cells)
  return { area, perimeter, connected, cost: area * 2 + perimeter + roads.length * 2 + (drain ? 4 : 0) }
}
export function checkBuilding(cells: number[], area: number, perimeter: number): Result {
  const metrics = districtMetrics(cells, [], false)
  if (cells.some(c => buildingBlocked.includes(c))) return result(false, 'You cannot build on rocks or at the entrance.')
  if (cells.some(c => neighbours(20).includes(c))) return result(false, 'Leave the cages next to the entrance free for the entrance area and path.')
  if (metrics.area !== 6 || !metrics.connected) return result(false, 'The clinic needs 6 cells connected by sides. Individual corners are not considered a passage.')
  if (area !== metrics.area) return result(false, 'Check the area: count the occupied floor cells. Each cell is 1 m².')
  if (perimeter !== metrics.perimeter) return result(false, 'The area is correct. Check only the outer boundary: the common side of two cells inside the building does not form part of the perimeter.')
  return result(true, `The site has been accepted. Construction costs ${metrics.cost} out of 42. The remainder depends on the shape of the building.`)
}
export function neighbours(cell: number) { const x = cell % 5, y = Math.floor(cell / 5); return [x > 0 ? cell - 1 : -1, x < 4 ? cell + 1 : -1, y > 0 ? cell - 5 : -1, y < 4 ? cell + 5 : -1].filter(c => c >= 0) }
export function districtPath(cells: number[], roads: number[], flood: number, drain: boolean) {
  const available = new Set([20, ...roads.filter(c => c !== flood || drain)]), previous = new Map<number, number>([[20, -1]]), queue = [20]
  while (queue.length) {
    const cell = queue.shift()!
    if (cell !== 20 && neighbours(cell).some(n => cells.includes(n))) {
      const path: number[] = []; let current = cell
      while (current !== 20) { path.unshift(current); current = previous.get(current)! }
      return path
    }
    for (const n of neighbours(cell)) if (available.has(n) && !previous.has(n)) { previous.set(n, cell); queue.push(n) }
  }
  return []
}
export function checkRoads(cells: number[], roads: number[], flood: number, drain: boolean): Result {
  if (roads.some(c => cells.includes(c) || [7, 17].includes(c))) return result(false, 'The road cannot cross the clinic or the cliffs.')
  const metrics = districtMetrics(cells, roads, drain)
  if (metrics.cost > 42) return result(false, `Estimate ${metrics.cost}, budget 42. Shorten the path or choose a bypass instead of a drainage system.`)
  if (!districtPath(cells, roads, flood, drain).length) return result(false, 'There is no dry path from the entrance to the clinic wall. Complete the path or protect the flooded cell.')
  return result(true, `The clinic is available. Estimate ${metrics.cost}/42; reserve ${42 - metrics.cost}.`)
}

export const museumClues = [
  { name: 'Camera', text: 'At 14:15, Leo carried the crate into the east hall.' },
  { name: 'Caretaker', text: 'I locked the east hall at 14:12. Leo had already left with the crate.' },
  { name: 'Invoice', text: 'Delivery: restoration room. Use the north corridor. The central floor is wet.' },
  { name: 'Note', text: 'Mia is still in the library. She has not collected any crates today.' },
]
export function checkTimeline(camera: number, exit: number, locked: number): Result {
  if (camera !== 10 || exit !== 11 || locked !== 12) return result(false, 'The camera rushes for 5 minutes. Leave one minute before closing. Compare the real times, not the order of obtaining evidence.')
  return result(true, '14:10 - entrance with a box; 14:11 - exit; 14:12 - closing. The box did not remain in the locked room.')
}
export function walkMuseum(program: number[]) {
  let cell = 20; const visited = [cell], blocked = [11, 12, 13]
  for (const [i, command] of program.entries()) {
    const next = command === 0 ? cell - 5 : command === 1 ? cell + 1 : command === 2 ? cell + 5 : cell - 1
    if (!neighbours(cell).includes(next) || blocked.includes(next)) return { ok: false, cell, visited, message: `On the move ${i + 1} the courier runs into a wall or wet floor. Correct the program from here on.` }
    cell = next; visited.push(cell)
  }
  return { ok: cell === 4, cell, visited, message: cell === 4 ? 'The courier arrived at the restoration room. The box was found, the story was restored.' : 'The courier has not yet reached the restoration room (4; 4). Continue the route.' }
}

export const transitNodes = ['Depot', 'School', 'Park', 'Market', 'House', 'Clinic']
export const transitEdges = [
  { a: 0, b: 1, cost: 2 }, { a: 1, b: 2, cost: 2 }, { a: 2, b: 4, cost: 2 },
  { a: 0, b: 3, cost: 3 }, { a: 3, b: 4, cost: 2 }, { a: 1, b: 3, cost: 2 },
  { a: 3, b: 5, cost: 2 }, { a: 4, b: 5, cost: 2 },
]
export function lineNodes(edges: number[]) {
  const visited = new Set([0]), queue = [0]
  while (queue.length) { const node = queue.shift()!; for (const id of edges) { const e = transitEdges[id]; if (!e) continue; const next = e.a === node ? e.b : e.b === node ? e.a : -1; if (next >= 0 && !visited.has(next)) { visited.add(next); queue.push(next) } } }
  return visited
}
export function checkTransit(lines: number[][], cars: number[], round: number): Result {
  const requirements = round === 0 ? [[1, 2], [3, 4]] : [[1, 2], [3, 4, 5]], demand = round === 0 ? [4, 6] : [6, 4]
  if (lines.length !== 2 || cars.length !== 2 || cars.some(c => !Number.isInteger(c) || c < 1) || sum(cars) > 5) return result(false, 'There are five carriages. Every line needs at least one; the carriage can accommodate two passengers.')
  if (round === 1 && lines.some(l => l.includes(4))) return result(false, 'Market stage - The house is closed. Remove it from both lines and create a detour.')
  const all = [...new Set(lines.flat())], cost = sum(all.map(i => transitEdges[i]?.cost ?? 100))
  if (cost > (round === 0 ? 9 : 13)) return result(false, `Construction ${cost}, budget ${round === 0 ? 9 : 13}. The general transfer is paid once.`)
  for (let i = 0; i < 2; i++) {
    const seen = lineNodes(lines[i])
    if (!requirements[i].every(n => seen.has(n))) return result(false, `Line ${i === 0 ? 'A' : 'B'} does not connect the depot with all its stops.`)
    if (cars[i] * 2 < demand[i]) return result(false, `On line ${i === 0 ? 'A' : 'B'} queue ${demand[i]}, and places ${cars[i] * 2}. Rearrange the carriages.`)
  }
  return result(true, `All passengers have been transported. The network is worth ${cost}. ${round === 0 ? 'A message has been received about the closure of the bridge...' : 'The clinic is connected, both lines are working.'}`)
}
export function checkDeparture(lines: number[][], departure: number[]): Result {
  return lines[0].some(e => lines[1].includes(e)) && departure[0] === departure[1]
    ? result(false, 'There will be two trains on the common route at the same time. Change the time of one departure.')
    : result(true, 'Departures have been agreed upon.')
}
