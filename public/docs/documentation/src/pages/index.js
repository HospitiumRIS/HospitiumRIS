import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/intro">
            Get Started →
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/installation"
            style={{marginLeft: '1rem'}}>
            Installation Guide
          </Link>
        </div>
      </div>
    </header>
  );
}

const FeatureList = [
  {
    title: 'Collaborative Research',
    description: (
      <>
        Real-time manuscript collaboration with track changes, version history,
        and inline comments. Work together seamlessly with researchers worldwide.
      </>
    ),
  },
  {
    title: 'Publication Management',
    description: (
      <>
        Import publications from PubMed, CrossRef, OpenAlex, and Zotero.
        Organize with folders, track citations, and manage your research library.
      </>
    ),
  },
  {
    title: 'ORCID Integration',
    description: (
      <>
        Seamless ORCID integration for researcher authentication, profile sync,
        and collaborator discovery. Verified researcher identities.
      </>
    ),
  },
  {
    title: 'Proposal Workflow',
    description: (
      <>
        Structured proposal creation with ethics documentation, team management,
        milestones, and institutional review workflow.
      </>
    ),
  },
  {
    title: 'Research Analytics',
    description: (
      <>
        Track H-Index, citations, publication trends, and research impact.
        Comprehensive analytics for researchers and institutions.
      </>
    ),
  },
  {
    title: 'Grant & Campaign Management',
    description: (
      <>
        Foundation tools for fundraising campaigns, donation tracking,
        grant discovery, and financial management.
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className="padding-horiz--md">
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModuleCards() {
  const modules = [
    {
      title: 'Researcher Portal',
      description: 'Manage Researcher Profile, Publications, Manuscripts, and Research Analytics.',
      link: '/docs/modules/researcher',
    },
    {
      title: 'Institution Portal',
      description: 'Oversee Researchers, Review Proposals, and Track Institutional Metrics.',
      link: '/docs/modules/institution',
    },
    {
      title: 'Foundation Portal',
      description: 'Manage Campaigns, Track Donations, and Discover Grant Opportunities.',
      link: '/docs/modules/foundation',
    },
    {
      title: 'Super Admin',
      description: 'System-Wide User Management, Database Operations, and Configuration.',
      link: '/docs/modules/super-admin',
    },
  ];

  return (
    <section className={styles.modules}>
      <div className="container">
        <Heading as="h2" className="text--center margin-bottom--lg">
          Platform Modules
        </Heading>
        <div className="row">
          {modules.map((module, idx) => (
            <div key={idx} className="col col--3">
              <Link to={module.link} className={styles.moduleCard}>
                <Heading as="h4">{module.title}</Heading>
                <p>{module.description}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Welcome to ${siteConfig.title}`}
      description="HospitiumRIS - Research Information System for Academic & Healthcare Institutions">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <ModuleCards />
      </main>
    </Layout>
  );
}
