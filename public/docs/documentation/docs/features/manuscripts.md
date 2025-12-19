---
sidebar_position: 1
title: Collaborative Manuscripts
---

# Collaborative Manuscripts

HospitiumRIS provides a powerful collaborative manuscript editing system built on TipTap, enabling researchers to work together in real-time on academic documents.

## Overview

The manuscript editor combines the functionality of professional word processors with real-time collaboration features designed specifically for academic writing.

### Key Capabilities

- ✍️ Rich text editing with academic formatting
- 👥 Real-time multi-user collaboration
- 📝 Track changes with accept/reject workflow
- 📚 Version history with restore capability
- 💬 Inline comments and threaded discussions
- 📖 Citation management with multiple formats
- 🔄 Auto-save and conflict resolution

## Creating a Manuscript

### New Manuscript

1. Navigate to **Publications → Collaborate**
2. Click **New Manuscript**
3. Fill in manuscript details:
   - **Title** - Manuscript title
   - **Type** - Article, Review, Conference Paper, etc.
   - **Field** - Research field or domain
   - **Description** - Brief summary

### Manuscript Types

| Type | Description |
|------|-------------|
| **Research Article** | Original research findings |
| **Review Paper** | Literature review or meta-analysis |
| **Conference Paper** | Conference proceedings |
| **Technical Report** | Technical documentation |
| **Grant Proposal** | Funding application |
| **Thesis/Dissertation** | Academic degree work |

## The Editor Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ 📄 Manuscript Title                              👥 3 Online    │
├─────────────────────────────────────────────────────────────────┤
│ [B] [I] [U] [S] | [H1] [H2] [H3] | [🔗] [📷] | [📚 Cite]       │
├───────────────────────────────────────┬─────────────────────────┤
│                                       │                         │
│                                       │    💬 Comments (5)      │
│         Document Editor               │    ──────────────       │
│                                       │    [Comment thread 1]   │
│         (TipTap Rich Text)            │    [Comment thread 2]   │
│                                       │                         │
│                                       │    📝 Track Changes     │
│                                       │    ──────────────       │
│                                       │    [Pending changes]    │
│                                       │                         │
├───────────────────────────────────────┴─────────────────────────┤
│ Word Count: 2,450 | Last saved: 2 minutes ago | Version: 12    │
└─────────────────────────────────────────────────────────────────┘
```

### Toolbar Features

| Tool | Shortcut | Description |
|------|----------|-------------|
| **Bold** | `Ctrl+B` | Bold text |
| **Italic** | `Ctrl+I` | Italic text |
| **Underline** | `Ctrl+U` | Underline text |
| **Strikethrough** | `Ctrl+Shift+S` | Strikethrough |
| **Heading 1** | `Ctrl+Alt+1` | Main heading |
| **Heading 2** | `Ctrl+Alt+2` | Sub-heading |
| **Heading 3** | `Ctrl+Alt+3` | Section heading |
| **Link** | `Ctrl+K` | Insert hyperlink |
| **Image** | - | Insert image |
| **Table** | - | Insert table |
| **Citation** | - | Insert citation |
| **Highlight** | - | Highlight text |

### Text Alignment

- Left align
- Center align
- Right align
- Justify

### Lists

- Bullet lists
- Numbered lists
- Task lists (checkboxes)

## Real-Time Collaboration

### Presence Awareness

See who's currently editing:

- Online collaborators shown in header
- Colored cursors indicate editor positions
- Names displayed at cursor locations

### Conflict Resolution

When multiple users edit simultaneously:

1. Changes are merged in real-time
2. Conflicting edits are flagged
3. Users can review and resolve conflicts
4. History preserves all versions

### Collaboration Roles

| Role | Edit | Comment | Invite | Delete |
|------|------|---------|--------|--------|
| **Owner** | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ❌ |
| **Editor** | ✅ | ✅ | ❌ | ❌ |
| **Contributor** | Suggest | ✅ | ❌ | ❌ |
| **Reviewer** | ❌ | ✅ | ❌ | ❌ |

## Track Changes

### Enabling Track Changes

1. Click **Track Changes** toggle in toolbar
2. All subsequent edits are tracked
3. Changes appear with author attribution

### Change Types

| Type | Appearance | Description |
|------|------------|-------------|
| **Insert** | Green underline | New text added |
| **Delete** | Red strikethrough | Text removed |
| **Format** | Blue highlight | Formatting changed |

### Reviewing Changes

For each tracked change:

- **Accept** - Apply the change permanently
- **Reject** - Discard the change
- **View Author** - See who made the change
- **View Timestamp** - When the change was made

### Bulk Actions

- Accept all changes
- Reject all changes
- Accept changes by author
- Filter changes by type

## Version History

### Automatic Versioning

Versions are created automatically:

- Every 50 changes
- Before major edits
- On manual save
- Before session ends

### Manual Versions

Create milestone versions:

1. Click **Save Version**
2. Add version description
3. Version is saved with timestamp

### Version Types

| Type | Description |
|------|-------------|
| **Auto** | Automatic periodic saves |
| **Manual** | User-created checkpoints |
| **Milestone** | Significant project milestones |

### Comparing Versions

1. Open version history panel
2. Select two versions
3. View side-by-side comparison
4. Changes highlighted between versions

### Restoring Versions

1. Select the version to restore
2. Click **Restore**
3. Confirm restoration
4. Current state becomes new version

## Comments & Discussions

### Adding Comments

1. Select text to comment on
2. Click **Add Comment** or use context menu
3. Type your comment
4. Submit

### Comment Types

| Type | Use Case |
|------|----------|
| **Comment** | General feedback |
| **Suggestion** | Proposed changes |
| **Question** | Clarification needed |

### Comment Features

- **Threaded Replies** - Nested discussions
- **@Mentions** - Notify specific collaborators
- **Resolve** - Mark as addressed
- **Delete** - Remove comment

### Comment Workflow

```
Comment Created → Discussion → Resolved/Deleted
       ↓              ↓
   Notify Author   Replies Added
```

## Citation Management

### Inserting Citations

1. Place cursor at citation point
2. Click **Insert Citation**
3. Search your publication library
4. Select publication(s)
5. Citation inserted with reference

### Citation Sources

Import citations from:

- Personal publication library
- PubMed search
- DOI lookup
- BibTeX import
- Manual entry

### Citation Styles

Supported formats:

- APA (7th Edition)
- MLA
- Chicago
- Harvard
- IEEE
- Vancouver

### Bibliography Generation

- Auto-generated from citations
- Sorted alphabetically or by appearance
- Formatted per style guide
- Updates dynamically

## Inviting Collaborators

### Invitation Methods

1. **ORCID Search**
   - Search by name or ORCID iD
   - View researcher profile
   - Send invitation with role

2. **Email Invitation**
   - Enter email address
   - System sends invitation link
   - Works for non-registered users

3. **System Users**
   - Search registered users
   - Quick invitation with role selection

### Invitation Process

```
Send Invitation → Email Notification → Accept/Decline → Access Granted
                        ↓
                  Expiration (7 days)
```

### Managing Collaborators

- View all collaborators
- Change roles
- Remove access
- Resend invitations

## Export Options

### Document Formats

| Format | Description |
|--------|-------------|
| **HTML** | Web-ready format |
| **PDF** | Print-ready document |
| **DOCX** | Microsoft Word |
| **LaTeX** | Academic typesetting |
| **Markdown** | Plain text markup |

### Export Settings

- Include comments
- Include track changes
- Include version history
- Bibliography format

## Keyboard Shortcuts

### Text Formatting

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |
| `Ctrl+Shift+S` | Strikethrough |
| `Ctrl+Shift+H` | Highlight |

### Document Actions

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+A` | Select all |
| `Ctrl+F` | Find |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl+Home` | Go to beginning |
| `Ctrl+End` | Go to end |
| `Ctrl+G` | Go to page |

## Best Practices

### Collaborative Writing

1. Establish writing conventions early
2. Use track changes for major revisions
3. Comment rather than overwrite
4. Create milestone versions regularly
5. Resolve comments promptly

### Document Structure

1. Use headings consistently
2. Apply styles rather than manual formatting
3. Keep paragraphs focused
4. Use lists for clarity

### Citation Management

1. Add citations as you write
2. Verify citation accuracy
3. Keep library organized
4. Choose style early

### Version Control

1. Create versions at logical points
2. Add descriptive version notes
3. Don't fear experimentation - you can restore
4. Review history before final submission

