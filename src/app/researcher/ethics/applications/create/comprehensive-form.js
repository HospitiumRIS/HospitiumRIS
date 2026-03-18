// Comprehensive Ethics Application Form Steps
// This file contains the complete renderStepContent function

export const renderStepContent = (step, formData, handleChange, handleVulnerablePopChange, coInvestigator, setCoInvestigator, addCoInvestigator, removeCoInvestigator) => {
  const { Box, Typography, TextField, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Checkbox, Divider, Chip, Button, Alert } = require('@mui/material');
  const { AddIcon } = require('@mui/icons-material');

  switch (step) {
    // Step 0: Project Overview (Lay Summary)
    case 0:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Project Summary (Lay Summary):</strong> Provide a brief overview in plain language for non-expert audiences.
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            Project Overview
          </Typography>
          
          <TextField
            label="Study Title *"
            fullWidth
            required
            value={formData.title}
            onChange={handleChange('title')}
            placeholder="Enter the full title of your research study"
            helperText="Use clear, descriptive language"
          />

          <TextField
            label="Lay Summary (Plain Language) *"
            multiline
            rows={5}
            required
            value={formData.laySummary}
            onChange={handleChange('laySummary')}
            placeholder="Explain your research in simple terms that anyone can understand. Avoid jargon and technical language."
            helperText="Write for a general audience without specialized knowledge"
          />

          <TextField
            label="Research Aims *"
            multiline
            rows={4}
            required
            value={formData.researchAims}
            onChange={handleChange('researchAims')}
            placeholder="What does this research intend to achieve? What questions will it answer?"
            helperText="Clearly state the main objectives"
          />

          <TextField
            label="Research Significance *"
            multiline
            rows={4}
            required
            value={formData.researchSignificance}
            onChange={handleChange('researchSignificance')}
            placeholder="Why is this research important? What are the potential benefits to participants, science, or society?"
            helperText="Explain the value and impact of this research"
          />
        </Box>
      );

    // Step 1: Research Team (with ORCID)
    case 1:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Investigator CVs Required:</strong> Evidence of research team qualifications and experience must be provided.
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            Principal Investigator
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Full Name *"
              required
              value={formData.principalInvestigator}
              onChange={handleChange('principalInvestigator')}
              sx={{ flex: '1 1 300px' }}
            />
            <TextField
              label="ORCID iD *"
              required
              value={formData.piOrcid}
              onChange={handleChange('piOrcid')}
              placeholder="0000-0000-0000-0000"
              sx={{ flex: '1 1 250px' }}
              helperText="Enter your ORCID identifier"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Email *"
              type="email"
              required
              value={formData.piEmail}
              onChange={handleChange('piEmail')}
              sx={{ flex: '1 1 300px' }}
            />
            <TextField
              label="Phone Number *"
              required
              value={formData.piPhone}
              onChange={handleChange('piPhone')}
              sx={{ flex: '1 1 250px' }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Institution *"
              required
              value={formData.piInstitution}
              onChange={handleChange('piInstitution')}
              sx={{ flex: '1 1 300px' }}
            />
            <TextField
              label="Department *"
              required
              value={formData.piDepartment}
              onChange={handleChange('piDepartment')}
              sx={{ flex: '1 1 300px' }}
            />
          </Box>

          <TextField
            label="Qualifications & Experience *"
            multiline
            rows={3}
            required
            value={formData.piQualifications}
            onChange={handleChange('piQualifications')}
            placeholder="Briefly describe your relevant qualifications and research experience"
            helperText="Include degrees, certifications, and relevant experience"
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ color: '#2D3748', fontWeight: 600 }}>
            Co-Investigators
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <TextField
              label="Name"
              value={coInvestigator.name}
              onChange={(e) => setCoInvestigator(prev => ({ ...prev, name: e.target.value }))}
              sx={{ flex: '1 1 200px' }}
              size="small"
            />
            <TextField
              label="ORCID iD"
              value={coInvestigator.orcid}
              onChange={(e) => setCoInvestigator(prev => ({ ...prev, orcid: e.target.value }))}
              placeholder="0000-0000-0000-0000"
              sx={{ flex: '1 1 180px' }}
              size="small"
            />
            <TextField
              label="Email"
              type="email"
              value={coInvestigator.email}
              onChange={(e) => setCoInvestigator(prev => ({ ...prev, email: e.target.value }))}
              sx={{ flex: '1 1 200px' }}
              size="small"
            />
            <TextField
              label="Role"
              value={coInvestigator.role}
              onChange={(e) => setCoInvestigator(prev => ({ ...prev, role: e.target.value }))}
              sx={{ flex: '1 1 150px' }}
              size="small"
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addCoInvestigator}
              sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', height: 40 }}
            >
              Add
            </Button>
          </Box>

          {formData.coInvestigators.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {formData.coInvestigators.map((ci, index) => (
                <Chip
                  key={index}
                  label={`${ci.name} - ${ci.role} (ORCID: ${ci.orcid || 'N/A'})`}
                  onDelete={() => removeCoInvestigator(index)}
                  sx={{ bgcolor: 'rgba(139, 108, 188, 0.1)' }}
                />
              ))}
            </Box>
          )}
        </Box>
      );

    // Step 2: Research Design & Methodology
    case 2:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Scientific Validity:</strong> Demonstrate that your study design can answer the research question.
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            Research Design & Methodology
          </Typography>

          <TextField
            select
            label="Research Type *"
            required
            value={formData.researchType}
            onChange={handleChange('researchType')}
          >
            {['Clinical Trial', 'Observational Study', 'Survey Research', 'Interview Study', 'Laboratory Research', 'Secondary Data Analysis', 'Community-Based Research', 'Other'].map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>

          {formData.researchType === 'Other' && (
            <TextField
              label="Please specify research type *"
              required
              value={formData.researchTypeOther}
              onChange={handleChange('researchTypeOther')}
            />
          )}

          <TextField
            label="Scientific Validity *"
            multiline
            rows={4}
            required
            value={formData.scientificValidity}
            onChange={handleChange('scientificValidity')}
            placeholder="Explain how your research design ensures the study can answer the research question"
            helperText="Justify your methodology and approach"
          />

          <TextField
            label="Research Procedures *"
            multiline
            rows={5}
            required
            value={formData.researchProcedures}
            onChange={handleChange('researchProcedures')}
            placeholder="Provide a step-by-step account of what participants will be asked to do (e.g., interviews, surveys, clinical tests, observations)"
            helperText="Be specific about all procedures involving participants"
          />

          <TextField
            label="Data Analysis Plan *"
            multiline
            rows={4}
            required
            value={formData.dataAnalysisPlan}
            onChange={handleChange('dataAnalysisPlan')}
            placeholder="Describe how the collected information will be processed and interpreted"
            helperText="Include statistical methods or qualitative analysis approaches"
          />

          <TextField
            label="Research Timeline *"
            multiline
            rows={3}
            required
            value={formData.timeline}
            onChange={handleChange('timeline')}
            placeholder="Provide a detailed timeline for your research activities"
            helperText="Include key milestones and phases"
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Study Duration (months) *"
              type="number"
              required
              value={formData.studyDuration}
              onChange={handleChange('studyDuration')}
              sx={{ flex: '1 1 150px' }}
            />
            <TextField
              label="Start Date *"
              type="date"
              required
              value={formData.startDate}
              onChange={handleChange('startDate')}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label="End Date *"
              type="date"
              required
              value={formData.endDate}
              onChange={handleChange('endDate')}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 200px' }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Funding Source"
              value={formData.fundingSource}
              onChange={handleChange('fundingSource')}
              sx={{ flex: '1 1 300px' }}
              helperText="Leave blank if unfunded"
            />
            <TextField
              label="Funding Amount"
              value={formData.fundingAmount}
              onChange={handleChange('fundingAmount')}
              sx={{ flex: '1 1 200px' }}
            />
          </Box>
        </Box>
      );

    // Step 3: Participants & Recruitment
    case 3:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Important:</strong> Clearly define who can participate and justify inclusion of vulnerable groups.
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            Participant Recruitment & Selection
          </Typography>

          <TextField
            label="Study Population *"
            multiline
            rows={3}
            required
            value={formData.studyPopulation}
            onChange={handleChange('studyPopulation')}
            placeholder="Describe the target population for your study"
            helperText="Be specific about demographics and characteristics"
          />

          <TextField
            label="Sample Size *"
            type="number"
            required
            value={formData.sampleSize}
            onChange={handleChange('sampleSize')}
            helperText="Justify your sample size if possible"
          />

          <TextField
            label="Inclusion Criteria *"
            multiline
            rows={4}
            required
            value={formData.inclusionCriteria}
            onChange={handleChange('inclusionCriteria')}
            placeholder="Clearly defined parameters for who CAN participate in this study"
            helperText="List all criteria that participants must meet"
          />

          <TextField
            label="Exclusion Criteria *"
            multiline
            rows={4}
            required
            value={formData.exclusionCriteria}
            onChange={handleChange('exclusionCriteria')}
            placeholder="Clearly defined parameters for who CANNOT participate in this study"
            helperText="List all criteria that would exclude participants"
          />

          <TextField
            label="Recruitment Strategy *"
            multiline
            rows={4}
            required
            value={formData.recruitmentStrategy}
            onChange={handleChange('recruitmentStrategy')}
            placeholder="How will participants be identified and approached? (e.g., flyers, social media, database screening, direct contact)"
            helperText="Describe all recruitment methods in detail"
          />

          <TextField
            label="Recruitment Materials Description *"
            multiline
            rows={3}
            required
            value={formData.recruitmentMaterials}
            onChange={handleChange('recruitmentMaterials')}
            placeholder="Describe all flyers, emails, social media posts, or scripts that will be used to find participants"
            helperText="Copies of actual materials must be attached"
          />

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
              Vulnerable Populations Involved *
            </FormLabel>
            {['Children (under 18)', 'Pregnant Women', 'Prisoners', 'Mentally Disabled Persons', 'Economically Disadvantaged', 'Educationally Disadvantaged', 'None'].map((population) => (
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
            ))}
          </FormControl>

          {formData.vulnerablePopulations.length > 0 && !formData.vulnerablePopulations.includes('None') && (
            <TextField
              label="Vulnerable Group Justification *"
              multiline
              rows={4}
              required
              value={formData.vulnerableGroupJustification}
              onChange={handleChange('vulnerableGroupJustification')}
              placeholder="Provide specific justification for including vulnerable populations in your study"
              helperText="Explain why this group must be included and how they will be protected"
            />
          )}

          <TextField
            label="Power Imbalance Considerations"
            multiline
            rows={4}
            value={formData.powerImbalanceConsiderations}
            onChange={handleChange('powerImbalanceConsiderations')}
            placeholder="If you have a relationship with participants (e.g., teacher/student, employer/employee), explain how you will prevent coercion"
            helperText="Address any dependent relationships that might affect voluntary participation"
          />

          <TextField
            label="Third-Party Permissions"
            multiline
            rows={3}
            value={formData.thirdPartyPermissions}
            onChange={handleChange('thirdPartyPermissions')}
            placeholder="List any permissions needed from schools, hospitals, or other organizations"
            helperText="Letters of support must be attached"
          />
        </Box>
      );

    // Step 4: Ethical Considerations
    case 4:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Informed Consent:</strong> Demonstrate that participants can make a truly voluntary and informed decision.
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            Informed Consent Process
          </Typography>

          <TextField
            label="Informed Consent Process *"
            multiline
            rows={5}
            required
            value={formData.informedConsentProcess}
            onChange={handleChange('informedConsentProcess')}
            placeholder="Describe HOW and WHEN consent will be sought. Ensure participants have adequate time to decide."
            helperText="Include details about the consent procedure and timing"
          />

          <TextField
            label="Capacity Assessment *"
            multiline
            rows={3}
            required
            value={formData.consentCapacityAssessment}
            onChange={handleChange('consentCapacityAssessment')}
            placeholder="How will you assess if the participant understands the information provided?"
            helperText="Describe methods to ensure comprehension"
          />

          <TextField
            label="Voluntary Participation Statement *"
            multiline
            rows={3}
            required
            value={formData.voluntaryParticipation}
            onChange={handleChange('voluntaryParticipation')}
            placeholder="Confirm that participation is completely voluntary and participants can withdraw at any time without penalty"
            helperText="Explain how this will be communicated"
          />

          <TextField
            label="Withdrawal Process *"
            multiline
            rows={3}
            required
            value={formData.withdrawalProcess}
            onChange={handleChange('withdrawalProcess')}
            placeholder="Describe the process for participants to withdraw from the study"
            helperText="Include what happens to their data if they withdraw"
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ color: '#2D3748', fontWeight: 600 }}>
            Participant Costs & Compensation
          </Typography>

          <TextField
            label="Participant Costs *"
            multiline
            rows={2}
            required
            value={formData.participantCosts}
            onChange={handleChange('participantCosts')}
            placeholder="Will participants incur any costs (e.g., travel, parking, time off work)? State 'None' if no costs."
            helperText="Be transparent about any costs to participants"
          />

          <TextField
            label="Reimbursement"
            multiline
            rows={2}
            value={formData.participantReimbursement}
            onChange={handleChange('participantReimbursement')}
            placeholder="Will participants be reimbursed for costs? Describe the reimbursement process."
          />

          <TextField
            label="Incentives"
            multiline
            rows={2}
            value={formData.participantIncentives}
            onChange={handleChange('participantIncentives')}
            placeholder="Will participants receive any incentives (e.g., gift cards, payment)? Describe amount and justification."
            helperText="Ensure incentives are not coercive"
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ color: '#2D3748', fontWeight: 600 }}>
            Data Management & Confidentiality
          </Typography>

          <TextField
            label="Data Collection Methods *"
            multiline
            rows={3}
            required
            value={formData.dataCollectionMethods}
            onChange={handleChange('dataCollectionMethods')}
            placeholder="Describe all methods of data collection (questionnaires, interviews, observations, etc.)"
            helperText="Final versions of tools must be attached"
          />

          <TextField
            label="Anonymization Method *"
            multiline
            rows={3}
            required
            value={formData.anonymizationMethod}
            onChange={handleChange('anonymizationMethod')}
            placeholder="How will data be de-identified? (e.g., pseudonyms, ID codes, removal of identifiers)"
            helperText="Describe the specific anonymization process"
          />

          <TextField
            label="Data Storage Location *"
            required
            value={formData.dataStorageLocation}
            onChange={handleChange('dataStorageLocation')}
            placeholder="Where will data be kept? (e.g., encrypted drives, locked cabinets, secure servers)"
            helperText="Be specific about physical and digital storage"
          />

          <TextField
            label="Data Storage Security *"
            multiline
            rows={3}
            required
            value={formData.dataStorageSecurity}
            onChange={handleChange('dataStorageSecurity')}
            placeholder="Describe security measures (encryption, password protection, access controls)"
            helperText="Explain how data will be protected from unauthorized access"
          />

          <TextField
            label="Data Retention Period *"
            required
            value={formData.dataRetentionPeriod}
            onChange={handleChange('dataRetentionPeriod')}
            placeholder="e.g., 5 years after publication"
            helperText="Follow institutional or funder requirements"
          />

          <TextField
            label="Data Disposal Protocol *"
            multiline
            rows={3}
            required
            value={formData.dataDisposalProtocol}
            onChange={handleChange('dataDisposalProtocol')}
            placeholder="Describe protocols for the eventual destruction of sensitive records"
            helperText="Include methods for secure deletion/destruction"
          />

          <TextField
            label="Confidentiality Measures *"
            multiline
            rows={4}
            required
            value={formData.confidentialityMeasures}
            onChange={handleChange('confidentialityMeasures')}
            placeholder="Describe all measures to protect participant confidentiality and privacy"
          />
        </Box>
      );

    // Step 5: Risk Management
    case 5:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Risk-Benefit Analysis:</strong> Demonstrate that benefits outweigh risks and risks are minimized.
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            Risk Identification & Mitigation
          </Typography>

          <TextField
            label="Physical Risks *"
            multiline
            rows={3}
            required
            value={formData.physicalRisks}
            onChange={handleChange('physicalRisks')}
            placeholder="Identify any potential physical risks to participants. State 'None' if no physical risks."
            helperText="Include discomfort, injury, or health impacts"
          />

          <TextField
            label="Psychological Risks *"
            multiline
            rows={3}
            required
            value={formData.psychologicalRisks}
            onChange={handleChange('psychologicalRisks')}
            placeholder="Identify any potential psychological risks (stress, anxiety, emotional distress). State 'None' if no psychological risks."
            helperText="Consider sensitive topics or traumatic experiences"
          />

          <TextField
            label="Social Risks *"
            multiline
            rows={3}
            required
            value={formData.socialRisks}
            onChange={handleChange('socialRisks')}
            placeholder="Identify any potential social risks (stigma, discrimination, relationship impacts). State 'None' if no social risks."
          />

          <TextField
            label="Legal Risks *"
            multiline
            rows={2}
            required
            value={formData.legalRisks}
            onChange={handleChange('legalRisks')}
            placeholder="Identify any potential legal risks. State 'None' if no legal risks."
          />

          <TextField
            label="Economic Risks *"
            multiline
            rows={2}
            required
            value={formData.economicRisks}
            onChange={handleChange('economicRisks')}
            placeholder="Identify any potential economic risks (job loss, financial burden). State 'None' if no economic risks."
          />

          <TextField
            label="Risk Mitigation Strategies *"
            multiline
            rows={5}
            required
            value={formData.riskMitigationStrategies}
            onChange={handleChange('riskMitigationStrategies')}
            placeholder="Describe specific steps to minimize ALL identified risks (e.g., providing counselor contact info for sensitive topics, monitoring procedures, stopping criteria)"
            helperText="Address each type of risk identified above"
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ color: '#2D3748', fontWeight: 600 }}>
            Benefits Analysis
          </Typography>

          <TextField
            label="Direct Benefits to Participants *"
            multiline
            rows={3}
            required
            value={formData.directBenefits}
            onChange={handleChange('directBenefits')}
            placeholder="What direct benefits will participants receive? State 'None' if no direct benefits."
            helperText="Be realistic - not all research provides direct benefits"
          />

          <TextField
            label="Indirect Benefits (Science/Society) *"
            multiline
            rows={3}
            required
            value={formData.indirectBenefits}
            onChange={handleChange('indirectBenefits')}
            placeholder="What are the potential benefits to science or society?"
            helperText="Explain the broader impact of the research"
          />

          <TextField
            label="Risk-Benefit Analysis *"
            multiline
            rows={5}
            required
            value={formData.riskBenefitAnalysis}
            onChange={handleChange('riskBenefitAnalysis')}
            placeholder="Explain why the benefits outweigh the risks. Justify why this research should proceed despite the risks."
            helperText="Provide a balanced assessment"
          />

          <Divider sx={{ my: 2 }} />

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600 }}>
              Conflict of Interest Disclosure *
            </FormLabel>
            <RadioGroup
              value={formData.conflictOfInterest.toString()}
              onChange={(e) => handleChange('conflictOfInterest')({ target: { type: 'checkbox', checked: e.target.value === 'true' } })}
            >
              <FormControlLabel value="false" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label="No conflict of interest" />
              <FormControlLabel value="true" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label="Conflict of interest exists" />
            </RadioGroup>
          </FormControl>

          {formData.conflictOfInterest && (
            <TextField
              label="Conflict of Interest Details *"
              multiline
              rows={4}
              required
              value={formData.conflictDetails}
              onChange={handleChange('conflictDetails')}
              placeholder="Disclose any financial or personal interests that could influence the research"
              helperText="Full transparency is required"
            />
          )}

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600 }}>
              Previous Ethics Approval
            </FormLabel>
            <RadioGroup
              value={formData.previousEthicsApproval.toString()}
              onChange={(e) => handleChange('previousEthicsApproval')({ target: { type: 'checkbox', checked: e.target.value === 'true' } })}
            >
              <FormControlLabel value="false" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label="No previous approval" />
              <FormControlLabel value="true" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label="Previously approved by another committee" />
            </RadioGroup>
          </FormControl>

          {formData.previousEthicsApproval && (
            <TextField
              label="Previous Approval Details *"
              multiline
              rows={3}
              required
              value={formData.previousApprovalDetails}
              onChange={handleChange('previousApprovalDetails')}
              placeholder="Provide reference number, institution, and date of previous approval"
            />
          )}
        </Box>
      );

    // Step 6: Documentation Checklist
    case 6:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Mandatory Documentation:</strong> All checked items must be attached to your application.
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 2 }}>
            Required Documentation Checklist
          </Typography>

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600, mb: 2 }}>
              Check all documents that will be attached:
            </FormLabel>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.participantInfoSheet}
                  onChange={handleChange('participantInfoSheet')}
                  sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Participant Information Sheet (PIS) *
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Explains the study in lay terms; includes contact details for PI and Ethics Committee
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.consentFormAttached}
                  onChange={handleChange('consentFormAttached')}
                  sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Consent Form *
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Formal document for participant signature (or verbal script/online version)
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.researchProtocol}
                  onChange={handleChange('researchProtocol')}
                  sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Research Protocol *
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Full scientific plan including references and detailed timeline
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.recruitmentMaterialsAttached}
                  onChange={handleChange('recruitmentMaterialsAttached')}
                  sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Recruitment Materials *
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Copies of all flyers, emails, social media posts, or scripts
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.dataCollectionTools}
                  onChange={handleChange('dataCollectionTools')}
                  sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Data Collection Tools *
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Final versions of questionnaires, interview schedules, or observation checklists
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.lettersOfSupport}
                  onChange={handleChange('lettersOfSupport')}
                  sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Letters of Support
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Permission from third-party organizations (schools, hospitals) if applicable
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.investigatorCVs}
                  onChange={handleChange('investigatorCVs')}
                  sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Investigator CVs *
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#718096' }}>
                    Evidence of research team qualifications and experience
                  </Typography>
                </Box>
              }
            />
          </FormControl>

          <Divider sx={{ my: 2 }} />

          <TextField
            label="Additional Comments"
            multiline
            rows={4}
            value={formData.additionalComments}
            onChange={handleChange('additionalComments')}
            placeholder="Any additional information or clarifications you would like to provide"
          />

          <Alert severity="success">
            <Typography variant="body2">
              <strong>Consistency Check:</strong> Ensure the number of participants, study title, and procedures match across ALL submitted documents.
            </Typography>
          </Alert>
        </Box>
      );

    // Step 7: Review & Submit
    case 7:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 2 }}>
            Review Your Application
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Please review all information carefully before submitting. You can save as draft and return later if needed.
          </Alert>

          <Paper sx={{ p: 3, bgcolor: 'rgba(139, 108, 188, 0.02)', border: '1px solid rgba(139, 108, 188, 0.2)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2 }}>
              Project Overview
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>Title:</strong> {formData.title}</Typography>
              <Typography><strong>Research Type:</strong> {formData.researchType}</Typography>
              <Typography><strong>Duration:</strong> {formData.studyDuration} months</Typography>
              <Typography><strong>Sample Size:</strong> {formData.sampleSize}</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: 'rgba(139, 108, 188, 0.02)', border: '1px solid rgba(139, 108, 188, 0.2)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2 }}>
              Research Team
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>Principal Investigator:</strong> {formData.principalInvestigator}</Typography>
              <Typography><strong>ORCID:</strong> {formData.piOrcid}</Typography>
              <Typography><strong>Institution:</strong> {formData.piInstitution}</Typography>
              <Typography><strong>Co-Investigators:</strong> {formData.coInvestigators.length}</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: 'rgba(139, 108, 188, 0.02)', border: '1px solid rgba(139, 108, 188, 0.2)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2 }}>
              Participants & Ethics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>Vulnerable Populations:</strong> {formData.vulnerablePopulations.join(', ') || 'None'}</Typography>
              <Typography><strong>Conflict of Interest:</strong> {formData.conflictOfInterest ? 'Yes - Disclosed' : 'No'}</Typography>
              <Typography><strong>Previous Approval:</strong> {formData.previousEthicsApproval ? 'Yes' : 'No'}</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: 'rgba(139, 108, 188, 0.02)', border: '1px solid rgba(139, 108, 188, 0.2)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2 }}>
              Documentation Checklist
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography>✓ Participant Information Sheet: {formData.participantInfoSheet ? 'Attached' : 'Not attached'}</Typography>
              <Typography>✓ Consent Form: {formData.consentFormAttached ? 'Attached' : 'Not attached'}</Typography>
              <Typography>✓ Research Protocol: {formData.researchProtocol ? 'Attached' : 'Not attached'}</Typography>
              <Typography>✓ Recruitment Materials: {formData.recruitmentMaterialsAttached ? 'Attached' : 'Not attached'}</Typography>
              <Typography>✓ Data Collection Tools: {formData.dataCollectionTools ? 'Attached' : 'Not attached'}</Typography>
              <Typography>✓ Investigator CVs: {formData.investigatorCVs ? 'Attached' : 'Not attached'}</Typography>
            </Box>
          </Paper>

          <Alert severity="warning">
            <Typography variant="body2">
              <strong>Before submitting:</strong> Ensure all participant-facing documents use clear, everyday language without jargon. Verify consistency across all documents.
            </Typography>
          </Alert>
        </Box>
      );

    default:
      return null;
  }
};
