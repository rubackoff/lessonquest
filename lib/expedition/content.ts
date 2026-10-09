export const expeditionTopics = [
  { id: 'triangle', title: 'Right triangle', skill: 'Find the length of a straight crossing using two perpendicular displacements.' },
  { id: 'segments', title: 'Addition of segments', skill: 'Compose the required length from several parts and check the amount.' },
  { id: 'scale', title: 'Drawing scale', skill: 'Convert the dimensions from the drawing to meters and find the length of the diagonal.' },
  { id: 'area', title: 'Area and perimeter', skill: 'Select the sides of the rectangle based on area and perimeter restrictions.' },
] as const
export type ExpeditionTopic = typeof expeditionTopics[number]['id']
export type Route = 'direct' | 'via'
export type Edge = 'ab' | 'ac' | 'cb'
export type Anchor = 'a' | 'b' | 'c'
export const anchors = { a: { x: 30, y: 64 }, b: { x: 60, y: 24 }, c: { x: 60, y: 64 } } as const
export const edgeAnchors: Record<Edge, [Anchor, Anchor]> = { ab: ['a', 'b'], ac: ['a', 'c'], cb: ['c', 'b'] }
export const directions = [
  { title: 'Right', angle: 0 }, { title: 'Up', angle: -90 }, { title: 'Diagonally', angle: -53.1301023542 },
] as const
export const edgeDirection: Record<Edge, number> = { ab: 2, ac: 0, cb: 1 }

export function expeditionContent(topic: ExpeditionTopic, homework = false, chapter = 1, variant = 0) {
  const step = (homework ? chapter : 0) + variant % 4, k = 2 + step
  const horizontal = 3 * k, vertical = 4 * k, diagonal = 5 * k
  const width = 4 + step, height = 6 + step
  const targetArea = width * height, fence = 2 * (width + height)
  return {
    topic, horizontal, vertical, diagonal, width, height, targetArea, fence, scale: k * 100,
    title: topic === 'area' ? 'Camp site' : 'Crossing the gorge',
    description: topic === 'area' ? `The team needs a platform ${targetArea} m². For the fence there is ${fence} m of rope. Select the sides and check the project.`
      : topic === 'segments' ? `The path goes through support C: first ${horizontal} m, then ${vertical} m. Assemble both spans from the available parts.`
      : topic === 'scale' ? `In the drawing, the offsets are 3 and 4 cm, the angle between them is right. Scale 1:${k * 100}. Build a crossing in real meters.`
      : `Between points A and B - ${horizontal} m horizontally and ${vertical} m vertically. Connect the banks and guide the team.`,
    predictionLabel: topic === 'area' ? 'What is the perimeter of your site?' : topic === 'segments' ? 'How many meters will the team walk?' : 'What is the length of the straight crossing A-B?',
    // Length choices do not identify which answer is correct.
    materials: (route: Route) => topic === 'segments'
      ? [2, 3, 4, 5, 6].map(n => ({ length: n + step, count: 4 }))
      : (route === 'direct' ? [4 * k, 5 * k, 6 * k, 7 * k] : [3 * k, 4 * k, 5 * k, 7 * k]).map(length => ({ length, count: 1 })),
    sides: [...new Set([3 + step, width, height, 8 + step])],
    hints: topic === 'area' ? [
      'The area shows how much space there is inside the site. Perimeter is the length of the fence around it.',
      `For sides a and b, check two conditions: a × b = ${targetArea} and 2 × (a + b) ≤ ${fence}. Rotation does not change the area or perimeter.`,
      `The sides will do ${width} and ${height} m: area ${width} × ${height} = ${targetArea} m², perimeter 2 × (${width} + ${height}) = ${fence} m. You can swap sides.`,
    ] : topic === 'segments' ? [
      'Each span can be composed of several parts. Add their lengths separately for A-C and C-B.',
      `On A-C you need exactly ${horizontal} m, on S-B - ${vertical} m. The total path is the sum of two spans. The order of parts may vary.`,
      `Total path length: ${horizontal} + ${vertical} = ${horizontal + vertical} m. For each span, the sum of the parts must coincide with its length.`,
    ] : [
      'A-C and C-B form a right angle. Line A-B is the third side of a right triangle.',
      topic === 'scale' ? `1 cm in the drawing - ${k} m on the ground. First convert 3 and 4 cm to meters, then use a² + b² = c².` : `Use the Pythagorean theorem: AB² = ${horizontal}² + ${vertical}². The sum of the two sides gives a detour, not a direct crossing.`,
      `${horizontal}² + ${vertical}² = ${diagonal ** 2}. So AB = ${diagonal} m. The path through the support is longer: ${horizontal} + ${vertical} = ${horizontal + vertical} m.`,
    ],
  }
}
