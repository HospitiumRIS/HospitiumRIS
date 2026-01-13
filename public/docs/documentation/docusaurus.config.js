// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'HospitiumRIS Documentation',
  tagline: 'Transforming Hospital Research Management',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://hospitiumris.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/documentation/',
  
  // Ensure trailing slashes for proper index.html routing
  trailingSlash: true,

  // GitHub pages deployment config.
  organizationName: 'hospitiumris',
  projectName: 'hospitiumris',

  onBrokenLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: 'docs',
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/hospitiumris-social-card.jpg',
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
      },
      navbar: {
        
        logo: {
          alt: 'HospitiumRIS Logo',
          src: 'img/hospitium-logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            href: 'https://github.com/hospitiumris/hospitiumris',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/intro',
              },
              {
                label: 'Installation',
                to: '/docs/getting-started/installation',
              },
              {
                label: 'Database Schema',
                to: '/docs/database/schema',
              },
            ],
          },
          {
            title: 'Modules',
            items: [
              {
                label: 'Researcher Portal',
                to: '/docs/modules/researcher',
              },
              {
                label: 'Institution Portal',
                to: '/docs/modules/institution',
              },
              {
                label: 'Foundation Portal',
                to: '/docs/modules/foundation',
              },
            ],
          },
          {
            title: 'Features',
            items: [
              {
                label: 'Manuscripts',
                to: '/docs/features/manuscripts',
              },
              {
                label: 'Publications',
                to: '/docs/features/publications',
              },
              {
                label: 'Proposals',
                to: '/docs/features/proposals',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} HospitiumRIS. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'sql'],
      },
    }),
};

export default config;
