'use client'

import { useState } from 'react'
import { balances, transformEquation, isolated, expression, operations, machineOrders, machineValue, checkMachine, bridgeTasks, bridgeStock, checkBridge, plotTasks, checkPlot, cases, checkCase, dispatches, checkDispatch, routes, checkRoute, repairs, checkRepair, type Check, type Equation, type Direction, type MechanicId, type Point } from '@/lib/mechanics-lab'
import s from './mechanics.module.css'

type Props = { round: number; onCheck: (result: Check) => void; onHint: (hint: string) => void }
const numeric = (v: string) => v.trim() ? Number(v.replace(',', '.')) : NaN
function Hint({ text, onHint }: { text: string; onHint: Props['onHint'] }) { return <button className={s.subtle} onClick={() => onHint(text)}>Hint</button> }

function Balance({ round, onCheck, onHint }: Props) {
  const [history, setHistory] = useState<Equation[]>([balances[round]])
  const [op, setOp] = useState('subtract'), [term, setTerm] = useState('number'), [amount, setAmount] = useState('1'), [notice, setNotice] = useState('')
  const e = history.at(-1)!, multiplying = ['multiply', 'divide'].includes(op), budget = round === 2 ? 4 : 3
  const apply = () => {
    const next = transformEquation(e, op, numeric(amount), term)
    if (!next) { setNotice('In this test we work with integer coefficients. Enter an integer from 1 to 20; For division, choose the common divisor of all numbers.'); return }
    setHistory([...history, next]); setNotice('')
    if (isolated(next)) onCheck({ ok: true, message: `There is only one unknown left: x = ${next.a === 1 ? next.d : next.b}. Equality is maintained for ${history.length} actions.` })
    else if (history.length === budget) onCheck({ ok: false, message: 'The test run charge has run out. Cancel unnecessary actions and find a shorter way; equality and history remain in place.' })
  }
  return <>
    <p>Leave it <b>x</b> on one side and the number on the other. Each action applies to both bowls. You can choose your order.</p>
    <div className={s.equation} aria-label="Current equation"><strong>{expression(e.a, e.b)}</strong><span>=</span><strong>{expression(e.c, e.d)}</strong></div>
    <div className={s.fields}>
      <label>Action<select value={op} onChange={ev => setOp(ev.target.value)}><option value="subtract">Subtract</option><option value="add">Add</option><option value="divide">Divide by</option><option value="multiply">Multiply by</option></select></label>
      <label>How much<input inputMode="numeric" value={amount} onChange={ev => setAmount(ev.target.value)} /></label>
      <label>What<select value={multiplying ? 'number' : term} disabled={multiplying} onChange={ev => setTerm(ev.target.value)}><option value="number">number</option><option value="x">X&apos;s</option></select></label>
    </div>
    <p>Test run charge: <b>{budget - history.length + 1} from {budget}</b>. Cancel returns the action and charge.</p>
    <div className={s.actions}><button className={s.primary} disabled={history.length > budget} onClick={apply}>Apply to both sides</button><button disabled={history.length < 2} onClick={() => setHistory(history.slice(0, -1))}>Cancel move</button></div>
    {notice && <p role="status">{notice}</p>}
    <ol className={s.history}>{history.map((line, i) => <li key={i}>{expression(line.a, line.b)} = {expression(line.c, line.d)}</li>)}</ol>
    <Hint onHint={onHint} text={round === 0 ? 'You can first subtract 6 from both sides, then divide both sides by 3. Or you can start by dividing by 3.' : 'Collect all the x\'s on one side using the same action on both pieces. Then remove the free number and the coefficient of x.'} />
  </>
}

function Machine({ round, onCheck, onHint }: Props) {
  const task = machineOrders[round], [chain, setChain] = useState<string[]>([]), [tested, setTested] = useState(false)
  const change = (value: string[]) => { setChain(value); setTested(false) }
  return <>
    <p>One machine must do <b>all three orders</b>. You have up to {task.slots} operations; Each part can be used once.</p>
    <table className={s.table}><thead><tr><th>Login</th><th>The right exit</th><th>Your result</th></tr></thead><tbody>{task.inputs.map((n, i) => <tr key={n}><td>{n}</td><td>{task.outputs[i]}</td><td>{tested ? machineValue(n, chain) : '—'}</td></tr>)}</tbody></table>
    {tested && <details open><summary>What happened to the signal</summary><ol>{task.inputs.map(n => <li key={n}>{[n, ...chain.map((_, i) => machineValue(n, chain.slice(0, i + 1)))].join(' → ')}</li>)}</ol></details>}
    <h3>Chain from left to right</h3><div className={s.chain} aria-label="Chain of operations">{chain.map((id, i) => <div key={id}><span>{i + 1}</span><strong>{operations.find(o => o.id === id)!.label}</strong><button aria-label={`Move operation ${i + 1} left`} disabled={!i} onClick={() => { const next = [...chain]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; change(next) }}>←</button><button aria-label={`Remove operation ${i + 1}`} onClick={() => change(chain.filter((_, k) => k !== i))}>×</button></div>)}{!chain.length && <p>Add the first operation from the stock.</p>}</div>
    <div className={s.choices} aria-label="Operations in reserve">{task.bank.map(id => <button key={id} disabled={chain.includes(id) || chain.length === task.slots} onClick={() => change([...chain, id])}>{operations.find(o => o.id === id)!.label}</button>)}</div>
    <div className={s.actions}><button className={s.primary} disabled={!chain.length} onClick={() => { setTested(true); onCheck(checkMachine(round, chain)) }}>Run all orders</button><button disabled={!chain.length} onClick={() => change([])}>Clear chain</button></div>
    <Hint onHint={onHint} text={task.hint} />
  </>
}

function Bridge({ round, onCheck, onHint }: Props) {
  const task = bridgeTasks[round], [history, setHistory] = useState<number[][][]>([[[], []]]), [selected, setSelected] = useState(0)
  const spans = history.at(-1)!, used = spans.flat()
  const change = (next: number[][]) => setHistory([...history, next])
  return <>
    <p>Collect two spans. Each length - <b>two parts</b>, no more can be used for the entire crossing <b>{task.limit} details</b>. Excess behind the support is not suitable.</p>
    <div className={s.spans}>{task.goals.map((goal, i) => <section key={i} data-selected={selected === i}>
      <button className={s.spanSelect} aria-pressed={selected === i} onClick={() => setSelected(i)}>Span {i + 1} · need {goal} m</button>
      <div className={s.beams}>{spans[i].map((n, j) => <button key={j} style={{ flexGrow: n }} aria-label={`Return ${n} m from the span ${i + 1}, detail ${j + 1}`} onClick={() => change(spans.map((row, k) => k === i ? row.filter((_, index) => index !== j) : row))}>{n} m</button>)}{!spans[i].length && <span>Select a span, then add details.</span>}</div>
    </section>)}</div>
    <h3>Add to flyby {selected + 1}</h3><div className={s.choices}>{bridgeStock.map(n => { const left = 2 - used.filter(v => v === n).length; return <button key={n} disabled={!left} onClick={() => change(spans.map((row, i) => i === selected ? [...row, n] : row))}>{n} m <small>left {left}</small></button> })}</div>
    <p>Parts used: {used.length} / {task.limit}. Click on an installed part to return it.</p>
    <div className={s.actions}><button className={s.primary} disabled={!spans.every(row => row.length)} onClick={() => onCheck(checkBridge(round, spans))}>Experience the crossing</button><button disabled={history.length < 2} onClick={() => setHistory(history.slice(0, -1))}>Cancel move</button></div>
    <Hint onHint={onHint} text={`Count the lengths separately. For ${task.goals[0]} m find a pair from stock and then check what parts are left for ${task.goals[1]} m. The order of parts within the span may differ.`} />
  </>
}

function Plot({ round, onCheck, onHint }: Props) {
  const task = plotTasks[round], [cells, setCells] = useState<number[]>([]), [prediction, setPrediction] = useState('')
  return <>
    <p>Need a communication platform <b>{task.area} m²</b>. Yes <b>{task.fence} m fence</b>. The side of the cage is 1 m. Any shape; the cells should touch sides.</p>
    <div className={s.plot} role="group" aria-label="Site cells">{Array.from({ length: 25 }, (_, n) => <button key={n} aria-label={`Cage ${n % 5 + 1}, ${Math.floor(n / 5) + 1}`} aria-pressed={cells.includes(n)} onClick={() => setCells(cells.includes(n) ? cells.filter(v => v !== n) : [...cells, n])}>{cells.includes(n) ? '■' : '·'}</button>)}</div>
    <p>Busy {cells.length} cells. Clicking adds or removes a cell.</p>
    <label className={s.answer}>Predict the length of the fence, m<input inputMode="numeric" value={prediction} onChange={ev => setPrediction(ev.target.value)} /></label>
    <div className={s.actions}><button className={s.primary} disabled={!cells.length || !Number.isFinite(numeric(prediction)) || numeric(prediction) <= 0} onClick={() => onCheck(checkPlot(round, cells, numeric(prediction)))}>Check the site</button><button disabled={!cells.length} onClick={() => setCells([])}>Remove all cells</button></div>
    <Hint onHint={onHint} text="A single cell has four sides. Each common side of two cells removes two meters from the fence. A more compact form usually requires less fencing for the same area." />
  </>
}

function Investigation({ round, onCheck, onHint }: Props) {
  const task = cases[round], sources = [...new Set(task.clues.map(c => c.source))]
  const [source, setSource] = useState(sources[0]), [found, setFound] = useState<number[]>([]), [last, setLast] = useState<number | null>(null), [evidence, setEvidence] = useState<number[]>([]), [answer, setAnswer] = useState(-1)
  return <>
    <h3 lang="en">{task.title}</h3><p lang="en" className={s.request}>{task.goal}</p><p>Talk to sources. Select output and <b>two facts</b>, which together prove it. Not all information is relevant to your case.</p>
    <div className={s.choices}>{sources.map(name => <button key={name} lang="en" aria-pressed={source === name} onClick={() => { setSource(name); setLast(null) }}>{name}</button>)}</div>
    <div className={s.questions}>{task.clues.map((clue, i) => clue.source === source && <button key={i} lang="en" onClick={() => { setFound(found.includes(i) ? found : [...found, i]); setLast(i) }}>{clue.question}{found.includes(i) ? ' ✓' : ''}</button>)}</div>
    {last !== null && <blockquote lang="en">{task.clues[last].text}</blockquote>}
    <h3>Magazine · {found.length} facts</h3>{!found.length && <p>Answers are saved here. Ask a question first.</p>}
    <div className={s.journal}>{found.map(i => <label key={i}><input type="checkbox" checked={evidence.includes(i)} disabled={!evidence.includes(i) && evidence.length === 2} onChange={() => setEvidence(evidence.includes(i) ? evidence.filter(v => v !== i) : [...evidence, i])} /><span><small>{task.clues[i].source}</small><span lang="en">{task.clues[i].text}</span></span></label>)}</div>
    <label className={s.answer}>My conclusion<select lang="en" value={answer} onChange={ev => setAnswer(Number(ev.target.value))}><option value={-1}>Choose a conclusion</option>{task.options.map((option, i) => <option value={i} key={option}>{option}</option>)}</select></label>
    <button className={s.primary} disabled={answer < 0 || evidence.length !== 2} onClick={() => onCheck(checkCase(round, answer, evidence))}>Provide a conclusion and 2 facts</button>
    <Hint onHint={onHint} text={task.hint} />
  </>
}

function Dispatch({ round, onCheck, onHint }: Props) {
  const task = dispatches[round], [choices, setChoices] = useState([-1, -1, -1])
  return <>
    <h3 lang="en">{task.title}</h3><p>Complete all three requests. Every resource is available <b>once</b>. Until the plan is sent, assignments can be freely changed.</p>
    <ul className={s.resourceList}>{task.resources.map(r => <li key={r} lang="en">{r}</li>)}</ul>
    <div className={s.orders}>{task.clients.map((client, i) => <section key={client.name}><h3>{client.name}</h3><p lang="en">“{client.request}”</p><label>Assign to {client.name}<select lang="en" value={choices[i]} onChange={ev => setChoices(choices.map((n, j) => j === i ? Number(ev.target.value) : n))}><option value={-1}>Choose a resource</option>{task.resources.map((r, n) => <option key={r} value={n}>{r}</option>)}</select></label></section>)}</div>
    <button className={s.primary} disabled={choices.includes(-1)} onClick={() => onCheck(checkDispatch(round, choices))}>Submit general plan</button><Hint onHint={onHint} text={task.hint} />
  </>
}

function Route({ round, onCheck, onHint }: Props) {
  const task = routes[round], [teacher, setTeacher] = useState(true), [program, setProgram] = useState<Direction[]>([]), [path, setPath] = useState<Point[]>([]), [selectedStep, setSelectedStep] = useState<number | null>(null)
  const names = { N: 'North ↑', E: 'East →', S: 'South ↓', W: 'West ←' }
  const change = (next: Direction[]) => { setProgram(next); setPath([]); setSelectedStep(null) }
  return <>
    <p>Two-player game on one device. The tutor is a guide, the student is a researcher. The student asks questions and creates a program himself; no need to compete.</p>
    <div className={s.rolebar}><strong>{teacher ? 'Explorer screen · tutor' : 'Explorer Screen Student'}</strong><button onClick={() => setTeacher(!teacher)}>{teacher ? 'Hide the card and give it to the student' : 'Hand over the device to the conductor'}</button></div>
    {teacher ? <><p>Communicate coordinates and restrictions in words, without dictating a ready-made chain of commands. The student can clarify. On a shared screen, first ask the student to turn away.</p><p><b>Goal: ({task.end.join('; ')})</b>. Obstacles: {task.blocked.map(p => `(${p.join('; ')})`).join(', ')}. Start: ({task.start.join('; ')}).</p></> : <p>Start: ({task.start.join('; ')}). Ask the guide about the goal and obstacles. North increases y, East increases x. Can be used up to {task.max} steps.</p>}
    <div className={s.coordinateMap} role="img" aria-label={teacher ? 'Map with obstacles and goal' : 'Explorer\'s field with a proven path'}>{Array.from({ length: 25 }, (_, n) => { const x = n % 5, y = 4 - Math.floor(n / 5), same = (p: Point) => p[0] === x && p[1] === y; const start = same(task.start), target = teacher && same(task.end), blocked = teacher && task.blocked.some(same); return <div key={n} data-blocked={blocked} data-visited={path.some(same)}><small>{x};{y}</small><strong>{start ? 'A' : target ? 'B' : blocked ? '×' : path.some(same) ? '•' : ''}</strong></div> })}</div>
    {!teacher && <><h3>Program · {program.length} / {task.max}</h3><div className={s.program}>{program.map((d, i) => <button key={i} aria-label={`Select step ${i + 1}: ${d}`} aria-pressed={selectedStep === i} onClick={() => setSelectedStep(selectedStep === i ? null : i)}>{i + 1}. {names[d]}</button>)}{!program.length && <p>Discuss the plan first, then add teams.</p>}</div><p>{selectedStep !== null ? `Replace step ${selectedStep + 1} direction below or delete it.` : 'Choose a step to fix it; without highlighting, commands are added to the end.'}</p><div className={s.choices}>{(Object.keys(names) as Direction[]).map(d => <button key={d} disabled={program.length === task.max && selectedStep === null} onClick={() => change(selectedStep === null ? [...program, d] : program.map((value, i) => i === selectedStep ? d : value))}>{names[d]}</button>)}</div><div className={s.actions}><button className={s.primary} disabled={!program.length} onClick={() => { const result = checkRoute(round, program); setPath(result.path); onCheck(result) }}>Check route</button><button disabled={selectedStep === null} onClick={() => change(program.filter((_, i) => i !== selectedStep))}>Delete selected step</button><button disabled={!program.length} onClick={() => change([])}>Clear commands</button></div></>}
    <Hint onHint={onHint} text="Student: ask “Where is the goal?” and “Which cells are blocked?”. Explorer: give the coordinates. Student: talk about how x and y change at each step. The card cannot go through an obstacle or go beyond the boundary." />
  </>
}

function Repair({ round, onCheck, onHint }: Props) {
  const task = repairs[round], [row, setRow] = useState(-1), [values, setValues] = useState(['', '', '', ''])
  const numbers = values.map(numeric)
  return <>
    <p>One transition in the solution was broken. Find <b>first erroneous line</b>, replace it with the correct equality and bring the solution to the answer.</p>
    <div className={s.original}>{task.task}</div><div className={s.errorSteps}>{task.steps.map((step, i) => <button key={step} aria-pressed={row === i} onClick={() => setRow(i)}><span>{i + 1}</span>{step}</button>)}</div>
    <h3>Corrected line: a x + b = c</h3><p>You can write any equation equivalent to the original one with nonzero a. Enter negative b with a minus sign.</p>
    <div className={s.fields}>{['a is the coefficient for x', 'b - number on the left', 'c is the number on the right', 'Final x'].map((label, i) => <label key={label}>{label}<input inputMode="decimal" value={values[i]} onChange={ev => setValues(values.map((v, j) => i === j ? ev.target.value : v))} /></label>)}</div>
    <button className={s.primary} disabled={row < 0 || numbers.some(n => !Number.isFinite(n))} onClick={() => onCheck(checkRepair(round, row, numbers[0], numbers[1], numbers[2], numbers[3]))}>Fix solution</button><Hint onHint={onHint} text={task.hint} />
  </>
}

const games = { balance: Balance, machine: Machine, bridge: Bridge, plot: Plot, case: Investigation, dispatch: Dispatch, route: Route, repair: Repair }
export function MiniGame({ id, ...props }: Props & { id: MechanicId }) { const Game = games[id]; return <Game {...props} /> }
