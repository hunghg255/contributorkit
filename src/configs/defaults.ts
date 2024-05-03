import type { Contributorkit, Tier } from '../types'
import { tierPresets } from './tier-presets'

export const defaultTiers: Tier[] = [
  {
    title: 'Commit',
    contribution: 1,
    preset: tierPresets.base,
  },
  {
    title: 'Over 10 Commit',
    contribution: 10,
    preset: tierPresets.medium,
  },
  {
    title: 'Over 100 Commit',
    contribution: 100,
    preset: tierPresets.large,
  },
  {
    title: 'Over 200 Commit',
    contribution: 200,
    preset: tierPresets.xl,
  },
]

export const defaultInlineCSS = `
text {
  font-weight: 300;
  font-size: 14px;
  fill: #777777;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.contributorkit-link {
  cursor: pointer;
}
.contributorkit-tier-title {
  font-weight: 500;
  font-size: 20px;
}
`

export const defaultConfig: Partial<Contributorkit> = {
  width: 800,
  outputDir: './contributorkit',
  cacheFile: '.cache.json',
  formats: ['svg', 'png'],
  tiers: defaultTiers,
  name: 'contributors',
  svgInlineCSS: defaultInlineCSS,
}
