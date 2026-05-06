# Ethics Application Form Fields

## Form URL
`http://localhost:3000/researcher/ethics/applications/create`

---

## Form Structure

The ethics application form is organized into **8 steps** with a total of **60+ fields** covering all aspects of research ethics review.

---

## Step 1: Project Overview

### Fields:

1. **Study Title** *(Required)*
   - Type: Text Field
   - Description: Full title of the research study
   - Validation: Required
   - Placeholder: "Enter the full title of your research study"

2. **Lay Summary (Plain Language)** *(Required)*
   - Type: Rich Text Editor
   - Description: Explain research in simple terms for non-expert audiences
   - Validation: Required
   - Min Rows: 5
   - Helper Text: "Write for a general audience without specialized knowledge"
   - Placeholder: "Explain your research in simple terms that anyone can understand. Avoid jargon and technical language."

3. **Research Aims** *(Required)*
   - Type: Rich Text Editor
   - Description: Main objectives and research questions
   - Validation: Required
   - Min Rows: 4
   - Helper Text: "Clearly state the main objectives"
   - Placeholder: "What does this research intend to achieve? What questions will it answer?"

4. **Research Significance** *(Required)*
   - Type: Rich Text Editor
   - Description: Importance and potential benefits of the research
   - Validation: Required
   - Min Rows: 4
   - Helper Text: "Explain the value and impact of this research"
   - Placeholder: "Why is this research important? What are the potential benefits to participants, science, or society?"

---

## Step 2: Research Team

### Principal Investigator Section:

5. **PI Option** *(Required)*
   - Type: Radio Group
   - Options:
     - "Use My Profile" - Uses logged-in user's ORCID profile
     - "Search for Another Researcher" - Search ORCID database
   - Default: "useProfile"

6. **Principal Investigator - Full Name** *(Required)*
   - Type: Text Field
   - Description: PI's full name
   - Validation: Required
   - Auto-populated if using profile

7. **Principal Investigator - ORCID iD** *(Required)*
   - Type: Text Field
   - Description: ORCID identifier
   - Validation: Required
   - Format: 0000-0000-0000-0000
   - Helper Text: "Enter your ORCID identifier"
   - Auto-populated if using profile

8. **Principal Investigator - Email** *(Required)*
   - Type: Email Field
   - Description: Contact email
   - Validation: Required, Email format

9. **Principal Investigator - Phone Number** *(Required)*
   - Type: Text Field
   - Description: Contact phone number
   - Validation: Required

10. **Principal Investigator - Institution** *(Required)*
    - Type: Text Field
    - Description: Affiliated institution
    - Validation: Required

11. **Principal Investigator - Department** *(Required)*
    - Type: Text Field
    - Description: Department or unit
    - Validation: Required

12. **Principal Investigator - Qualifications & Experience** *(Required)*
    - Type: Rich Text Editor
    - Description: Relevant qualifications and research experience
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Include degrees, certifications, and relevant experience"
    - Placeholder: "Briefly describe your relevant qualifications and research experience"

### Co-Investigators Section:

13. **Co-Investigators** *(Optional)*
    - Type: Array of Objects (searchable via ORCID)
    - Fields per Co-Investigator:
      - Name (from ORCID)
      - ORCID iD (from ORCID)
      - Email (manual entry)
      - Role (manual entry)
      - Institution (from ORCID)
    - Action: Add/Remove via ORCID search modal

---

## Step 3: Research Design

### Fields:

14. **Research Type** *(Required)*
    - Type: Dropdown Select
    - Options:
      - Clinical Trial
      - Observational Study
      - Survey Research
      - Interview Study
      - Laboratory Research
      - Secondary Data Analysis
      - Community-Based Research
      - Other
    - Validation: Required

15. **Research Type Other** *(Conditional - Required if "Other" selected)*
    - Type: Text Field
    - Description: Specify research type if "Other" selected
    - Validation: Required when Research Type = "Other"

16. **Scientific Validity** *(Required)*
    - Type: Rich Text Editor
    - Description: Justification of research design
    - Validation: Required
    - Min Rows: 4
    - Helper Text: "Justify your methodology and approach"
    - Placeholder: "Explain how your research design ensures the study can answer the research question"

17. **Research Procedures** *(Required)*
    - Type: Rich Text Editor
    - Description: Step-by-step procedures for participants
    - Validation: Required
    - Min Rows: 5
    - Helper Text: "Be specific about all procedures involving participants"
    - Placeholder: "Provide a step-by-step account of what participants will be asked to do (e.g., interviews, surveys, clinical tests, observations)"

18. **Data Analysis Plan** *(Required)*
    - Type: Rich Text Editor
    - Description: How data will be processed and interpreted
    - Validation: Required
    - Min Rows: 4
    - Helper Text: "Include statistical methods or qualitative analysis approaches"
    - Placeholder: "Describe how the collected information will be processed and interpreted"

19. **Research Timeline** *(Required)*
    - Type: Rich Text Editor
    - Description: Detailed timeline with milestones
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Include key milestones and phases"
    - Placeholder: "Provide a detailed timeline for your research activities"

20. **Study Duration (months)** *(Required)*
    - Type: Number Field
    - Description: Duration in months
    - Validation: Required, Numeric

21. **Start Date** *(Required)*
    - Type: Date Field
    - Description: Planned start date
    - Validation: Required, Date format

22. **End Date** *(Required)*
    - Type: Date Field
    - Description: Planned end date
    - Validation: Required, Date format

23. **Funding Source** *(Optional)*
    - Type: Text Field
    - Description: Source of funding
    - Helper Text: "Leave blank if unfunded"

24. **Funding Amount** *(Optional)*
    - Type: Text Field
    - Description: Total funding amount

---

## Step 4: Participants

### Fields:

25. **Study Population** *(Required)*
    - Type: Rich Text Editor
    - Description: Target population description
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Be specific about demographics and characteristics"
    - Placeholder: "Describe the target population for your study"

26. **Sample Size** *(Required)*
    - Type: Number Field
    - Description: Number of participants
    - Validation: Required, Numeric
    - Helper Text: "Justify your sample size if possible"

27. **Inclusion Criteria** *(Required)*
    - Type: Rich Text Editor
    - Description: Who CAN participate
    - Validation: Required
    - Min Rows: 4
    - Helper Text: "List all criteria that participants must meet"
    - Placeholder: "Clearly defined parameters for who CAN participate in this study"

28. **Exclusion Criteria** *(Required)*
    - Type: Rich Text Editor
    - Description: Who CANNOT participate
    - Validation: Required
    - Min Rows: 4
    - Helper Text: "List all criteria that would exclude participants"
    - Placeholder: "Clearly defined parameters for who CANNOT participate in this study"

29. **Recruitment Strategy** *(Required)*
    - Type: Rich Text Editor
    - Description: How participants will be recruited
    - Validation: Required
    - Min Rows: 4
    - Helper Text: "Describe all recruitment methods in detail. Recruitment materials will be uploaded in the Documentation step."
    - Placeholder: "How will participants be identified and approached? (e.g., flyers, social media, database screening, direct contact)"

30. **Vulnerable Populations** *(Required)*
    - Type: Checkbox Group (Multiple Selection)
    - Options:
      - Children (under 18)
      - Pregnant Women
      - Prisoners
      - Mentally Disabled Persons
      - Economically Disadvantaged
      - Educationally Disadvantaged
      - None
    - Validation: At least one must be selected

31. **Vulnerable Group Justification** *(Conditional - Required if vulnerable populations selected)*
    - Type: Rich Text Editor
    - Description: Justification for including vulnerable groups
    - Validation: Required when vulnerable populations selected (except "None")
    - Min Rows: 4
    - Helper Text: "Explain why this group must be included and how they will be protected"
    - Placeholder: "Provide specific justification for including vulnerable populations in your study"

32. **Power Imbalance Considerations** *(Optional)*
    - Type: Rich Text Editor
    - Description: How to prevent coercion in dependent relationships
    - Min Rows: 3
    - Helper Text: "Address any dependent relationships that might affect voluntary participation"
    - Placeholder: "If you have a relationship with participants (e.g., teacher/student, employer/employee), explain how you will prevent coercion"

---

## Step 5: Ethics & Data

### Informed Consent Section:

33. **Informed Consent Process** *(Required)*
    - Type: Rich Text Editor
    - Description: How and when consent will be obtained
    - Validation: Required
    - Min Rows: 5
    - Helper Text: "Include details about the consent procedure and timing. Consent forms will be uploaded in the Documentation step."
    - Placeholder: "Describe HOW and WHEN consent will be sought. Ensure participants have adequate time to decide."

34. **Consent Capacity Assessment** *(Required)*
    - Type: Rich Text Editor
    - Description: How to assess participant understanding
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Describe methods to ensure comprehension"
    - Placeholder: "How will you assess if the participant understands the information provided?"

35. **Withdrawal Process** *(Required)*
    - Type: Rich Text Editor
    - Description: How participants can withdraw
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Confirm that participation is voluntary and participants can withdraw at any time without penalty"
    - Placeholder: "Describe the process for participants to withdraw from the study and what happens to their data"

36. **Participant Costs & Compensation** *(Required)*
    - Type: Rich Text Editor
    - Description: Costs to participants and any compensation
    - Validation: Required
    - Min Rows: 2
    - Helper Text: "Be transparent about any costs to participants and any compensation provided"
    - Placeholder: "Will participants incur any costs (e.g., travel, parking, time off work)? Will they receive reimbursement or incentives? State 'None' if no costs."

### Data Management Section:

37. **Data Collection Methods** *(Required)*
    - Type: Rich Text Editor
    - Description: All methods of data collection
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Final versions of data collection tools will be uploaded in the Documentation step"
    - Placeholder: "Describe all methods of data collection (questionnaires, interviews, observations, etc.)"

38. **Anonymization Method** *(Required)*
    - Type: Rich Text Editor
    - Description: How data will be de-identified
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Describe the specific anonymization process"
    - Placeholder: "How will data be de-identified? (e.g., pseudonyms, ID codes, removal of identifiers)"

39. **Data Storage Location** *(Required)*
    - Type: Text Field
    - Description: Physical and digital storage locations
    - Validation: Required
    - Helper Text: "Be specific about physical and digital storage"
    - Placeholder: "e.g., encrypted drives, locked cabinets, secure servers"

40. **Data Retention Period** *(Required)*
    - Type: Text Field
    - Description: How long data will be kept
    - Validation: Required
    - Helper Text: "Follow institutional or funder requirements"
    - Placeholder: "e.g., 5 years after publication"

41. **Data Storage Security** *(Required)*
    - Type: Rich Text Editor
    - Description: Security measures for data protection
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Explain how data will be protected from unauthorized access"
    - Placeholder: "Describe security measures (encryption, password protection, access controls)"

42. **Data Disposal Protocol** *(Required)*
    - Type: Rich Text Editor
    - Description: How data will be destroyed
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Include methods for secure deletion/destruction"
    - Placeholder: "Describe protocols for the eventual destruction of sensitive records"

---

## Step 6: Risk & Benefits

### Risk Identification Section:

43. **Physical Risks** *(Required)*
    - Type: Rich Text Editor
    - Description: Potential physical risks to participants
    - Validation: Required
    - Min Rows: 3
    - Placeholder: "Identify any potential physical risks to participants (discomfort, injury, health impacts). State 'None' if no physical risks."

44. **Psychological Risks** *(Required)*
    - Type: Rich Text Editor
    - Description: Potential psychological risks
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Consider sensitive topics or traumatic experiences"
    - Placeholder: "Identify any potential psychological risks (stress, anxiety, emotional distress). State 'None' if no psychological risks."

45. **Social & Other Risks** *(Required)*
    - Type: Rich Text Editor
    - Description: Social, legal, or economic risks
    - Validation: Required
    - Min Rows: 3
    - Placeholder: "Identify any potential social, legal, or economic risks (stigma, discrimination, job loss, financial burden). State 'None' if no such risks."

46. **Risk Mitigation Strategies** *(Required)*
    - Type: Rich Text Editor
    - Description: Steps to minimize all identified risks
    - Validation: Required
    - Min Rows: 5
    - Helper Text: "Address each type of risk identified above"
    - Placeholder: "Describe specific steps to minimize ALL identified risks (e.g., providing counselor contact info for sensitive topics, monitoring procedures, stopping criteria)"

### Benefits Section:

47. **Direct Benefits to Participants** *(Required)*
    - Type: Rich Text Editor
    - Description: Direct benefits participants will receive
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Be realistic - not all research provides direct benefits"
    - Placeholder: "What direct benefits will participants receive? State 'None' if no direct benefits."

48. **Indirect Benefits (Science/Society)** *(Required)*
    - Type: Rich Text Editor
    - Description: Broader benefits to science or society
    - Validation: Required
    - Min Rows: 3
    - Helper Text: "Explain the broader impact of the research"
    - Placeholder: "What are the potential benefits to science or society?"

49. **Risk-Benefit Analysis** *(Required)*
    - Type: Rich Text Editor
    - Description: Justification that benefits outweigh risks
    - Validation: Required
    - Min Rows: 5
    - Helper Text: "Provide a balanced assessment"
    - Placeholder: "Explain why the benefits outweigh the risks. Justify why this research should proceed despite the risks."

### Conflict of Interest Section:

50. **Conflict of Interest** *(Required)*
    - Type: Radio Group
    - Options:
      - "No conflict of interest"
      - "Conflict of interest exists"
    - Validation: Required
    - Default: false

51. **Conflict of Interest Details** *(Conditional - Required if conflict exists)*
    - Type: Rich Text Editor
    - Description: Disclosure of financial or personal interests
    - Validation: Required when Conflict of Interest = true
    - Min Rows: 3
    - Helper Text: "Full transparency is required"
    - Placeholder: "Disclose any financial or personal interests that could influence the research"

### Previous Approval Section:

52. **Previous Ethics Approval** *(Required)*
    - Type: Radio Group
    - Options:
      - "No previous approval"
      - "Previously approved by another committee"
    - Validation: Required
    - Default: false

53. **Previous Approval Details** *(Conditional - Required if previously approved)*
    - Type: Rich Text Editor
    - Description: Reference number, institution, and date
    - Validation: Required when Previous Ethics Approval = true
    - Min Rows: 2
    - Placeholder: "Provide reference number, institution, and date of previous approval"

---

## Step 7: Documentation

### File Upload Fields:

54. **Participant Information Sheet (PIS)** *(Required)*
    - Type: File Upload
    - Description: Study explanation in lay terms
    - Validation: Required
    - Accepted Types: .pdf, .doc, .docx
    - Multiple: No
    - Helper Text: "Explains the study in lay terms; includes contact details for PI and Ethics Committee"

55. **Consent Form** *(Required)*
    - Type: File Upload
    - Description: Formal consent document
    - Validation: Required
    - Accepted Types: .pdf, .doc, .docx
    - Multiple: No
    - Helper Text: "Formal document for participant signature (or verbal script/online version)"

56. **Research Protocol** *(Required)*
    - Type: File Upload
    - Description: Full scientific plan
    - Validation: Required
    - Accepted Types: .pdf, .doc, .docx
    - Multiple: No
    - Helper Text: "Full scientific plan including references and detailed timeline"

57. **Recruitment Materials** *(Required)*
    - Type: File Upload
    - Description: All recruitment materials
    - Validation: Required
    - Accepted Types: .pdf, .doc, .docx, .jpg, .jpeg, .png
    - Multiple: Yes
    - Helper Text: "Copies of all flyers, emails, social media posts, or scripts"

58. **Data Collection Tools** *(Required)*
    - Type: File Upload
    - Description: Questionnaires, interview schedules, etc.
    - Validation: Required
    - Accepted Types: .pdf, .doc, .docx, .xlsx
    - Multiple: Yes
    - Helper Text: "Final versions of questionnaires, interview schedules, or observation checklists"

59. **Letters of Support** *(Optional)*
    - Type: File Upload
    - Description: Permission from third-party organizations
    - Validation: Optional
    - Accepted Types: .pdf, .doc, .docx
    - Multiple: Yes
    - Helper Text: "Permission from third-party organizations (schools, hospitals) if applicable"

60. **Investigator CVs** *(Required)*
    - Type: File Upload
    - Description: Research team qualifications
    - Validation: Required
    - Accepted Types: .pdf, .doc, .docx
    - Multiple: Yes
    - Helper Text: "Evidence of research team qualifications and experience"

### Additional Information:

61. **Additional Comments** *(Optional)*
    - Type: Rich Text Editor
    - Description: Any additional information or clarifications
    - Validation: Optional
    - Min Rows: 4
    - Placeholder: "Any additional information or clarifications you would like to provide"

---

## Step 8: Review

This step displays a summary of all entered information across the following categories:

- **Project Overview**: Title, Research Type, Duration, Sample Size
- **Research Team**: PI Name, ORCID, Institution, Number of Co-Investigators
- **Participants & Ethics**: Vulnerable Populations, Conflict of Interest, Previous Approval
- **Documentation**: Upload status for all required documents

### Actions Available:
- **Save as Draft**: Saves the application without submitting
- **Submit Application**: Submits for ethics review

---

## Summary Statistics

- **Total Steps**: 8
- **Total Fields**: 61
- **Required Fields**: 47
- **Optional Fields**: 14
- **Conditional Fields**: 4 (shown based on other selections)
- **File Upload Fields**: 7 (4 required, 3 optional/conditional)
- **Rich Text Editor Fields**: 28
- **Text Fields**: 18
- **Number Fields**: 3
- **Date Fields**: 2
- **Dropdown Fields**: 1
- **Radio Groups**: 3
- **Checkbox Groups**: 1

---

## Field Categories

### Text Input Fields (18):
- Study Title, PI Name, PI ORCID, PI Email, PI Phone, PI Institution, PI Department
- Research Type Other, Funding Source, Funding Amount
- Data Storage Location, Data Retention Period
- Sample Size, Study Duration

### Rich Text Editor Fields (28):
- Lay Summary, Research Aims, Research Significance
- PI Qualifications, Scientific Validity, Research Procedures
- Data Analysis Plan, Timeline, Study Population
- Inclusion Criteria, Exclusion Criteria, Recruitment Strategy
- Vulnerable Group Justification, Power Imbalance Considerations
- Informed Consent Process, Capacity Assessment, Withdrawal Process
- Participant Costs, Data Collection Methods, Anonymization Method
- Data Storage Security, Data Disposal Protocol
- Physical Risks, Psychological Risks, Social Risks
- Risk Mitigation, Direct Benefits, Indirect Benefits
- Risk-Benefit Analysis, Conflict Details, Previous Approval Details
- Additional Comments

### Selection Fields (5):
- PI Option (Radio), Research Type (Dropdown)
- Vulnerable Populations (Checkboxes)
- Conflict of Interest (Radio), Previous Ethics Approval (Radio)

### Date Fields (2):
- Start Date, End Date

### File Upload Fields (7):
- Participant Info Sheet, Consent Form, Research Protocol
- Recruitment Materials, Data Collection Tools
- Letters of Support, Investigator CVs

### Array Fields (1):
- Co-Investigators (searchable via ORCID)

---

## Validation Rules

### Required Fields Must Be Completed:
- All fields marked with *(Required)* must be filled before submission
- Conditional fields are required only when their condition is met

### File Upload Requirements:
- Minimum 1 file for required uploads
- Multiple files allowed for: Recruitment Materials, Data Collection Tools, Letters of Support, Investigator CVs

### Format Validations:
- Email fields must be valid email format
- ORCID must follow format: 0000-0000-0000-0000
- Dates must be valid date format
- Numbers must be numeric values

### Conditional Logic:
- "Research Type Other" appears only when Research Type = "Other"
- "Vulnerable Group Justification" required when vulnerable populations selected (except "None")
- "Conflict Details" required when Conflict of Interest = true
- "Previous Approval Details" required when Previous Ethics Approval = true

---

## Form Submission

### Save as Draft:
- Saves all current form data
- Status set to "DRAFT"
- Can be edited later
- No validation required

### Submit Application:
- Validates all required fields
- Uploads all files
- Status changes to "SUBMITTED"
- Enters ethics review workflow
- Cannot be edited after submission (unless returned for revision)

---

## Notes

- The form uses ORCID integration for PI and Co-Investigator selection
- Rich text editors support formatted text (bold, italic, lists, etc.)
- File uploads are validated for file type
- The form auto-saves progress (implementation may vary)
- Consistency checks remind users to ensure information matches across all documents
