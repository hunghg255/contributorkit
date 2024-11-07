import { Buffer } from 'node:buffer'
import { $fetch } from 'ofetch'
import sharp from 'sharp'
import { version } from '../../package.json'
import type { Contributor, ImageFormat } from '../types'

// export async function resolveAvatars(contributors: Contributor[]) {
//   const pLimit = await import('p-limit').then(r => r.default)
//   const limit = pLimit(15)

//   return Promise.all(contributors.map(ship => limit(async () => {
//     const data = await $fetch(ship.avatar_url, {
//       responseType: 'arrayBuffer',
//       headers: {
//         'User-Agent': `Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36 Contributorkit/${version}`,
//       },
//     })

//     if (data) {
//       const radius = ship.type === 'Organization' ? 0.1 : 0.5
//       ship.avatarBuffer = arrayBufferToBase64(data)
//       ship.avatarUrlHighRes = pngToDataUri(await round(data, radius, 120))
//       ship.avatarUrlMediumRes = pngToDataUri(await round(data, radius, 80))
//       ship.avatarUrlLowRes = pngToDataUri(await round(data, radius, 50))
//     }
//   })))
// }

// function toBuffer(ab: ArrayBuffer) {
//   const buf = Buffer.alloc(ab.byteLength)
//   const view = new Uint8Array(ab)
//   for (let i = 0; i < buf.length; ++i)
//     buf[i] = view[i]

//   return buf
// }

// export function base64ToArrayBuffer(base64: string) {
//   const binaryString = atob(base64)
//   const len = binaryString.length
//   const bytes = new Uint8Array(len)
//   for (let i = 0; i < len; i++)
//     bytes[i] = binaryString.charCodeAt(i)

//   return bytes.buffer
// }

// export function arrayBufferToBase64(buffer: ArrayBuffer) {
//   let binary = ''
//   const bytes = new Uint8Array(buffer)
//   const len = bytes.byteLength
//   for (let i = 0; i < len; i++)
//     binary += String.fromCharCode(bytes[i])
//   return btoa(binary)
// }

// export async function round(image: string | ArrayBuffer, radius = 0.5, size = 100) {
//   const rect = Buffer.from(
//     `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size * radius}" ry="${size * radius}"/></svg>`,
//   )

//   return await sharp(typeof image === 'string' ? image : toBuffer(image))
//     .resize(size, size, { fit: sharp.fit.cover })
//     .composite([{
//       blend: 'dest-in',
//       input: rect,
//       density: 72,
//     }])
//     .png({ quality: 80, compressionLevel: 8 })
//     .toBuffer()
// }

// export function svgToPng(svg: string) {
//   return sharp(Buffer.from(svg), { density: 150 })
//     .png({ quality: 90 })
//     .toBuffer()
// }

// export function pngToDataUri(png: Buffer) {
//   return `data:image/png;base64,${png.toString('base64')}`
// }

// export function svgToWebp(svg: string) {
//   return sharp(Buffer.from(svg), { density: 150 })
//     .webp()
//     .toBuffer()
// }

async function fetchImage(url: string) {
  const arrayBuffer = await $fetch(url, {
    responseType: 'arrayBuffer',
    headers: {
      'User-Agent': `Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36 Contributorkit/${version}`,
    },
  })
  return Buffer.from(arrayBuffer)
}

export async function resolveAvatars(
  contributors: Contributor[],
) {
  // const fallbackAvatar = await (() => {
  //   if (typeof getFallbackAvatar === 'string')
  //     return fetchImage(getFallbackAvatar)

  //   if (getFallbackAvatar)
  //     return getFallbackAvatar
  // })()

  const pLimit = await import('p-limit').then(r => r.default)
  const limit = pLimit(15)

  return Promise.all(contributors.map(ship => limit(async () => {
    // if (ship.privacyLevel === 'PRIVATE' || !ship.sponsor.avatarUrl) {
    //   ship.sponsor.avatarBuffer = fallbackAvatar
    //   return
    // }

    const pngBuffer = await fetchImage(ship.avatar_url).catch((e) => {
      // if (fallbackAvatar)
      //   return fallbackAvatar
      throw e
    })

    if (pngBuffer) {
      // Store the highest resolution version we use of the original image
      // Stored in webp to save space
      ship.avatarBuffer = await resizeImage(pngBuffer, 120, 'webp')
    }
  })))
}

const cache = new Map<Buffer, Map<string, Buffer>>()
export async function resizeImage(
  image: Buffer,
  size = 100,
  format: ImageFormat,
) {
  try {
    const cacheKey = `${size}:${format}`
    if (cache.has(image)) {
      const cacheHit = cache.get(image)!.get(cacheKey)
      if (cacheHit)
        return cacheHit
    }

    if (image) {
      let processing = sharp(image)
        .resize(size, size, { fit: sharp.fit.cover })

      processing = (format === 'webp')
        ? processing.webp()
        : processing.png({ quality: 80, compressionLevel: 8 })

      const result = await processing.toBuffer()

      if (!cache.has(image))
        cache.set(image, new Map())

      cache.get(image)!.set(cacheKey, result)

      return result
    }
  }
  catch (error) {
    console.log('resizeImage error', error)
  }
}

export function svgToPng(svg: string) {
  return sharp(Buffer.from(svg), { density: 150 })
    .png({ quality: 90 })
    .toBuffer()
}

export function svgToWebp(svg: string) {
  return sharp(Buffer.from(svg), { density: 150 })
    .webp()
    .toBuffer()
}
