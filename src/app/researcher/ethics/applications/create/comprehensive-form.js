// Comprehensive Ethics Application Form Steps
// This file contains the complete renderStepContent function

export const renderStepContent = (step, formData, handleChange, handleVulnerablePopChange, coInvestigator, setCoInvestigator, addCoInvestigator, removeCoInvestigator, t) => {
  const tr = (key, opts) => (t ? t(key, opts) : key);
  const { Box, Typography, TextField, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Checkbox, Divider, Chip, Button, Alert } = require('@mui/material');
  const { AddIcon } = require('@mui/icons-material');

  switch (step) {
    // Step 0: Project Overview (Lay Summary)
    case 0:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {tr('ethics_form.project_summary_alert')}
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            {tr('ethics_form.project_overview')}
          </Typography>
          
          <TextField
            label={tr('ethics_form.study_title')}
            fullWidth
            required
            value={formData.title}
            onChange={handleChange('title')}
            placeholder={tr('ethics_form.study_title_placeholder')}
            helperText={tr('ethics_form.study_title_helper')}
          />

          <TextField
            label={tr('ethics_form.lay_summary')}
            multiline
            rows={5}
            required
            value={formData.laySummary}
            onChange={handleChange('laySummary')}
            placeholder={tr('ethics_form.lay_summary_placeholder')}
            helperText={tr('ethics_form.lay_summary_helper')}
          />

          <TextField
            label={tr('ethics_form.research_aims')}
            multiline
            rows={4}
            required
            value={formData.researchAims}
            onChange={handleChange('researchAims')}
            placeholder={tr('ethics_form.research_aims_placeholder')}
            helperText={tr('ethics_form.research_aims_helper')}
          />

          <TextField
            label={tr('ethics_form.research_significance')}
            multiline
            rows={4}
            required
            value={formData.researchSignificance}
            onChange={handleChange('researchSignificance')}
            placeholder={tr('ethics_form.research_significance_placeholder')}
            helperText={tr('ethics_form.research_significance_helper')}
          />
        </Box>
      );

    // Step 1: Research Team (with ORCID)
    case 1:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {tr('ethics_form.investigator_cvs_alert')}
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            {tr('ethics_form.principal_investigator')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label={tr('ethics_form.full_name')}
              required
              value={formData.principalInvestigator}
              onChange={handleChange('principalInvestigator')}
              sx={{ flex: '1 1 300px' }}
            />
            <TextField
              label={tr('ethics_form.orcid_id')}
              required
              value={formData.piOrcid}
              onChange={handleChange('piOrcid')}
              placeholder={tr('ethics_form.orcid_placeholder')}
              sx={{ flex: '1 1 250px' }}
              helperText={tr('ethics_form.orcid_helper')}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label={tr('ethics_form.email')}
              type="email"
              required
              value={formData.piEmail}
              onChange={handleChange('piEmail')}
              sx={{ flex: '1 1 300px' }}
            />
            <TextField
              label={tr('ethics_form.phone_number')}
              required
              value={formData.piPhone}
              onChange={handleChange('piPhone')}
              sx={{ flex: '1 1 250px' }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label={tr('ethics_form.institution')}
              required
              value={formData.piInstitution}
              onChange={handleChange('piInstitution')}
              sx={{ flex: '1 1 300px' }}
            />
            <TextField
              label={tr('ethics_form.department')}
              required
              value={formData.piDepartment}
              onChange={handleChange('piDepartment')}
              sx={{ flex: '1 1 300px' }}
            />
          </Box>

          <TextField
            label={tr('ethics_form.qualifications')}
            multiline
            rows={3}
            required
            value={formData.piQualifications}
            onChange={handleChange('piQualifications')}
            placeholder={tr('ethics_form.qualifications_placeholder')}
            helperText={tr('ethics_form.qualifications_helper')}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ color: '#2D3748', fontWeight: 600 }}>
            {tr('ethics_form.co_investigators')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <TextField
              label={tr('common.name')}
              value={coInvestigator.name}
              onChange={(e) => setCoInvestigator(prev => ({ ...prev, name: e.target.value }))}
              sx={{ flex: '1 1 200px' }}
              size="small"
            />
            <TextField
              label={tr('ethics_form.orcid_id_optional')}
              value={coInvestigator.orcid}
              onChange={(e) => setCoInvestigator(prev => ({ ...prev, orcid: e.target.value }))}
              placeholder={tr('ethics_form.orcid_placeholder')}
              sx={{ flex: '1 1 180px' }}
              size="small"
            />
            <TextField
              label={tr('common.email')}
              type="email"
              value={coInvestigator.email}
              onChange={(e) => setCoInvestigator(prev => ({ ...prev, email: e.target.value }))}
              sx={{ flex: '1 1 200px' }}
              size="small"
            />
            <TextField
              label={tr('ethics_form.role')}
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
                  label={tr('ethics_form.co_investigator_chip', { name: ci.name, role: ci.role, orcid: ci.orcid || tr('common.not_available') })}
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
            {tr('ethics_form.scientific_validity_alert')}
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            {tr('ethics_form.research_design')}
          </Typography>

          <TextField
            select
            label={tr('ethics_form.research_type')}
            required
            value={formData.researchType}
            onChange={handleChange('researchType')}
          >
            {[
              'research_type_clinical_trial',
              'research_type_observational',
              'research_type_survey',
              'research_type_interview',
              'research_type_laboratory',
              'research_type_secondary',
              'research_type_community',
              'research_type_other_option',
            ].map((typeKey) => {
              const typeLabel = tr(`ethics_form.${typeKey}`);
              return (
                <MenuItem key={typeKey} value={typeLabel}>{typeLabel}</MenuItem>
              );
            })}
          </TextField>

          {formData.researchType === tr('ethics_form.research_type_other_option') && (
            <TextField
              label={tr('ethics_form.research_type_other')}
              required
              value={formData.researchTypeOther}
              onChange={handleChange('researchTypeOther')}
            />
          )}

          <TextField
            label={tr('ethics_form.scientific_validity')}
            multiline
            rows={4}
            required
            value={formData.scientificValidity}
            onChange={handleChange('scientificValidity')}
            placeholder={tr('ethics_form.scientific_validity_placeholder')}
            helperText={tr('ethics_form.scientific_validity_helper')}
          />

          <TextField
            label={tr('ethics_form.research_procedures')}
            multiline
            rows={5}
            required
            value={formData.researchProcedures}
            onChange={handleChange('researchProcedures')}
            placeholder={tr('ethics_form.research_procedures_placeholder')}
            helperText={tr('ethics_form.research_procedures_helper')}
          />

          <TextField
            label={tr('ethics_form.data_analysis_plan')}
            multiline
            rows={4}
            required
            value={formData.dataAnalysisPlan}
            onChange={handleChange('dataAnalysisPlan')}
            placeholder={tr('ethics_form.data_analysis_plan_placeholder')}
            helperText={tr('ethics_form.data_analysis_plan_helper')}
          />

          <TextField
            label={tr('ethics_form.research_timeline')}
            multiline
            rows={3}
            required
            value={formData.timeline}
            onChange={handleChange('timeline')}
            placeholder={tr('ethics_form.research_timeline_placeholder')}
            helperText={tr('ethics_form.research_timeline_helper')}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label={tr('ethics_form.study_duration')}
              type="number"
              required
              value={formData.studyDuration}
              onChange={handleChange('studyDuration')}
              sx={{ flex: '1 1 150px' }}
            />
            <TextField
              label={tr('ethics_form.start_date')}
              type="date"
              required
              value={formData.startDate}
              onChange={handleChange('startDate')}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 200px' }}
            />
            <TextField
              label={tr('ethics_form.end_date')}
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
              label={tr('ethics_form.funding_source')}
              value={formData.fundingSource}
              onChange={handleChange('fundingSource')}
              sx={{ flex: '1 1 300px' }}
              helperText={tr('ethics_form.funding_source_helper')}
            />
            <TextField
              label={tr('ethics_form.funding_amount')}
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
            {tr('ethics_form.participants_alert')}
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            {tr('ethics_form.participant_recruitment')}
          </Typography>

          <TextField
            label={tr('ethics_form.study_population')}
            multiline
            rows={3}
            required
            value={formData.studyPopulation}
            onChange={handleChange('studyPopulation')}
            placeholder={tr('ethics_form.study_population_placeholder')}
            helperText={tr('ethics_form.study_population_helper')}
          />

          <TextField
            label={tr('ethics_form.sample_size')}
            type="number"
            required
            value={formData.sampleSize}
            onChange={handleChange('sampleSize')}
            helperText={tr('ethics_form.sample_size_helper')}
          />

          <TextField
            label={tr('ethics_form.inclusion_criteria')}
            multiline
            rows={4}
            required
            value={formData.inclusionCriteria}
            onChange={handleChange('inclusionCriteria')}
            placeholder={tr('ethics_form.inclusion_criteria_placeholder')}
            helperText={tr('ethics_form.inclusion_criteria_helper')}
          />

          <TextField
            label={tr('ethics_form.exclusion_criteria')}
            multiline
            rows={4}
            required
            value={formData.exclusionCriteria}
            onChange={handleChange('exclusionCriteria')}
            placeholder={tr('ethics_form.exclusion_criteria_placeholder')}
            helperText={tr('ethics_form.exclusion_criteria_helper')}
          />

          <TextField
            label={tr('ethics_form.recruitment_strategy')}
            multiline
            rows={4}
            required
            value={formData.recruitmentStrategy}
            onChange={handleChange('recruitmentStrategy')}
            placeholder={tr('ethics_form.recruitment_strategy_placeholder')}
            helperText={tr('ethics_form.recruitment_strategy_helper')}
          />

          <TextField
            label={tr('ethics_form.recruitment_materials')}
            multiline
            rows={3}
            required
            value={formData.recruitmentMaterials}
            onChange={handleChange('recruitmentMaterials')}
            placeholder={tr('ethics_form.recruitment_materials_placeholder')}
            helperText={tr('ethics_form.recruitment_materials_helper')}
          />

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
              {tr('ethics_form.vulnerable_populations')}
            </FormLabel>
            {[
              { key: 'vuln_children', value: 'Children (under 18)' },
              { key: 'vuln_pregnant', value: 'Pregnant Women' },
              { key: 'vuln_prisoners', value: 'Prisoners' },
              { key: 'vuln_mental', value: 'Mentally Disabled Persons' },
              { key: 'vuln_economic', value: 'Economically Disadvantaged' },
              { key: 'vuln_education', value: 'Educationally Disadvantaged' },
              { key: 'none', value: 'None' },
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
                label={key === 'none' ? tr('common.none') : tr(`ethics_form.${key}`)}
              />
            ))}
          </FormControl>

          {formData.vulnerablePopulations.length > 0 && !formData.vulnerablePopulations.includes('None') && (
            <TextField
              label={tr('ethics_form.vulnerable_group_justification')}
              multiline
              rows={4}
              required
              value={formData.vulnerableGroupJustification}
              onChange={handleChange('vulnerableGroupJustification')}
              placeholder={tr('ethics_form.vulnerable_group_justification_placeholder')}
              helperText={tr('ethics_form.vulnerable_group_justification_helper')}
            />
          )}

          <TextField
            label={tr('ethics_form.power_imbalance')}
            multiline
            rows={4}
            value={formData.powerImbalanceConsiderations}
            onChange={handleChange('powerImbalanceConsiderations')}
            placeholder={tr('ethics_form.power_imbalance_placeholder')}
            helperText={tr('ethics_form.power_imbalance_helper')}
          />

          <TextField
            label={tr('ethics_form.third_party_permissions')}
            multiline
            rows={3}
            value={formData.thirdPartyPermissions}
            onChange={handleChange('thirdPartyPermissions')}
            placeholder={tr('ethics_form.third_party_permissions_placeholder')}
            helperText={tr('ethics_form.third_party_permissions_helper')}
          />
        </Box>
      );

    // Step 4: Ethical Considerations
    case 4:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {tr('ethics_form.informed_consent_alert')}
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            {tr('ethics_form.informed_consent_process')}
          </Typography>

          <TextField
            label={tr('ethics_form.informed_consent_process_field')}
            multiline
            rows={5}
            required
            value={formData.informedConsentProcess}
            onChange={handleChange('informedConsentProcess')}
            placeholder={tr('ethics_form.informed_consent_process_placeholder')}
            helperText={tr('ethics_form.informed_consent_process_helper')}
          />

          <TextField
            label={tr('ethics_form.capacity_assessment')}
            multiline
            rows={3}
            required
            value={formData.consentCapacityAssessment}
            onChange={handleChange('consentCapacityAssessment')}
            placeholder={tr('ethics_form.capacity_assessment_placeholder')}
            helperText={tr('ethics_form.capacity_assessment_helper')}
          />

          <TextField
            label={tr('ethics_form.voluntary_participation')}
            multiline
            rows={3}
            required
            value={formData.voluntaryParticipation}
            onChange={handleChange('voluntaryParticipation')}
            placeholder={tr('ethics_form.voluntary_participation_placeholder')}
            helperText={tr('ethics_form.voluntary_participation_helper')}
          />

          <TextField
            label={tr('ethics_form.withdrawal_process')}
            multiline
            rows={3}
            required
            value={formData.withdrawalProcess}
            onChange={handleChange('withdrawalProcess')}
            placeholder={tr('ethics_form.withdrawal_process_placeholder')}
            helperText={tr('ethics_form.withdrawal_process_helper')}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ color: '#2D3748', fontWeight: 600 }}>
            {tr('ethics_form.participant_costs_compensation')}
          </Typography>

          <TextField
            label={tr('ethics_form.participant_costs')}
            multiline
            rows={2}
            required
            value={formData.participantCosts}
            onChange={handleChange('participantCosts')}
            placeholder={tr('ethics_form.participant_costs_placeholder')}
            helperText={tr('ethics_form.participant_costs_helper')}
          />

          <TextField
            label={tr('ethics_form.reimbursement')}
            multiline
            rows={2}
            value={formData.participantReimbursement}
            onChange={handleChange('participantReimbursement')}
            placeholder={tr('ethics_form.reimbursement_placeholder')}
          />

          <TextField
            label={tr('ethics_form.incentives')}
            multiline
            rows={2}
            value={formData.participantIncentives}
            onChange={handleChange('participantIncentives')}
            placeholder={tr('ethics_form.incentives_placeholder')}
            helperText={tr('ethics_form.incentives_helper')}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ color: '#2D3748', fontWeight: 600 }}>
            {tr('ethics_form.data_management')}
          </Typography>

          <TextField
            label={tr('ethics_form.data_collection_methods')}
            multiline
            rows={3}
            required
            value={formData.dataCollectionMethods}
            onChange={handleChange('dataCollectionMethods')}
            placeholder={tr('ethics_form.data_collection_methods_placeholder')}
            helperText={tr('ethics_form.data_collection_methods_helper')}
          />

          <TextField
            label={tr('ethics_form.anonymization_method')}
            multiline
            rows={3}
            required
            value={formData.anonymizationMethod}
            onChange={handleChange('anonymizationMethod')}
            placeholder={tr('ethics_form.anonymization_method_placeholder')}
            helperText={tr('ethics_form.anonymization_method_helper')}
          />

          <TextField
            label={tr('ethics_form.data_storage_location')}
            required
            value={formData.dataStorageLocation}
            onChange={handleChange('dataStorageLocation')}
            placeholder={tr('ethics_form.data_storage_location_placeholder')}
            helperText={tr('ethics_form.data_storage_location_helper')}
          />

          <TextField
            label={tr('ethics_form.data_storage_security')}
            multiline
            rows={3}
            required
            value={formData.dataStorageSecurity}
            onChange={handleChange('dataStorageSecurity')}
            placeholder={tr('ethics_form.data_storage_security_placeholder')}
            helperText={tr('ethics_form.data_storage_security_helper')}
          />

          <TextField
            label={tr('ethics_form.data_retention_period')}
            required
            value={formData.dataRetentionPeriod}
            onChange={handleChange('dataRetentionPeriod')}
            placeholder={tr('ethics_form.data_retention_period_placeholder')}
            helperText={tr('ethics_form.data_retention_period_helper')}
          />

          <TextField
            label={tr('ethics_form.data_disposal_protocol')}
            multiline
            rows={3}
            required
            value={formData.dataDisposalProtocol}
            onChange={handleChange('dataDisposalProtocol')}
            placeholder={tr('ethics_form.data_disposal_protocol_placeholder')}
            helperText={tr('ethics_form.data_disposal_protocol_helper')}
          />

          <TextField
            label={tr('ethics_form.confidentiality_measures')}
            multiline
            rows={4}
            required
            value={formData.confidentialityMeasures}
            onChange={handleChange('confidentialityMeasures')}
            placeholder={tr('ethics_form.confidentiality_measures_placeholder')}
          />
        </Box>
      );

    // Step 5: Risk Management
    case 5:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {tr('ethics_form.risk_benefit_alert')}
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 1 }}>
            {tr('ethics_form.risk_identification')}
          </Typography>

          <TextField
            label={tr('ethics_form.physical_risks')}
            multiline
            rows={3}
            required
            value={formData.physicalRisks}
            onChange={handleChange('physicalRisks')}
            placeholder={tr('ethics_form.physical_risks_placeholder')}
            helperText={tr('ethics_form.physical_risks_helper')}
          />

          <TextField
            label={tr('ethics_form.psychological_risks')}
            multiline
            rows={3}
            required
            value={formData.psychologicalRisks}
            onChange={handleChange('psychologicalRisks')}
            placeholder={tr('ethics_form.psychological_risks_placeholder')}
            helperText={tr('ethics_form.psychological_risks_helper')}
          />

          <TextField
            label={tr('ethics_form.social_risks')}
            multiline
            rows={3}
            required
            value={formData.socialRisks}
            onChange={handleChange('socialRisks')}
            placeholder={tr('ethics_form.social_risks_placeholder')}
          />

          <TextField
            label={tr('ethics_form.legal_risks')}
            multiline
            rows={2}
            required
            value={formData.legalRisks}
            onChange={handleChange('legalRisks')}
            placeholder={tr('ethics_form.legal_risks_placeholder')}
          />

          <TextField
            label={tr('ethics_form.economic_risks')}
            multiline
            rows={2}
            required
            value={formData.economicRisks}
            onChange={handleChange('economicRisks')}
            placeholder={tr('ethics_form.economic_risks_placeholder')}
          />

          <TextField
            label={tr('ethics_form.risk_mitigation')}
            multiline
            rows={5}
            required
            value={formData.riskMitigationStrategies}
            onChange={handleChange('riskMitigationStrategies')}
            placeholder={tr('ethics_form.risk_mitigation_placeholder')}
            helperText={tr('ethics_form.risk_mitigation_helper')}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ color: '#2D3748', fontWeight: 600 }}>
            {tr('ethics_form.benefits_analysis')}
          </Typography>

          <TextField
            label={tr('ethics_form.direct_benefits')}
            multiline
            rows={3}
            required
            value={formData.directBenefits}
            onChange={handleChange('directBenefits')}
            placeholder={tr('ethics_form.direct_benefits_placeholder')}
            helperText={tr('ethics_form.direct_benefits_helper')}
          />

          <TextField
            label={tr('ethics_form.indirect_benefits')}
            multiline
            rows={3}
            required
            value={formData.indirectBenefits}
            onChange={handleChange('indirectBenefits')}
            placeholder={tr('ethics_form.indirect_benefits_placeholder')}
            helperText={tr('ethics_form.indirect_benefits_helper')}
          />

          <TextField
            label={tr('ethics_form.risk_benefit_analysis')}
            multiline
            rows={5}
            required
            value={formData.riskBenefitAnalysis}
            onChange={handleChange('riskBenefitAnalysis')}
            placeholder={tr('ethics_form.risk_benefit_analysis_placeholder')}
            helperText={tr('ethics_form.risk_benefit_analysis_helper')}
          />

          <Divider sx={{ my: 2 }} />

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600 }}>
              {tr('ethics_form.conflict_of_interest')}
            </FormLabel>
            <RadioGroup
              value={formData.conflictOfInterest.toString()}
              onChange={(e) => handleChange('conflictOfInterest')({ target: { type: 'checkbox', checked: e.target.value === 'true' } })}
            >
              <FormControlLabel value="false" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label={tr('ethics_form.no_conflict')} />
              <FormControlLabel value="true" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label={tr('ethics_form.conflict_exists')} />
            </RadioGroup>
          </FormControl>

          {formData.conflictOfInterest && (
            <TextField
              label={tr('ethics_form.conflict_details')}
              multiline
              rows={4}
              required
              value={formData.conflictDetails}
              onChange={handleChange('conflictDetails')}
              placeholder={tr('ethics_form.conflict_details_placeholder')}
              helperText={tr('ethics_form.conflict_details_helper')}
            />
          )}

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600 }}>
              {tr('ethics_form.previous_ethics_approval')}
            </FormLabel>
            <RadioGroup
              value={formData.previousEthicsApproval.toString()}
              onChange={(e) => handleChange('previousEthicsApproval')({ target: { type: 'checkbox', checked: e.target.value === 'true' } })}
            >
              <FormControlLabel value="false" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label={tr('ethics_form.no_previous_approval')} />
              <FormControlLabel value="true" control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />} label={tr('ethics_form.previous_approval_yes')} />
            </RadioGroup>
          </FormControl>

          {formData.previousEthicsApproval && (
            <TextField
              label={tr('ethics_form.previous_approval_details')}
              multiline
              rows={3}
              required
              value={formData.previousApprovalDetails}
              onChange={handleChange('previousApprovalDetails')}
              placeholder={tr('ethics_form.previous_approval_details_placeholder')}
            />
          )}
        </Box>
      );

    // Step 6: Documentation Checklist
    case 6:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {tr('ethics_form.documentation_alert')}
          </Alert>

          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 2 }}>
            {tr('ethics_form.documentation_checklist')}
          </Typography>

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ color: '#2D3748', fontWeight: 600, mb: 2 }}>
              {tr('ethics_form.check_documents')}
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
            label={tr('ethics_form.additional_comments')}
            multiline
            rows={4}
            value={formData.additionalComments}
            onChange={handleChange('additionalComments')}
            placeholder={tr('ethics_form.additional_comments_placeholder')}
          />

          <Alert severity="success">
            <Typography variant="body2">
              {tr('ethics_form.consistency_check')}
            </Typography>
          </Alert>
        </Box>
      );

    // Step 7: Review & Submit
    case 7:
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600, mb: 2 }}>
            {tr('ethics_form.review_application')}
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            {tr('ethics_form.review_alert')}
          </Alert>

          <Paper sx={{ p: 3, bgcolor: 'rgba(139, 108, 188, 0.02)', border: '1px solid rgba(139, 108, 188, 0.2)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2 }}>
              {tr('ethics_form.project_overview')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>{tr('ethics_form.review_title')}</strong> {formData.title}</Typography>
              <Typography><strong>{tr('ethics_form.review_research_type')}</strong> {formData.researchType}</Typography>
              <Typography><strong>{tr('ethics_form.review_duration')}</strong> {formData.studyDuration}{tr('ethics_form.months_suffix')}</Typography>
              <Typography><strong>{tr('ethics_form.review_sample_size')}</strong> {formData.sampleSize}</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: 'rgba(139, 108, 188, 0.02)', border: '1px solid rgba(139, 108, 188, 0.2)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2 }}>
              {tr('ethics_form.research_team')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>{tr('ethics_form.review_pi')}</strong> {formData.principalInvestigator}</Typography>
              <Typography><strong>{tr('ethics_form.review_orcid')}</strong> {formData.piOrcid}</Typography>
              <Typography><strong>{tr('ethics_form.review_institution')}</strong> {formData.piInstitution}</Typography>
              <Typography><strong>{tr('ethics_form.review_co_investigators')}</strong> {formData.coInvestigators.length}</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: 'rgba(139, 108, 188, 0.02)', border: '1px solid rgba(139, 108, 188, 0.2)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2 }}>
              {tr('ethics_form.participants_ethics')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>{tr('ethics_form.review_vulnerable')}</strong> {formData.vulnerablePopulations.join(', ') || tr('common.none')}</Typography>
              <Typography><strong>{tr('ethics_form.review_conflict')}</strong> {formData.conflictOfInterest ? tr('ethics_form.yes_disclosed') : tr('common.no')}</Typography>
              <Typography><strong>{tr('ethics_form.review_previous_approval')}</strong> {formData.previousEthicsApproval ? tr('common.yes') : tr('common.no')}</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, bgcolor: 'rgba(139, 108, 188, 0.02)', border: '1px solid rgba(139, 108, 188, 0.2)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 2 }}>
              {tr('ethics_form.documentation_checklist_review')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography>✓ {tr('ethics_form.review_pis')}: {formData.participantInfoSheet ? tr('ethics_form.attached') : tr('ethics_form.not_attached')}</Typography>
              <Typography>✓ {tr('ethics_form.review_consent')}: {formData.consentFormAttached ? tr('ethics_form.attached') : tr('ethics_form.not_attached')}</Typography>
              <Typography>✓ {tr('ethics_form.review_protocol')}: {formData.researchProtocol ? tr('ethics_form.attached') : tr('ethics_form.not_attached')}</Typography>
              <Typography>✓ {tr('ethics_form.review_recruitment')}: {formData.recruitmentMaterialsAttached ? tr('ethics_form.attached') : tr('ethics_form.not_attached')}</Typography>
              <Typography>✓ {tr('ethics_form.review_data_tools')}: {formData.dataCollectionTools ? tr('ethics_form.attached') : tr('ethics_form.not_attached')}</Typography>
              <Typography>✓ {tr('ethics_form.review_cvs')}: {formData.investigatorCVs ? tr('ethics_form.attached') : tr('ethics_form.not_attached')}</Typography>
            </Box>
          </Paper>

          <Alert severity="warning">
            <Typography variant="body2">
              {tr('ethics_form.before_submitting')}
            </Typography>
          </Alert>
        </Box>
      );

    default:
      return null;
  }
};
