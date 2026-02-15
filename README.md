# HospitiumRIS

A comprehensive Research Information System designed for researchers, institutions, and funding foundations. HospitiumRIS streamlines research management by providing tools for publication tracking, collaborative manuscript editing, proposal management, and integration with major academic databases.

## Overview

HospitiumRIS serves as a centralized platform for:

- **Researchers** to manage publications, collaborate on manuscripts, and track their academic profile
- **Research Administrators** to oversee institutional research activities and outputs
- **Funding Foundations** to manage grants, campaigns, and track research impact

## Features

### 🤖 AI-Powered Insights

- **AI Publication Summaries**: Automatically generate comprehensive summaries of research publications using Google Gemini AI
- **Keyword Extraction**: AI-powered extraction of key terms and concepts from abstracts
- **Batch Processing**: Generate summaries for multiple publications simultaneously
- **Research Trends**: Identify emerging patterns and themes in your research portfolio

### 📚 Publication Management

- **Multi-Source Import**: Import from PubMed, CrossRef, OpenAlex, and Research4Life
- **Format Support**: BibTeX, RIS (EndNote), Mendeley, and CSV formats
- **Folder Organization**: Create custom hierarchies to organize your publications
- **Citation Styles**: Support for 7 major styles (APA, MLA, Chicago, Harvard, Vancouver, IEEE, AMA)
- **Citation Tracking**: Track citations with metadata using custom TipTap extension
- **Hover Menu**: Quick update/delete citations with inline hover menu
- **Bibliography Generation**: Automatic bibliography with only cited references
- **Cite-as-You-Write**: Real-time citation insertion while writing

### ✍️ Manuscript Collaboration

- **Real-time Editing**: Collaborative document editing with TipTap rich text editor
- **ORCID Integration**: Invite collaborators via ORCID search or direct email
- **Role-Based Permissions**: Owner, Admin, Editor, Contributor, Reviewer roles
- **Track Changes**: Accept/reject workflow for document revisions
- **Version History**: Manual and automatic snapshots with restore capability
- **Comments & Suggestions**: Threaded comments and inline suggestions
- **Presence Indicators**: See who's online and editing in real-time
- **Citation Management**: Integrated citation insertion and bibliography generation

### 🔬 Research Proposals

- **Structured Templates**: Create proposals with predefined sections
- **Publication Linking**: Connect related publications and manuscripts
- **Ethics Tracking**: Track ethical approvals and documentation
- **Budget Management**: Manage project budgets and funding sources
- **Milestone Tracking**: Monitor deliverables and project progress
- **Multi-Investigator**: Support for collaborative research teams
- **Data Management Plans**: Create and manage DMP documents

### 🌐 Network Visualization

- **Collaboration Network**: Interactive D3.js visualization of research connections
- **ORCID Display**: Show researcher ORCID IDs in network profiles
- **Citation Metrics**: Display global citations and HospitiumRIS citations
- **Force-Directed Layout**: Automatic node positioning with collision detection
- **Relationship Levels**: Direct, secondary, and tertiary collaboration visualization
- **Publication Sharing**: View shared publications between collaborators

### 📊 Analytics & Reporting

- **Research Analytics**: Professional bar charts with proper scaling
- **Publication Trends**: Track publications and projects over time
- **Citation Impact**: Monitor citation counts and h-index
- **Network Growth**: Visualize collaboration network expansion
- **Custom Reports**: Generate reports for specific time periods
- **Export Options**: Download data in multiple formats

### 🔗 Integrations

- **ORCID**: Authentication and researcher profile lookup
- **Zotero**: Library synchronization and import
- **DOI Resolution**: Automatic metadata fetching via DOI
- **PubMed**: Direct search and import from PubMed database
- **OpenAlex**: Access to open scholarly data
- **CrossRef**: Citation data and metadata retrieval
- **Research4Life**: Access to research resources

### 💰 Grant & Campaign Management

- **Funding Tracking**: Monitor grant opportunities and applications
- **Campaign Management**: Manage fundraising campaigns with activity logs
- **Donor Records**: Track donations and donor information
- **Budget Allocation**: Manage research budgets and expenses
- **Reporting**: Generate financial and progress reports

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

# Google Gemini AI (optional - for AI summaries)
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"
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
