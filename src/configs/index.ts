import { loadConfig as _loadConfig } from 'unconfig'
import type { Contributorkit } from '../types'
import { FALLBACK_AVATAR } from './fallback'
import { defaultConfig } from './defaults'

export * from './tier-presets'
export * from './fallback'
export * from './defaults'

export function defineConfig(config: Contributorkit): Contributorkit {
  return config
}

// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
export async function loadConfig(inlineConfig: Contributorkit = {}): Promise<Required<Contributorkit>> {
  const { config = {} } = await _loadConfig<Contributorkit>({
    sources: [
      {
        files: 'contributor.config',
      },
      {
        files: 'contributorkit.config',
      },
    ],
    merge: true,
  })

  const resolved = {
    fallbackAvatar: FALLBACK_AVATAR,
    ...defaultConfig,
    ...config,
    ...inlineConfig,
  } as Required<Contributorkit>

  return resolved
}
