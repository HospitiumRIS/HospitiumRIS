# Mendeley Import Guide

## Overview

The Mendeley import functionality allows researchers to import their publication libraries from Mendeley reference manager. This feature supports multiple export formats and provides intelligent parsing for seamless publication import.

## Supported Formats

### 1. BibTeX Format (.bib)
- **Description**: Standard bibliographic format widely used in LaTeX
- **Usage**: Most comprehensive format with full metadata
- **Extension**: `.bib`

### 2. RIS Format (.ris)
- **Description**: Research Information Systems format
- **Usage**: Compatible with most reference managers
- **Extension**: `.ris`

### 3. CSV Format (.csv)
- **Description**: Comma-separated values format
- **Usage**: Spreadsheet-compatible, easy to edit
- **Extension**: `.csv`

### 4. JSON Format (.json)
- **Description**: JavaScript Object Notation format
- **Usage**: Modern structured data format
- **Extension**: `.json`

## How to Export from Mendeley

### Method 1: Desktop Application
1. Open Mendeley Desktop
2. Select the publications you want to export (or select all)
3. Go to **File** → **Export**
4. Choose your preferred format:
   - **BibTeX** for comprehensive metadata
   - **RIS** for broad compatibility
   - **CSV** for spreadsheet use
5. Save the file to your computer

### Method 2: Web Application
1. Login to Mendeley Web (mendeley.com)
2. Navigate to your library
3. Select publications to export
4. Click **Export** button
5. Choose format and download

## Import Process

### Step 1: Access Import Page
Navigate to: `http://localhost:3000/researcher/publications/import`

### Step 2: Select Mendeley
Click on the **Mendeley** import card

### Step 3: Choose Import Method
You have two options:

#### A. File Upload
1. Click **Choose Mendeley File**
2. Select your exported file (.bib, .ris, .csv, or .json)
3. File will be automatically loaded

#### B. Manual Input
1. Copy your exported content
2. Paste into the text area
3. Format will be auto-detected

### Step 4: Preview Publications
1. Click **Preview Publications**
2. Review parsed publications
3. Verify author names, titles, and metadata

### Step 5: Select and Import
1. Use checkboxes to select publications
2. Click **Select All** for bulk selection
3. Click **Import X Selected** to complete

## Sample Files for Testing

### BibTeX Sample (`sample-mendeley.bib`)
```bibtex
@article{smith2023covid,
    title={Efficacy and safety of mRNA COVID-19 vaccines in immunocompromised patients},
    author={Smith, John A. and Rodriguez, Maria A.},
    journal={The Lancet},
    volume={401},
    year={2023},
    doi={10.1016/S0140-6736(23)00234-5}
}
```

### CSV Sample (`sample-mendeley.csv`)
```csv
Title,Authors,Year,Journal,Volume,Issue,Pages,DOI
"COVID-19 vaccines in immunocompromised patients","Smith, John A.; Rodriguez, Maria A.",2023,The Lancet,401,10375,456-468,10.1016/S0140-6736(23)00234-5
```

### JSON Sample (`sample-mendeley.json`)
```json
[
  {
    "title": "COVID-19 vaccines in immunocompromised patients",
    "authors": ["Smith, John A.", "Rodriguez, Maria A."],
    "year": 2023,
    "journal": "The Lancet",
    "doi": "10.1016/S0140-6736(23)00234-5"
  }
]
```

## Field Mapping

### BibTeX Fields
| BibTeX Field | Publication Field | Description |
|--------------|-------------------|-------------|
| `title` | Title | Publication title |
| `author` | Authors | Author names (separated by "and") |
| `year` | Year | Publication year |
| `journal` | Journal | Journal/source name |
| `volume` | Volume | Volume number |
| `number` | Issue | Issue number |
| `pages` | Pages | Page numbers |
| `doi` | DOI | Digital Object Identifier |
| `abstract` | Abstract | Publication abstract |
| `keywords` | Keywords | Keywords/tags |

### CSV Fields
| CSV Column | Publication Field | Notes |
|------------|-------------------|-------|
| Title | Title | Publication title |
| Authors | Authors | Separated by semicolons |
| Year | Year | Publication year |
| Journal | Journal | Journal/source name |
| Volume | Volume | Volume number |
| Issue | Issue | Issue number |
| Pages | Pages | Page range |
| DOI | DOI | Digital Object Identifier |
| Abstract | Abstract | Publication abstract |
| Keywords | Keywords | Separated by semicolons |

## Publication Types

### Supported Types
- **article** - Journal articles
- **book** - Books
- **book-chapter** - Book chapters
- **conference** - Conference papers
- **thesis** - Theses and dissertations
- **report** - Technical reports
- **other** - Other publication types

### Type Detection
- **BibTeX**: Based on entry type (`@article`, `@book`, etc.)
- **RIS**: Based on TY field (`JOUR`, `BOOK`, etc.)
- **CSV**: Defaults to "article" (can be specified in Type column)
- **JSON**: Based on "type" field or defaults to "article"

## Error Handling

### Common Errors and Solutions

#### 1. "Unable to detect file format"
- **Cause**: File format not recognized
- **Solution**: Ensure file is in BibTeX, RIS, CSV, or JSON format

#### 2. "No valid publications found"
- **Cause**: Empty or malformed file
- **Solution**: Check file content and format

#### 3. "Invalid file type"
- **Cause**: Unsupported file extension
- **Solution**: Use .bib, .ris, .csv, .json, or .txt extensions

#### 4. "Import failed"
- **Cause**: Database or network error
- **Solution**: Check network connection and try again

### Format-Specific Issues

#### BibTeX Issues
- **Missing braces**: Ensure field values are in `{}`
- **Invalid characters**: Avoid special characters in keys
- **Incomplete entries**: Ensure all entries have closing braces

#### CSV Issues
- **Header mismatch**: First row must contain column headers
- **Delimiter problems**: Use commas as separators
- **Quote issues**: Wrap text with quotes if it contains commas

#### JSON Issues
- **Invalid JSON**: Use JSON validator to check syntax
- **Array format**: Single objects should be wrapped in array `[]`
- **Field names**: Use standard field names (title, authors, year, etc.)

## Advanced Features

### Automatic Format Detection
The system automatically detects the format based on content:
- **BibTeX**: Starts with `@` and contains `{}`
- **RIS**: Contains lines starting with tags like `TY  -`
- **JSON**: Starts with `{` or `[`
- **CSV**: Contains commas and multiple lines

### Data Validation
- **Author parsing**: Handles multiple author formats
- **Date validation**: Validates and normalizes years
- **DOI formatting**: Standardizes DOI format
- **Duplicate detection**: Warns about potential duplicates

### Batch Processing
- **Large files**: Handles files with hundreds of publications
- **Progress indication**: Shows parsing progress
- **Memory efficiency**: Streams large files for processing

## Best Practices

### Export Recommendations
1. **Use BibTeX** for most comprehensive metadata
2. **Clean data** in Mendeley before export
3. **Check author names** for consistency
4. **Include abstracts** and keywords when possible

### Import Recommendations
1. **Preview first** before importing
2. **Check for duplicates** in your existing library
3. **Verify metadata** accuracy
4. **Select carefully** - only import needed publications

### File Management
1. **Keep backups** of export files
2. **Use descriptive names** for export files
3. **Organize by topic** or date for large libraries
4. **Document export settings** for reproducibility

## Integration Benefits

### Seamless Migration
- **No manual entry**: Bulk import saves time
- **Metadata preservation**: Maintains bibliographic details
- **Format flexibility**: Multiple import options
- **Quality validation**: Automatic data checking

### Research Workflow
- **Centralized management**: Single publication database
- **Cross-platform access**: Web-based interface
- **Collaboration ready**: Share and collaborate on publications
- **Export capabilities**: Re-export in various formats

## Troubleshooting

### Common Issues

#### Import Stalls
- **Check file size**: Large files may take time
- **Browser memory**: Close other tabs if needed
- **Network timeout**: Refresh and try again

#### Missing Data
- **Check source**: Verify data exists in Mendeley
- **Format limitations**: Some formats lose metadata
- **Field mapping**: Check if fields are supported

#### Duplicate Entries
- **Manual review**: Check for duplicates before import
- **Unique identifiers**: Use DOI or title to identify duplicates
- **Selective import**: Import only new publications

### Support Resources
- **Mendeley Help**: [mendeley.com/support](https://mendeley.com/support)
- **Export Guides**: Mendeley documentation on exporting
- **Format Specifications**: BibTeX, RIS format documentation

## Sample Test Data

The following sample files are available in the `public/` directory:

- `sample-mendeley.bib` - BibTeX format with medical publications
- `sample-mendeley.csv` - CSV format with same publications  
- `sample-mendeley.json` - JSON format with structured data

These files contain realistic medical research publications for testing the import functionality across all supported formats.
