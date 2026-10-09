import { describe, it, expect } from 'vitest'
import { balances, transformEquation, isolated, machineOrders, checkMachine, checkBridge, checkPlot, plotMetrics, cases, checkCase, checkDispatch, checkRoute, checkRepair, type Direction } from './mechanics-lab'

describe('mechanics laboratory', () => {
  it('keeps both sides equivalent and accepts two orders for balancing', () => {
    const subtractFirst = transformEquation(balances[0], 'subtract', 6, 'number')!
    expect(isolated(transformEquation(subtractFirst, 'divide', 3, 'number')!)).toBe(true)
    const divideFirst = transformEquation(balances[0], 'divide', 3, 'number')!
    expect(isolated(transformEquation(divideFirst, 'subtract', 2, 'number')!)).toBe(true)
  })
  it('solves variables on both sides without changing their root', () => {
    let e = transformEquation(balances[2], 'subtract', 2, 'x')!
    e = transformEquation(e, 'add', 4, 'number')!
    e = transformEquation(e, 'divide', 3, 'number')!
    expect(e).toEqual({ a: 1, b: 0, c: 0, d: 4 }); expect(isolated(e)).toBe(true)
    expect(isolated(transformEquation(transformEquation(balances[1], 'subtract', 1, 'x')!, 'subtract', 5, 'number')!)).toBe(true)
  })
  it('rejects division by zero, fractional step and exploding coefficients', () => {
    expect(transformEquation(balances[0], 'divide', 0, 'number')).toBeNull()
    expect(transformEquation(balances[0], 'divide', 2, 'number')).toBeNull()
    expect(transformEquation({ a: 9999, b: 0, c: 0, d: 1 }, 'multiply', 2, 'number')).toBeNull()
  })
  it.each([['add2', 'mul3'], ['mul2', 'sub3'], ['add4', 'div2', 'sub1']])('has a working machine order %j', (...chain) => {
    const index = chain[0] === 'add2' ? 0 : chain[0] === 'mul2' ? 1 : 2
    expect(checkMachine(index, chain).ok).toBe(true)
  })
  it('checks every machine input and the order of operations', () => {
    expect(checkMachine(0, ['mul3', 'add2']).ok).toBe(false)
    expect(checkMachine(1, ['sub3', 'sub3']).ok).toBe(false)
    expect(checkMachine(2, ['mul2']).ok).toBe(false)
    expect(machineOrders).toHaveLength(3)
  })
  it('accepts different bridge assemblies but checks each span and stock', () => {
    expect(checkBridge(0, [[2, 4], [3, 5]]).ok).toBe(true)
    expect(checkBridge(0, [[6], [4, 4]]).ok).toBe(true)
    expect(checkBridge(0, [[4], [4, 6]]).ok).toBe(false)
    expect(checkBridge(0, [[2, 2, 2], [4, 4]]).ok).toBe(false)
    expect(checkBridge(1, [[2, 5], [3, 6]]).ok).toBe(true)
    expect(checkBridge(2, [[3, 6], [5, 6]]).ok).toBe(true)
  })
  it('rejects a correct total built with too many parts', () => {
    expect(checkBridge(0, [[3, 3], [2, 2, 4]])).toMatchObject({ ok: false })
  })
  it('counts outer and inner boundary edges, not diagonals', () => {
    expect(plotMetrics([0, 6])).toEqual({ area: 2, perimeter: 8, connected: false })
    expect(plotMetrics([0, 1, 5, 6])).toEqual({ area: 4, perimeter: 8, connected: true })
    expect(plotMetrics([0, 1, 2, 5, 7, 10, 11, 12]).perimeter).toBe(16)
  })
  it('accepts translated and differently shaped plots', () => {
    expect(checkPlot(0, [0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13], 14).ok).toBe(true)
    expect(checkPlot(0, [6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19], 14).ok).toBe(true)
    expect(checkPlot(1, [0, 1, 2, 3, 5, 6, 7, 8], 12).ok).toBe(true)
    expect(checkPlot(1, [0, 1, 2, 5, 6, 7, 10, 11], 12).ok).toBe(true)
    expect(checkPlot(2, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 14).ok).toBe(true)
  })
  it('requires both geometry and a perimeter forecast', () => {
    const cells = [0, 1, 2, 3, 5, 6, 7, 8]
    expect(checkPlot(1, cells, 8).ok).toBe(false)
    expect(checkPlot(1, [0, 1, 2, 3, 4, 5, 10, 15], 18).ok).toBe(false)
    expect(checkPlot(1, [0, 2], 8).ok).toBe(false)
  })
  it.each([0, 1, 2])('requires corroborating evidence in case %i', round => {
    const task = cases[round]
    expect(checkCase(round, task.answer, task.required).ok).toBe(true)
    expect(checkCase(round, task.answer, [0, 3]).ok).toBe(false)
    expect(checkCase(round, (task.answer + 1) % 3, task.required).ok).toBe(false)
  })
  it('checks scarce shared resources as well as English requests', () => {
    expect(checkDispatch(0, [0, 2, 1]).ok).toBe(true)
    expect(checkDispatch(1, [1, 0, 2]).ok).toBe(true)
    expect(checkDispatch(2, [0, 2, 1]).ok).toBe(true)
    expect(checkDispatch(1, [0, 0, 2]).ok).toBe(false)
    expect(checkDispatch(1, [0, 1, 2]).ok).toBe(false)
  })
  it.each(['NNEEEE', 'NNEEEESS', 'WNNNEEEN'])('has a valid cooperative route %s', text => {
    const round = text === 'NNEEEE' ? 0 : text === 'NNEEEESS' ? 1 : 2
    expect(checkRoute(round, [...text] as Direction[]).ok).toBe(true)
  })
  it('stops a route on collision or boundary and keeps the visited prefix', () => {
    expect(checkRoute(0, ['E', 'E'])).toMatchObject({ ok: false, path: [[0, 0], [1, 0]] })
    expect(checkRoute(0, ['S']).ok).toBe(false)
    expect(checkRoute(0, ['N']).ok).toBe(false)
  })
  it('accepts alternative equivalent repairs but needs the first error', () => {
    expect(checkRepair(0, 1, 2, 0, 8, 4).ok).toBe(true)
    expect(checkRepair(0, 1, 1, 0, 4, 4).ok).toBe(true)
    expect(checkRepair(0, 2, 1, 0, 4, 4).ok).toBe(false)
    expect(checkRepair(1, 0, 5, -10, 15, 5).ok).toBe(true)
    expect(checkRepair(2, 2, 1, 0, 6, 6).ok).toBe(true)
    expect(checkRepair(0, 1, 0, 8, 8, 4).ok).toBe(false)
    expect(checkRepair(0, 1, 2, 0, 8, 10).ok).toBe(false)
  })
})
