import { defineConfig } from 'vitepress';

// Docs site for Repospec. Sources live where the repo already keeps them
// (spec/, docs/, root READMEs); srcDir is the repo root so the site mirrors
// the repository rather than duplicating content. Non-doc trees are excluded.
export default defineConfig({
  title: 'Repospec',
  description:
    'An open, repository-first specification that standardizes how AI coding assistants understand, build, and evolve a software project — without prompts.',
  lang: 'en-US',

  // Project Pages site: https://npxchaos.github.io/repospec/
  base: '/repospec/',

  srcExclude: [
    'node_modules/**',
    'packages/**',
    'examples/**',
    '.changeset/**',
    '.github/**',
    'scripts/**',
    'schemas/**',
    '**/CHANGELOG.md',
    'CODE_OF_CONDUCT.md',
    // Fill-in templates with <placeholder> text the Vue compiler reads as HTML.
    'docs/adr/template.md',
    'spec/rfcs/**',
  ],

  // The spec and guides cross-link to files outside srcDir (packages/,
  // examples/, LICENSE). Those resolve on GitHub, not on the site.
  ignoreDeadLinks: true,

  cleanUrls: true,
  lastUpdated: true,

  head: [['meta', { name: 'theme-color', content: '#3c8772' }]],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/docs/vision' },
      { text: 'Commands', link: '/docs/commands' },
      { text: 'Specification', link: '/spec/README' },
      { text: 'ADRs', link: '/docs/adr/README' },
      {
        text: 'v0.1',
        items: [
          {
            text: 'npm — @repospec/cli',
            link: 'https://www.npmjs.com/package/@repospec/cli',
          },
          {
            text: 'Changelog',
            link: 'https://github.com/npxchaos/repospec/releases',
          },
        ],
      },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Why Repospec', link: '/docs/vision' },
          { text: 'Manifesto', link: '/docs/manifesto' },
          { text: 'Command reference', link: '/docs/commands' },
          { text: 'Authoring templates', link: '/docs/templates' },
        ],
      },
      {
        text: 'Specification',
        items: [
          { text: 'Overview', link: '/spec/README' },
          { text: 'Protocol', link: '/spec/protocol' },
          { text: 'Repository', link: '/spec/repository' },
          { text: 'Configuration', link: '/spec/configuration' },
          { text: 'Agent', link: '/spec/agent' },
          { text: 'Workflow', link: '/spec/workflow' },
          { text: 'Lifecycle', link: '/spec/lifecycle' },
          { text: 'Versioning', link: '/spec/versioning' },
        ],
      },
      {
        text: 'Architecture',
        items: [
          { text: 'Overview', link: '/docs/architecture/overview' },
          { text: 'Analysis', link: '/docs/analysis' },
          { text: 'Governance', link: '/docs/governance' },
          { text: 'Roadmap', link: '/docs/roadmap' },
        ],
      },
      {
        text: 'Decision records',
        collapsed: true,
        items: [
          { text: 'ADR index', link: '/docs/adr/README' },
          {
            text: '0001 · Monorepo & boundaries',
            link: '/docs/adr/0001-monorepo-and-package-boundaries',
          },
          {
            text: '0002 · Protocol versioning',
            link: '/docs/adr/0002-protocol-versioning',
          },
          {
            text: '0003 · Source of truth & adapters',
            link: '/docs/adr/0003-single-source-of-truth-and-tool-adapters',
          },
          {
            text: '0004 · Ownership & idempotent sync',
            link: '/docs/adr/0004-ownership-and-idempotent-sync',
          },
          {
            text: '0005 · Validation (zod & JSON Schema)',
            link: '/docs/adr/0005-validation-zod-and-json-schema',
          },
          {
            text: '0006 · Template distribution',
            link: '/docs/adr/0006-template-distribution',
          },
          {
            text: '0007 · Specification-first',
            link: '/docs/adr/0007-specification-first-architecture',
          },
          {
            text: '0008 · Plugin runtime security',
            link: '/docs/adr/0008-plugin-runtime-security',
          },
          {
            text: '0009 · Plugin sandbox mechanism',
            link: '/docs/adr/0009-plugin-sandbox-mechanism',
          },
          {
            text: '0010 · Sandbox via permission model',
            link: '/docs/adr/0010-plugin-sandbox-permission-model',
          },
          {
            text: '0011 · Plugin bundling',
            link: '/docs/adr/0011-plugin-bundling',
          },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/npxchaos/repospec' },
    ],

    editLink: {
      pattern: 'https://github.com/npxchaos/repospec/edit/main/:path',
      text: 'Edit this page on GitHub',
    },

    search: { provider: 'local' },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © npxchaos',
    },
  },
});
