import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const source = resolve(dirname(fileURLToPath(import.meta.url)), '..')
if (!process.argv[2]) throw new Error('Usage: node scripts/prepare-hosting.mjs <opened-sites-checkout>')
const destination = resolve(process.argv[2])
const sourceFromDestination = relative(destination, source)
if (!sourceFromDestination || (!sourceFromDestination.startsWith('..') && !isAbsolute(sourceFromDestination))) {
  throw new Error('The deployment checkout must not be the source directory or its parent.')
}
const manifest = resolve(destination, '.openai/hosting.json')
if (!existsSync(manifest) || !JSON.parse(readFileSync(manifest, 'utf8')).project_id) {
  throw new Error('Open or register the Sites checkout before preparing it.')
}
mkdirSync(destination, { recursive: true })
function copyDirectory(from, to) {
  mkdirSync(to, { recursive: true })
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const input = resolve(from, entry.name), output = resolve(to, entry.name)
    if (entry.isDirectory()) copyDirectory(input, output)
    else if (entry.isFile()) {
      let content = readFileSync(input)
      // This Vinext release fails in its RSC navigation module.
      // Native links preserve working navigation in the hosted build.
      if (entry.name.endsWith('.tsx') && content.toString().includes('next/link')) {
        content = Buffer.from(content.toString().replace(/(['"])next\/link\1/g, "'@/components/hosted-link'"))
      }
      writeFileSync(output, content)
    }
  }
}
for (const folder of ['app', 'components', 'lib', 'public']) {
  copyDirectory(resolve(source, folder), resolve(destination, folder))
}
copyDirectory(resolve(source, 'hosting/sites'), destination)
writeFileSync(resolve(destination, 'SOURCE.json'), JSON.stringify({
  repository: 'https://github.com/rubackoff/lessonquest',
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim(),
}, null, 2) + '\n')
console.log(`Prepared ${destination}; preserved the Site identity and cloud database adapter.`)
