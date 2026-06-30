const fs = require('fs');
const path = require('path');

const formPath = path.join(__dirname, '../src/app/researcher/ethics/applications/create/comprehensive-form.js');
let src = fs.readFileSync(formPath, 'utf8');

src = src.replace(
  'export const renderStepContent = (step, formData, handleChange, handleVulnerablePopChange, coInvestigator, setCoInvestigator, addCoInvestigator, removeCoInvestigator) => {',
  `export const renderStepContent = (step, formData, handleChange, handleVulnerablePopChange, coInvestigator, setCoInvestigator, addCoInvestigator, removeCoInvestigator, t) => {
  const tr = (key, opts) => (t ? t(key, opts) : key);`
);

const alertReplacements = [
  [
    '<strong>Project Summary (Lay Summary):</strong> Provide a brief overview in plain language for non-expert audiences.',
    "{tr('ethics_form.project_summary_alert')}",
  ],
  [
    '<strong>Investigator CVs Required:</strong> Evidence of research team qualifications and experience must be provided.',
    "{tr('ethics_form.investigator_cvs_alert')}",
  ],
  [
    '<strong>Scientific Validity:</strong> Demonstrate that your study design can answer the research question.',
    "{tr('ethics_form.scientific_validity_alert')}",
  ],
  [
    '<strong>Important:</strong> Clearly define who can participate and justify inclusion of vulnerable groups.',
    "{tr('ethics_form.participants_alert')}",
  ],
  [
    '<strong>Informed Consent:</strong> Demonstrate that participants can make a truly voluntary and informed decision.',
    "{tr('ethics_form.informed_consent_alert')}",
  ],
  [
    '<strong>Risk-Benefit Analysis:</strong> Demonstrate that benefits outweigh risks and risks are minimized.',
    "{tr('ethics_form.risk_benefit_alert')}",
  ],
  [
    '<strong>Mandatory Documentation:</strong> All checked items must be attached to your application.',
    "{tr('ethics_form.documentation_alert')}",
  ],
  [
    '<strong>Consistency Check:</strong> Ensure the number of participants, study title, and procedures match across ALL submitted documents.',
    "{tr('ethics_form.consistency_check')}",
  ],
  [
    '<strong>Before submitting:</strong> Ensure all participant-facing documents use clear, everyday language without jargon. Verify consistency across all documents.',
    "{tr('ethics_form.before_submitting')}",
  ],
];

for (const [from, to] of alertReplacements) {
  src = src.replace(from, to);
}

const fieldMap = {
  'Project Overview': "tr('ethics_form.project_overview')",
  'Study Title *': "tr('ethics_form.study_title')",
  'Enter the full title of your research study': "tr('ethics_form.study_title_placeholder')",
  'Use clear, descriptive language': "tr('ethics_form.study_title_helper')",
  'Lay Summary (Plain Language) *': "tr('ethics_form.lay_summary')",
  'Explain your research in simple terms that anyone can understand. Avoid jargon and technical language.':
    "tr('ethics_form.lay_summary_placeholder')",
  'Write for a general audience without specialized knowledge': "tr('ethics_form.lay_summary_helper')",
  'Research Aims *': "tr('ethics_form.research_aims')",
  'What does this research intend to achieve? What questions will it answer?':
    "tr('ethics_form.research_aims_placeholder')",
  'Clearly state the main objectives': "tr('ethics_form.research_aims_helper')",
  'Research Significance *': "tr('ethics_form.research_significance')",
  'Why is this research important? What are the potential benefits to participants, science, or society?':
    "tr('ethics_form.research_significance_placeholder')",
  'Explain the value and impact of this research': "tr('ethics_form.research_significance_helper')",
  'Principal Investigator': "tr('ethics_form.principal_investigator')",
  'Full Name *': "tr('ethics_form.full_name')",
  'ORCID iD *': "tr('ethics_form.orcid_id')",
  '0000-0000-0000-0000': "tr('ethics_form.orcid_placeholder')",
  'Enter your ORCID identifier': "tr('ethics_form.orcid_helper')",
  'Email *': "tr('ethics_form.email')",
  'Phone Number *': "tr('ethics_form.phone_number')",
  'Institution *': "tr('ethics_form.institution')",
  'Department *': "tr('ethics_form.department')",
  'Qualifications & Experience *': "tr('ethics_form.qualifications')",
  'Briefly describe your relevant qualifications and research experience':
    "tr('ethics_form.qualifications_placeholder')",
  'Include degrees, certifications, and relevant experience': "tr('ethics_form.qualifications_helper')",
  'Co-Investigators': "tr('ethics_form.co_investigators')",
  Name: "tr('common.name')",
  'ORCID iD': "tr('ethics_form.orcid_id_optional')",
  Email: "tr('common.email')",
  Role: "tr('ethics_form.role')",
  Add: "tr('common.add')",
  'Research Design & Methodology': "tr('ethics_form.research_design')",
  'Research Type *': "tr('ethics_form.research_type')",
  'Please specify research type *': "tr('ethics_form.research_type_other')",
  'Scientific Validity *': "tr('ethics_form.scientific_validity')",
  'Explain how your research design ensures the study can answer the research question':
    "tr('ethics_form.scientific_validity_placeholder')",
  'Justify your methodology and approach': "tr('ethics_form.scientific_validity_helper')",
  'Research Procedures *': "tr('ethics_form.research_procedures')",
  'Provide a step-by-step account of what participants will be asked to do (e.g., interviews, surveys, clinical tests, observations)':
    "tr('ethics_form.research_procedures_placeholder')",
  'Be specific about all procedures involving participants': "tr('ethics_form.research_procedures_helper')",
  'Data Analysis Plan *': "tr('ethics_form.data_analysis_plan')",
  'Describe how the collected information will be processed and interpreted':
    "tr('ethics_form.data_analysis_plan_placeholder')",
  'Include statistical methods or qualitative analysis approaches': "tr('ethics_form.data_analysis_plan_helper')",
  'Research Timeline *': "tr('ethics_form.research_timeline')",
  'Provide a detailed timeline for your research activities': "tr('ethics_form.research_timeline_placeholder')",
  'Include key milestones and phases': "tr('ethics_form.research_timeline_helper')",
  'Study Duration (months) *': "tr('ethics_form.study_duration')",
  'Start Date *': "tr('ethics_form.start_date')",
  'End Date *': "tr('ethics_form.end_date')",
  'Funding Source': "tr('ethics_form.funding_source')",
  'Leave blank if unfunded': "tr('ethics_form.funding_source_helper')",
  'Funding Amount': "tr('ethics_form.funding_amount')",
  'Participant Recruitment & Selection': "tr('ethics_form.participant_recruitment')",
  'Study Population *': "tr('ethics_form.study_population')",
  'Describe the target population for your study': "tr('ethics_form.study_population_placeholder')",
  'Be specific about demographics and characteristics': "tr('ethics_form.study_population_helper')",
  'Sample Size *': "tr('ethics_form.sample_size')",
  'Justify your sample size if possible': "tr('ethics_form.sample_size_helper')",
  'Inclusion Criteria *': "tr('ethics_form.inclusion_criteria')",
  'Clearly defined parameters for who CAN participate in this study':
    "tr('ethics_form.inclusion_criteria_placeholder')",
  'List all criteria that participants must meet': "tr('ethics_form.inclusion_criteria_helper')",
  'Exclusion Criteria *': "tr('ethics_form.exclusion_criteria')",
  'Clearly defined parameters for who CANNOT participate in this study':
    "tr('ethics_form.exclusion_criteria_placeholder')",
  'List all criteria that would exclude participants': "tr('ethics_form.exclusion_criteria_helper')",
  'Recruitment Strategy *': "tr('ethics_form.recruitment_strategy')",
  'How will participants be identified and approached? (e.g., flyers, social media, database screening, direct contact)':
    "tr('ethics_form.recruitment_strategy_placeholder')",
  'Describe all recruitment methods in detail': "tr('ethics_form.recruitment_strategy_helper')",
  'Recruitment Materials Description *': "tr('ethics_form.recruitment_materials')",
  'Describe all flyers, emails, social media posts, or scripts that will be used to find participants':
    "tr('ethics_form.recruitment_materials_placeholder')",
  'Copies of actual materials must be attached': "tr('ethics_form.recruitment_materials_helper')",
  'Vulnerable Populations Involved *': "tr('ethics_form.vulnerable_populations')",
  'Vulnerable Group Justification *': "tr('ethics_form.vulnerable_group_justification')",
  'Provide specific justification for including vulnerable populations in your study':
    "tr('ethics_form.vulnerable_group_justification_placeholder')",
  'Explain why this group must be included and how they will be protected':
    "tr('ethics_form.vulnerable_group_justification_helper')",
  'Power Imbalance Considerations': "tr('ethics_form.power_imbalance')",
  'If you have a relationship with participants (e.g., teacher/student, employer/employee), explain how you will prevent coercion':
    "tr('ethics_form.power_imbalance_placeholder')",
  'Address any dependent relationships that might affect voluntary participation':
    "tr('ethics_form.power_imbalance_helper')",
  'Third-Party Permissions': "tr('ethics_form.third_party_permissions')",
  'List any permissions needed from schools, hospitals, or other organizations':
    "tr('ethics_form.third_party_permissions_placeholder')",
  'Letters of support must be attached': "tr('ethics_form.third_party_permissions_helper')",
  'Informed Consent Process': "tr('ethics_form.informed_consent_process')",
  'Informed Consent Process *': "tr('ethics_form.informed_consent_process_field')",
  'Describe HOW and WHEN consent will be sought. Ensure participants have adequate time to decide.':
    "tr('ethics_form.informed_consent_process_placeholder')",
  'Include details about the consent procedure and timing': "tr('ethics_form.informed_consent_process_helper')",
  'Capacity Assessment *': "tr('ethics_form.capacity_assessment')",
  'How will you assess if the participant understands the information provided?':
    "tr('ethics_form.capacity_assessment_placeholder')",
  'Describe methods to ensure comprehension': "tr('ethics_form.capacity_assessment_helper')",
  'Voluntary Participation Statement *': "tr('ethics_form.voluntary_participation')",
  'Confirm that participation is completely voluntary and participants can withdraw at any time without penalty':
    "tr('ethics_form.voluntary_participation_placeholder')",
  'Explain how this will be communicated': "tr('ethics_form.voluntary_participation_helper')",
  'Withdrawal Process *': "tr('ethics_form.withdrawal_process')",
  'Describe the process for participants to withdraw from the study':
    "tr('ethics_form.withdrawal_process_placeholder')",
  'Include what happens to their data if they withdraw': "tr('ethics_form.withdrawal_process_helper')",
  'Participant Costs & Compensation': "tr('ethics_form.participant_costs_compensation')",
  'Participant Costs *': "tr('ethics_form.participant_costs')",
  "Will participants incur any costs (e.g., travel, parking, time off work)? State 'None' if no costs.":
    "tr('ethics_form.participant_costs_placeholder')",
  'Be transparent about any costs to participants': "tr('ethics_form.participant_costs_helper')",
  Reimbursement: "tr('ethics_form.reimbursement')",
  'Will participants be reimbursed for costs? Describe the reimbursement process.':
    "tr('ethics_form.reimbursement_placeholder')",
  Incentives: "tr('ethics_form.incentives')",
  'Will participants receive any incentives (e.g., gift cards, payment)? Describe amount and justification.':
    "tr('ethics_form.incentives_placeholder')",
  'Ensure incentives are not coercive': "tr('ethics_form.incentives_helper')",
  'Data Management & Confidentiality': "tr('ethics_form.data_management')",
  'Data Collection Methods *': "tr('ethics_form.data_collection_methods')",
  'Describe all methods of data collection (questionnaires, interviews, observations, etc.)':
    "tr('ethics_form.data_collection_methods_placeholder')",
  'Final versions of tools must be attached': "tr('ethics_form.data_collection_methods_helper')",
  'Anonymization Method *': "tr('ethics_form.anonymization_method')",
  'How will data be de-identified? (e.g., pseudonyms, ID codes, removal of identifiers)':
    "tr('ethics_form.anonymization_method_placeholder')",
  'Describe the specific anonymization process': "tr('ethics_form.anonymization_method_helper')",
  'Data Storage Location *': "tr('ethics_form.data_storage_location')",
  'Where will data be kept? (e.g., encrypted drives, locked cabinets, secure servers)':
    "tr('ethics_form.data_storage_location_placeholder')",
  'Be specific about physical and digital storage': "tr('ethics_form.data_storage_location_helper')",
  'Data Storage Security *': "tr('ethics_form.data_storage_security')",
  'Describe security measures (encryption, password protection, access controls)':
    "tr('ethics_form.data_storage_security_placeholder')",
  'Explain how data will be protected from unauthorized access': "tr('ethics_form.data_storage_security_helper')",
  'Data Retention Period *': "tr('ethics_form.data_retention_period')",
  'e.g., 5 years after publication': "tr('ethics_form.data_retention_period_placeholder')",
  'Follow institutional or funder requirements': "tr('ethics_form.data_retention_period_helper')",
  'Data Disposal Protocol *': "tr('ethics_form.data_disposal_protocol')",
  'Describe protocols for the eventual destruction of sensitive records':
    "tr('ethics_form.data_disposal_protocol_placeholder')",
  'Include methods for secure deletion/destruction': "tr('ethics_form.data_disposal_protocol_helper')",
  'Confidentiality Measures *': "tr('ethics_form.confidentiality_measures')",
  'Describe all measures to protect participant confidentiality and privacy':
    "tr('ethics_form.confidentiality_measures_placeholder')",
  'Risk Identification & Mitigation': "tr('ethics_form.risk_identification')",
  'Physical Risks *': "tr('ethics_form.physical_risks')",
  "Identify any potential physical risks to participants. State 'None' if no physical risks.":
    "tr('ethics_form.physical_risks_placeholder')",
  'Include discomfort, injury, or health impacts': "tr('ethics_form.physical_risks_helper')",
  'Psychological Risks *': "tr('ethics_form.psychological_risks')",
  "Identify any potential psychological risks (stress, anxiety, emotional distress). State 'None' if no psychological risks.":
    "tr('ethics_form.psychological_risks_placeholder')",
  'Consider sensitive topics or traumatic experiences': "tr('ethics_form.psychological_risks_helper')",
  'Social Risks *': "tr('ethics_form.social_risks')",
  "Identify any potential social risks (stigma, discrimination, relationship impacts). State 'None' if no social risks.":
    "tr('ethics_form.social_risks_placeholder')",
  'Legal Risks *': "tr('ethics_form.legal_risks')",
  "Identify any potential legal risks. State 'None' if no legal risks.":
    "tr('ethics_form.legal_risks_placeholder')",
  'Economic Risks *': "tr('ethics_form.economic_risks')",
  "Identify any potential economic risks (job loss, financial burden). State 'None' if no economic risks.":
    "tr('ethics_form.economic_risks_placeholder')",
  'Risk Mitigation Strategies *': "tr('ethics_form.risk_mitigation')",
  'Describe specific steps to minimize ALL identified risks (e.g., providing counselor contact info for sensitive topics, monitoring procedures, stopping criteria)':
    "tr('ethics_form.risk_mitigation_placeholder')",
  'Address each type of risk identified above': "tr('ethics_form.risk_mitigation_helper')",
  'Benefits Analysis': "tr('ethics_form.benefits_analysis')",
  'Direct Benefits to Participants *': "tr('ethics_form.direct_benefits')",
  "What direct benefits will participants receive? State 'None' if no direct benefits.":
    "tr('ethics_form.direct_benefits_placeholder')",
  'Be realistic - not all research provides direct benefits': "tr('ethics_form.direct_benefits_helper')",
  'Indirect Benefits (Science/Society) *': "tr('ethics_form.indirect_benefits')",
  'What are the potential benefits to science or society?': "tr('ethics_form.indirect_benefits_placeholder')",
  'Explain the broader impact of the research': "tr('ethics_form.indirect_benefits_helper')",
  'Risk-Benefit Analysis *': "tr('ethics_form.risk_benefit_analysis')",
  'Explain why the benefits outweigh the risks. Justify why this research should proceed despite the risks.':
    "tr('ethics_form.risk_benefit_analysis_placeholder')",
  'Provide a balanced assessment': "tr('ethics_form.risk_benefit_analysis_helper')",
  'Conflict of Interest Disclosure *': "tr('ethics_form.conflict_of_interest')",
  'No conflict of interest': "tr('ethics_form.no_conflict')",
  'Conflict of interest exists': "tr('ethics_form.conflict_exists')",
  'Conflict of Interest Details *': "tr('ethics_form.conflict_details')",
  'Disclose any financial or personal interests that could influence the research':
    "tr('ethics_form.conflict_details_placeholder')",
  'Full transparency is required': "tr('ethics_form.conflict_details_helper')",
  'Previous Ethics Approval': "tr('ethics_form.previous_ethics_approval')",
  'No previous approval': "tr('ethics_form.no_previous_approval')",
  'Previously approved by another committee': "tr('ethics_form.previous_approval_yes')",
  'Previous Approval Details *': "tr('ethics_form.previous_approval_details')",
  'Provide reference number, institution, and date of previous approval':
    "tr('ethics_form.previous_approval_details_placeholder')",
  'Required Documentation Checklist': "tr('ethics_form.documentation_checklist')",
  'Check all documents that will be attached:': "tr('ethics_form.check_documents')",
  'Participant Information Sheet (PIS) *': "tr('ethics_form.pis_title')",
  'Explains the study in lay terms; includes contact details for PI and Ethics Committee':
    "tr('ethics_form.pis_desc')",
  'Consent Form *': "tr('ethics_form.consent_form')",
  'Formal document for participant signature (or verbal script/online version)':
    "tr('ethics_form.consent_form_desc')",
  'Research Protocol *': "tr('ethics_form.research_protocol')",
  'Full scientific plan including references and detailed timeline': "tr('ethics_form.research_protocol_desc')",
  'Recruitment Materials *': "tr('ethics_form.recruitment_materials_doc')",
  'Copies of all flyers, emails, social media posts, or scripts': "tr('ethics_form.recruitment_materials_doc_desc')",
  'Data Collection Tools *': "tr('ethics_form.data_collection_tools')",
  'Final versions of questionnaires, interview schedules, or observation checklists':
    "tr('ethics_form.data_collection_tools_desc')",
  'Letters of Support': "tr('ethics_form.letters_of_support')",
  'Permission from third-party organizations (schools, hospitals) if applicable':
    "tr('ethics_form.letters_of_support_desc')",
  'Investigator CVs *': "tr('ethics_form.investigator_cvs')",
  'Evidence of research team qualifications and experience': "tr('ethics_form.investigator_cvs_desc')",
  'Additional Comments': "tr('ethics_form.additional_comments')",
  'Any additional information or clarifications you would like to provide':
    "tr('ethics_form.additional_comments_placeholder')",
  'Review Your Application': "tr('ethics_form.review_application')",
  'Please review all information carefully before submitting. You can save as draft and return later if needed.':
    "tr('ethics_form.review_alert')",
  'Research Team': "tr('ethics_form.research_team')",
  'Participants & Ethics': "tr('ethics_form.participants_ethics')",
  'Title:': "tr('ethics_form.review_title')",
  'Research Type:': "tr('ethics_form.review_research_type')",
  'Duration:': "tr('ethics_form.review_duration')",
  'Sample Size:': "tr('ethics_form.review_sample_size')",
  'Principal Investigator:': "tr('ethics_form.review_pi')",
  'ORCID:': "tr('ethics_form.review_orcid')",
  'Institution:': "tr('ethics_form.review_institution')",
  'Co-Investigators:': "tr('ethics_form.review_co_investigators')",
  'Vulnerable Populations:': "tr('ethics_form.review_vulnerable')",
  'Conflict of Interest:': "tr('ethics_form.review_conflict')",
  'Previous Approval:': "tr('ethics_form.review_previous_approval')",
  'Documentation Checklist': "tr('ethics_form.documentation_checklist_review')",
  'Clinical Trial': "tr('ethics_form.research_type_clinical_trial')",
  'Observational Study': "tr('ethics_form.research_type_observational')",
  'Survey Research': "tr('ethics_form.research_type_survey')",
  'Interview Study': "tr('ethics_form.research_type_interview')",
  'Laboratory Research': "tr('ethics_form.research_type_laboratory')",
  'Secondary Data Analysis': "tr('ethics_form.research_type_secondary')",
  'Community-Based Research': "tr('ethics_form.research_type_community')",
  Other: "tr('ethics_form.research_type_other_option')",
  'Children (under 18)': "tr('ethics_form.vuln_children')",
  'Pregnant Women': "tr('ethics_form.vuln_pregnant')",
  Prisoners: "tr('ethics_form.vuln_prisoners')",
  'Mentally Disabled Persons': "tr('ethics_form.vuln_mental')",
  'Economically Disadvantaged': "tr('ethics_form.vuln_economic')",
  'Educationally Disadvantaged': "tr('ethics_form.vuln_education')",
  None: "tr('common.none')",
  'No conflict of interest': "tr('ethics_form.no_conflict')",
  'Conflict of interest exists': "tr('ethics_form.conflict_exists')",
  'No previous approval': "tr('ethics_form.no_previous_approval')",
  'Previously approved by another committee': "tr('ethics_form.previous_approval_yes')",
};

const entries = Object.entries(fieldMap).sort((a, b) => b[0].length - a[0].length);

for (const [en, expr] of entries) {
  src = src.split(`label="${en}"`).join(`label={${expr}}`);
  src = src.split(`placeholder="${en}"`).join(`placeholder={${expr}}`);
  src = src.split(`helperText="${en}"`).join(`helperText={${expr}}`);
  src = src.split(`label="${en}"`).join(`label={${expr}}`);
  src = src.split(`label={population}`).join(`label={tr('ethics_form.vuln_' + population.toLowerCase().replace(/[^a-z]+/g, '_'))}`);
}

// Vulnerable populations - manual fix
const vulnMap = {
  'Children (under 18)': 'vuln_children',
  'Pregnant Women': 'vuln_pregnant',
  Prisoners: 'vuln_prisoners',
  'Mentally Disabled Persons': 'vuln_mental',
  'Economically Disadvantaged': 'vuln_economic',
  'Educationally Disadvantaged': 'vuln_education',
  None: 'common.none',
};
for (const [pop, key] of Object.entries(vulnMap)) {
  src = src.replace(
    new RegExp(`\\['${pop.replace(/[()]/g, '\\$&')}'(,|\\])`, 'g'),
    (m) => m.replace(pop, key.startsWith('common') ? `'${pop}'` : `'${key}'`)
  );
}

// Research types array
src = src.replace(
  `['Clinical Trial', 'Observational Study', 'Survey Research', 'Interview Study', 'Laboratory Research', 'Secondary Data Analysis', 'Community-Based Research', 'Other'].map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))`,
  `[
              'research_type_clinical_trial',
              'research_type_observational',
              'research_type_survey',
              'research_type_interview',
              'research_type_laboratory',
              'research_type_secondary',
              'research_type_community',
              'research_type_other_option',
            ].map((typeKey) => {
              const typeLabel = tr('ethics_form.' + typeKey);
              return (
                <MenuItem key={typeKey} value={typeLabel}>{typeLabel}</MenuItem>
              );
            })`
);

// Vulnerable populations checkbox labels
src = src.replace(
  `['Children (under 18)', 'Pregnant Women', 'Prisoners', 'Mentally Disabled Persons', 'Economically Disadvantaged', 'Educationally Disadvantaged', 'None'].map((population) => (
              <FormControlLabel
                key={population}
                control={
                  <Checkbox
                    checked={formData.vulnerablePopulations.includes(population)}
                    onChange={handleVulnerablePopChange(population)}
                    sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                  />
                }
                label={population}
              />
            ))`,
  `[
              { key: 'vuln_children', value: 'Children (under 18)' },
              { key: 'vuln_pregnant', value: 'Pregnant Women' },
              { key: 'vuln_prisoners', value: 'Prisoners' },
              { key: 'vuln_mental', value: 'Mentally Disabled Persons' },
              { key: 'vuln_economic', value: 'Economically Disadvantaged' },
              { key: 'vuln_education', value: 'Educationally Disadvantaged' },
              { key: 'common.none', value: 'None' },
            ].map(({ key, value }) => (
              <FormControlLabel
                key={value}
                control={
                  <Checkbox
                    checked={formData.vulnerablePopulations.includes(value)}
                    onChange={handleVulnerablePopChange(value)}
                    sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                  />
                }
                label={key.startsWith('common.') ? tr(key) : tr('ethics_form.' + key)}
              />
            ))`
);

// Chip label
src = src.replace(
  'label={`${ci.name} - ${ci.role} (ORCID: ${ci.orcid || \'N/A\'})`}',
  "label={tr('ethics_form.co_investigator_chip', { name: ci.name, role: ci.role, orcid: ci.orcid || tr('common.not_available') })}"
);

// Review section strings
src = src.replace(
  '<Typography><strong>Title:</strong> {formData.title}</Typography>',
  '<Typography><strong>{tr(\'ethics_form.review_title\')}</strong> {formData.title}</Typography>'
);
src = src.replace(
  '<Typography><strong>Research Type:</strong> {formData.researchType}</Typography>',
  '<Typography><strong>{tr(\'ethics_form.review_research_type\')}</strong> {formData.researchType}</Typography>'
);
src = src.replace(
  '<Typography><strong>Duration:</strong> {formData.studyDuration} months</Typography>',
  '<Typography><strong>{tr(\'ethics_form.review_duration\')}</strong> {formData.studyDuration}{tr(\'ethics_form.months_suffix\')}</Typography>'
);
src = src.replace(
  '<Typography><strong>Sample Size:</strong> {formData.sampleSize}</Typography>',
  '<Typography><strong>{tr(\'ethics_form.review_sample_size\')}</strong> {formData.sampleSize}</Typography>'
);
src = src.replace(
  '<Typography><strong>Principal Investigator:</strong> {formData.principalInvestigator}</Typography>',
  '<Typography><strong>{tr(\'ethics_form.review_pi\')}</strong> {formData.principalInvestigator}</Typography>'
);
src = src.replace(
  '<Typography><strong>ORCID:</strong> {formData.piOrcid}</Typography>',
  '<Typography><strong>{tr(\'ethics_form.review_orcid\')}</strong> {formData.piOrcid}</Typography>'
);
src = src.replace(
  '<Typography><strong>Institution:</strong> {formData.piInstitution}</Typography>',
  '<Typography><strong>{tr(\'ethics_form.review_institution\')}</strong> {formData.piInstitution}</Typography>'
);
src = src.replace(
  '<Typography><strong>Co-Investigators:</strong> {formData.coInvestigators.length}</Typography>',
  '<Typography><strong>{tr(\'ethics_form.review_co_investigators\')}</strong> {formData.coInvestigators.length}</Typography>'
);
src = src.replace(
  "<Typography><strong>Vulnerable Populations:</strong> {formData.vulnerablePopulations.join(', ') || 'None'}</Typography>",
  "<Typography><strong>{tr('ethics_form.review_vulnerable')}</strong> {formData.vulnerablePopulations.join(', ') || tr('common.none')}</Typography>"
);
src = src.replace(
  "<Typography><strong>Conflict of Interest:</strong> {formData.conflictOfInterest ? 'Yes - Disclosed' : 'No'}</Typography>",
  "<Typography><strong>{tr('ethics_form.review_conflict')}</strong> {formData.conflictOfInterest ? tr('ethics_form.yes_disclosed') : tr('common.no')}</Typography>"
);
src = src.replace(
  "<Typography><strong>Previous Approval:</strong> {formData.previousEthicsApproval ? 'Yes' : 'No'}</Typography>",
  "<Typography><strong>{tr('ethics_form.review_previous_approval')}</strong> {formData.previousEthicsApproval ? tr('common.yes') : tr('common.no')}</Typography>"
);

const docChecks = [
  ['Participant Information Sheet', 'participantInfoSheet', 'review_pis'],
  ['Consent Form', 'consentFormAttached', 'review_consent'],
  ['Research Protocol', 'researchProtocol', 'review_protocol'],
  ['Recruitment Materials', 'recruitmentMaterialsAttached', 'review_recruitment'],
  ['Data Collection Tools', 'dataCollectionTools', 'review_data_tools'],
  ['Investigator CVs', 'investigatorCVs', 'review_cvs'],
];
for (const [label, field, key] of docChecks) {
  src = src.replace(
    `<Typography>✓ ${label}: {formData.${field} ? 'Attached' : 'Not attached'}</Typography>`,
    `<Typography>✓ {tr('ethics_form.${key}')}: {formData.${field} ? tr('ethics_form.attached') : tr('ethics_form.not_attached')}</Typography>`
  );
}

fs.writeFileSync(formPath, src);
console.log('Updated comprehensive-form.js');
