# contributorkit

[![NPM version](https://img.shields.io/npm/v/contributorkit?color=a1b858&label=)](https://www.npmjs.com/package/contributorkit)

Toolkit for generating contributors images.

## Usage

Run:

```base
npx contributorkit
```

[Example Setup](./example/) | [GitHub Actions Setup](https://github.com/hunghg255/contributorkit/blob/main/.github/workflows/scheduler.yml) | [Generated SVG](https://cdn.jsdelivr.net/gh/hunghg255/contributorkit/example/contributor.svg)

## Configurations

Create `contributorkit.config.js` file with:

```ts
import { defineConfig, tierPresets } from 'contributorkit'

export default defineConfig({
  outputDir: '.',
  owner: 'vercel',
  repo: 'next.js',
  renders: [
    {
      name: 'contributor',
      width: 800,
      formats: ['svg', 'png'],
    },
    {
      name: 'contributor-wide',
      width: 1000,
      formats: ['svg'],
    },
    {
      renderer: 'circles',
      name: 'contributor-circles',
      width: 1000,
    },
  ],
})
```

Also check [the example](./example/).

## Utils

Check the type definition or source code for more utils available.

## Renderers

We provide two renderers built-in:

- `tiers`: Render sponsors in tiers.
- `circles`: Render sponsors in packed circles.

### Tiers Renderer

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/hunghg255/contributorkit/example/contributor.svg">
    <img src='https://cdn.jsdelivr.net/gh/hunghg255/contributorkit/example/contributor.svg'/>
  </a>
</p>

### Circles Renderer

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/hunghg255/contributorkit/example/contributor-circles.svg">
    <img src='https://cdn.jsdelivr.net/gh/hunghg255/contributorkit/example/contributor-circles.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2024 [Hung](https://github.com/hunghg255)
