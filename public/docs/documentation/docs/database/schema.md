---
sidebar_position: 1
title: Database Schema
---

# Database Schema

HospitiumRIS uses PostgreSQL with Prisma ORM for data management. This document provides a comprehensive overview of the data models and their relationships.

## Schema Overview

The database is organized into several logical domains:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HospitiumRIS Database                          │
├─────────────────┬─────────────────┬─────────────────┬──────────────────┤
│  User & Auth    │   Research      │   Foundation    │   Collaboration  │
├─────────────────┼─────────────────┼─────────────────┼──────────────────┤
│ • User          │ • Publication   │ • Campaign      │ • Manuscript     │
│ • Institution   │ • Proposal      │ • Donation      │ • Collaborator   │
│ • Foundation    │ • ResearchProfile│ • Grantor      │ • Invitation     │
│ • UserSettings  │ • LibraryFolder │ • GrantOpportunity│ • Comment      │
│ • RegistrationLog│               │ • CampaignActivity│ • Version       │
└─────────────────┴─────────────────┴─────────────────┴──────────────────┘
```

## Core Models

### User

The central model for all user accounts in the system.

```prisma
model User {
  id              String      @id @default(cuid())
  accountType     AccountType // RESEARCHER, RESEARCH_ADMIN, FOUNDATION_ADMIN, SUPER_ADMIN
  status          UserStatus  @default(PENDING)
  
  // Personal Information
  givenName       String
  familyName      String
  email           String      @unique
  passwordHash    String
  
  // Email Verification
  emailVerified   Boolean     @default(false)
  
  // ORCID Information
  orcidId         String?
  
  // Research Information
  primaryInstitution String?
  
  // Relations
  institution     Institution?
  foundation      Foundation?
  researchProfile ResearchProfile?
  publications    PublicationAuthor[]
  manuscripts     Manuscript[]
  // ... other relations
}
```

**Account Types:**

| Type | Description |
|------|-------------|
| `RESEARCHER` | Individual researchers |
| `RESEARCH_ADMIN` | Institutional research administrators |
| `FOUNDATION_ADMIN` | Foundation/funding organization admins |
| `SUPER_ADMIN` | System-wide administrators |

**User Statuses:**

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting email verification |
| `ACTIVE` | Verified and active |
| `INACTIVE` | Temporarily disabled |
| `SUSPENDED` | Administratively suspended |

### Research Profile

Extended researcher information linked to User.

```prisma
model ResearchProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  
  // Research Information
  specialization  String[]
  keywords        String[]
  researchInterests String?
  biography       String?
  
  // Academic Information
  academicTitle   String?  // Professor, Dr., etc.
  department      String?
  
  // Professional Links
  website         String?
  linkedin        String?
  twitter         String?
  googleScholar   String?
  
  // Research Metrics
  hIndex          Int?
  citationCount   Int?
  
  user            User     @relation(...)
}
```

### Institution

Research institution details for RESEARCH_ADMIN accounts.

```prisma
model Institution {
  id          String   @id @default(cuid())
  userId      String   @unique
  
  name        String
  type        String   // University, Hospital, Research Institute
  country     String
  website     String?
  
  user        User     @relation(...)
}
```

### Foundation

Foundation details for FOUNDATION_ADMIN accounts.

```prisma
model Foundation {
  id              String   @id @default(cuid())
  userId          String   @unique
  
  institutionName String
  foundationName  String
  type            String   // Private Foundation, Public Foundation
  country         String
  website         String?
  focusArea       String?
  description     String?
  
  user            User     @relation(...)
}
```

---

## Publication Management

### Publication

Stores research publications imported from external sources or manually entered.

```prisma
model Publication {
  id              String            @id @default(cuid())
  
  title           String
  type            String?           // Article, Review, Conference
  field           String?
  journal         String?
  abstract        String?
  authors         String[]
  
  // Identifiers
  doi             String?
  isbn            String?
  url             String?
  
  // Metadata
  keywords        String[]
  pages           String?
  volume          String?
  publicationDate DateTime?
  year            Int?
  
  status          PublicationStatus @default(PUBLISHED)
  source          String?           // PubMed, CrossRef, OpenAlex, Manual
  
  authorRelations PublicationAuthor[]
  manuscriptCitations ManuscriptCitation[]
  proposals       ProposalPublication[]
  libraryFolders  LibraryFolderPublication[]
}
```

### Library Folder

Hierarchical folder system for organizing publications.

```prisma
model LibraryFolder {
  id          String   @id @default(cuid())
  userId      String
  name        String
  parentId    String?  // For nested folders
  expanded    Boolean  @default(false)
  
  parent      LibraryFolder?  @relation("FolderHierarchy", ...)
  children    LibraryFolder[] @relation("FolderHierarchy")
  publications LibraryFolderPublication[]
}
```

---

## Manuscript Collaboration

### Manuscript

Core model for collaborative document editing.

```prisma
model Manuscript {
  id          String           @id @default(cuid())
  
  title       String
  type        String           // Article, Review, Proposal
  field       String?
  description String?
  status      ManuscriptStatus @default(DRAFT)
  
  // Document Content
  content     String?          @db.Text  // HTML/JSON from TipTap
  wordCount   Int?             @default(0)
  
  createdBy   String
  lastUpdatedBy String?
  
  collaborators ManuscriptCollaborator[]
  invitations   ManuscriptInvitation[]
  citations     ManuscriptCitation[]
  comments      ManuscriptComment[]
  versions      ManuscriptVersion[]
  trackedChanges TrackedChange[]
}
```

**Manuscript Statuses:**

| Status | Description |
|--------|-------------|
| `DRAFT` | Initial editing phase |
| `IN_REVIEW` | Under peer review |
| `UNDER_REVISION` | Being revised based on feedback |
| `PUBLISHED` | Finalized and published |
| `ARCHIVED` | No longer active |

### Manuscript Collaborator

Tracks user access and permissions for manuscripts.

```prisma
model ManuscriptCollaborator {
  id           String          @id @default(cuid())
  manuscriptId String
  userId       String
  
  role         CollaboratorRole  // OWNER, ADMIN, EDITOR, CONTRIBUTOR, REVIEWER
  invitedBy    String
  
  // Permissions
  canEdit      Boolean         @default(true)
  canInvite    Boolean         @default(false)
  canDelete    Boolean         @default(false)
  
  manuscript   Manuscript      @relation(...)
  user         User            @relation(...)
}
```

### Manuscript Version

Stores version snapshots for history and rollback.

```prisma
model ManuscriptVersion {
  id            String      @id @default(cuid())
  manuscriptId  String
  versionNumber Int
  
  title         String
  content       String      @db.Text
  changes       String?     @db.Text  // JSON tracked changes data
  
  createdBy     String
  versionType   VersionType @default(AUTO)  // AUTO, MANUAL, MILESTONE
  description   String?
  wordCount     Int?
  
  manuscript    Manuscript  @relation(...)
  creator       User        @relation(...)
}
```

### Tracked Change

Individual change tracking for accept/reject workflow.

```prisma
model TrackedChange {
  id           String       @id @default(cuid())
  manuscriptId String
  changeId     String
  
  type         ChangeType   // INSERT, DELETE, FORMAT, REPLACE
  operation    String
  content      String?      @db.Text
  oldContent   String?      @db.Text
  
  startOffset  Int
  endOffset    Int
  nodeType     String?
  
  authorId     String
  status       ChangeStatus @default(PENDING)  // PENDING, ACCEPTED, REJECTED
  
  acceptedAt   DateTime?
  rejectedAt   DateTime?
  acceptedBy   String?
  
  manuscript   Manuscript   @relation(...)
  author       User         @relation(...)
}
```

### Manuscript Comment

Inline comments and threaded discussions.

```prisma
model ManuscriptComment {
  id              String        @id @default(cuid())
  manuscriptId    String
  authorId        String
  parentCommentId String?
  
  content         String        @db.Text
  type            CommentType   @default(COMMENT)  // COMMENT, SUGGESTION, QUESTION
  status          CommentStatus @default(ACTIVE)   // ACTIVE, RESOLVED, DELETED
  
  // Text Selection Context
  selectedText    String?
  startOffset     Int?
  endOffset       Int?
  
  manuscript      Manuscript         @relation(...)
  author          User               @relation(...)
  parentComment   ManuscriptComment? @relation(...)
  replies         ManuscriptComment[]
}
```

---

## Proposal Management

### Proposal

Research proposal with full lifecycle tracking.

```prisma
model Proposal {
  id          String         @id @default(cuid())
  
  // Core Information
  title       String
  principalInvestigator String
  principalInvestigatorOrcid String?
  coInvestigators Json[]
  departments String[]
  startDate   DateTime?
  endDate     DateTime?
  
  // Research Details
  researchAreas String[]
  researchObjectives String?
  methodology String?
  abstract    String?
  
  // Project Management
  milestones  Json[]
  deliverables Json[]
  
  // Funding
  fundingSource String?
  grantNumber String?
  fundingInstitution String?
  totalBudgetAmount Decimal?
  
  // Ethical Considerations
  ethicalConsiderationsOverview String?
  consentProcedures String?
  dataSecurityMeasures String?
  ethicsApprovalStatus String?
  
  // File uploads (metadata)
  ethicsDocuments Json[]
  dataManagementPlan Json[]
  otherRelatedFiles Json[]
  
  status      ProposalStatus @default(DRAFT)
  
  publications ProposalPublication[]
  manuscripts  ProposalManuscript[]
}
```

**Proposal Statuses:**

| Status | Description |
|--------|-------------|
| `DRAFT` | Being prepared |
| `SUBMITTED` | Submitted for review |
| `UNDER_REVIEW` | Being evaluated |
| `APPROVED` | Accepted |
| `REJECTED` | Not approved |
| `REVISION_REQUESTED` | Needs changes |

---

## Foundation & Grants

### Campaign

Fundraising campaign management.

```prisma
model Campaign {
  id          String   @id @default(cuid())
  categoryId  String
  
  name        String
  description String?
  targetAmount Decimal?
  raisedAmount Decimal  @default(0)
  
  startDate   DateTime?
  endDate     DateTime?
  status      String   @default("Planning")
  
  donorCount      Int @default(0)
  donationCount   Int @default(0)
  
  category    CampaignCategory @relation(...)
  activities  CampaignActivity[]
  donations   Donation[]
}
```

### Donation

Individual donation records.

```prisma
model Donation {
  id              String   @id @default(cuid())
  campaignId      String?
  
  donorName       String
  donorEmail      String?
  donorPhone      String?
  donorType       String?
  
  amount          Decimal
  donationDate    DateTime @default(now())
  paymentMethod   String?
  transactionId   String?
  
  status          String   @default("Completed")
  message         String?
  isAnonymous     Boolean  @default(false)
  taxDeductible   Boolean  @default(true)
  
  campaign        Campaign? @relation(...)
}
```

### Grantor

Grant funding organizations.

```prisma
model Grantor {
  id              String   @id @default(cuid())
  
  name            String   @unique
  type            String   // federal, private, nonprofit, corporate
  focus           String[]
  
  contactPerson   String?
  email           String?
  phone           String?
  country         String
  
  status          String   @default("active")
  
  opportunities   GrantOpportunity[]
}
```

### Grant Opportunity

Available grant opportunities from grantors.

```prisma
model GrantOpportunity {
  id              String   @id @default(cuid())
  grantorId       String
  
  title           String
  amount          Decimal
  deadline        DateTime
  
  category        String[]
  eligibility     String[]
  notes           String?
  status          String   @default("open")
  
  grantor         Grantor  @relation(...)
}
```

---

## Entity Relationship Diagram

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│     User     │────<│ ResearchProfile│     │   Institution    │
└──────┬───────┘     └───────────────┘     └────────┬─────────┘
       │                                            │
       │ 1:N                                        │ 1:1
       │                                            │
       ├────────────────────────────────────────────┘
       │
       │     ┌─────────────────┐
       ├────<│ PublicationAuthor│>────┬──────────────────┐
       │     └─────────────────┘      │                  │
       │                              │                  │
       │     ┌─────────────────────┐  │    ┌─────────────┴───┐
       ├────<│ManuscriptCollaborator│>─┼───<│   Manuscript    │
       │     └─────────────────────┘  │    └────────┬────────┘
       │                              │             │
       │                              │    ┌────────┴────────┐
       │                              └────│   Publication   │
       │                                   └─────────────────┘
       │
       │     ┌──────────────┐     ┌──────────────┐
       └────<│  Notification │────<│   Proposal   │
             └──────────────┘     └──────────────┘
```

---

## Database Commands

### Common Prisma Commands

```bash
# Generate client after schema changes
npm run db:generate

# Create a migration
npm run db:migrate

# Push changes without migration (development)
npm run db:push

# Reset database (⚠️ destroys all data)
npm run db:reset

# Seed sample data
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

### Direct Database Access

```bash
# Connect via psql
psql -U hospitiumuser -d hospitiumris

# Common queries
SELECT * FROM users WHERE "accountType" = 'RESEARCHER';
SELECT COUNT(*) FROM manuscripts WHERE status = 'PUBLISHED';
```

---

## Indexing & Performance

The schema includes automatic indexes on:
- Primary keys (`@id`)
- Unique constraints (`@unique`)
- Foreign key relationships

For large deployments, consider adding indexes on frequently queried fields:

```prisma
@@index([status])
@@index([createdAt])
@@index([userId, status])
```

