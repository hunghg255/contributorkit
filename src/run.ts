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
import { resolveAvatars, svgToPng } from './processing/image'
import { builtinRenderers } from './renders'
import type { Contributor, Contributorkit, ContributorkitRenderOptions, ContributorkitRenderer } from './types'

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

export async function run(inlineConfig?: Contributorkit, t = consola) {
  t.log(`\n${c.magenta(c.bold('ContributorKit'))} ${c.dim(`v${version}`)}\n`)

  const fullConfig = await loadConfig(inlineConfig)
  const config = fullConfig as Required<Contributorkit>
  const dir = resolve(process.cwd(), config.outputDir)
  const cacheFile = resolve(dir, config.cacheFile)

  if (config.renders?.length) {
    const names = new Set<string>()
    config.renders.forEach((renderOptions, idx) => {
      const name = renderOptions.name || 'sponsors'
      if (names.has(name))
        throw new Error(`Duplicate render name: ${name} at index ${idx}`)
      names.add(name)
    })
  }

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
    await fsp.writeFile(cacheFile, JSON.stringify(allContributors, null, 2))
  }
  else {
    allContributors = JSON.parse(await fsp.readFile(cacheFile, 'utf-8'))
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

  t.info(`${logPrefix} Composing SVG...`)
  const svg = await renderer.renderSVG(renderOptions, contributors)
  // svg = await renderOptions.onSvgGenerated?.(svg) || svg

  if (renderOptions.formats?.includes('svg')) {
    const path = join(dir, `${renderOptions.name}.svg`)
    await fsp.writeFile(path, svg, 'utf-8')
    t.success(`${logPrefix} Wrote to ${r(path)}`)
  }

  if (renderOptions.formats?.includes('png')) {
    const path = join(dir, `${renderOptions.name}.png`)
    await fsp.writeFile(path, await svgToPng(svg))
    t.success(`${logPrefix} Wrote to ${r(path)}`)
  }
}
