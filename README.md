# HospitiumRIS

A comprehensive Research Information System designed for researchers, institutions, and funding foundations. HospitiumRIS streamlines research management by providing tools for publication tracking, collaborative manuscript editing, proposal management, and integration with major academic databases.

## Overview

HospitiumRIS serves as a centralized platform for:

- **Researchers** to manage publications, collaborate on manuscripts, and track their academic profile
- **Research Administrators** to oversee institutional research activities and outputs
- **Funding Foundations** to manage grants, campaigns, and track research impact

## Features

### Publication Management

- Import publications from PubMed, CrossRef, OpenAlex, and Research4Life
- Support for BibTeX, RIS (EndNote), and Mendeley formats
- Organize publications in custom folder hierarchies
- Citation formatting with multiple styles (APA, MLA, Chicago, Vancouver)

### Manuscript Collaboration

- Real-time collaborative document editing with TipTap editor
- Invite collaborators via ORCID search or direct email
- Role-based permissions (Owner, Admin, Editor, Contributor, Reviewer)
- Track changes with accept/reject workflow
- Version history with manual and automatic snapshots
- Threaded comments and inline suggestions

### Research Proposals

- Create and manage research proposals with structured templates
- Link related publications and manuscripts
- Track ethical approvals and documentation
- Manage milestones, deliverables, and budgets
- Support for multi-investigator projects

### Integrations

- ORCID authentication and researcher lookup
- Zotero library synchronization
- DOI resolution and metadata fetching
- PubMed and OpenAlex search

### Grant and Campaign Management

- Track funding sources and grant opportunities
- Manage fundraising campaigns with activity logging
- Record donations and donor information

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Material UI (MUI) 7
- **Editor**: TipTap rich text editor
- **Visualization**: D3.js and Chart.js

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL 14 or later

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env` file with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/hospitiumris"
NEXTAUTH_SECRET="your-secret-key-at-least-32-characters"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="HospitiumRIS <your-email@gmail.com>"

# ORCID (optional)
NEXT_PUBLIC_ORCID_CLIENT_ID="your-client-id"
ORCID_CLIENT_SECRET="your-client-secret"
NEXT_PUBLIC_ORCID_REDIRECT_URI="http://localhost:3000/auth/orcid/callback"
```

3. Set up the database:

```bash
npm run db:generate
npm run db:push
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio database browser |
| `npm run db:seed` | Seed database with sample data |
| `npm run test:email` | Test SMTP email configuration |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # REST API endpoints
│   ├── researcher/        # Researcher dashboard pages
│   ├── institution/       # Institution admin pages
│   └── foundation/        # Foundation admin pages
├── components/            # Reusable React components
├── lib/                   # Core utilities and configuration
├── services/              # External API integrations
└── utils/                 # Helper functions
```

## Documentation

Additional documentation is available in the `docs/` directory:

- `DATABASE_SETUP.md` - Database configuration guide
- `ORCID_SETUP_GUIDE.md` - ORCID integration setup
- `ZOTERO_SETUP.md` - Zotero synchronization guide
- `MENDELEY_IMPORT_GUIDE.md` - Importing from Mendeley

## License

This project is proprietary software. All rights reserved.
