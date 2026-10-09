import { describe, expect, it } from 'vitest'
import { bridgeSpec, checkCargo, checkExpeditionBridge, checkPower, checkReactor, stationReserve, stormTurn, checkTravel, checkRebooking, checkBuilding, checkRoads, districtPath, checkTimeline, walkMuseum, checkTransit, checkDeparture } from './scenario-missions'

describe('linked mission consequences', () => {
  it('carries the river bridge into the flood and accepts two repairs', () => {
    expect(checkExpeditionBridge(0, false, [2, 4], 2, 6).ok).toBe(true)
    expect(checkExpeditionBridge(0, true, [2, 4], 2, 6).ok).toBe(false)
    expect(checkExpeditionBridge(0, true, [2, 4, 2], 2, 6).ok).toBe(true)
    expect(checkExpeditionBridge(0, true, [4, 4], 2, 6).ok).toBe(true)
  })
  it('enforces stock and capacity, not just total bridge length', () => {
    expect(checkExpeditionBridge(1, false, [2, 2, 2, 2], 2, 6).ok).toBe(false)
    expect(checkExpeditionBridge(0, false, [2, 4], 1, 4).ok).toBe(false)
    expect(checkExpeditionBridge(0, false, [2, 4], 2, 8).ok).toBe(false)
  })
  it('makes the mountain route require a genuinely different cargo plan', () => {
    expect(checkCargo(1, false, 2, [0, 1, 1, 0], [6, 6]).ok).toBe(true)
    expect(checkCargo(1, true, 2, [0, 1, 1, 0], [6, 6, 0]).ok).toBe(false)
    expect(bridgeSpec(1, true).sleds).toBe(3)
    expect(checkCargo(1, true, 2, [0, 1, 2, 1], [4, 5, 3]).ok).toBe(true)
    expect(checkCargo(1, true, 2, [0, -1, 2, 1], [4, 2, 3]).ok).toBe(false)
    expect(checkCargo(1, true, 2, [0, 1, 2, 1], [4, 3, 5]).ok).toBe(false)
  })
  it('tests the whole function rather than a single output', () => {
    expect(checkReactor([0, 1]).ok).toBe(true)
    expect(checkReactor([1, 0]).ok).toBe(false)
    expect(checkReactor([3, 3]).ok).toBe(false)
  })
  it.each([[4, 0, 16], [4, 1, 14], [6, 0, 14], [6, 1, 12]])('keeps all reactor and wiring strategies viable: fuel %i wiring %i', (fuel, wiring, expected) => {
    const allocation = [6, 4, 4]
    expect(checkPower(fuel, wiring, allocation).ok).toBe(true)
    let reserve = stationReserve(fuel, wiring, allocation)
    expect(reserve).toBe(expected)
    for (let turn = 0; turn < 3; turn++) { const shield = [1, 3, 2][turn]; expect(stormTurn(turn, reserve, 2, shield).ok).toBe(true); reserve -= 2 + shield }
    expect(reserve).toBeGreaterThanOrEqual(0)
  })
  it('rejects local successes that would consume the next turn’s reserve', () => {
    expect(checkPower(6, 1, [8, 4, 4]).ok).toBe(false)
    expect(checkPower(4, 0, [4, 6, 4]).ok).toBe(false)
    expect(checkPower(4, 0, [6, 4, 5]).ok).toBe(false)
    expect(stormTurn(0, 12, 2, 2).ok).toBe(false)
    expect(stormTurn(1, 9, 2, 2).ok).toBe(false)
  })
  it('requires an accessible trip and correct resource accounting', () => {
    expect(checkTravel(2, 10, 20).ok).toBe(false)
    expect(checkTravel(0, 9, 30).ok).toBe(true)
    expect(checkTravel(1, 4, 15).ok).toBe(true)
    expect(checkTravel(0, 12, 30).ok).toBe(false)
  })
  it('carries both time and money from the first trip into rebooking', () => {
    expect(checkRebooking(0, 0, 0, 60).ok).toBe(false)
    expect(checkRebooking(0, 0, 0, 65).ok).toBe(true)
    expect(checkRebooking(0, 1, 0, 60).ok).toBe(true)
    expect(checkRebooking(1, 1, 0, 60).ok).toBe(false)
    expect(checkRebooking(1, 0, 0, 60).ok).toBe(true)
    expect(checkRebooking(1, 0, 1, 60).ok).toBe(false)
  })
  it('accepts different connected building shapes and their actual perimeter', () => {
    expect(checkBuilding([0, 1, 2, 3, 4, 9], 6, 14).ok).toBe(true)
    expect(checkBuilding([0, 1, 5, 6, 10, 11], 6, 10).ok).toBe(true)
    expect(checkBuilding([0, 1, 5, 6, 10, 11], 6, 12).ok).toBe(false)
    expect(checkBuilding([0, 1, 5, 6, 10, 15], 6, 12).ok).toBe(false)
    expect(checkBuilding([0, 1, 3, 4, 10, 11], 6, 20).ok).toBe(false)
  })
  it('floods a used path and allows both drainage and rerouting', () => {
    const building = [0, 1, 5, 6, 10, 11], roads = [15]
    expect(districtPath(building, roads, -1, false)).toEqual([15])
    expect(checkRoads(building, roads, -1, false).ok).toBe(true)
    expect(checkRoads(building, roads, 15, false).ok).toBe(false)
    expect(checkRoads(building, roads, 15, true).ok).toBe(true)
    expect(checkRoads(building, [21, 16], 15, false).ok).toBe(true)
    expect(checkRoads(building, [23, 24], -1, false).ok).toBe(false)
  })
  it('rejects an incorrect camera correction, wet tile crossing and row wrapping', () => {
    expect(checkTimeline(15, 11, 12).ok).toBe(false)
    expect(checkTimeline(10, 11, 12).ok).toBe(true)
    expect(walkMuseum([0, 0, 1]).ok).toBe(false)
    expect(walkMuseum([0, 0, 1]).cell).toBe(10)
    expect(walkMuseum([3]).cell).toBe(20)
    expect(walkMuseum([0, 0, 0, 0, 1, 1, 1, 1]).ok).toBe(true)
    expect(walkMuseum([1, 1, 1, 1, 0, 0, 0, 0]).ok).toBe(true)
  })
  it('changes passenger capacity and network constraints after the first transit day', () => {
    const before = [[0, 1], [3, 4]], after = [[0, 1], [0, 5, 6, 7]]
    expect(checkTransit(before, [2, 3], 0).ok).toBe(true)
    expect(checkTransit(before, [3, 2], 1).ok).toBe(false)
    expect(checkTransit(after, [2, 3], 1).ok).toBe(false)
    expect(checkTransit(after, [3, 2], 1).ok).toBe(true)
    expect(checkTransit(after, [3, 3], 1).ok).toBe(false)
    expect(checkDeparture(after, [0, 0]).ok).toBe(false)
    expect(checkDeparture(after, [0, 2]).ok).toBe(true)
    expect(checkDeparture(before, [0, 0]).ok).toBe(true)
  })
  it('rejects isolated transit track and counts shared construction only once', () => {
    expect(checkTransit([[1], [3, 4]], [2, 3], 0).ok).toBe(false)
    expect(checkTransit([[0, 1], [0, 5, 4]], [2, 3], 0).ok).toBe(true)
  })
})

it('diagnoses empty construction, area and perimeter independently', () => {
  expect(checkExpeditionBridge(0,false,[],0,0).message).toContain('no bridge between the banks')
  const cells=[0,1,5,6,10,11]
  expect(checkBuilding(cells,5,10).message).toContain('Check the area')
  expect(checkBuilding(cells,6,24).message).toContain('area is correct')
})
