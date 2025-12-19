// @ts-check

/**
 * HospitiumRIS Documentation Sidebar Configuration
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/requirements',
        'getting-started/installation',
      ],
    },
    {
      type: 'category',
      label: 'Database',
      items: [
        'database/schema',
      ],
    },
    {
      type: 'category',
      label: 'Modules',
      items: [
        'modules/researcher',
        'modules/institution',
        'modules/foundation',
        'modules/super-admin',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/manuscripts',
        'features/publications',
        'features/proposals',
        'features/orcid',
      ],
    },
  ],
};

export default sidebars;
