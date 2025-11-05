# EndNote Import Sample Files

This document provides sample EndNote files for testing the import functionality.

## Sample RIS Format (.ris)

### Sample 1: Medical Journal Articles

```
TY  - JOUR
TI  - Efficacy and safety of mRNA COVID-19 vaccines in immunocompromised patients: a systematic review and meta-analysis
AU  - Chen, Wei L.
AU  - Rodriguez, Maria A.
AU  - Smith, John A.
AU  - Patel, Ravi K.
PY  - 2023
JO  - The Lancet
VL  - 401
IS  - 10375
SP  - 456
EP  - 468
AB  - Background: Immunocompromised patients have reduced immune responses to vaccines and increased risk of severe COVID-19. We assessed the efficacy and safety of mRNA COVID-19 vaccines in this population.
DO  - 10.1016/S0140-6736(23)00234-5
KW  - COVID-19
KW  - mRNA vaccines
KW  - immunocompromised
KW  - meta-analysis
KW  - vaccine efficacy
SN  - 0140-6736
ER  -

TY  - JOUR
TI  - Machine learning approaches for early detection of sepsis in the intensive care unit
AU  - Johnson, Sarah K.
AU  - Williams, Michael R.
AU  - Davis, Jennifer L.
AU  - Thompson, David E.
PY  - 2023
JO  - Critical Care Medicine
VL  - 51
IS  - 8
SP  - 1034
EP  - 1045
AB  - Objective: To develop and validate machine learning models for early sepsis detection using electronic health record data from ICU patients.
DO  - 10.1097/CCM.0000000000005123
KW  - sepsis
KW  - machine learning
KW  - intensive care
KW  - early detection
KW  - electronic health records
SN  - 0090-3493
ER  -
```

### Sample 2: Book Chapter

```
TY  - CHAP
TI  - Sustainable urban planning in the 21st century
AU  - Thompson, Lisa M.
AU  - Garcia, Carlos E.
PY  - 2023
BT  - Urban Development and Sustainability
ED  - Wilson, David P.
ED  - Lee, Jennifer K.
PB  - Academic Press
CY  - New York
SP  - 45
EP  - 78
AB  - This chapter explores innovative approaches to sustainable urban planning, examining case studies from major metropolitan areas worldwide.
IS  - 978-0-12-345678-9
KW  - urban planning
KW  - sustainability
KW  - metropolitan development
ER  -
```

### Sample 3: Conference Paper

```
TY  - CONF
TI  - Blockchain technology in supply chain management
AU  - Anderson, Peter J.
AU  - Miller, Jennifer L.
PY  - 2023
BT  - Proceedings of the International Conference on Technology Innovation
ED  - Roberts, James M.
PB  - IEEE
CY  - San Francisco, CA
SP  - 123
EP  - 130
AB  - This paper presents a novel framework for implementing blockchain technology in supply chain management systems to improve transparency and traceability.
DO  - 10.1109/ICTI.2023.1234567
KW  - blockchain
KW  - supply chain
KW  - transparency
KW  - traceability
ER  -
```

## Sample EndNote XML Format

### Basic XML Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xml>
  <records>
    <record>
      <database name="Sample Database" path="sample.enl">sample.enl</database>
      <source-app name="EndNote" version="20.0">EndNote</source-app>
      <rec-number>1</rec-number>
      <foreign-keys>
        <key app="EN" db-id="sample">1</key>
      </foreign-keys>
      <ref-type name="Journal Article">17</ref-type>
      <contributors>
        <authors>
          <author>Smith, John A.</author>
          <author>Johnson, Mary B.</author>
        </authors>
      </contributors>
      <titles>
        <title>The impact of climate change on biodiversity conservation</title>
      </titles>
      <periodical>
        <full-title>Nature Climate Change</full-title>
      </periodical>
      <pages>245-260</pages>
      <volume>13</volume>
      <number>4</number>
      <dates>
        <year>2023</year>
      </dates>
      <abstract>This study examines the relationship between climate change and biodiversity conservation efforts across multiple ecosystems.</abstract>
      <keywords>
        <keyword>climate change</keyword>
        <keyword>biodiversity</keyword>
        <keyword>conservation</keyword>
      </keywords>
      <electronic-resource-num>10.1038/s41558-023-01234-x</electronic-resource-num>
    </record>
    
    <record>
      <database name="Sample Database" path="sample.enl">sample.enl</database>
      <source-app name="EndNote" version="20.0">EndNote</source-app>
      <rec-number>2</rec-number>
      <foreign-keys>
        <key app="EN" db-id="sample">2</key>
      </foreign-keys>
      <ref-type name="Book">6</ref-type>
      <contributors>
        <authors>
          <author>Thompson, Lisa M.</author>
        </authors>
      </contributors>
      <titles>
        <title>Sustainable Urban Development: A Comprehensive Guide</title>
      </titles>
      <dates>
        <year>2022</year>
      </dates>
      <publisher>Academic Press</publisher>
      <pub-location>New York</pub-location>
      <isbn>978-0-12-345678-9</isbn>
      <abstract>A comprehensive guide to sustainable urban development practices and methodologies.</abstract>
      <keywords>
        <keyword>urban development</keyword>
        <keyword>sustainability</keyword>
      </keywords>
    </record>
  </records>
</xml>
```

## Testing the EndNote Import

### Test Steps:

1. **Navigate to Import Page**: Go to `http://localhost:3000/researcher/publications/import`

2. **Select EndNote**: Click on the EndNote import option

3. **Test File Upload**:
   - Save one of the sample RIS formats above as a `.ris` file
   - Upload the file using the "Choose EndNote File" button
   - Click "Preview Publications"

4. **Test Manual Input**:
   - Copy and paste the sample RIS content into the text area
   - Click "Preview Publications"

5. **Test Selection and Import**:
   - Review the parsed publications
   - Select/deselect publications as needed
   - Click "Import X Selected" to complete the import

### Supported File Formats:

- **`.ris`** - Reference Manager format (most common)
- **`.enw`** - EndNote export format
- **`.xml`** - EndNote XML format
- **`.txt`** - Plain text EndNote format

### Common EndNote Field Mappings:

| EndNote Field | RIS Tag | Description |
|---------------|---------|-------------|
| Reference Type | TY | Publication type (JOUR, BOOK, CONF, etc.) |
| Title | TI | Publication title |
| Author | AU | Author names |
| Year | PY | Publication year |
| Journal | JO/JF | Journal name |
| Volume | VL | Volume number |
| Issue | IS | Issue number |
| Pages | SP/EP | Start and end pages |
| Abstract | AB | Abstract text |
| DOI | DO | Digital Object Identifier |
| Keywords | KW | Keywords/tags |
| ISBN/ISSN | SN | Standard numbers |
| Publisher | PB | Publisher name |

### Error Handling:

The EndNote import includes comprehensive error handling for:
- Invalid file formats
- Malformed RIS/XML content
- Missing required fields
- Network errors during import
- Database connection issues

All errors are displayed using user-friendly snackbar notifications with clear instructions for resolution.
