import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'

const files = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(Boolean))]
const cyrillic = /[\u0400-\u052f]/u
const failures = []
for (const file of files) {
  if (cyrillic.test(file)) failures.push(`${file}: filename`)
  if (!statSync(file).isFile()) continue
  const data = readFileSync(file)
  if (data.includes(0)) continue
  const lines = data.toString('utf8').split('\n')
  lines.forEach((line, index) => {
    if (cyrillic.test(line)) failures.push(`${file}:${index + 1}`)
  })
}
if (failures.length) {
  console.error(`English-content check failed:\n${failures.join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`English-content check passed for ${files.length} repository files. Images require visual review.`)
}
