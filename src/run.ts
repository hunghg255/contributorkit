/* eslint-disable node/prefer-global/buffer */
/* eslint-disable ts/ban-ts-comment */
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { consola } from 'consola'
import c from 'picocolors'
import { Octokit } from '@octokit/core'
import { version } from '../package.json'
import { loadConfig } from './configs'
import { resolveAvatars, svgToPng, svgToWebp } from './processing/image'
import { builtinRenderers } from './renders'
import { type Contributor, type Contributorkit, type ContributorkitRenderOptions, type ContributorkitRenderer, outputFormats } from './types'
import { parseCache, stringifyCache } from './cache'

export {
  // default
  tiersRenderer as defaultRenderer,
  tiersComposer as defaultComposer,

  tiersRenderer,
  tiersComposer,
} from './renders/tiers'

function r(path: string) {
  return `./${relative(process.cwd(), path)}`
}

// function normalizeReplacements(replaces: ContributorkitMainConfig['replaceLinks']) {
//   const array = (Array.isArray(replaces) ? replaces : [replaces]).filter(notNullish)
//   const entries = array.map((i) => {
//     if (!i)
//       return []
//     if (typeof i === 'function')
//       return [i]
//     return Object.entries(i) as [string, string][]
//   }).flat()
//   return entries
// }

export async function run(inlineConfig?: Contributorkit, t = consola) {
  t.log(`\n${c.magenta(c.bold('ContributorKit'))} ${c.dim(`v${version}`)}\n`)

  const fullConfig = await loadConfig(inlineConfig)
  const config = fullConfig as Required<Contributorkit>
  const dir = resolve(process.cwd(), config.outputDir)
  const cacheFile = resolve(dir, config.cacheFile)

  if (config.renders?.length) {
    const names = new Set<string>()
    config.renders.forEach((renderOptions, idx) => {
      const name = renderOptions.name || 'contributors'
      if (names.has(name))
        throw new Error(`Duplicate render name: ${name} at index ${idx}`)
      names.add(name)
    })
  }

  // const linksReplacements = normalizeReplacements(config.replaceLinks)
  // const avatarsReplacements = normalizeReplacements(config.replaceAvatars)

  let allContributors: Contributor[] = []
  const octokit = new Octokit()

  if (!config.owner || !config.repo)
    throw new Error('Missing owner or repo in config')

  if (!fs.existsSync(cacheFile)) {
    const res = await octokit.request(`GET /repos/${config.owner}/${config.repo}/contributors`, {
      owner: config.owner,
      repo: config.repo,
      per_page: 100,
    }) as any

    allContributors = res?.data?.filter((v: any) => v.type !== 'Bot') || []

    t.info('Resolving avatars...')
    await resolveAvatars(allContributors)
    t.success('Avatars resolved')

    await fsp.mkdir(dirname(cacheFile), { recursive: true })
    await fsp.writeFile(cacheFile, stringifyCache(allContributors))
  }
  else {
    allContributors = parseCache(await fsp.readFile(cacheFile, 'utf-8'))

    t.success(`Loaded from cache ${r(cacheFile)}`)
  }

  // Sort
  allContributors.sort((a, b) =>
    b.contributions - a.contributions // DESC amount
    || (b.login).localeCompare(a.login), // ASC name
  )

  // allContributors = await config.onSponsorsReady?.(allContributors) || allContributors

  if (config.renders?.length) {
    t.info(`Generating with ${config.renders.length} renders...`)
    await Promise.all(config.renders.map(async (renderOptions) => {
      const mergedOptions = {
        ...fullConfig,
        ...renderOptions,
      }
      const renderer = builtinRenderers[mergedOptions.renderer || 'tiers']
      await applyRenderer(
        renderer,
        config,
        // @ts-expect-error
        mergedOptions,
        allContributors,
        t,
      )
    }))
  }
  else {
    const renderer = builtinRenderers[fullConfig.renderer || 'tiers']
    await applyRenderer(
      renderer,
      config,
      // @ts-expect-error
      fullConfig,
      allContributors,
      t,
    )
  }
}

export async function applyRenderer(
  renderer: ContributorkitRenderer,
  config: Required<Contributorkit>,
  renderOptions: Required<ContributorkitRenderOptions>,
  contributors: Contributor[],
  t = consola,
) {
  // contributors = [...contributors]
  // contributors = await renderOptions.onBeforeRenderer?.(contributors) || contributors

  const logPrefix = c.dim(`[${renderOptions.name}]`)
  const dir = resolve(process.cwd(), config.outputDir)
  await fsp.mkdir(dir, { recursive: true })
  // if (renderOptions.formats?.includes('json')) {
  //   const path = join(dir, `${renderOptions.name}.json`)
  //   await fsp.writeFile(path, JSON.stringify(contributors, null, 2))
  //   t.success(`${logPrefix} Wrote to ${r(path)}`)
  // }

  // if (renderOptions.filter)
  //   contributors = contributors.filter(s => renderOptions.filter(s, sponsors) !== false)

  if (!renderOptions.imageFormat)
    renderOptions.imageFormat = 'webp'

  t.info(`${logPrefix} Composing SVG...`)

  const processingSvg = (async () => {
    let svgWebp = await renderer.renderSVG(renderOptions, contributors)

    if (renderOptions.onSvgGenerated)
      svgWebp = await renderOptions.onSvgGenerated(svgWebp) || svgWebp

    return svgWebp
  })()

  if (renderOptions.formats) {
    let svgPng: Promise<string> | undefined

    await Promise.all([
      renderOptions.formats.map(async (format) => {
        if (!outputFormats.includes(format))
          throw new Error(`Unsupported format: ${format}`)

        const path = join(dir, `${renderOptions.name}.${format}`)

        let data: string | Buffer

        if (format === 'svg')
          data = await processingSvg

        if (format === 'png' || format === 'webp') {
          if (!svgPng) {
            // Sharp can't render embedded Webp so re-generate with png
            // https://github.com/lovell/sharp/issues/4254
            svgPng = renderer.renderSVG({
              ...renderOptions,
              imageFormat: 'png',
            }, contributors)
          }

          if (format === 'png')
            data = await svgToPng(await svgPng)

          if (format === 'webp')
            data = await svgToWebp(await svgPng)
        }

        await fsp.writeFile(path, data as any)

        t.success(`${logPrefix} Wrote to ${r(path)}`)
      }),
    ])
  }

  // t.info(`${logPrefix} Composing SVG...`)
  // const svg = await renderer.renderSVG(renderOptions, contributors)
  // // svg = await renderOptions.onSvgGenerated?.(svg) || svg

  // if (renderOptions.formats?.includes('svg')) {
  //   const path = join(dir, `${renderOptions.name}.svg`)
  //   await fsp.writeFile(path, svg, 'utf-8')
  //   t.success(`${logPrefix} Wrote to ${r(path)}`)
  // }

  // if (renderOptions.formats?.includes('png')) {
  //   const path = join(dir, `${renderOptions.name}.png`)
  //   await fsp.writeFile(path, await svgToPng(svg))
  //   t.success(`${logPrefix} Wrote to ${r(path)}`)
  // }
}
