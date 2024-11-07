import { defineConfig, tierPresets } from 'contributorkit'

export default defineConfig({
  // includePrivate: true,
  // tiers: [
  //   {
  //     title: 'Past Sponsors',
  //     monthlyDollars: -1,
  //     preset: tierPresets.xs,
  //   },
  //   {
  //     title: 'Backers',
  //     // to replace the entire tier rendering
  //     // compose: (composer, tierSponsors, config) => {
  //     //   composer.addRaw(
  //     //     '<-- custom svg -->',
  //     //   )
  //     // },
  //   },
  //   {
  //     title: 'Sponsors',
  //     monthlyDollars: 10,
  //     preset: tierPresets.medium,
  //     // to insert custom elements after the tier block
  //     composeAfter: (composer, _tierSponsors, _config) => {
  //       composer.addSpan(10)
  //     },
  //   },
  //   {
  //     title: 'Silver Sponsors',
  //     monthlyDollars: 50,
  //     preset: tierPresets.large,
  //   },
  //   {
  //     title: 'Gold Sponsors',
  //     monthlyDollars: 100,
  //     preset: tierPresets.xl,
  //   },
  // ],

  // Run multiple renders with different configurations
  // renders: [
  //   {
  //     name: 'sponsors',
  //     width: 800,
  //     formats: ['svg', 'png'],
  //   },
  //   {
  //     name: 'sponsors-wide',
  //     width: 1000,
  //     formats: ['svg'],
  //   },
  //   {
  //     renderer: 'circles',
  //     name: 'sponsors-circles',
  //     width: 1000,
  //     includePastSponsors: true,

  //   },
  // ],
  outputDir: '.',
  owner: 'facebook',
  repo: 'react',
  renders: [
    {
      name: 'contributor',
      width: 800,
      formats: ['svg', 'png', 'webp'],
    },
    {
      name: 'contributor-wide',
      width: 1000,
      formats: ['svg', 'png', 'webp'],
    },
    {
      renderer: 'circles',
      name: 'contributor-circles',
      width: 1000,
    },
  ],
})
