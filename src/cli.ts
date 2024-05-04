import process from 'node:process'
import yargs from 'yargs'
import { version } from '../package.json'
import { run } from './run'
import type { Contributorkit } from './types'

const cli = yargs(process.argv.slice(2))
  .scriptName('contributors-svg')
  .usage('$0 [args]')
  .version(version)
  .strict()
  .showHelpOnFail(false)
  .alias('h', 'help')
  .alias('v', 'version')

cli.command(
  '*',
  'Generate',
  args => args
    .option('owner', {
      type: 'string',
      requiresArg: true,
    })
    .option('repo', {
      type: 'string',
      requiresArg: true,
    })
    .option('width', {
      alias: 'w',
      type: 'number',
      default: 800,
    })
    .option('outputDir', {
      type: 'string',
      alias: ['out', 'dir'],
    })
    .option('renderer', {
      type: 'string',
      description: 'tiers | circles',
      default: 'tiers',
    })
    .option('name', {
      type: 'string',
    })
    .option('format', {
      type: 'string',
      default: 'svg',
    })
    .strict()
    .help(),
  async (options) => {
    const config = options as Contributorkit

    if (options._[0])
      config.outputDir = options._[0] as string

    await run(config)
  },
)

cli
  .help()
  .parse()
