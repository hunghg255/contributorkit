import { Buffer } from 'node:buffer'
import { $fetch } from 'ofetch'
import sharp from 'sharp'
import { consola } from 'consola'
import { version } from '../../package.json'
import type { Contributor } from '../types'

export async function resolveAvatars(contributors: Contributor[]) {
  const pLimit = await import('p-limit').then(r => r.default)
  const limit = pLimit(15)

  return Promise.all(contributors.map(ship => limit(async () => {
    const data = await $fetch(ship.avatar_url, {
      responseType: 'arrayBuffer',
      headers: {
        'User-Agent': `Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36 Sponsorkit/${version}`,
      },
    })

    if (data) {
      const radius = ship.type === 'Organization' ? 0.1 : 0.5
      ship.avatarBuffer = arrayBufferToBase64(data)
      ship.avatarUrlHighRes = pngToDataUri(await round(data, radius, 120))
      ship.avatarUrlMediumRes = pngToDataUri(await round(data, radius, 80))
      ship.avatarUrlLowRes = pngToDataUri(await round(data, radius, 50))
    }
  })))
}

function toBuffer(ab: ArrayBuffer) {
  const buf = Buffer.alloc(ab.byteLength)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buf.length; ++i)
    buf[i] = view[i]

  return buf
}

export function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++)
    bytes[i] = binaryString.charCodeAt(i)

  return bytes.buffer
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++)
    binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export async function round(image: string | ArrayBuffer, radius = 0.5, size = 100) {
  const rect = Buffer.from(
    `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size * radius}" ry="${size * radius}"/></svg>`,
  )

  return await sharp(typeof image === 'string' ? image : toBuffer(image))
    .resize(size, size, { fit: sharp.fit.cover })
    .composite([{
      blend: 'dest-in',
      input: rect,
      density: 72,
    }])
    .png({ quality: 80, compressionLevel: 8 })
    .toBuffer()
}

export function svgToPng(svg: string) {
  return sharp(Buffer.from(svg), { density: 150 })
    .png({ quality: 90 })
    .toBuffer()
}

export function pngToDataUri(png: Buffer) {
  return `data:image/png;base64,${png.toString('base64')}`
}
