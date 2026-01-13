---
sidebar_position: 1
title: Researcher Portal
---

# Researcher Portal

The Researcher Portal is the primary workspace for individual researchers. It provides comprehensive tools for managing research activities, publications, manuscripts, proposals, and analytics.

## Dashboard Overview

Upon login, researchers are greeted with a personalized dashboard displaying:

- **Quick Stats** - Publications, manuscripts, proposals, collaborations
- **Recent Activity** - Latest updates on manuscripts and collaborations
- **Research Metrics** - H-Index, citation counts, publication trends
- **Notifications** - Collaboration invitations, comment mentions, updates

## Research Profile

### Profile Management

Researchers can build comprehensive profiles including:

| Field | Description |
|-------|-------------|
| **Academic Title** | Professor, Dr., PhD Candidate, etc. |
| **Department** | Primary department affiliation |
| **Biography** | Research background and experience |
| **Research Interests** | Areas of focus and expertise |
| **Specializations** | Specific research specializations (tags) |
| **Keywords** | Research keywords for discoverability |

### Professional Links

Connect external profiles for enhanced visibility:

- **Google Scholar Profile**
- **ORCID iD** (verified)

### Research Metrics

The profile displays key metrics automatically calculated from publications:

- **H-Index** - Research impact indicator
- **Total Citations** - Cumulative citation count
- **Publications Count** - Total publications
- **Collaboration Count** - Active collaborations

### Public Profile

Each researcher has a shareable public profile at:
```
/researcher/profile/[user-id]
```

The public profile displays:
- Professional avatar with initials
- ORCID verification badge
- Department and institution
- Research biography and interests
- Specializations and keywords
- Publication list with citations
- Manuscript status overview
- Research metrics sidebar
- Professional links
- ORCID employment and education history

## Publications Module

### Import Publications

Import publications from multiple sources:

| Source | Description |
|--------|-------------|
| **PubMed** | NIH biomedical literature database |
| **CrossRef** | DOI-based publication metadata |
| **OpenAlex** | Open scholarly metadata |
| **Zotero** | Personal reference library sync |
| **BibTeX** | Manual .bib file import |
| **Manual Entry** | Create publications manually |

### Publication Library

Organize publications with:

- **Folder System** - Create hierarchical folders
- **Search & Filter** - Find publications by title, author, year
- **Bulk Actions** - Move, delete, or export multiple items
- **Citation Export** - Generate citations in various formats

### Publication Details

Each publication record includes:

- Title and abstract
- Authors list
- Journal/Conference name
- DOI and URL links
- Publication year and date
- Citation count
- Keywords and field

## Manuscripts Module

### Collaborative Editing

Create and collaborate on manuscripts with:

- **Rich Text Editor** - Full-featured TipTap editor
- **Real-time Collaboration** - Multiple editors simultaneously
- **Track Changes** - Accept/reject changes workflow
- **Version History** - Restore previous versions
- **Inline Comments** - Contextual feedback and discussions

### Manuscript Types

Support for various document types:

- Research Articles
- Review Papers
- Conference Papers
- Grant Proposals
- Technical Reports

### Collaboration Roles

| Role | Permissions |
|------|------------|
| **Owner** | Full control, can delete manuscript |
| **Admin** | Can manage collaborators, edit, comment |
| **Editor** | Can edit content, track changes |
| **Contributor** | Can suggest changes, comment |
| **Reviewer** | Read-only with commenting |

### Inviting Collaborators

Invite collaborators via:

1. **ORCID Search** - Find researchers by ORCID iD
2. **Email Invitation** - Invite by email address
3. **System Users** - Search registered users

### Citation Management

Manage references within manuscripts:

- Insert citations from library
- Import new references inline
- Auto-format bibliography
- Multiple citation styles (APA, MLA, Chicago, etc.)

## Proposals Module

### Create Proposals

Structured proposal creation with sections for:

1. **Basic Information**
   - Title and abstract
   - Principal Investigator (with ORCID lookup)
   - Co-Investigators
   - Departments involved

2. **Research Details**
   - Research areas and objectives
   - Methodology
   - Timeline (start/end dates)

3. **Project Management**
   - Milestones with deadlines
   - Deliverables list

4. **Funding Information**
   - Funding source
   - Grant number
   - Budget amount
   - Funding institution

5. **Ethical Considerations**
   - Ethics overview
   - Consent procedures
   - Data security measures
   - Ethics approval status

6. **File Attachments**
   - Ethics documents
   - Data management plans
   - Supporting files

### Proposal Statuses

Track proposals through the lifecycle:

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/REVISION_REQUESTED
```

### Liaison Communication

Email thread system for proposal-related communications with reviewers and administrators.

## Analytics Module

### Publication Analytics

- Publication trends over time
- Citations per year
- Top cited publications
- Co-author network visualization

### Impact Analytics

- H-Index progression
- Citation velocity
- Field impact comparison
- Collaboration metrics

### Progress Tracking

- Manuscript completion status
- Proposal success rates
- Research output trends

## Settings

### Account Settings

- Password management
- Email notifications preferences
- Profile visibility settings

### Integration Settings

- **Zotero Connection** - API key configuration
- **ORCID Sync** - Refresh profile data

## Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     RESEARCHER WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                 │
│  │  Import  │────>│  Manage  │────>│   Cite   │                 │
│  │Publications│   │  Library │     │in Manuscript│              │
│  └──────────┘     └──────────┘     └──────────┘                 │
│                                           │                      │
│                                           ▼                      │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                 │
│  │  Create  │<────│  Invite  │<────│Collaborate│                │
│  │Manuscript│     │ Authors  │     │ & Edit   │                 │
│  └──────────┘     └──────────┘     └──────────┘                 │
│                                           │                      │
│                                           ▼                      │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                 │
│  │  Track   │────>│  Review  │────>│ Publish  │                 │
│  │ Changes  │     │ Versions │     │ Submit   │                 │
│  └──────────┘     └──────────┘     └──────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save manuscript |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+K` | Insert link |

