// Reproducible import of the CC0 Quaternius GLBs; no remote runtime dependency.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'

const source = path.resolve('tmp/space-kit/unpacked')
const destination = path.resolve('public/game-assets/space-maze')
await mkdir(destination, { recursive: true })
const files = {
  '../human-modular-astronaut.glb': 'human-astronaut.glb',
  'Enemy Small.glb': 'scout.glb',
  'Enemy Large.glb': 'hunter.glb',
  'Enemy Flying.glb': 'interceptor.glb',
}
const assets = []
for (const [original, output] of Object.entries(files)) {
  const data = await readFile(path.join(source, original))
  if (data.toString('utf8', 0, 4) !== 'glTF') throw new Error(`Not a GLB: ${original}`)
  const document = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString())
  await copyFile(path.join(source, original), path.join(destination, output))
  assets.push({ original, output, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'),
    source: output === 'human-astronaut.glb' ? 'https://poly.pizza/m/3hC2i0CTuO' : 'https://quaternius.com/packs/ultimatespacekit.html',
    animations: document.animations.map((animation) => animation.name) })
}
await writeFile(path.join(destination, 'provenance.json'), JSON.stringify({
  author: 'Quaternius', packs: ['Ultimate Space Kit', 'Ultimate Modular Men Pack'], license: 'CC0-1.0',
  authorSource: 'https://quaternius.com/packs/ultimatespacekit.html',
  archiveSource: 'https://opengameart.org/sites/default/files/ultimate_space_kit-glb.zip',
  imported: '2026-10-04', assets,
}, null, 2) + '\n')
console.log(`Prepared ${assets.length} models, ${assets.reduce((sum, item) => sum + item.bytes, 0)} bytes`)
