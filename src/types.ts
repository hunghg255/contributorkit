import type { Buffer } from 'node:buffer'
import type { SvgComposer } from './processing/svg'

export interface Contributor {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: 'User' | 'Organization'
  site_admin: boolean
  contributions: number
  avatarBuffer?: Buffer
  // avatarUrlHighRes?: string
  // avatarUrlMediumRes?: string
  // avatarUrlLowRes?: string
}

export const outputFormats = ['svg', 'png', 'webp', 'json'] as const

export type OutputFormat = typeof outputFormats[number]

export type ImageFormat = 'png' | 'webp'

export interface Contributorkit {
  owner: string
  repo: string
  width?: number
  outputDir?: string
  cacheFile?: string

  tiers?: Tier[]
  formats?: OutputFormat[]
  name?: string
  svgInlineCSS?: string

  /**
   * Url to fallback avatar.
   * Setting false to disable fallback avatar.
   */
  fallbackAvatar?: string | false | Buffer | Promise<Buffer>

  /**
   * Configs for multiple renders
   */
  renders?: ContributorkitRenderOptions[]

  /**
   * Configs for render
   */
  renderer?: 'tiers' | 'circles'

  /**
   * Padding of image container
   */
  padding?: {
    top?: number
    bottom?: number
  }
}

export interface BadgePreset {
  boxWidth: number
  boxHeight: number
  avatar: {
    size: number
    classes?: string
  }
  name?: false | {
    color?: string
    classes?: string
    maxLength?: number
  }
  container?: {
    sidePadding?: number
  }
  classes?: string
}

export interface TierPartition {
  contribution: number
  contributions: Contributor[]
  tier: Tier
}

export interface Tier {
  /**
   * The lower bound of the tier (inclusive)
   */
  contribution?: number
  title?: string
  preset?: BadgePreset
  padding?: {
    top?: number
    bottom?: number
  }
}

export interface CircleRenderOptions {
  /**
   * Min radius for sponsors
   *
   * @default 10
   */
  radiusMin?: number
  /**
   * Max radius for sponsors
   *
   * @default 300
   */
  radiusMax?: number
  /**
   * Radius for past sponsors
   *
   * @default 5
   */
  radiusPast?: number
  /**
   * Custom function to calculate the weight of the sponsor.
   *
   * When provided, `radiusMin`, `radiusMax` and `radiusPast` will be ignored.
   */
  weightInterop?: (contributor: any, maxAmount: number) => number
}

export interface ContributorkitRenderOptions {
  /**
   * Name of exported files
   *
   * @default 'contributor'
   */
  name?: string

  /**
   * Renderer to use
   *
   * @default 'tiers'
   */
  renderer?: 'tiers' | 'circles'

  /**
   * Output formats
   *
   * @default ['json', 'svg', 'png']
   */
  formats?: OutputFormat[]

  /**
   * Compose the SVG
   */
  customComposer?: (composer: SvgComposer, contributors: Contributor[], config: Contributorkit) => PromiseLike<void> | void

  /**
   * Filter of sponsorships to render in the final image.
   */
  // filter?: (sponsor: Sponsorship, all: Sponsorship[]) => boolean | void

  /**
   * Tiers
   *
   * Only effective when using `tiers` renderer.
   */
  tiers?: Tier[]

  /**
   * Options for rendering circles
   *
   * Only effective when using `circles` renderer.
   */
  circles?: CircleRenderOptions

  /**
   * Width of the image.
   *
   * @default 800
   */
  width?: number

  /**
   * Padding of image container
   */
  padding?: {
    top?: number
    bottom?: number
  }

  /**
   * Inline CSS of generated SVG
   */
  svgInlineCSS?: string

  /**
   * Whether to display the private sponsors
   *
   * @default false
   */
  includePrivate?: boolean

  /**
   * Whether to display the past sponsors
   * Currently only works with GitHub provider
   *
   * @default auto detect based on tiers
   */
  includePastSponsors?: boolean

  /**
   * Hook to modify sponsors data before rendering.
   */
  // onBeforeRenderer?: (sponsors: Sponsorship[]) => PromiseLike<void | Sponsorship[]> | void | Sponsorship[]

  /**
   * Hook to get or modify the SVG before writing.
   */
  onSvgGenerated?: (svg: string) => PromiseLike<string | void | undefined | null> | string | void | undefined | null

  /**
   * Format of embedded images
   *
   * @default 'webp'
   */
  imageFormat?: ImageFormat
}

export interface ContributorkitRenderer {
  name: string
  renderSVG: (config: Required<ContributorkitRenderOptions>, contributors: Contributor[]) => Promise<string>
}
