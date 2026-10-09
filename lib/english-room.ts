export type RoomState = {
  phase: number; done: boolean; mode: string; partner: boolean; room: number; pos: number; focus: number;
  route: number[]; guestRoute: number[]; guestPos: number; windows: number[]; cupboards: number[];
  plugs: number[]; lights: number[]; boxes: number[]; mugs: number[]; carrying: number;
  feedback: string; hints: number; mistakes: number[]; question: number;
  // Optional additions keep existing room-v1 saves readable.
  aired?: boolean; laptopPlugged?: boolean; callPassed?: boolean;
}
export const roomNames = ['Room 101 · ground floor · street', 'Room 102 · upstairs · courtyard']
export const roomRequests = [
  'I need somewhere quiet to read. Could you turn on the lamp, put the red mug on a table and leave the blue mug on the shelf? Please keep the doorway clear.',
  'I cannot use stairs. Before my video call, air the room, then keep traffic noise out. Charge my laptop at the desk. Keep my blue mug away from the laptop and leave the red one on the shelf.',
]
export const roomTranslations = [
  'I need a quiet place to read. Turn on the lamp, put the red mug on the table, and leave the blue one on the shelf. Leave the doorway clear.',
  'I can\'t climb stairs. Before a video call, ventilate the room, then remove street noise. Connect your laptop to your desk. Place the blue mug away from the laptop, leave the red one on the shelf.',
]
export const roomObjects = [0, 4, 5, 6, 8, 9, 28]
export const initialRoom: RoomState = {
  phase: 0, done: false, mode: 'solo', partner: false, room: 0, pos: 25, focus: -1,
  route: [], guestRoute: [], guestPos: 28, windows: [1, 1], cupboards: [0, 0],
  plugs: [0, 0], lights: [0, 0], boxes: [22, 22], mugs: [5, 5, 5, 5], carrying: -1,
  feedback: '', hints: 0, mistakes: [], question: -1,
}
export function roomNeighbours(cell: number) {
  const x = cell % 6, y = Math.floor(cell / 6)
  return [y > 0 ? cell - 6 : -1, x < 5 ? cell + 1 : -1, y < 4 ? cell + 6 : -1, x > 0 ? cell - 1 : -1].filter(n => n >= 0)
}
export function roomPath(start: number, target: number, box: number) {
  const blocked = [0, 2, 3, 4, 5, 6, 8, 9, 27, 29, box]
  const queue = [{ cell: start, route: [] as number[] }], seen = new Set([start])
  while (queue.length) {
    const { cell, route } = queue.shift()!
    if (cell === target) return route
    for (const next of roomNeighbours(cell)) if (!blocked.includes(next) && !seen.has(next)) { seen.add(next); queue.push({ cell: next, route: [...route, next] }) }
  }
  return null
}
export function visitRoomObject(s: RoomState, cell: number): RoomState {
  if (s.done || s.route.length || s.guestRoute.length || s.partner) return s
  const object = roomObjects.includes(cell) || s.boxes[s.room] === cell
  const destinations = object ? roomNeighbours(cell) : [cell]
  const paths = destinations.map(n => roomPath(s.pos, n, s.boxes[s.room])).filter((p): p is number[] => !!p).sort((a, b) => a.length - b.length)
  if (!paths.length) return { ...s, feedback: 'There is no clear path. Try approaching from the other side.' }
  return { ...s, route: paths[0], focus: object ? cell : -1, feedback: '' }
}
export function roomWalkStep(s: RoomState): RoomState {
  if (s.route.length) return { ...s, pos: s.route[0], route: s.route.slice(1) }
  if (s.guestRoute.length) {
    const guestRoute = s.guestRoute.slice(1)
    const problem = roomProblem(s)
    return { ...s, guestPos: s.guestRoute[0], guestRoute,
      feedback: guestRoute.length ? 'The guest is trying your room.' : problem ? problem.message : s.phase === 1 ? 'Maya: Thank you! I can read here. The room is quiet and everything is where I asked.' : 'Alex: The desk looks ready. Let us test the video call before the interview.' }
  }
  return s
}
const replace = (a: number[], i: number, v: number) => a.map((n, j) => i === j ? v : n)
export type RoomAction = 'open' | 'close' | 'plug' | 'unplug' | 'on' | 'off' | 'red' | 'blue' | 'put' | 'move-left' | 'move-right'
export function roomAct(s: RoomState, action: RoomAction): RoomState {
  if (s.done || s.route.length || s.guestRoute.length || s.partner || !roomNeighbours(s.focus).includes(s.pos)) return s
  if (s.phase === 2 && s.callPassed) s = { ...s, callPassed: false }
  const room = s.room, focus = s.focus
  if (focus === 0 && (action === 'open' || action === 'close')) return { ...s, aired: s.aired || (s.phase === 2 && room === 0 && action === 'open'), windows: replace(s.windows, room, action === 'open' ? 1 : 0), feedback: action === 'open' ? room === 0 ? s.phase === 2 ? 'Fresh air comes in, but so does traffic noise. Think about what should happen before the call.' : 'The window is open. You can hear traffic from the street.' : 'The window is open. You can hear birds in the courtyard.' : 'The window is closed. The room is quieter.' }
  if (focus === 5 && (action === 'open' || action === 'close')) return { ...s, cupboards: replace(s.cupboards, room, action === 'open' ? 1 : 0), feedback: action === 'open' ? 'The cupboard is open. Look inside.' : 'The cupboard is closed.' }
  if (focus === 6) {
    if (action === 'plug' && room === 0 && s.laptopPlugged) return { ...s, feedback: 'There is only one socket. The laptop is using it. Which device does Alex need?' }
    if (action === 'plug' || action === 'unplug') return { ...s, plugs: replace(s.plugs, room, action === 'plug' ? 1 : 0), lights: action === 'unplug' ? replace(s.lights, room, 0) : s.lights, feedback: action === 'plug' ? 'The lamp is plugged in. It has power.' : 'The lamp is unplugged.' }
    if (action === 'on' && !s.plugs[room]) return { ...s, feedback: 'The switch clicks, but the lamp stays dark. Look at the cable.', mistakes: [...s.mistakes, 1].slice(-60) }
    if (action === 'on' || action === 'off') return { ...s, lights: replace(s.lights, room, action === 'on' ? 1 : 0), feedback: action === 'on' ? 'The lamp lights up the room.' : 'The lamp is off. There is daylight from the window.' }
  }
  if (s.phase === 2 && room === 0 && focus === 8 && (action === 'plug' || action === 'unplug')) {
    if (action === 'plug' && s.plugs[0]) return { ...s, feedback: 'The only socket is occupied by the lamp. Turning the lamp off does not unplug it.', mistakes: [...s.mistakes, 10].slice(-60) }
    return { ...s, laptopPlugged: action === 'plug', feedback: action === 'plug' ? 'The laptop is charging. Its microphone is beside the window.' : 'The laptop is unplugged. Its battery is too low for a call.' }
  }
  if ((action === 'red' || action === 'blue') && [4, 5, 8, 9].includes(focus)) {
    const mug = room * 2 + (action === 'red' ? 0 : 1)
    if (s.carrying >= 0) return { ...s, feedback: 'Your hands are full. Put down the mug first.' }
    if (focus === 5 && !s.cupboards[room]) return { ...s, feedback: 'The cupboard is closed.' }
    if (s.mugs[mug] !== focus) return { ...s, feedback: 'That mug is somewhere else. Look around the room.' }
    return { ...s, carrying: mug, mugs: replace(s.mugs, mug, -1), feedback: `You are carrying the ${action} mug. Choose where to put it.` }
  }
  if (action === 'put' && [4, 5, 8, 9].includes(focus) && s.carrying >= 0) {
    if (focus === 5 && !s.cupboards[room]) return { ...s, feedback: 'Open the cupboard first.' }
    return { ...s, mugs: replace(s.mugs, s.carrying, focus), carrying: -1, feedback: focus === 4 ? 'The mug is on the shelf.' : focus === 5 ? 'The mug is inside the cupboard.' : 'The mug is on the table.' }
  }
  if (focus === s.boxes[room] && (action === 'move-left' || action === 'move-right')) {
    const box = action === 'move-left' ? 18 : 26
    return { ...s, boxes: replace(s.boxes, room, box), focus: -1, feedback: 'The box is beside the wall. There is space to walk through the doorway.' }
  }
  return s
}
export function roomProblem(s: RoomState): { cell: number; code: number; message: string } | null {
  const room = s.room, red = s.mugs[room * 2], blue = s.mugs[room * 2 + 1], table = (n: number) => [8, 9].includes(n)
  if (s.phase === 2 && room !== 0) return { cell: 28, code: 2, message: 'Alex: This room is upstairs. I cannot climb the stairs today. Is there another room?' }
  if (!roomPath(28, 14, s.boxes[room])) return { cell: s.boxes[room], code: 3, message: 'I cannot get through the doorway with my bag.' }
  if (s.phase === 1 && room === 0 && s.windows[room]) return { cell: 0, code: 4, message: 'Maya: I can hear cars. I need somewhere quieter to read.' }
  if (s.phase === 1 && !s.lights[room]) return { cell: 6, code: 5, message: 'Maya: It is too dark for my book. Could you help?' }
  if (s.phase === 2 && !s.aired) return { cell: 0, code: 6, message: 'Alex: It feels stuffy. Could you air the room before we start?' }
  if (s.phase === 2 && s.windows[room]) return { cell: 0, code: 9, message: 'Alex: The microphone picks up the traffic. We have aired the room; now I need a quiet call.' }
  if (s.phase === 2 && !s.laptopPlugged) return { cell: 8, code: 10, message: 'Alex: The laptop battery is almost empty. Is it plugged in?' }
  if (s.phase === 1 ? !table(red) || blue !== 4 : blue !== 9 || red !== 4) return { cell: 8, code: 8, message: s.phase === 1 ? 'Maya: Which mug is for me? I asked for the red one on a table, and the blue one on the shelf.' : 'Alex: Keep my blue mug away from the laptop. Is there another table? The red mug belongs on the shelf.' }
  return null
}
export function inviteRoomGuest(s: RoomState): RoomState {
  if (s.done || s.route.length || s.guestRoute.length || s.partner) return s
  const problem = roomProblem(s)
  if (problem) return { ...s, guestPos: 28, guestRoute: problem.code === 2 ? [] : roomPath(28, 14, s.boxes[s.room]) ?? [], focus: -1, feedback: problem.message, mistakes: [...s.mistakes, problem.code].slice(-60) }
  return { ...s, guestRoute: roomPath(28, 14, s.boxes[s.room])!, guestPos: 28, focus: -1, feedback: 'Come in! Try the room and tell me what you think.' }
}
export function changeRoom(s: RoomState, room: number): RoomState {
  if (s.done || s.route.length || s.guestRoute.length || s.partner || room < 0 || room > 1) return s
  if (s.carrying >= 0) return { ...s, feedback: 'Leave the mug in this room before visiting the other room.' }
  return { ...s, room, pos: 25, focus: -1, guestPos: 28, callPassed: false, feedback: `${roomNames[room]}. Everything you have arranged in the other room is saved.` }
}
export function morningVisit(s: RoomState): RoomState {
  if (!s.done || s.phase !== 1) return s
  return { ...s, phase: 2, done: false, partner: false, pos: 25, focus: -1, guestPos: 28, aired: false, laptopPlugged: false, callPassed: false, feedback: 'Alex has an interview by video. There is a laptop on the desk, but only one socket in this room.', question: -1 }
}
export function testRoomCall(s: RoomState): RoomState {
  if (s.phase !== 2 || s.done || s.partner || s.route.length || s.guestRoute.length || s.guestPos !== 14) return s
  const problem = roomProblem(s)
  return problem ? { ...s, callPassed: false, feedback: problem.message, mistakes: [...s.mistakes, problem.code].slice(-60) } : { ...s, callPassed: true, feedback: 'Alex: I can hear you clearly. The laptop is charging and my drink is safely on the side table. I am ready for the interview!' }
}
export function finishRoomVisit(s: RoomState): RoomState {
  if (s.guestPos !== 14 || s.route.length || s.guestRoute.length || roomProblem(s) || (s.phase === 2 && !s.callPassed)) return s
  return { ...s, done: true }
}
