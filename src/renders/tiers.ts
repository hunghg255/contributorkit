import type { Contributor, Contributorkit, ContributorkitRenderer, Tier, TierPartition } from '../types'
import { SvgComposer } from '../processing/svg'
import { tierPresets } from '../configs/tier-presets'

function partitionTiers(contributions: Contributor[], tiers: Tier[]): TierPartition[] {
  const tierMappings = tiers!.map<TierPartition>(tier => ({
    contribution: tier.contribution ?? 0,
    tier,
    contributions: [],
  }))

  tierMappings.sort((a, b) => b.contribution - a.contribution)

  // if (tierMappings.length !== 1)
  //   throw new Error(`There should be exactly one tier with no \`contribution\`, but got ${tierMappings.length}`)

  contributions
    .filter(s => s.contributions > 0) // Past sponsors monthlyDollars is -1
    .forEach((contributor) => {
      const tier = tierMappings.find(t => contributor.contributions >= t.contribution) ?? tierMappings[0]
      tier.contributions.push(contributor)
    })

  return tierMappings
}

export async function tiersComposer(composer: SvgComposer, contributors: Contributor[], config: Contributorkit) {
  const tierPartitions = partitionTiers(contributors, config.tiers!)

  composer.addSpan(config.padding?.top ?? 20)

  for (const { tier: t, contributions } of tierPartitions) {
    // t.composeBefore?.(composer, contributions, config)
    // if (t.compose) {
    //   t.compose(composer, contributions, config)
    // }
    // else {
    const preset = t.preset || tierPresets.base
    if (contributions.length && preset.avatar.size) {
      const paddingTop = t.padding?.top ?? 20
      const paddingBottom = t.padding?.bottom ?? 10
      if (paddingTop)
        composer.addSpan(paddingTop)
      if (t.title) {
        composer
          .addTitle(t.title)
          .addSpan(5)
      }
      await composer.addSponsorGrid(contributions, preset)
      if (paddingBottom)
        composer.addSpan(paddingBottom)
    }
    // }
    // t.composeAfter?.(composer, contributions, config)
  }

  composer.addSpan(config.padding?.bottom ?? 20)
}

export const tiersRenderer: ContributorkitRenderer = {
  name: 'contributorkit:tiers',
  async renderSVG(config, contributors: Contributor[]) {
    const composer = new SvgComposer(config)
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    await (config.customComposer || tiersComposer)(composer, contributors, config)
    return composer.generateSvg()
  },
}
