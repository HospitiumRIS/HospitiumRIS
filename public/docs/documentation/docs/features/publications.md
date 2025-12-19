---
sidebar_position: 2
title: Publication Management
---

# Publication Management

HospitiumRIS provides comprehensive tools for importing, organizing, and managing research publications from multiple sources.

## Overview

The publication management system helps researchers:

- Import publications from external databases
- Organize with a folder-based library
- Track citations and impact metrics
- Generate bibliographies for manuscripts
- Share publications on researcher profiles

## Importing Publications

### Supported Sources

| Source | Description | Auto-Update |
|--------|-------------|-------------|
| **PubMed** | NIH biomedical literature | ✅ |
| **CrossRef** | DOI-based metadata | ✅ |
| **OpenAlex** | Open scholarly data | ✅ |
| **Zotero** | Personal reference manager | ✅ |
| **BibTeX** | Standard bibliography format | ❌ |
| **Manual** | Manual entry | ❌ |

### PubMed Import

1. Go to **Publications → Import**
2. Select **PubMed** source
3. Search by:
   - Author name
   - Title keywords
   - PMID
   - Date range
4. Review results
5. Select publications to import
6. Click **Import Selected**

### CrossRef Import

1. Select **CrossRef** source
2. Search by:
   - DOI
   - Title
   - Author
3. Metadata retrieved automatically
4. Import selected publications

### OpenAlex Import

1. Select **OpenAlex** source
2. Search by:
   - ORCID iD
   - Author name
   - Institution
4. Import comprehensive publication data

### Zotero Integration

Connect your Zotero library:

1. Go to **Settings → Zotero**
2. Enter Zotero API Key
3. Enter User ID
4. Save connection
5. Sync publications from Zotero

#### Getting Zotero API Key

1. Log in to [zotero.org](https://www.zotero.org)
2. Go to **Settings → Feeds/API**
3. Create new API key
4. Copy key to HospitiumRIS

### BibTeX Import

Import from BibTeX files:

1. Select **BibTeX** source
2. Upload `.bib` file or paste content
3. Parse entries
4. Review and map fields
5. Import publications

### Manual Entry

Create publications manually:

| Field | Required | Description |
|-------|----------|-------------|
| **Title** | ✅ | Publication title |
| **Authors** | ✅ | Author list |
| **Year** | ✅ | Publication year |
| **Type** | ✅ | Article, Review, etc. |
| **Journal** | ❌ | Journal name |
| **DOI** | ❌ | Digital Object Identifier |
| **Abstract** | ❌ | Publication abstract |
| **URL** | ❌ | Link to publication |
| **Keywords** | ❌ | Subject keywords |

## Publication Library

### Library Structure

```
📁 My Library
├── 📁 Research Projects
│   ├── 📁 Project Alpha
│   │   ├── 📄 Publication 1
│   │   └── 📄 Publication 2
│   └── 📁 Project Beta
│       └── 📄 Publication 3
├── 📁 Reviews
│   └── 📄 Review Paper 1
└── 📁 Collaborations
    └── 📄 Collab Publication 1
```

### Creating Folders

1. Click **New Folder** in library
2. Enter folder name
3. Choose parent folder (or root)
4. Folders can be nested

### Managing Folders

- **Rename** - Change folder name
- **Move** - Relocate to different parent
- **Delete** - Remove folder (publications moved to root)
- **Expand/Collapse** - Toggle folder visibility

### Moving Publications

1. Select publication(s)
2. Drag to target folder, or
3. Use **Move to Folder** action
4. Publications can exist in one folder

## Publication Details

### Viewing Details

Click any publication to see:

```
┌─────────────────────────────────────────────────────────────────┐
│ Title: Machine Learning in Healthcare                          │
├─────────────────────────────────────────────────────────────────┤
│ Authors: Smith, J., Johnson, A., Williams, B.                   │
│ Journal: Nature Medicine                                        │
│ Year: 2024        Volume: 30        Pages: 145-156              │
│ DOI: 10.1038/nm.12345                                           │
├─────────────────────────────────────────────────────────────────┤
│ Abstract:                                                        │
│ This study presents a novel approach to...                       │
├─────────────────────────────────────────────────────────────────┤
│ Keywords: machine learning, healthcare, AI, diagnostics         │
├─────────────────────────────────────────────────────────────────┤
│ 📊 Citations: 45    📅 Added: Jan 15, 2024                      │
└─────────────────────────────────────────────────────────────────┘
```

### Editing Publications

1. Click publication
2. Click **Edit**
3. Modify fields
4. Save changes

### Deleting Publications

1. Select publication(s)
2. Click **Delete**
3. Confirm deletion
4. Publication removed from library

:::warning Citation Impact
Deleting publications removes them from manuscripts. Consider archiving instead.
:::

## Search & Filter

### Search Options

| Field | Description |
|-------|-------------|
| **Title** | Search in titles |
| **Author** | Search by author name |
| **Keywords** | Search by keywords |
| **Abstract** | Search in abstracts |
| **DOI** | Exact DOI match |
| **Year** | Publication year |

### Filters

- **Publication Type** - Article, Review, Conference, etc.
- **Year Range** - From year to year
- **Source** - Import source
- **Folder** - Specific folder only
- **Has DOI** - With/without DOI

### Sorting

| Sort By | Description |
|---------|-------------|
| **Date Added** | When imported (default) |
| **Title** | Alphabetical |
| **Year** | Publication year |
| **Citations** | Citation count |
| **Author** | First author name |

## Citation Tracking

### Citation Sources

Citation counts retrieved from:

- CrossRef
- OpenAlex
- Google Scholar (manual)

### Citation Metrics

| Metric | Description |
|--------|-------------|
| **Total Citations** | Sum of all citations |
| **H-Index** | Impact indicator |
| **Average Citations** | Mean per publication |
| **Citation Velocity** | Citations per year |

### Citation Updates

- Automatic refresh weekly
- Manual refresh available
- Historical tracking

## Export Options

### Export Formats

| Format | Use Case |
|--------|----------|
| **BibTeX** | LaTeX, reference managers |
| **RIS** | EndNote, Zotero |
| **CSV** | Spreadsheets |
| **JSON** | API, data analysis |

### Export Scope

- Single publication
- Selected publications
- Entire folder
- Full library

### Export Fields

Select fields to export:

- [ ] Title
- [ ] Authors
- [ ] Year
- [ ] Journal
- [ ] DOI
- [ ] Abstract
- [ ] Keywords
- [ ] URL
- [ ] Citation count

## Using Publications in Manuscripts

### Citing Publications

1. Open manuscript editor
2. Click **Insert Citation**
3. Search library
4. Select publication
5. Citation inserted

### Citation Linking

```
[1] Smith et al., 2024   →   References section
      ↓
Auto-generated bibliography entry
```

### Citation Styles

Choose from:

- APA 7th Edition
- MLA 9th Edition
- Chicago 17th Edition
- Harvard
- IEEE
- Vancouver
- Custom styles

## Public Profile Display

### Visibility Settings

Control which publications appear on public profile:

| Setting | Description |
|---------|-------------|
| **Show All** | Display complete list |
| **Published Only** | Only published status |
| **Selected** | Manually curated list |
| **Hide All** | No publications shown |

### Profile Display

Publications on profile show:

- Title (linked)
- Authors
- Journal
- Year
- DOI link
- Citation count

## Deduplication

### Automatic Detection

System detects duplicates by:

- DOI matching
- Title similarity
- Author matching
- Year comparison

### Merge Duplicates

1. Review detected duplicates
2. Choose master record
3. Merge metadata
4. Remove duplicate

## Best Practices

### Import Strategy

1. Start with ORCID-linked sources
2. Import by project/topic
3. Review metadata accuracy
4. Organize immediately

### Library Organization

1. Create logical folder structure
2. Use consistent naming
3. Regular cleanup
4. Archive old projects

### Metadata Quality

1. Verify imported data
2. Add missing abstracts
3. Correct author names
4. Update citation counts

### Citation Management

1. Import before writing
2. Cite as you write
3. Verify citations
4. Update before submission

