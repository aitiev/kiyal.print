import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import { logoSvg } from './logo.mjs'

const out = new URL('../public/', import.meta.url)
writeFileSync(new URL('favicon.svg', out), logoSvg({ size: 64 }))
const jobs = [
  ['icon-192.png', 192, { rounded: false }],
  ['icon-512.png', 512, { rounded: false }],
  ['icon-maskable-512.png', 512, { rounded: false, pad: 0.1 }],
  ['apple-touch-icon-180.png', 180, { rounded: false }],
]
for (const [name, size, opts] of jobs) {
  await sharp(Buffer.from(logoSvg({ size, ...opts }))).png().toFile(new URL(name, out).pathname)
  console.log('wrote', name)
}
