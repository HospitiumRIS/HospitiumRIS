# Proposal Creation Form - Required Fields Documentation

**Page URL:** http://localhost:3000/researcher/projects/proposals/create

This document provides a comprehensive list of all fields available in the Research Proposal Creation form, organized by step.

---

## Form Structure

The form is divided into **7 steps** with a multi-step wizard interface:

1. Core Information
2. Research Details
3. Project Management
4. Funding and Grants
5. Ethical Considerations & Data Management
6. Related Publications & Files
7. Proposal Summary

---

## Step 1: Core Information

### Basic Project Information
- **Project Title** * (Required)
  - Type: Text field
  - Description: Enter a descriptive title for your research project

### Principal Investigator
- **PI Selection Option** (Radio buttons)
  - Option 1: Use my profile as Principal Investigator
  - Option 2: Search for a different Principal Investigator (via ORCID search)
  
- **Principal Investigator Name** * (Required)
  - Type: Text field
  - Auto-filled if using profile, or populated from ORCID search
  
- **Principal Investigator ORCID ID**
  - Type: Text field
  - Auto-filled if using profile, or populated from ORCID search

### Co-Investigators
- **Co-Investigators List** (Optional)
  - Add via ORCID search
  - For each co-investigator:
    - **Full Name** (Auto-filled from ORCID, read-only)
    - **ORCID ID** (Auto-filled from ORCID, read-only)
    - **Email** * (Required - must be entered manually)
    - **Role/Position** (Auto-filled from ORCID, read-only)
    - **Institution** (Auto-filled from ORCID, read-only)

### Departments
- **Departments** * (Required)
  - Type: Multi-select autocomplete with custom entry
  - Description: Select one or more departments
  - Can add custom departments not in the predefined list
  - Predefined options include: Medicine, Surgery, Pediatrics, Cardiology, Neurology, Oncology, Psychiatry, Radiology, Pathology, Anesthesiology, Emergency Medicine, Family Medicine, Internal Medicine, Obstetrics and Gynecology, Orthopedics, Ophthalmology, Otolaryngology, Dermatology, Urology, Public Health, Nursing, Pharmacy, Dentistry, Physical Therapy, Occupational Therapy, Medical Technology, Health Administration, Biomedical Engineering, Clinical Research, Health Informatics, Rural Health, Artificial Intelligence, Diagnostic Imaging

### Project Timeline
- **Start Date** (Optional)
  - Type: Date picker
  - Description: When do you plan to start?
  
- **End Date** (Optional)
  - Type: Date picker
  - Description: Expected completion date
  - Validation: Must be after start date if both are provided

---

## Step 2: Research Details

### Research Areas
- **Research Areas** * (Required)
  - Type: Multi-select autocomplete with custom entry
  - Description: Select all relevant research areas for your project
  - Can add custom research areas not in the predefined list
  - Predefined options include: Cardiology, Neurology, Oncology, Pediatrics, Immunology, Endocrinology, Genetics, Public Health, Epidemiology, Surgery, Medicine, Pharmacy, Nursing, Dentistry, Other

### Research Objectives
- **Research Objectives** * (Required)
  - Type: Rich text editor (TipTap)
  - Description: Clearly state your research objectives
  - Supports formatting (bullet points, numbered lists, bold, italic, etc.)
  - Minimum height: 200px

### Research Methods
- **Research Methods** * (Required)
  - Type: Rich text editor (TipTap)
  - Description: Describe your research methodology in detail
  - Include: research design, data collection methods, analysis techniques, tools/instruments
  - Supports formatting
  - Minimum height: 200px

### Abstract
- **Abstract** * (Required)
  - Type: Rich text editor (TipTap)
  - Description: Comprehensive abstract of your research proposal
  - Recommended: 250-500 words
  - Should include: background, objectives, methodology, expected outcomes, and significance
  - Supports formatting
  - Minimum height: 250px

---

## Step 3: Project Management

### Project Milestones
- **Milestones** (Optional - can add multiple)
  - For each milestone:
    - **Milestone Title**
      - Type: Text field
    - **Target Date**
      - Type: Date picker
    - **Description**
      - Type: Multi-line text (2 rows)
      - Description: Describe what will be achieved at this milestone

### Project Deliverables
- **Deliverables** (Optional - can add multiple)
  - For each deliverable:
    - **Deliverable Title**
      - Type: Text field
    - **Type** * (Required)
      - Type: Dropdown select
      - Options: Research Report, Technical Report, Final Report, Interim Report, White Paper, Software/Application, Mobile App, Web Platform, Database, Dataset, Research Data, Survey Data, Experimental Data, Publication, Journal Article, Conference Paper, Book Chapter, Thesis/Dissertation, Presentation, Workshop, Training Material, Guidelines, Policy Document, Standard/Protocol, Patent, Prototype, Model, Framework, Tool/Instrument, Other
    - **Due Date**
      - Type: Date picker
    - **Description**
      - Type: Multi-line text (3 rows)
      - Description: Describe the deliverable, its specifications, and expected outcomes

---

## Step 4: Funding and Grants

### Funding Source
- **Funding Source** * (Required)
  - Type: Autocomplete with custom entry
  - Predefined options: Internal Hospital Fund, National Health Institute, Government Research Grant, Private Industry Sponsor, Charitable Foundation, Academic Institution, Clinical Trial Sponsor, International Research Fund

### Grant Details
- **Grant Number**
  - Type: Text field
  - Description: Enter the unique identifier for the grant
  
- **Funding Institution**
  - Type: Text field
  - Description: Enter the name of the funding institution
  
- **Grant Start Date** * (Required)
  - Type: Date picker
  
- **Grant End Date** * (Required)
  - Type: Date picker

### Budget Information
- **Total Budget Amount** * (Required)
  - Type: Number field
  - Prefix: $ symbol
  - Description: Total budget amount for the entire research project

---

## Step 5: Ethical Considerations & Data Management

### Ethics Application Linking
- **Ethics Application Option** (Radio buttons)
  - Option 1: Enter Ethics Details Manually
  - Option 2: Link Existing Ethics Application (auto-fills fields below)

### Ethical Considerations
- **Ethical Considerations Overview**
  - Type: Multi-line text (4 rows)
  - Description: Provide a comprehensive overview of ethical considerations
  - Auto-filled if linking existing ethics application
  
- **Consent Procedures**
  - Type: Multi-line text (4 rows)
  - Description: Explain your informed consent process
  - Auto-filled if linking existing ethics application
  
- **Data Security and Privacy Measures**
  - Type: Multi-line text (4 rows)
  - Description: Detail your data protection and security measures
  - Auto-filled if linking existing ethics application

### Ethics Approval Information
- **Ethics Approval Status**
  - Type: Dropdown select
  - Options: Not Required, Pending Application, Under Review, Approved, Conditionally Approved, Rejected, Exempted
  
- **Ethics Approval Reference Number**
  - Type: Text field
  - Description: Enter the reference number if approval has been obtained
  
- **Ethics Committee/IRB**
  - Type: Text field
  - Description: Specify which ethics committee will review/has reviewed this research
  
- **Approval Date**
  - Type: Date picker
  - Description: Date of ethics approval (if obtained)

### File Uploads
- **Ethics Documentation** (Optional - multiple files)
  - Type: File upload
  - Accepted formats: .pdf, .doc, .docx, .txt
  - Description: Upload ethics approval letters, consent forms, participant information sheets, or protocols
  - Can also be auto-linked from existing ethics application
  
- **Data Management Plan** (Optional - multiple files)
  - Type: File upload
  - Accepted formats: .pdf, .doc, .docx, .txt
  - Description: Upload DMP document outlining how research data will be collected, stored, managed, and shared

---

## Step 6: Related Publications & Files

### Publications
- **Available Publications** (Optional - can select multiple)
  - Type: Searchable autocomplete
  - Description: Select publications from the database that are relevant to this research proposal
  - Search by: title, author, journal, or keywords
  - Shows: Title, Authors, Year, Journal, Publication Type, DOI
  - Limit: First 50 results shown

- **Publication Relevance**
  - Type: Multi-line text (4 rows)
  - Description: Explain the relevance of the linked publications and files to this research proposal

### File Uploads
- **Other Related Files** (Optional - multiple files)
  - Type: File upload
  - Accepted formats: .pdf, .doc, .docx, .txt, .xls, .xlsx, .ppt, .pptx, .jpg, .png
  - Description: Upload preliminary data, additional references, supplementary materials, or supporting documents

---

## Step 7: Proposal Summary

### Collaborative Proposals
- **Link with Collaborative Proposals** (Optional - can select multiple)
  - Type: Searchable list
  - Description: Choose from existing collaborative proposals (manuscripts) created in the system
  - Search by: title or author
  - Shows: Title, Authors, Collaborator count, Status, Last updated

### Summary Review
This step provides a read-only summary of:
- All attached files (Ethics Documents, Data Management Plans, Other Related Files)
- Linked publications count
- Linked collaborative proposals count
- File statistics and summaries

---

## Validation Rules

### Required Fields for Step Progression:
- **Step 1 (Core Information):**
  - Title
  - Principal Investigator (either use profile or search)
  - At least one Department
  - Valid date range (end date must be after start date if both provided)

- **Step 2 (Research Details):**
  - At least one Research Area
  - Research Objectives
  - Abstract
  - Methodology

- **Step 3 (Project Management):**
  - No required fields (optional step)

- **Step 4 (Funding and Grants):**
  - Funding Source
  - Total Budget Amount

- **Step 5 (Ethical Considerations):**
  - No required fields (optional step)

- **Step 6 (Publications & Files):**
  - No required fields (optional step)

- **Step 7 (Summary):**
  - No required fields (review only)

---

## Additional Features

### Auto-save Functionality
- Form auto-saves after 3 seconds of inactivity
- Auto-save triggers when moving between steps
- Shows "Auto-saving..." indicator
- Shows "Unsaved changes" warning

### Draft Management
- Can save as draft at any time
- Can continue editing existing drafts
- Drafts can be loaded via URL parameter: `?id={proposalId}`

### Navigation
- Can navigate between steps freely
- Progress indicator shows completion percentage
- Can click on any step in the stepper to jump to it
- Unsaved changes warning when attempting to leave page

### Status Options
- Draft
- Under Review (when submitted)
- Approved
- Rejected
- Pending

---

## Notes

1. Fields marked with * are required for that specific step
2. Rich text editors support formatting including bold, italic, bullet points, numbered lists, headings, etc.
3. ORCID search integration allows searching for researchers by name and auto-populates their information
4. Custom entries are allowed for Departments and Research Areas beyond predefined lists
5. Multiple files can be uploaded for each file upload section
6. The form supports linking to existing ethics applications to auto-populate ethics-related fields
7. Publications must already exist in the system database to be linkable
8. Collaborative proposals refer to manuscripts created in the collaborative writing system
