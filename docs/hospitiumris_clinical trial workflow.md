# HOSPITIUMRIS — Clinical Trials: Comprehensive Workflow & Integration Map

> **Scope:** Full research lifecycle from concept to institutional archive.  
> **Audience:** Researcher (PI/Study Team) + Research Admin (Research Office/Compliance/Leadership).  
> **Position of HOSPITIUMRIS:** Institutional Research Intelligence Layer — sits *above* CTMS, EDC, and eTMF systems to unify, orchestrate, and report.

---

## 1. Guiding Architecture Principle

HOSPITIUMRIS is **not** a replacement for:
- CTMS (Veeva Vault, Oracle Siebel) → trial operations
- EDC (REDCap, Medidata Rave) → patient/subject data capture
- eTMF (Veeva eTMF) → compliance document store

It is the **institutional connective tissue** — the layer that gives leadership, research offices, compliance teams, and funders a single unified view of all research activity.

---

## 2. Roles & Responsibilities Matrix

| Role | Primary System | HOSPITIUMRIS Actions |
|---|---|---|
| Principal Investigator (PI) | CTMS / EDC | Create trial record, link ORCID, track outputs |
| Sub-Investigator | CTMS / EDC | Assigned via delegation log |
| Study Coordinator | CTMS | Recruitment tracking, milestone updates |
| Research Nurse | EDC / EHR | Visit status sync |
| IRB/IEC Officer | Internal Ethics System | Upload approvals, link amendments |
| Research Office Admin | HOSPITIUMRIS | Full lifecycle oversight, compliance flags |
| Grants & Finance Admin | Grants Module | Funding source linkage, reporting triggers |
| Compliance Officer | eTMF / HOSPITIUMRIS | Deviation alerts, audit trail review |
| Hospital Leadership | HOSPITIUMRIS Dashboards | Portfolio view, KPI dashboards |
| Sponsor / Funder | Registry / Reports | Submission-ready exports |
| Data Manager | EDC / CDISC tools | Metadata exchange via ODM/SDTM |

---

## 3. Full Lifecycle Workflow

### PHASE 1 — TRIAL INTAKE & REGISTRATION

#### Researcher Actions
- [ ] Submit study concept / protocol title to Research Office portal
- [ ] Provide core metadata: PI, co-investigators, department, sponsor, intervention type, study phase, funding source
- [ ] Declare intended public registry (ClinicalTrials.gov, PACTR, ANZCTR, etc.)
- [ ] Upload preliminary protocol draft
- [ ] Confirm planned sample size and recruitment site(s)

#### Research Admin Actions
- [ ] Review intake submission for completeness
- [ ] Assign internal **Trial ID** (linked to institutional identifier schema)
- [ ] Link PI via **ORCID** identifier
- [ ] Link institution via **ROR** identifier
- [ ] Map all WHO Trial Registration Data Set fields
- [ ] Create trial record in HOSPITIUMRIS with status: `Concept`
- [ ] Trigger **Ethics Routing** workflow

#### Integrations at This Phase
| Integration | Purpose | Direction |
|---|---|---|
| ORCID API | Verify & auto-fill PI/co-investigator profiles | Pull |
| ROR API | Validate institutional affiliations | Pull |
| WHO Trial Registration Dataset | Pre-fill registry-ready fields | Internal mapping |
| Internal HR/Staff Directory | Validate team members | Pull |

---

### PHASE 2 — ETHICS & REGULATORY CLEARANCE

#### Researcher Actions
- [ ] Submit full protocol package to IRB/IEC via HOSPITIUMRIS document portal
- [ ] Upload: informed consent form (ICF), participant information sheet, insurance certificate, investigator brochure, CRF templates
- [ ] Respond to IRB queries through the correspondence log
- [ ] Upload approval letters when received
- [ ] Record protocol version number and amendment history

#### Research Admin Actions
- [ ] Route document package to the relevant ethics committee
- [ ] Track approval status: `Submitted → Under Review → Approved / Rejected / Revisions Required`
- [ ] Store all ethics correspondence with timestamps
- [ ] Log IRB approval number and expiry date
- [ ] Trigger `Ethics Approved` → activate **Trial Registration** workflow
- [ ] Verify ICH GCP compliance: delegation logs, training certificates attached
- [ ] Flag missing or expiring documents

#### Integrations at This Phase
| Integration | Purpose | Direction |
|---|---|---|
| Institutional Ethics Management System | Two-way status sync | Bi-directional |
| Document Management / eTMF | Protocol and consent versioning | Push/Pull |
| Notification Engine | Approval alerts to PI and Research Office | Internal |
| ICH GCP Checklist Engine | Compliance gap identification | Internal |

---

### PHASE 3 — STUDY TEAM & SITE SETUP

#### Researcher Actions
- [ ] Nominate full study team in HOSPITIUMRIS
- [ ] Assign roles: PI, sub-investigators, coordinators, nurses, pharmacists, statisticians, monitors, lab staff
- [ ] Upload GCP training certificates for each team member
- [ ] Complete and sign delegation of authority log
- [ ] Confirm participating site departments and any collaborating external institutions

#### Research Admin Actions
- [ ] Validate team member credentials and GCP certificate expiry dates
- [ ] Configure permission-based access for each role in HOSPITIUMRIS and linked CTMS
- [ ] Log delegation authority entries per GCP requirements
- [ ] Set up site record(s) for multi-site trials
- [ ] Alert PI if any team member has expired or missing certifications

#### Integrations at This Phase
| Integration | Purpose | Direction |
|---|---|---|
| CTMS (Veeva / Oracle) | Mirror study team and site configuration | Push |
| HR / Training Records System | Verify GCP certifications | Pull |
| Institutional SSO / IAM | Role-based access provisioning | Pull |

---

### PHASE 4 — REGISTRY INTEGRATION & PUBLIC REGISTRATION

#### Researcher Actions
- [ ] Review auto-populated registry fields in HOSPITIUMRIS
- [ ] Confirm or complete any missing required fields
- [ ] Approve for submission to primary registry (ClinicalTrials.gov, PACTR, etc.)
- [ ] Receive and record Trial Registration Number (TRN)

#### Research Admin Actions
- [ ] Generate submission-ready export file (ClinicalTrials.gov PRS format)
- [ ] Validate all WHO primary registry required fields
- [ ] Submit or instruct PI to submit via registry portal
- [ ] Record TRN in HOSPITIUMRIS trial record
- [ ] Set calendar reminders for mandatory registry update deadlines
- [ ] For African institutions: ensure PACTR registration for WHO network compliance

#### Integrations at This Phase
| Integration | Purpose | Direction |
|---|---|---|
| ClinicalTrials.gov PRS API | Submit / update trial record | Push |
| PACTR API / Export | Submit to African registry | Push |
| WHO ICTRP | Validate registration in global network | Pull |
| DataCite / DOI Registry | Assign persistent identifier to trial | Pull |

---

### PHASE 5 — TRIAL ACTIVATION & RECRUITMENT MONITORING

#### Researcher Actions
- [ ] Confirm "First Patient Enrolled" milestone in HOSPITIUMRIS
- [ ] Log recruitment targets by site/department
- [ ] Update enrollment numbers (actual vs. target) on agreed reporting cadence
- [ ] Record screening failures with reason codes
- [ ] Escalate recruitment delays to Research Office

#### Research Admin Actions
- [ ] Activate trial status: `Active` in HOSPITIUMRIS
- [ ] Monitor real-time enrollment dashboard across all active trials
- [ ] Flag sites with recruitment below threshold
- [ ] Track milestone dates: FPI, 50% enrollment, 100% enrollment, last patient visit
- [ ] Generate recruitment performance reports for leadership
- [ ] Sync enrollment counts from CTMS (Veeva/Oracle) automatically

#### Integrations at This Phase
| Integration | Purpose | Direction |
|---|---|---|
| CTMS (Veeva / Oracle Siebel) | Pull enrollment counts and milestone status | Pull |
| EDC (REDCap / Medidata Rave) | Pull anonymized subject counts, visit completion | Pull |
| EHR System | Pull screening/eligibility data (de-identified) | Pull |
| BI / Dashboard Tool | Feed enrollment KPIs to leadership dashboards | Push |

---

### PHASE 6 — PARTICIPANT & VISIT MANAGEMENT (Orchestration Layer)

> **Design Decision:** HOSPITIUMRIS does NOT become a full EDC. It is the orchestration layer.

#### What HOSPITIUMRIS Holds
- Anonymized participant counts
- Visit schedule milestones (baseline, mid-point, end-of-study)
- Deviation flags and protocol violation records
- Completion and dropout rates

#### What Stays in EDC / CTMS / EHR
- Subject-level clinical data
- Case Report Forms (CRFs)
- Lab values, imaging, clinical notes
- Adverse event raw data

#### Sync Model
```
EDC (REDCap / Medidata) → API → HOSPITIUMRIS Orchestration Layer
  - Enrollment count ✓
  - Visit completion rate ✓
  - Open queries / data issues ✓
  - Protocol deviations ✓
  - SAE flags ✓ (not the SAE detail)
```

#### Integrations at This Phase
| Integration | Purpose | Direction |
|---|---|---|
| REDCap API | Pull aggregated enrollment and visit metrics | Pull |
| Medidata Rave API | Pull trial progress metrics | Pull |
| EHR (e.g., Epic, OpenMRS) | De-identified recruitment/screening counts | Pull |
| CDISC ODM | Metadata exchange with EDC systems | Bi-directional |

---

### PHASE 7 — DOCUMENT & AUDIT TRAIL MANAGEMENT

#### Researcher Actions
- [ ] Upload new protocol amendments when issued
- [ ] Upload updated consent forms (version-controlled)
- [ ] Upload monitoring visit reports
- [ ] Upload DSMB outputs
- [ ] Upload SAE/SUSAR reports
- [ ] Confirm documents reviewed and signed as required

#### Research Admin Actions
- [ ] Maintain centralized Trial Master File (TMF) structure in HOSPITIUMRIS document workspace
- [ ] Enforce document versioning: no overwriting, full audit trail
- [ ] Cross-link documents to relevant trial phase / milestone
- [ ] Alert PI on overdue document submissions
- [ ] Prepare TMF for sponsor or regulatory inspection on request
- [ ] Generate audit trail report (who uploaded, when, what version)

#### Document Categories
| Document Type | Version Controlled | Linked To |
|---|---|---|
| Protocol & Amendments | Yes | Ethics approval, Registry |
| Informed Consent Forms | Yes | Ethics approval, Recruitment |
| CRF Templates | Yes | EDC configuration |
| Monitoring Reports | Yes | Site visits |
| DSMB Reports | Yes | Safety review |
| SAE / SUSAR Reports | Yes | Safety flags |
| Regulatory Correspondence | Yes | Approvals log |
| Close-Out Letter | Yes | Trial closure |
| Publications | Yes | Output records |

#### Integrations at This Phase
| Integration | Purpose | Direction |
|---|---|---|
| eTMF (Veeva eTMF) | Bi-directional document sync | Bi-directional |
| CDISC ODM | Audit trail metadata exchange | Push |
| e-Signature Platform | Sign and timestamp critical documents | Pull |
| Cloud Storage (S3/GCS) | Secure document archival | Push |

---

### PHASE 8 — SAFETY & COMPLIANCE MONITORING

#### Researcher Actions
- [ ] Report adverse events and SAEs through HOSPITIUMRIS safety module
- [ ] Log protocol deviations and corrective actions
- [ ] Respond to compliance alerts within defined SLA
- [ ] Update regulatory submissions following SAE/amendment triggers

#### Research Admin / Compliance Officer Actions
- [ ] Monitor real-time compliance dashboard with automated flags:
  - ⚠️ SAE reporting deadline approaching / overdue
  - ⚠️ Protocol deviation logged — corrective action pending
  - ⚠️ Ethics approval expiry within 30 days
  - ⚠️ GCP certification expired for team member
  - ⚠️ Registry update overdue
  - ⚠️ Results reporting deadline approaching
- [ ] Escalate unresolved flags to PI and department head
- [ ] Maintain deviation log with resolution records
- [ ] Generate compliance summary reports for governance/leadership

#### Integrations at This Phase
| Integration | Purpose | Direction |
|---|---|---|
| CTMS (Veeva) | Sync deviation and safety flag status | Pull |
| Regulatory Authority Portals | Submit SAE reports (national/international) | Push |
| eTMF | File safety correspondence | Push |
| Notification Engine (Email/SMS) | Alert stakeholders of compliance deadlines | Internal |
| MedDRA / WHO-DD | Standardized AE coding | Pull |

---

### PHASE 9 — DATA STANDARDS & INTEROPERABILITY

#### Core Standards Stack

| Standard | Role in HOSPITIUMRIS |
|---|---|
| **CDISC ODM** | Metadata and data exchange with EDC systems; supports audit trails |
| **CDISC SDTM** | Organize trial data for downstream regulatory and warehousing use |
| **FHIR (HL7)** | Interoperability with EHR systems for clinical data feeds |
| **ORCID** | Persistent researcher identifier |
| **ROR** | Persistent institutional identifier |
| **DOI / DataCite** | Persistent identifiers for datasets and publications |
| **WHO ICTRP Dataset** | Registry-ready field mapping |

#### Data Flow Model
```
EHR (FHIR) ──────────────────────┐
EDC (CDISC ODM) ─────────────────┤
CTMS (API) ──────────────────────┤──→ HOSPITIUMRIS Intelligence Layer
eTMF (API) ──────────────────────┤         ↓
Registry (ClinicalTrials API) ───┘    CDISC SDTM
                                       ↓
                              Data Warehouse / Analytics
```

---

### PHASE 10 — RESULTS REPORTING & OUTPUT LINKAGE

#### Researcher Actions
- [ ] Submit summary results to ClinicalTrials.gov (or applicable registry) within required window
- [ ] Upload manuscript draft to HOSPITIUMRIS for output tracking
- [ ] Record DOI when paper is published
- [ ] Deposit dataset in institutional or external repository
- [ ] Submit grant progress / final report

#### Research Admin Actions
- [ ] Track results reporting deadlines (ClinicalTrials.gov: 12 months post-study completion)
- [ ] Alert PI 60/30/14 days before deadline
- [ ] Link trial record to:
  - Published paper (via DOI)
  - Dataset deposit (via DataCite DOI)
  - Grant report
- [ ] Update registry with summary results and links
- [ ] Feed output data to institutional KPI dashboards

#### Output Linkage Map
```
Trial Record
  ├── → Publication (DOI via Crossref)
  ├── → Dataset (DOI via DataCite / Zenodo / Figshare)
  ├── → Grant Report (Internal grants module)
  ├── → Registry Results (ClinicalTrials.gov / PACTR)
  └── → Institutional Dashboard (KPIs)
```

#### Integrations at This Phase
| Integration | Purpose | Direction |
|---|---|---|
| Crossref API | Retrieve DOIs for publications, verify authorship | Pull |
| DataCite API | Register / retrieve dataset DOIs | Bi-directional |
| ClinicalTrials.gov Results Submission | Submit results post-study | Push |
| ORCID API | Update researcher publication records | Push |
| Funder Reporting Portal (e.g., Wellcome, NIH) | Link outputs to grant records | Push |
| Institutional Repository | Deposit preprints and datasets | Push |

---

### PHASE 11 — TRIAL CLOSE-OUT & INSTITUTIONAL MEMORY

#### Researcher Actions
- [ ] Confirm Last Patient Last Visit (LPLV) date
- [ ] Upload close-out monitoring report and close-out letter
- [ ] Confirm all data queries resolved in EDC
- [ ] Archive final protocol version

#### Research Admin Actions
- [ ] Update trial status: `Closed` in HOSPITIUMRIS
- [ ] Archive complete TMF package
- [ ] Record final enrollment, completion rate, dropout rate
- [ ] Document sponsor and collaborator history for future engagement
- [ ] Extract lessons learned (structured template)
- [ ] Tag reusable templates (consent, protocol structure, CRF library) for future studies
- [ ] Publish trial to institutional portfolio dashboard

#### Institutional Assets Created
| Asset | Future Use |
|---|---|
| Final protocol version | Template for follow-on studies |
| Sponsor engagement record | Future partnership development |
| Collaborator map | Multi-site trial planning |
| Outputs and citations | Institutional profile and rankings |
| Lessons learned | Process improvement |
| Archived TMF | Regulatory inspection readiness |

---

## 4. Integration Architecture Summary

### External Systems
| System | Type | Integration Method | Data Flow |
|---|---|---|---|
| ClinicalTrials.gov | Registry | PRS API | Push (registration, updates, results) |
| PACTR | Registry | API / Export | Push |
| WHO ICTRP | Validation | Query API | Pull |
| ORCID | Researcher PID | OAuth + API | Pull/Push |
| ROR | Institution PID | REST API | Pull |
| Crossref | Publication DOI | REST API | Pull |
| DataCite | Dataset DOI | REST API | Pull/Push |
| Funder Portals (NIH, Wellcome, MRC) | Reporting | Export / API | Push |

### Internal / Clinical Systems
| System | Type | Integration Method | Data Flow |
|---|---|---|---|
| Veeva Vault CTMS | Trial Operations | REST API | Pull (metrics, milestones) |
| Oracle Siebel CTMS | Trial Operations | REST API | Pull |
| REDCap | EDC | REDCap API | Pull (anonymized counts, completion) |
| Medidata Rave | EDC | REST API | Pull |
| Veeva eTMF | Document Management | Bi-directional API | Push/Pull |
| EHR (Epic / OpenMRS) | Clinical Data | HL7 FHIR | Pull (de-identified) |
| Ethics Management System | Approvals | API / Webhook | Bi-directional |
| HR / Training Records | Credentials | LDAP / API | Pull |
| Institutional SSO | Authentication | SAML / OAuth | Pull |
| BI / Analytics Platform | Dashboards | API / Data export | Push |

---

## 5. Compliance & Standards Alignment

| Standard / Regulation | Where It Applies | HOSPITIUMRIS Response |
|---|---|---|
| ICH GCP E6(R2) | Full lifecycle | Delegation logs, audit trails, proportionate documentation |
| ICH E8 | Study design | Protocol quality flags |
| CDISC ODM | EDC metadata exchange | ODM-compatible metadata export |
| CDISC SDTM | Data organisation | SDTM mapping templates |
| WHO Trial Registration Dataset | Registry submission | Pre-mapped field set |
| GDPR / POPIA | Data privacy | De-identified data only in HOSPITIUMRIS; EDC holds subject data |
| 21 CFR Part 11 | Electronic records (US trials) | Audit trail, e-signature, access controls |
| EU CTR | EU clinical trial regulation | Trial status reporting fields |

---

## 6. Dashboard & KPI Layer (Leadership View)

### Research Admin / Institutional Dashboards
- **Trial Pipeline:** Active / Pending / Closed by department and phase
- **Compliance Status:** % of trials with up-to-date approvals, certifications, registry entries
- **Recruitment Performance:** Enrollment vs. target across all active trials
- **Safety Flags:** Open SAE reports, deviation counts, overdue actions
- **Output Conversion:** Trials → Publications, Trials → Datasets
- **Funding Performance:** Grants received vs. research output generated
- **Collaboration Network:** Map of institutional partnerships by trial

### Researcher Dashboards
- My Active Trials and status
- My pending document submissions
- My compliance alerts (expiring approvals, certifications)
- My publications linked to trial records
- My ORCID activity feed

---

## 7. Notification & Alert Schedule

| Trigger | Alert To | SLA |
|---|---|---|
| Ethics approval expiry (30 days) | PI + Research Office | Immediate |
| GCP certificate expiry (60 days) | Team member + Admin | Immediate |
| Registry update overdue | PI + Research Office | Immediate |
| SAE reporting deadline (72hr / 7 days / 15 days) | PI + Safety Officer | Immediate |
| Results reporting deadline (60/30/14 days) | PI + Research Office | Scheduled |
| Recruitment below 70% of target at midpoint | PI + Department Head | Weekly report |
| Protocol amendment pending ethics re-approval | PI + Admin | Immediate |
| Document upload overdue | PI + Admin | Weekly |

---

## 8. Recommended Module Structure (HOSPITIUMRIS)

```
HOSPITIUMRIS Clinical Trials Module
│
├── 01. Trial Setup
│     ├── Internal ID & Metadata
│     ├── PI & Team (ORCID-linked)
│     └── Registry Fields (WHO TRS)
│
├── 02. Approvals & Compliance
│     ├── Ethics Routing & Status
│     ├── Regulatory Log
│     └── Compliance Flags Dashboard
│
├── 03. Study Team & Delegation
│     ├── Role Assignments
│     ├── Delegation Log
│     └── Training / GCP Certificates
│
├── 04. Registry & Registration
│     ├── ClinicalTrials.gov Submission
│     ├── PACTR Submission
│     └── TRN Record & Update Reminders
│
├── 05. Recruitment & Progress
│     ├── Enrollment Dashboard
│     ├── Site Performance
│     └── Milestone Tracker
│
├── 06. Document Repository (TMF)
│     ├── Protocol & Amendments
│     ├── Consent Forms
│     ├── Monitoring Reports
│     └── Audit Trail Log
│
├── 07. Safety & Deviations
│     ├── AE / SAE Flag Tracker
│     ├── Protocol Deviation Log
│     └── Corrective Action Records
│
├── 08. Data Standards
│     ├── CDISC ODM Metadata Exchange
│     ├── SDTM Mapping Templates
│     └── FHIR EHR Sync
│
├── 09. Registry & Results Reporting
│     ├── Summary Results Submission
│     ├── Results Deadline Tracker
│     └── Registry Update History
│
├── 10. Outputs & Impact
│     ├── Publication Tracker (DOI)
│     ├── Dataset Deposits (DataCite)
│     ├── Grant Report Linkage
│     └── ORCID Profile Updates
│
└── 11. Close-Out & Archive
      ├── Final Enrollment Record
      ├── Archived TMF
      ├── Sponsor History
      ├── Lessons Learned
      └── Reusable Template Library
```

---

## 9. Strategic Differentiation (vs. CTMS-Only Approach)

| Capability | CTMS Alone | HOSPITIUMRIS |
|---|---|---|
| Trial operations | ✅ | Via integration |
| Institutional portfolio view | ❌ | ✅ |
| Multi-system unification | ❌ | ✅ |
| Ethics & approvals tracking | ❌ | ✅ |
| Output & publication linkage | ❌ | ✅ |
| Funding vs. output performance | ❌ | ✅ |
| Leadership KPI dashboards | ❌ | ✅ |
| ORCID / ROR / DOI integration | ❌ | ✅ |
| African registry (PACTR) support | ❌ | ✅ |
| Low-resource environment design | ❌ | ✅ |

---

*Document generated from: A practical workflow view, Clinical Trials and HOSPITIUMRIS*  
*Version: 1.0 | For internal use — HOSPITIUMRIS product team*
