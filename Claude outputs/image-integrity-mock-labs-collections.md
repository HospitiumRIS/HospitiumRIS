# Image Integrity: Mock Labs/Units and Collections

**Prepared for:** Stephen Gaita, HospitiumRIS
**Date:** October 21, 2026
**Purpose:** A small, realistic mock dataset for demoing and testing the Image Integrity (ImaChek) module: the Lab/Unit filter, the Collections feature, the submissions lists, KPI cards, compare, and the Usage Report.
**Schema basis:** `prisma/schema.prisma`: `ImageIntegrityLabUnit`, `ImageIntegrityCollection`, `ImageIntegrityCase` (Image Integrity module block).

> All names, institutions and DOIs are fictional. DOIs use the `10.5555` prefix, which Crossref reserves for examples, so DOI autofill will not pull real authors.

---

## 1. Scenario

**Institution:** Hospitium Teaching & Referral Hospital (HTRH), Nairobi, a fictional national referral and teaching hospital with an attached medical school.

**Cast**

| Key | Person | Role (`accountType`) | Home lab |
|---|---|---|---|
| `R1` | Dr. Wanjiru Kamau | Researcher | Histopathology & Cytology |
| `R2` | Dr. Otieno Ochieng | Researcher | Molecular Biology & Genomics |
| `R3` | Dr. Amina Hassan | Researcher | Clinical Microbiology & Parasitology |
| `R4` | Dr. Kiprop Cheruiyot | Researcher | Haematology & Blood Transfusion |
| `A1` | Prof. Grace Njeri | Research Admin (Institution portal) | n/a. Views all cases and usage. Owns no collections. |

**At a glance:** 5 labs/units (1 inactive), 6 collections (1 empty), 12 cases across all 5 statuses, 5 cases with findings, spread over November 2025 to October 2026.

---

## 2. Labs / Units (`ImageIntegrityLabUnit`)

All rows have `institutionId = <HTRH institution id>`.

| # | `name` | `description` | `isActive` | `sortOrder` | Cases |
|---|---|---|---|---|---|
| L1 | Histopathology & Cytology Lab | Tissue processing, H&E and special stains, immunohistochemistry (IHC), FNA cytology. Main source of microscopy figures for oncology manuscripts. | `true` | 1 | 3 |
| L2 | Molecular Biology & Genomics Unit | PCR/qPCR, Western blotting, gel electrophoresis and sequencing for infectious-disease and oncology studies. | `true` | 2 | 3 |
| L3 | Clinical Microbiology & Parasitology Lab | Culture and sensitivity, antibiograms, Gram/ZN stains, malaria microscopy and AMR surveillance. | `true` | 3 | 2 |
| L4 | Haematology & Blood Transfusion Lab | Peripheral smears, bone-marrow aspirates, HPLC haemoglobinopathy screening, flow cytometry. | `true` | 4 | 2 |
| L5 | Radiology & Imaging Research Unit | Merged into the Department of Diagnostic Imaging in July 2026. Kept for historical submissions. | **`false`** | 5 | 1 |

One case (C12) has no lab (`labUnitId = null`), to test the "Unassigned" bucket.

**What this exercises**
- Lab filter and grouping on `/institution/image-integrity`, and "By Lab/Unit" on the Usage Report.
- **L5 (inactive):** it should be hidden from the *New Integrity Check* lab dropdown, but its historical case (C11) must still display the lab name, not a blank.
- `@@unique([institutionId, name])`: try creating a second "Histopathology & Cytology Lab" to confirm the duplicate-name error is handled gracefully.

---

## 3. Collections (`ImageIntegrityCollection`)

Collections are **personal**, owned by one user (`userId`), like ImaChek's "My Collections".

| # | Owner | `name` | `description` | `color` | Cases |
|---|---|---|---|---|---|
| K1 | R1 Wanjiru | Cervical Cancer Biopsy Study 2026 | Figures for the CIN grading cohort paper. Target journal: *East African Medical Journal*. | `#8b6cbc` | 1 |
| K2 | R1 Wanjiru | Breast Ca IHC: Reviewer Revisions | Re-submitted IHC panels after Reviewer 2 queried Figure 4. | `#E57373` | 1 |
| K3 | R2 Otieno | Antimalarial Resistance Blots | pfcrt/pfmdr1 Western blots and PCR gels for the resistance-markers study. | `#4FC3F7` | 2 |
| K4 | R3 Amina | AMR Surveillance Figures | Antibiogram plates and Gram stains for the 2026 AMR surveillance report. | `#81C784` | 2 |
| K5 | R4 Kiprop | Sickle Cell Smears: Thesis Ch. 3 | Peripheral smear figures for the PhD thesis, Chapter 3. | `#FFB74D` | 1 |
| K6 | R3 Amina | Archive: Pre-2025 | Placeholder for older figures, not yet migrated. | `#90A4AE` | **0** |

Five cases (C3, C6, C10, C11, C12) are not in any collection (`collectionId = null`).

**What this exercises**
- Collection chips and colour dots in the list, and the filter by collection.
- **K6 (empty):** empty-state rendering, and deleting a collection that has no cases.
- `@@unique([userId, name])`: Wanjiru cannot create two collections named "Cervical Cancer Biopsy Study 2026", but Otieno could reuse the name.
- Deleting K3 should set `collectionId = null` on C4 and C5 (`onDelete: SetNull`), not delete the cases.

---

## 4. Sample cases (`ImageIntegrityCase`)

Every case's collection belongs to its own submitter (see §6.2).

### 4.1 Summary

| # | Title | Submitter | Lab | Collection | Format / size | Status | Similarity (H/M/L) | Manip. | Global repo | Created (EAT) |
|---|---|---|---|---|---|---|---|---|---|---|
| C1 | H&E sections of CIN III lesions: Figure 2 | R1 | L1 | K1 | PDF / 4.8 MB | COMPLETED | 0 (0/0/0) | 0 | ✅ | 2026-01-22 |
| C2 | Ki-67 IHC panel: Figure 4A–D | R1 | L1 | K2 | TIFF / 18.2 MB | COMPLETED | 3 (1/1/1) | 1 | ✅ | 2026-08-27 |
| C3 | Supplementary figures S1–S8 | R1 | L1 | — | ZIP / 23.9 MB | PROCESSING (62%) | — | — | ❌ | 2026-10-20 |
| C4 | pfcrt / pfmdr1 Western blot: Figure 3 | R2 | L2 | K3 | PNG / 2.1 MB | COMPLETED | 2 (2/0/0) | 3 | ✅ | 2026-03-05 |
| C5 | PCR product gel electrophoresis: Figure S2 | R2 | L2 | K3 | JPG / 1.4 MB | COMPLETED | 1 (0/0/1) | 0 | ❌ | 2026-03-05 |
| C6 | qPCR melt curves: Supplementary | R2 | L2 | — | PDF / 3.2 MB | FAILED | — | — | ❌ | 2026-09-15 |
| C7 | Antibiogram plates: *E. coli* isolates | R3 | L3 | K4 | JPEG / 6.5 MB | COMPLETED | 1 (0/1/0) | 0 | ✅ | 2026-06-09 |
| C8 | Gram stain micrographs: blood cultures | R3 | L3 | K4 | TIFF / 11.0 MB | UPLOADED (0%) | — | — | ❌ | 2026-10-19 |
| C9 | Peripheral blood smears: HbSS cohort | R4 | L4 | K5 | PDF / 9.7 MB | COMPLETED | 0 (0/0/0) | 2 | ✅ | 2026-04-18 |
| C10 | HPLC chromatograms: HbS/HbF quantification | R4 | L4 | — | PNG / 0.9 MB | UPLOADING (0%) | — | — | ❌ | 2026-10-21 |
| C11 | MRI cervical cancer staging figures | R1 | L5 *(inactive)* | — | PDF / 7.4 MB | COMPLETED | 0 (0/0/0) | 0 | ✅ | 2025-11-14 |
| C12 | Conference poster figures: AMR Symposium 2026 | R3 | *(none)* | — | PNG / 3.3 MB | COMPLETED | 0 (0/0/0) | 0 | ❌ | 2026-02-10 |

### 4.2 Field-level detail

The JSON-ish blocks below use the exact schema field names. Omitted fields keep their defaults or `null`. `contributor` is derived from the submitter's profile name.

**C1: clean, completed, global compare**
```json
{
  "title": "H&E sections of CIN III lesions – Figure 2",
  "doi": "10.5555/htrh.2026.0012",
  "authors": ["Wanjiru Kamau", "Peter Mwangi", "Faith Achieng"],
  "description": "Representative H&E sections showing CIN III grading criteria, x100 and x400.",
  "fileName": "Kamau_CIN_Fig2.pdf", "fileFormat": "pdf", "fileSizeBytes": 5033164,
  "comparedGlobalRepository": true,
  "status": "COMPLETED", "analysisStatus": "completed", "analysisProgress": 100,
  "similarityCount": 0, "similarityLevel": {"high": 0, "medium": 0, "low": 0},
  "manipulationCount": 0,
  "classification": {"microscopy": 12},
  "pageAmount": 6, "croppedAmount": 12,
  "tags": ["histology", "cervical-cancer", "figure-2"],
  "analysisStartedAt": "2026-01-22T10:04:00+03:00", "analysisCompletedAt": "2026-01-22T10:11:00+03:00"
}
```

**C2: findings (all three similarity levels and a manipulation hit)**
```json
{
  "title": "Ki-67 IHC panel – Figure 4A–D",
  "doi": "10.5555/htrh.2026.0047",
  "authors": ["Wanjiru Kamau", "Samuel Kiprotich", "Lucy Wairimu", "Hassan Abdi"],
  "fileName": "Fig4_Ki67_panel_v3.tiff", "fileFormat": "tiff", "fileSizeBytes": 19083264,
  "comparedGlobalRepository": true,
  "status": "COMPLETED", "analysisProgress": 100,
  "similarityCount": 3, "similarityLevel": {"high": 1, "medium": 1, "low": 1},
  "manipulationCount": 1,
  "classification": {"microscopy": 4},
  "pageAmount": 1, "croppedAmount": 4,
  "notes": "Panels 4B and 4D flagged HIGH similarity. Check whether the same field of view was captured twice before replying to Reviewer 2.",
  "tags": ["IHC", "breast-cancer", "revision", "flagged"]
}
```

**C3: processing (polling state)**
```json
{
  "title": "Supplementary figures S1–S8",
  "fileName": "Supp_Figures_S1-S8.zip", "fileFormat": "zip", "fileSizeBytes": 25060556,
  "status": "PROCESSING", "analysisStatus": "processing", "analysisProgress": 62,
  "externalCaseId": "imk_c3_mock_000123",
  "analysisStartedAt": "2026-10-20T16:40:00+03:00"
}
```
> The file is 23.9 MB, just under the 25 MB per-file limit. That makes it a useful boundary test.

**C4: highest-risk case (for compare and detail-page demos)**
```json
{
  "title": "pfcrt / pfmdr1 Western blot – Figure 3",
  "doi": "10.5555/htrh.2026.0021",
  "authors": ["Otieno Ochieng", "Mercy Chebet", "Daniel Mutua"],
  "fileName": "Fig3_WB_pfcrt_pfmdr1.png", "fileFormat": "png", "fileSizeBytes": 2202009,
  "comparedGlobalRepository": true,
  "status": "COMPLETED", "analysisProgress": 100,
  "similarityCount": 2, "similarityLevel": {"high": 2, "medium": 0, "low": 0},
  "manipulationCount": 3,
  "classification": {"blot_gel": 4},
  "pageAmount": 1, "croppedAmount": 4,
  "notes": "Two lanes show HIGH similarity to a 2019 published blot in the global repository. Escalate to the Research Integrity Committee.",
  "tags": ["western-blot", "malaria", "escalated"]
}
```

**C5: low-similarity only (likely benign)**
```json
{
  "title": "PCR product gel electrophoresis – Figure S2",
  "fileName": "FigS2_gel.jpg", "fileFormat": "jpg", "fileSizeBytes": 1468006,
  "status": "COMPLETED", "analysisProgress": 100,
  "similarityCount": 1, "similarityLevel": {"high": 0, "medium": 0, "low": 1},
  "manipulationCount": 0,
  "classification": {"blot_gel": 1},
  "pageAmount": 1, "croppedAmount": 1,
  "notes": "Low similarity is to Figure 3 (C4), the same ladder. Expected.",
  "tags": ["gel", "malaria"]
}
```

**C6: failed**
```json
{
  "title": "qPCR melt curves – Supplementary",
  "fileName": "qPCR_melt_curves_protected.pdf", "fileFormat": "pdf", "fileSizeBytes": 3355443,
  "status": "FAILED", "analysisProgress": 0,
  "errorMessage": "Upload rejected: the PDF is password-protected. Remove the password and resubmit."
}
```
> Use this case to test the **Resubmit** flow. It also stands in for the "raw vendor error shown to users" finding from the earlier report. Here the message is written to be user-safe.

**C7: medium similarity, photo-type images**
```json
{
  "title": "Antibiogram plates – E. coli isolates",
  "doi": "10.5555/htrh.2026.0033",
  "authors": ["Amina Hassan", "Joseph Kariuki"],
  "fileName": "antibiogram_ecoli_plates.jpeg", "fileFormat": "jpeg", "fileSizeBytes": 6815744,
  "comparedGlobalRepository": true,
  "status": "COMPLETED", "analysisProgress": 100,
  "similarityCount": 1, "similarityLevel": {"high": 0, "medium": 1, "low": 0},
  "manipulationCount": 0,
  "classification": {"photo": 6},
  "pageAmount": 1, "croppedAmount": 6,
  "tags": ["AMR", "antibiogram"]
}
```

**C8: uploaded and queued.** `status: "UPLOADED"`, `analysisProgress: 0`, `externalCaseId: "imk_c8_mock_000131"`, TIFF, 11,534,336 bytes.

**C9: manipulation without duplication**
```json
{
  "title": "Peripheral blood smears – HbSS cohort",
  "fileName": "HbSS_smears_ch3.pdf", "fileFormat": "pdf", "fileSizeBytes": 10171187,
  "comparedGlobalRepository": true,
  "status": "COMPLETED", "analysisProgress": 100,
  "similarityCount": 0, "similarityLevel": {"high": 0, "medium": 0, "low": 0},
  "manipulationCount": 2,
  "classification": {"microscopy": 9, "chart": 2},
  "pageAmount": 4, "croppedAmount": 11,
  "notes": "Contrast filter flagged 2 images. These were white-balance adjusted on the microscope camera; confirm with the original captures.",
  "tags": ["sickle-cell", "thesis", "smear"]
}
```

**C10: uploading.** `status: "UPLOADING"`, `analysisProgress: 0`, `externalCaseId: null`, PNG, 943,718 bytes. Created a few minutes ago, so it shows as the newest row.

**C11: historical case in the inactive lab.** COMPLETED and clean, `labUnitId → L5`, `classification: {"microscopy": 0, "chart": 3}`, `pageAmount: 3`, `croppedAmount: 5`. It is the oldest row, dated 2025-11-14.

**C12: no lab, no collection.** COMPLETED and clean, `labUnitId: null`, `collectionId: null`, `classification: {"chart": 2, "photo": 1}`, `tags: ["poster", "conference"]`.

> **Classification keys:** the schema comment names `microscopy`, `blot_gel` and `chart`. `photo` is my assumption. Confirm it against a real ImaChek response before relying on it.

---

## 5. Roll-ups (expected values for checking the UI)

### 5.1 KPI cards (Researcher view per user / Institution view total)

| Scope | Total | Completed | In progress\* | Failed | With findings |
|---|---|---|---|---|---|
| **Institution (A1)** | 12 | 8 | 3 | 1 | 5 |
| R1 Wanjiru | 4 | 3 | 1 | 0 | 1 |
| R2 Otieno | 3 | 2 | 0 | 1 | 2 |
| R3 Amina | 3 | 2 | 1 | 0 | 1 |
| R4 Kiprop | 2 | 1 | 1 | 0 | 1 |

\*In progress = UPLOADING + UPLOADED + PROCESSING. "With findings" means `similarityCount > 0 OR manipulationCount > 0`, which gives C2, C4, C5, C7 and C9.

### 5.2 By Lab/Unit

| Lab | Cases | Completed | With findings |
|---|---|---|---|
| L1 Histopathology & Cytology | 3 | 2 | 1 |
| L2 Molecular Biology & Genomics | 3 | 2 | 2 |
| L3 Clinical Microbiology & Parasitology | 2 | 1 | 1 |
| L4 Haematology & Blood Transfusion | 2 | 1 | 1 |
| L5 Radiology & Imaging *(inactive)* | 1 | 1 | 0 |
| Unassigned | 1 | 1 | 0 |

### 5.3 By month (for the Usage Report, Oct 2025 to Oct 2026)

| Month | Cases |
|---|---|
| Nov 2025 | 1 |
| Dec 2025 | **0** |
| Jan 2026 | 1 |
| Feb 2026 | 1 |
| Mar 2026 | 2 (same-day batch) |
| Apr 2026 | 1 |
| May 2026 | **0** |
| Jun 2026 | 1 |
| Jul 2026 | **0** |
| Aug 2026 | 1 |
| Sep 2026 | 1 |
| Oct 2026 | 3 |

The zero months are deliberate. They check that the report shows empty months instead of skipping them.

---

## 6. Test scenarios this data covers

| Scenario | Use |
|---|---|
| All 5 `ImageIntegrityStatus` values | C10 UPLOADING, C8 UPLOADED, C3 PROCESSING, C1 COMPLETED, C6 FAILED |
| Clean vs. flagged results | Clean: C1, C11, C12. Flagged: C2, C4, C5, C7, C9 |
| Each similarity level on its own | High only: C4. Medium only: C7. Low only: C5. All three: C2 |
| Manipulation without duplication | C9 |
| Cross-case compare (2–10 records) | C4 + C5 (same author, expected low match). C2 + C1 (same author, different studies) |
| Inactive lab with history | L5 / C11 |
| Unassigned case | C12 |
| Empty collection | K6 |
| Delete collection → `SetNull` | K3 (C4 and C5 survive, uncollected) |
| File size boundary | C3 (23.9 MB) |
| Resubmit after failure | C6 |
| Tenant scoping (earlier report, §5.2) | Not covered by this single-institution set. Add a second institution with one lab and one case to test it |

### 6.1 Edge cases deliberately left out (small dataset)
Long and Unicode titles, the maximum number of tags, more than 20 cases (pagination), and multiple institutions. Each of these is one or two extra rows if you need them later.

### 6.2 Schema observations from building this
1. **Nothing enforces collection ownership.** A case's `collectionId` could point at *another user's* collection. The data above keeps them consistent, but the API should check `collection.userId === case.submittedById` on assign.
2. **There is no lab membership.** Any researcher can tag a case with any active lab (C11 is Wanjiru filing under Radiology). That is fine for now, but ImaChek's Lab/Unit Admin tier would need a `UserLabUnit` link.
3. **Each case belongs to one collection only.** ImaChek's "My Collections" works like folders, so this matches. Tags (`Json`) cover the many-to-many need.
4. **There are no per-lab analysis caps or validity periods** on `ImageIntegrityLabUnit`. These are ImaChek account features, mentioned in the earlier report §6.

---

*Improvement note: if you later want this as data, the tables above map 1:1 to a `prisma/seed-image-integrity.js`. Generating mock datasets from a schema is repeatable across modules (Proposals, Ethics, Project Management), so it is a good candidate for a Claude Skill ("schema-driven mock data report + optional seed").*
