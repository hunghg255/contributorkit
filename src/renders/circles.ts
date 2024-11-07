import type { Contributor, ContributorkitRenderer } from '../types'
import { SvgComposer, generateBadge } from '../processing/svg'

export const circlesRenderer: ContributorkitRenderer = {
  name: 'contributorkit:circles',
  async renderSVG(config, contributors: Contributor[]) {
    const { hierarchy, pack } = await import('d3-hierarchy')
    const composer = new SvgComposer(config)

    const amountMax = Math.max(...contributors.map(contributor => contributor.contributions))

    const {
      radiusMax = 300,
      radiusMin = 10,
      radiusPast = 5,
      weightInterop = defaultInterop,
    } = config.circles || {}

    function defaultInterop(contribute: Contributor) {
      return contribute.contributions < 0
        ? radiusPast
        : lerp(radiusMin, radiusMax, (Math.max(0.1, contribute.contributions || 0) / amountMax) ** 0.9)
    }

    const root = hierarchy({ ...contributors[0], children: contributors, id: 'root' })
      .sum(d => weightInterop(d, amountMax))
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    const p = pack<typeof contributors[0]>()
    p.size([config.width, config.width])
    p.padding(config.width / 400)
    const circles = p(root as any).descendants().slice(1)

    for (const circle of circles) {
      composer.addRaw(await generateBadge(
        circle.x - circle.r,
        circle.y - circle.r,
        circle.data,
        {
          name: false,
          boxHeight: circle.r * 2,
          boxWidth: circle.r * 2,
          avatar: {
            size: circle.r * 2,
          },
        },
        0.5,
        config.imageFormat,
      ))
    }

    composer.height = config.width

    return composer.generateSvg()
  },
}

function lerp(a: number, b: number, t: number) {
  if (t < 0)
    return a
  return a + (b - a) * t
}
