'use client';

import React, { useState, useEffect, useRef } from 'react';
import OrcidSearchModal from './components/OrcidSearchModal';
import EthicsLinkModal from './components/EthicsLinkModal';
import UploadCertificateDialog from '../../../../../components/Ethics/UploadCertificateDialog';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Switch,
  RadioGroup,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Save as SaveIcon,
  Send as SubmitIcon,
  Assignment as ProposalIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  AttachMoney as BudgetIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Science as ScienceIcon,
  BusinessCenter as ManagementIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  ExpandMore as ExpandMoreIcon,
  Group as TeamIcon,
  Timeline as TimelineIcon,
  Shield as EthicsIcon,
  FolderOpen as FilesIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import PageHeader from '../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../components/AuthProvider';
import TipTapEditor from '../../../../../components/common/TipTapEditor';
import { useTranslation } from 'react-i18next';

const RESEARCH_FIELDS = [
  'Cardiology',
  'Neurology', 
  'Oncology',
  'Pediatrics',
  'Immunology',
  'Endocrinology',
  'Genetics',
  'Public Health',
  'Epidemiology',
  'Surgery',
  'Medicine',
  'Pharmacy',
  'Nursing',
  'Dentistry',
  'Other'
];

const DEPARTMENTS = [
  'Medicine',
  'Surgery', 
  'Pediatrics',
  'Cardiology',
  'Neurology',
  'Oncology',
  'Psychiatry',
  'Radiology',
  'Pathology',
  'Anesthesiology',
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Obstetrics and Gynecology',
  'Orthopedics',
  'Ophthalmology',
  'Otolaryngology',
  'Dermatology',
  'Urology',
  'Public Health',
  'Nursing',
  'Pharmacy',
  'Dentistry',
  'Physical Therapy',
  'Occupational Therapy',
  'Medical Technology',
  'Health Administration',
  'Biomedical Engineering',
  'Clinical Research',
  'Health Informatics',
  'Rural Health',
  'Artificial Intelligence',
  'Diagnostic Imaging'
];

const DELIVERABLE_TYPES = [
  'Research Report',
  'Technical Report',
  'Final Report',
  'Interim Report',
  'White Paper',
  'Software/Application',
  'Mobile App',
  'Web Platform',
  'Database',
  'Dataset',
  'Research Data',
  'Survey Data',
  'Experimental Data',
  'Publication',
  'Journal Article',
  'Conference Paper',
  'Book Chapter',
  'Thesis/Dissertation',
  'Presentation',
  'Workshop',
  'Training Material',
  'Guidelines',
  'Policy Document',
  'Standard/Protocol',
  'Patent',
  'Prototype',
  'Model',
  'Framework',
  'Tool/Instrument',
  'Other'
];

const PROPOSAL_TYPES = [
  'Research Proposal',
  'Grant Application',
  'Project Proposal',
  'Fellowship Application',
  'Collaborative Research',
  'Clinical Trial',
  'Other'
];

const FUNDING_SOURCES = [
  'Internal Hospital Fund',
  'National Health Institute',
  'Government Research Grant',
  'Private Industry Sponsor',
  'Charitable Foundation',
  'Academic Institution',
  'Clinical Trial Sponsor',
  'International Research Fund'
];

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'GBP', symbol: '£' },
  { code: 'KES', name: 'KES', symbol: 'KSh' },
];
const currencySymbol = (code) => CURRENCIES.find((item) => item.code === code)?.symbol || code || '';
const fileDisplayName = (file) => file?.name || file?.originalName || file?.fileName || 'Document';
const fileDisplaySize = (file) => {
  const size = Number(file?.size) || 0;
  if (!size) return '';
  return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB`;
};
const stripHtml = (value) => String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const truncateText = (value, max = 180) => {
  const text = stripHtml(value);
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
};

const STATUS_OPTIONS = [
  'Draft',
  'Under Review',
  'Approved',
  'Rejected',
  'Pending'
];

const ETHICS_APPROVAL_STATUS = [
  'Not Required',
  'Pending Application',
  'Under Review',
  'Approved',
  'Conditionally Approved',
  'Rejected',
  'Exempted'
];

const steps = [
  'Core Information',
  'Research Details', 
  'Project Management',
  'Funding and Grants',
  'Ethical Considerations & Data Management',
  'Supporting Files',
  'Proposal Summary'
];

const PURPLE = '#8b6cbc';
const fieldFocusSx = {
  '& .MuiOutlinedInput-root:hover fieldset': { borderColor: PURPLE },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: PURPLE },
  '& .MuiInputLabel-root.Mui-focused': { color: PURPLE },
};
const sectionCardSx = {
  p: 2.5,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  background: 'white',
  boxShadow: 'none',
  width: '100%',
};
const formatProposalDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const toDateInputValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const datePart = value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const createItemId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const appendProposalFiles = (submitData, field, files) => {
  (files || []).forEach((file) => {
    if (file instanceof File) {
      submitData.append(field, file);
    }
  });
};
const buildProposalSubmitData = (formData, user, status) => {
  const submitData = new FormData();
  submitData.append('proposalData', JSON.stringify({
    title: formData.title,
    principalInvestigator: formData.piOption === 'useProfile'
      ? `${user?.givenName || ''} ${user?.familyName || ''}`.trim() || 'Current User'
      : formData.principalInvestigator,
    principalInvestigatorOrcid: formData.piOption === 'useProfile'
      ? user?.orcidId || null
      : formData.principalInvestigatorOrcid,
    principalInvestigatorEmail: formData.piOption === 'searchOther' ? formData.principalInvestigatorEmail || null : null,
    principalInvestigatorInstitution: formData.piOption === 'searchOther' ? formData.principalInvestigatorInstitution || null : null,
    principalInvestigatorDepartment: formData.piOption === 'searchOther' ? formData.principalInvestigatorDepartment || null : null,
    coInvestigators: formData.coInvestigators,
    departments: formData.departments,
    startDate: formData.startDate,
    endDate: formData.endDate,
    researchAreas: formData.fields,
    researchObjectives: formData.researchObjectives,
    methodology: formData.methodology,
    abstract: formData.abstract,
    milestones: formData.milestones,
    deliverables: formData.deliverables,
    fundingSource: formData.fundingSource,
    grantNumber: formData.grantNumber,
    fundingInstitution: formData.fundingInstitution,
    grantStartDate: formData.grantStartDate,
    grantEndDate: formData.grantEndDate,
    totalBudgetAmount: formData.totalBudgetAmount,
    budgetCurrency: formData.budgetCurrency || 'USD',
    savedBudgetDocuments: (formData.budgetDocuments || []).filter((file) => !(file instanceof File)),
    ethicalConsiderationsOverview: formData.ethicalConsiderationsOverview,
    consentProcedures: formData.consentProcedures,
    dataSecurityMeasures: formData.dataSecurityMeasures,
    ethicsApprovalStatus: formData.ethicsApprovalStatus,
    ethicsApprovalReference: formData.ethicsApprovalReference,
    ethicsCommittee: formData.ethicsCommittee,
    approvalDate: formData.approvalDate,
    linkedEthicsApplicationId: formData.linkedEthicsApplicationId || null,
    selectedPublications: formData.selectedPublications,
    publicationRelevance: formData.publicationRelevance,
    linkedCollaborativeProposals: formData.linkedCollaborativeProposals,
    impactStatement: formData.impactStatement,
    disseminationPlan: formData.disseminationPlan,
    status,
  }));
  appendProposalFiles(submitData, 'ethicsDocuments', formData.ethicsDocuments);
  appendProposalFiles(submitData, 'dataManagementPlan', formData.dataManagementPlan);
  appendProposalFiles(submitData, 'otherRelatedFiles', formData.otherRelatedFiles);
  appendProposalFiles(submitData, 'budgetDocuments', formData.budgetDocuments);
  return submitData;
};
const selectMenuProps = { disableScrollLock: true, PaperProps: { sx: { maxHeight: 280 } } };
const milestoneLabel = (milestone, index) => milestone.title?.trim() || `Milestone ${index + 1}`;
const projectDurationLabel = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return '';
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (days < 31) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.round(days / 30.44);
  if (months < 24) return `About ${months} month${months === 1 ? '' : 's'}`;
  const years = (days / 365.25).toFixed(1).replace(/\.0$/, '');
  return `About ${years} year${years === '1' ? '' : 's'}`;
};
const STEP_META = [
  { label: 'Core', title: 'Core Information', hint: 'Title, investigators, and institution' },
  { label: 'Research', title: 'Research details', hint: 'Areas, objectives, abstract, and methods' },
  { label: 'Management', title: 'Project Management', hint: 'Milestones, deliverables, and outputs' },
  { label: 'Funding', title: 'Funding and budget', hint: 'Source, currency, and proposed budget' },
  { label: 'Ethics', title: 'Ethical considerations', hint: 'Link an application or upload a certificate' },
  { label: 'Files', title: 'Supporting files', hint: 'Upload documents and note their relevance' },
  { label: 'Review', title: 'Proposal summary', hint: 'Check details, then submit' },
];

function StepIntro({ index, title, hint }) {
  return (
    <Box sx={{ mb: 2.5, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: alpha(PURPLE, 0.12),
            color: PURPLE,
            fontWeight: 800,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.15,
          }}
        >
          {index}
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.25 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {hint}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

const CreateProposalPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const profileName = `${user?.givenName || ''} ${user?.familyName || ''}`.trim() || 'Your profile';
  const profileOrcid = user?.orcidId || '';
  
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // ORCID search modals
  const [piSearchModalOpen, setPiSearchModalOpen] = useState(false);
  const [coInvSearchModalOpen, setCoInvSearchModalOpen] = useState(false);
  const [viewingInvestigator, setViewingInvestigator] = useState(null);
  const [departmentsTouched, setDepartmentsTouched] = useState(false);
  const [researchAreasTouched, setResearchAreasTouched] = useState(false);
  
  // Ethics application linking
  const [ethicsLinkOption, setEthicsLinkOption] = useState('existing');
  const [existingEthicsApplications, setExistingEthicsApplications] = useState([]);
  const [selectedEthicsApplication, setSelectedEthicsApplication] = useState(null);
  const [loadingEthicsApps, setLoadingEthicsApps] = useState(false);
  const [ethicsSearchModalOpen, setEthicsSearchModalOpen] = useState(false);
  const [ethicsCertUploadOpen, setEthicsCertUploadOpen] = useState(false);
  
  // Unsaved changes and auto-save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [proposalId, setProposalId] = useState(null); // For updating existing drafts
  const formDataRef = useRef(null);
  const userRef = useRef(user);
  const proposalIdRef = useRef(proposalId);
  const hasUnsavedChangesRef = useRef(false);
  const skipLeaveSaveRef = useRef(false);
  const persistInFlightRef = useRef(null);
  const flushDraftSaveRef = useRef(async () => null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load existing proposal if ID is provided in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const proposalIdFromUrl = urlParams.get('id');
    
    if (proposalIdFromUrl) {
      setProposalId(proposalIdFromUrl);
      loadExistingProposal(proposalIdFromUrl);
    }
  }, []);

  const loadExistingProposal = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load proposal');
      }

      const data = await response.json();
      
      if (data.success) {
        const proposal = data.proposal;
        
        // Populate form data with existing proposal
        const loadedForm = {
          // Step 1: Core Information
          title: proposal.title || '',
          type: proposal.type || '',
          piOption: (
            proposal.principalInvestigatorEmail
            || (proposal.principalInvestigatorOrcid && user?.orcidId && proposal.principalInvestigatorOrcid !== user.orcidId)
          ) ? 'searchOther' : 'useProfile',
          principalInvestigator: proposal.principalInvestigator || '',
          principalInvestigatorOrcid: proposal.principalInvestigatorOrcid || '',
          principalInvestigatorEmail: proposal.principalInvestigatorEmail || '',
          principalInvestigatorInstitution: proposal.principalInvestigatorInstitution || '',
          principalInvestigatorDepartment: proposal.principalInvestigatorDepartment || '',
          principalInvestigatorAffiliations: [],
          coInvestigators: proposal.coInvestigators || [],
          institution: proposal.institution || '',
          departments: proposal.departments || [],
          startDate: toDateInputValue(proposal.startDate),
          endDate: toDateInputValue(proposal.endDate),
          email: proposal.email || '',
          phone: proposal.phone || '',
          orcidId: proposal.orcidId || '',
          
          // Step 2: Research Details
          fields: proposal.researchAreas || [],
          researchObjectives: proposal.researchObjectives || '',
          abstract: proposal.abstract || '',
          methodology: proposal.methodology || '',
          
          // Step 3: Project Management
          milestones: (proposal.milestones || []).map((milestone, index) => ({
            id: milestone.id || `ms_loaded_${index}`,
            title: milestone.title || '',
            targetDate: milestone.targetDate || '',
            description: milestone.description || '',
          })),
          deliverables: (proposal.deliverables || []).map((deliverable, index) => ({
            id: deliverable.id || `dl_loaded_${index}`,
            title: deliverable.title || '',
            dueDate: deliverable.dueDate || '',
            description: deliverable.description || '',
            type: deliverable.type || '',
            milestoneId: deliverable.milestoneId || '',
          })),
          
          // Step 4: Funding and Grants
          fundingSource: proposal.fundingSource || '',
          grantNumber: proposal.grantNumber || '',
          fundingInstitution: proposal.fundingInstitution || '',
          grantStartDate: toDateInputValue(proposal.grantStartDate),
          grantEndDate: toDateInputValue(proposal.grantEndDate),
          totalBudgetAmount: proposal.totalBudgetAmount || '',
          budgetCurrency: proposal.budgetCurrency || 'USD',
          budgetDocuments: proposal.budgetDocuments || [],
          
          // Step 5: Ethical Considerations & Data Management
          ethicalConsiderationsOverview: proposal.ethicalConsiderationsOverview || '',
          consentProcedures: proposal.consentProcedures || '',
          ethicsApprovalStatus: proposal.ethicsApprovalStatus || '',
          ethicsApprovalReference: proposal.ethicsApprovalReference || '',
          ethicsCommittee: proposal.ethicsCommittee || '',
          approvalDate: toDateInputValue(proposal.approvalDate),
          dataSecurityMeasures: proposal.dataSecurityMeasures || '',
          linkedEthicsApplicationId: proposal.linkedEthicsApplicationId || null,
          linkedEthicsDocuments: proposal.linkedEthicsDocuments || [],
          ethicsDocuments: [],
          dataManagementPlan: [],
          
          // Step 6: Related Publications & Files
          selectedPublications: proposal.selectedPublications || [],
          publicationRelevance: proposal.publicationRelevance || '',
          otherRelatedFiles: [],
          
          // Step 7: Summary
          linkedCollaborativeProposals: proposal.linkedCollaborativeProposals || [],
          collaborativeProposalSearch: '',
          impactStatement: proposal.impactStatement || '',
          disseminationPlan: proposal.disseminationPlan || '',
          
          // Status
          status: proposal.status || 'Draft'
        };

        setFormData(loadedForm);
        formDataRef.current = loadedForm;

        const linkedEthics = proposal.ethicsLinks?.[0]?.ethicsApplication;
        if (linkedEthics) {
          setSelectedEthicsApplication(linkedEthics);
        }

        setLastSavedData(loadedForm);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error loading proposal:', error);
      setError('Failed to load proposal data');
    } finally {
      setLoading(false);
    }
  };
  
  const [formData, setFormData] = useState({
    // Step 1: Core Information
    title: '',
    type: '',
    piOption: 'useProfile', // Default to using profile
    principalInvestigator: '',
    principalInvestigatorOrcid: '',
    principalInvestigatorEmail: '',
    principalInvestigatorInstitution: '',
    principalInvestigatorDepartment: '',
    principalInvestigatorAffiliations: [],
    coInvestigators: [],
    institution: '',
    departments: [],
    startDate: '',
    endDate: '',
    email: '',
    phone: '',
    orcidId: '',
    
    // Step 2: Research Details
    fields: [],
    researchObjectives: '',
    abstract: '',
    methodology: '',
    
    // Step 3: Project Management
    milestones: [],
    deliverables: [],
    
    // Step 4: Funding and Grants
    fundingSource: '',
    grantNumber: '',
    fundingInstitution: '',
    grantStartDate: '',
    grantEndDate: '',
    totalBudgetAmount: '',
    budgetCurrency: 'USD',
    budgetDocuments: [],
    
    // Step 5: Ethical Considerations & Data Management
    ethicalConsiderationsOverview: '',
    consentProcedures: '',
    ethicsApprovalStatus: '',
    ethicsApprovalReference: '',
    ethicsCommittee: '',
    approvalDate: '',
    dataSecurityMeasures: '',
    linkedEthicsApplicationId: null,
    linkedEthicsDocuments: [],
    ethicsDocuments: [],
    dataManagementPlan: [],
    
    // Step 6: Related Publications & Files
    selectedPublications: [],
    publicationRelevance: '',
    otherRelatedFiles: [],
    
    // Step 7: Summary
    linkedCollaborativeProposals: [],
    collaborativeProposalSearch: '',
    impactStatement: '',
    disseminationPlan: '',
    
    // Status
    status: 'Draft'
  });

  // Track changes to form data
  useEffect(() => {
    formDataRef.current = formData;
    userRef.current = user;
    proposalIdRef.current = proposalId;
    if (lastSavedData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(lastSavedData);
      hasUnsavedChangesRef.current = hasChanges;
      setHasUnsavedChanges(hasChanges);
    } else {
      const hasAnyData = Object.values(formData).some(value => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim() !== '';
        return value !== null && value !== undefined && value !== '';
      });
      hasUnsavedChangesRef.current = hasAnyData;
      setHasUnsavedChanges(hasAnyData);
    }
  }, [formData, lastSavedData, user, proposalId]);

  // Auto-save shortly after edits stop
  useEffect(() => {
    if (!hasUnsavedChanges || !formData.title?.trim()) return undefined;
    const autoSaveTimer = setTimeout(() => {
      flushDraftSaveRef.current({ showNotification: false });
    }, 2000);
    return () => clearTimeout(autoSaveTimer);
  }, [formData, hasUnsavedChanges]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartDateChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      startDate: value,
      endDate: value && prev.endDate && prev.endDate < value ? '' : prev.endDate,
    }));
  };

  const handleEndDateChange = (value) => {
    if (formData.startDate && value && value < formData.startDate) {
      return;
    }
    handleInputChange('endDate', value);
  };

  // Fetch existing ethics applications
  const fetchEthicsApplications = async () => {
    if (!user?.id) return;
    
    setLoadingEthicsApps(true);
    try {
      const response = await fetch(`/api/ethics/applications?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        // Filter only approved or submitted applications
        const validApps = data.applications.filter(
          app => app.status === 'APPROVED' || app.status === 'SUBMITTED' || app.status === 'CONDITIONAL_APPROVAL'
        );
        setExistingEthicsApplications(validApps);
      }
    } catch (error) {
      console.error('Error fetching ethics applications:', error);
    } finally {
      setLoadingEthicsApps(false);
    }
  };

  // Handle ethics application selection
  const handleEthicsApplicationSelect = async (application) => {
    setSelectedEthicsApplication(application);
    
    // Fetch full application details including documents
    try {
      const response = await fetch(`/api/ethics/applications/${application.id}`);
      const data = await response.json();
      
      if (data.success && data.application) {
        const fullApplication = data.application;
        
        // Convert document metadata to file references
        const ethicsDocuments = fullApplication.documents || [];
        
        setFormData(prev => ({
          ...prev,
          linkedEthicsApplicationId: fullApplication.id,
          ethicsApprovalStatus: fullApplication.status === 'APPROVED' ? 'Approved' : 'Submitted',
          ethicsApprovalReference: fullApplication.referenceNumber || '',
          ethicsCommittee: fullApplication.committeeName || '',
          approvalDate: fullApplication.approvalDate ? new Date(fullApplication.approvalDate).toISOString().split('T')[0] : '',
          ethicalConsiderationsOverview: fullApplication.researchSummary || '',
          consentProcedures: fullApplication.consentProcess || '',
          dataSecurityMeasures: fullApplication.dataSecurityMeasures || '',
          // Link the ethics documents from the application
          linkedEthicsDocuments: ethicsDocuments
        }));
        
        setEthicsLinkOption('existing');
        setEthicsSearchModalOpen(false);
        setSnackbar({
          open: true,
          message: `Ethics record linked${ethicsDocuments.length > 0 ? ` with ${ethicsDocuments.length} document(s)` : ''}`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error fetching ethics application details:', error);
      // Still populate basic fields even if detailed fetch fails
      setFormData(prev => ({
        ...prev,
        linkedEthicsApplicationId: application.id,
        ethicsApprovalStatus: application.status === 'APPROVED' ? 'Approved' : 'Submitted',
        ethicsApprovalReference: application.referenceNumber || '',
        ethicsCommittee: application.committeeName || '',
        approvalDate: application.approvalDate ? new Date(application.approvalDate).toISOString().split('T')[0] : '',
        ethicalConsiderationsOverview: application.researchSummary || '',
        consentProcedures: application.consentProcess || '',
        dataSecurityMeasures: application.dataSecurityMeasures || ''
      }));
      setEthicsLinkOption('existing');
      setEthicsSearchModalOpen(false);
    }
  };

  const handleUnlinkEthicsApplication = () => {
    setSelectedEthicsApplication(null);
    setFormData((prev) => ({
      ...prev,
      linkedEthicsApplicationId: null,
      linkedEthicsDocuments: [],
      ethicsApprovalStatus: '',
      ethicsApprovalReference: '',
      ethicsCommittee: '',
      approvalDate: '',
      ethicalConsiderationsOverview: '',
      consentProcedures: '',
      dataSecurityMeasures: '',
    }));
  };

  const handleEthicsCertificateUploaded = async (application) => {
    await handleEthicsApplicationSelect(application);
    setFormData((prev) => ({
      ...prev,
      ethicsDocuments: [],
    }));

    if (proposalId && application?.id && user?.id) {
      try {
        await fetch(`/api/proposals/${proposalId}/link-ethics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ethicsApplicationId: application.id,
            linkedBy: user.id,
          }),
        });
      } catch (err) {
        console.error('Failed to link uploaded ethics certificate to proposal:', err);
      }
    }

    setSnackbar({
      open: true,
      message: 'Ethics certificate uploaded. It is now available in Ethics Applications.',
      severity: 'success',
    });
  };

  useEffect(() => {
    if (ethicsSearchModalOpen) {
      fetchEthicsApplications();
    }
  }, [ethicsSearchModalOpen]);

  const persistDraft = async (status = 'DRAFT', {
    showNotification = true,
    keepalive = false,
    data,
    id,
  } = {}) => {
    const currentForm = data || formDataRef.current || formData;
    const currentUser = userRef.current || user;
    const currentId = id || proposalIdRef.current || proposalId;

    if (!currentForm?.title?.trim()) {
      if (showNotification) {
        setSnackbar({
          open: true,
          message: 'Please enter a proposal title before saving.',
          severity: 'warning'
        });
      }
      throw new Error('Title is required');
    }

    const submitData = buildProposalSubmitData(currentForm, currentUser, status);
    const method = currentId ? 'PUT' : 'POST';
    const url = currentId ? `/api/proposals/${currentId}` : '/api/proposals';
    const response = await fetch(url, {
      method,
      body: submitData,
      keepalive,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Failed to save proposal: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to save proposal');
    }

    if (result.proposal?.id && result.proposal.id !== proposalIdRef.current) {
      proposalIdRef.current = result.proposal.id;
      setProposalId(result.proposal.id);
    }

    hasUnsavedChangesRef.current = false;
    setLastSavedData({ ...currentForm });
    setHasUnsavedChanges(false);

    if (showNotification) {
      setSnackbar({
        open: true,
        message: status === 'DRAFT' ? 'Draft saved successfully!' : 'Proposal submitted successfully!',
        severity: 'success'
      });
    }

    return result;
  };

  const flushDraftSave = async ({ showNotification = false, keepalive = false } = {}) => {
    const currentForm = formDataRef.current || formData;
    if (!currentForm?.title?.trim() || !hasUnsavedChangesRef.current) {
      return null;
    }
    if (persistInFlightRef.current) {
      return persistInFlightRef.current;
    }

    const run = (async () => {
      if (!keepalive) setAutoSaving(true);
      try {
        return await persistDraft('DRAFT', { showNotification, keepalive, data: currentForm });
      } catch (error) {
        console.error('Auto-save failed:', error);
        if (showNotification) {
          setSnackbar({
            open: true,
            message: 'Failed to save proposal. Please try again.',
            severity: 'error'
          });
        }
        return null;
      } finally {
        if (!keepalive) setAutoSaving(false);
        persistInFlightRef.current = null;
      }
    })();

    persistInFlightRef.current = run;
    return run;
  };

  flushDraftSaveRef.current = flushDraftSave;

  const handleAutoSave = async () => {
    await flushDraftSave({ showNotification: false });
  };

  const saveDraftToDatabase = async (status = 'DRAFT', showNotification = true) => {
    try {
      return await persistDraft(status, { showNotification, data: formData, id: proposalId });
    } catch (error) {
      console.error('Error saving proposal:', error);
      if (showNotification && error.message !== 'Title is required') {
        setSnackbar({
          open: true,
          message: 'Failed to save proposal. Please try again.',
          severity: 'error'
        });
      }
      throw error;
    }
  };

  useEffect(() => {
    const originalPush = router.push.bind(router);
    const originalReplace = router.replace.bind(router);

    const withDraftSave = (navigate) => async (href, options) => {
      if (skipLeaveSaveRef.current) {
        return navigate(href, options);
      }
      const target = typeof href === 'string' ? href : '';
      const stayingOnCreate = target.includes('/researcher/projects/proposals/create');
      if (!stayingOnCreate) {
        await flushDraftSaveRef.current({ showNotification: false });
      }
      return navigate(href, options);
    };

    router.push = withDraftSave(originalPush);
    router.replace = withDraftSave(originalReplace);

    return () => {
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [router]);

  useEffect(() => {
    const saveOnLeave = () => {
      flushDraftSaveRef.current({ showNotification: false, keepalive: true });
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        saveOnLeave();
      }
    };
    window.addEventListener('pagehide', saveOnLeave);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', saveOnLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleFieldToggle = (field) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field]
    }));
  };

  const handleAddCoInvestigator = () => {
    setCoInvSearchModalOpen(true);
  };

  const handleRemoveCoInvestigator = (index) => {
    setFormData(prev => ({
      ...prev,
      coInvestigators: prev.coInvestigators.filter((_, i) => i !== index)
    }));
  };

  // Department handlers
  const handleDepartmentChange = (event, newValue) => {
    // Clean up the values to remove "Add " prefix from custom entries
    // and split comma-separated entries into distinct departments
    const cleanedValues = newValue.flatMap(value => {
      let cleanValue = value;
      
      // Remove "Add " prefix from custom entries
      if (typeof value === 'string' && value.startsWith('Add "')) {
        cleanValue = value.slice(5, -1);
      }
      
      // Split by comma if the value contains commas
      if (typeof cleanValue === 'string' && cleanValue.includes(',')) {
        return cleanValue.split(',').map(v => v.trim()).filter(v => v !== '');
      }
      
      return cleanValue;
    });
    
    // Remove duplicates
    const uniqueValues = [...new Set(cleanedValues)];
    
    setFormData(prev => ({
      ...prev,
      departments: uniqueValues
    }));
  };

  // Research Areas handlers
  const handleResearchAreasChange = (event, newValue) => {
    // Clean up the values to remove "Add " prefix from custom entries
    // and split comma-separated entries into distinct research areas
    const cleanedValues = newValue.flatMap(value => {
      let cleanValue = value;
      
      // Remove "Add " prefix from custom entries
      if (typeof value === 'string' && value.startsWith('Add "')) {
        cleanValue = value.slice(5, -1);
      }
      
      // Split by comma if the value contains commas
      if (typeof cleanValue === 'string' && cleanValue.includes(',')) {
        return cleanValue.split(',').map(v => v.trim()).filter(v => v !== '');
      }
      
      return cleanValue;
    });
    
    // Remove duplicates
    const uniqueValues = [...new Set(cleanedValues)];
    
    setFormData(prev => ({
      ...prev,
      fields: uniqueValues
    }));
  };

  // File upload handlers
  const handleEthicsDocumentUpload = (event) => {
    const files = Array.from(event.target.files);
    setFormData(prev => ({
      ...prev,
      ethicsDocuments: [...prev.ethicsDocuments, ...files]
    }));
    // Reset the input
    event.target.value = '';
  };

  const handleDataManagementPlanUpload = (event) => {
    const files = Array.from(event.target.files);
    setFormData(prev => ({
      ...prev,
      dataManagementPlan: [...prev.dataManagementPlan, ...files]
    }));
    // Reset the input
    event.target.value = '';
  };

  const handleBudgetDocumentUpload = (event) => {
    const files = Array.from(event.target.files || []);
    setFormData((prev) => ({
      ...prev,
      budgetDocuments: [...(prev.budgetDocuments || []), ...files],
    }));
    event.target.value = '';
  };

  const removeBudgetDocument = (index) => {
    setFormData((prev) => ({
      ...prev,
      budgetDocuments: (prev.budgetDocuments || []).filter((_, i) => i !== index),
    }));
  };

  const removeEthicsDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      ethicsDocuments: prev.ethicsDocuments.filter((_, i) => i !== index)
    }));
  };

  const removeDataManagementPlan = (index) => {
    setFormData(prev => ({
      ...prev,
      dataManagementPlan: prev.dataManagementPlan.filter((_, i) => i !== index)
    }));
  };

  // Proposal submission handler
  const handleSubmitProposal = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await saveDraftToDatabase('UNDER_REVIEW', true);
      
      // Send notifications to submitter, Research Admin, and co-investigators
      try {
        const notifications = [];

        // 1. Notification to submitter
        notifications.push(fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'PROPOSAL_SUBMITTED',
            title: 'Proposal Submitted Successfully',
            message: `Your proposal "${formData.title}" has been submitted for review.`,
            recipientId: user?.id,
            metadata: {
              proposalId: result.proposal?.id,
              proposalTitle: formData.title,
              status: 'UNDER_REVIEW'
            }
          })
        }));

        // 2. Notification to Research Admin
        notifications.push(fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'PROPOSAL_REVIEW_REQUEST',
            title: 'New Proposal Submitted for Review',
            message: `A new proposal "${formData.title}" has been submitted by ${(`${user?.givenName || ''} ${user?.familyName || ''}`.trim() || 'Unknown User')} and requires review.`,
            recipientRole: 'RESEARCH_ADMIN',
            metadata: {
              proposalId: result.proposal?.id,
              proposalTitle: formData.title,
              submitterName: (`${user?.givenName || ''} ${user?.familyName || ''}`.trim() || 'Unknown User'),
              submitterId: user?.id
            }
          })
        }));

        if (formData.piOption === 'searchOther' && formData.principalInvestigatorEmail) {
          notifications.push(fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'PROPOSAL_INVITATION',
              title: 'Proposal Principal Investigator Invitation',
              message: `You have been invited as principal investigator on the proposal: "${formData.title}"`,
              recipientEmail: formData.principalInvestigatorEmail,
              metadata: {
                proposalId: result.proposal?.id,
                proposalTitle: formData.title,
                inviterName: (`${user?.givenName || ''} ${user?.familyName || ''}`.trim() || 'Unknown User'),
                role: 'Principal Investigator',
              },
            }),
          }));
        }

        // 3. Notifications to co-investigators
        if (formData.coInvestigators && formData.coInvestigators.length > 0) {
          for (const coInvestigator of formData.coInvestigators) {
            if (coInvestigator.email) {
              notifications.push(fetch('/api/notifications', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'PROPOSAL_INVITATION',
                  title: 'New Proposal Collaboration Invitation',
                  message: `You have been invited to collaborate on the proposal: "${formData.title}"`,
                  recipientEmail: coInvestigator.email,
                  metadata: {
                    proposalId: result.proposal?.id,
                    proposalTitle: formData.title,
                    inviterName: (`${user?.givenName || ''} ${user?.familyName || ''}`.trim() || 'Unknown User'),
                    role: 'Co-Investigator'
                  }
                })
              }));
            }
          }
        }

        // Send all notifications
        await Promise.all(notifications);
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the whole process if notifications fail
      }
      
      skipLeaveSaveRef.current = true;
      setTimeout(() => {
        router.push('/researcher/projects/proposals/list');
      }, 2000);

    } catch (error) {
      console.error('Error submitting proposal:', error);
      setError(error.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    handleSubmitProposal();
  };

  const handleNavigation = async (navigationFn) => {
    await flushDraftSave({ showNotification: false });
    navigationFn();
  };

  // Related files upload handler
  const handleRelatedFilesUpload = (event) => {
    const files = Array.from(event.target.files);
    setFormData(prev => ({
      ...prev,
      otherRelatedFiles: [...prev.otherRelatedFiles, ...files]
    }));
    // Reset the input
    event.target.value = '';
  };

  const removeRelatedFile = (index) => {
    setFormData(prev => ({
      ...prev,
      otherRelatedFiles: prev.otherRelatedFiles.filter((_, i) => i !== index)
    }));
  };

  // Publication selection handlers
  const [publicationSearch, setPublicationSearch] = useState('');
  const [availablePublications, setAvailablePublications] = useState([]);
  const [publicationsLoading, setPublicationsLoading] = useState(false);
  const [publicationsError, setPublicationsError] = useState(null);

  // Fetch publications from database
  const fetchPublications = async (searchTerm = '') => {
    setPublicationsLoading(true);
    setPublicationsError(null);
    
    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('limit', '50'); // Limit results for performance
      
      const response = await fetch(`/api/publications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch publications');
      }
      
      const data = await response.json();
      setAvailablePublications(data.publications || []);
    } catch (error) {
      console.error('Error fetching publications:', error);
      setPublicationsError('Failed to load publications. Please try again.');
      setAvailablePublications([]);
    } finally {
      setPublicationsLoading(false);
    }
  };

  // Load publications on component mount
  useEffect(() => {
    fetchPublications();
  }, []);

  // Debounced search for publications
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (publicationSearch.length >= 2 || publicationSearch.length === 0) {
        fetchPublications(publicationSearch);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [publicationSearch]);

  const handlePublicationSelect = (publication) => {
    if (!formData.selectedPublications.find(p => p.id === publication.id)) {
      setFormData(prev => ({
        ...prev,
        selectedPublications: [...prev.selectedPublications, publication]
      }));
    }
  };

  const removeSelectedPublication = (publicationId) => {
    setFormData(prev => ({
      ...prev,
      selectedPublications: prev.selectedPublications.filter(p => p.id !== publicationId)
    }));
  };

  // Publications are now filtered on the server side

  // Collaborative proposals handlers
  const [collaborativeProposalSearch, setCollaborativeProposalSearch] = useState('');
  const [availableCollaborativeProposals, setAvailableCollaborativeProposals] = useState([]);
  const [collaborativeProposalsLoading, setCollaborativeProposalsLoading] = useState(false);
  const [collaborativeProposalsError, setCollaborativeProposalsError] = useState(null);

  // Fetch collaborative proposals from database
  const fetchCollaborativeProposals = async (searchTerm = '') => {
    setCollaborativeProposalsLoading(true);
    setCollaborativeProposalsError(null);
    
    try {
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('type', 'Proposal');
      params.append('limit', '20');
      
      const response = await fetch(`/api/manuscripts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch collaborative proposals');
      }
      
      const data = await response.json();
      setAvailableCollaborativeProposals(data.manuscripts || []);
    } catch (error) {
      console.error('Error fetching collaborative proposals:', error);
      setCollaborativeProposalsError('Failed to load collaborative proposals. Please try again.');
      setAvailableCollaborativeProposals([]);
    } finally {
      setCollaborativeProposalsLoading(false);
    }
  };

  // Load collaborative proposals on component mount
  useEffect(() => {
    fetchCollaborativeProposals();
  }, []);

  // Debounced search for collaborative proposals
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (collaborativeProposalSearch.length >= 2 || collaborativeProposalSearch.length === 0) {
        fetchCollaborativeProposals(collaborativeProposalSearch);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [collaborativeProposalSearch]);

  const handleCollaborativeProposalSelect = (proposal) => {
    if (!formData.linkedCollaborativeProposals.find(p => p.id === proposal.id)) {
      setFormData(prev => ({
        ...prev,
        linkedCollaborativeProposals: [...prev.linkedCollaborativeProposals, proposal]
      }));
    }
  };

  const removeCollaborativeProposal = (proposalId) => {
    setFormData(prev => ({
      ...prev,
      linkedCollaborativeProposals: prev.linkedCollaborativeProposals.filter(p => p.id !== proposalId)
    }));
  };

  // Collaborative proposals are now filtered on the server side

  // Milestone handlers
  const handleAddMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { id: createItemId('ms'), title: '', targetDate: '', description: '' }]
    }));
  };

  const handleRemoveMilestone = (index) => {
    setFormData((prev) => {
      const removedId = prev.milestones[index]?.id;
      return {
        ...prev,
        milestones: prev.milestones.filter((_, i) => i !== index),
        deliverables: prev.deliverables.map((item) =>
          item.milestoneId && removedId && item.milestoneId === removedId
            ? { ...item, milestoneId: '' }
            : item
        ),
      };
    });
  };

  const handleMilestoneChange = (index, field, value) => {
    setFormData((prev) => {
      const milestones = prev.milestones.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      );
      const milestoneId = prev.milestones[index]?.id;
      const deliverables = field === 'targetDate' && value && milestoneId
        ? prev.deliverables.map((item) =>
            item.milestoneId === milestoneId && item.dueDate && item.dueDate > value
              ? { ...item, dueDate: value }
              : item
          )
        : prev.deliverables;
      return { ...prev, milestones, deliverables };
    });
  };

  // Deliverable handlers
  const handleAddDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, { id: createItemId('dl'), title: '', dueDate: '', description: '', type: '', milestoneId: '' }]
    }));
  };

  const handleDeliverableMilestoneChange = (index, milestoneId) => {
    setFormData((prev) => {
      const milestone = prev.milestones.find((item) => item.id === milestoneId);
      return {
        ...prev,
        deliverables: prev.deliverables.map((item, i) => {
          if (i !== index) return item;
          const next = { ...item, milestoneId };
          if (milestone?.targetDate && (!item.dueDate || item.dueDate > milestone.targetDate)) {
            next.dueDate = milestone.targetDate;
          }
          return next;
        }),
      };
    });
  };

  const handleRemoveDeliverable = (index) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const handleDeliverableChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // ORCID search handlers
  const usingProfilePi = (formData.piOption || 'useProfile') !== 'searchOther';
  const selectedPi = {
    name: usingProfilePi ? profileName : formData.principalInvestigator,
    orcidId: usingProfilePi ? profileOrcid : formData.principalInvestigatorOrcid,
    institution: usingProfilePi
      ? (user?.primaryInstitution || '')
      : (formData.principalInvestigatorInstitution || formData.principalInvestigatorAffiliations?.[0] || ''),
    department: usingProfilePi ? '' : (formData.principalInvestigatorDepartment || ''),
    email: usingProfilePi ? (user?.email || '') : (formData.principalInvestigatorEmail || ''),
  };

  const handlePrincipalInvestigatorSelect = (researcher) => {
    setFormData(prev => ({
      ...prev,
      principalInvestigator: researcher.creditName || `${researcher.givenNames || ''} ${researcher.familyName || ''}`.trim(),
      principalInvestigatorOrcid: researcher.orcidId,
      principalInvestigatorEmail: researcher.email || '',
      principalInvestigatorInstitution: researcher.institution || researcher.affiliations?.[0] || '',
      principalInvestigatorDepartment: researcher.department || '',
      principalInvestigatorAffiliations: researcher.affiliations || []
    }));
  };

  const handleCoInvestigatorSelect = (researcher) => {
    const newCoInvestigator = {
      name: researcher.creditName || `${researcher.givenNames || ''} ${researcher.familyName || ''}`.trim(),
      email: researcher.email || '',
      role: researcher.employmentSummary || '',
      institution: researcher.institution || researcher.affiliations?.[0] || '',
      department: researcher.department || '',
      orcidId: researcher.orcidId,
      affiliations: researcher.affiliations || []
    };

    setFormData((prev) => {
      if (researcher.orcidId && prev.coInvestigators.some((person) => person.orcidId === researcher.orcidId)) {
        return prev;
      }
      return { ...prev, coInvestigators: [...prev.coInvestigators, newCoInvestigator] };
    });
  };

  const handleCoInvestigatorChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      coInvestigators: prev.coInvestigators.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      // Auto-save when moving to next step
      if (hasUnsavedChanges) {
        handleAutoSave();
      }
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const result = await saveDraftToDatabase('DRAFT', true);
      const savedId = result?.proposal?.id || proposalIdRef.current;
      if (savedId && typeof window !== 'undefined') {
        const currentId = new URL(window.location.href).searchParams.get('id');
        if (currentId !== savedId) {
          skipLeaveSaveRef.current = true;
          router.replace(`/researcher/projects/proposals/create?id=${savedId}`, { scroll: false });
          skipLeaveSaveRef.current = false;
        }
      }
    } catch (err) {
      setError('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };


  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Core Information
        return (
          <Box>
            <StepIntro index={1} title="Core Information" hint="Title, investigators, and institution" />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Basic Project Information Card */}
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Basic Project Information
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                Enter the fundamental details about your research project.
              </Typography>
              
              <TextField
                fullWidth
                label="Project Title *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter a descriptive title for your research project"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#8b6cbc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#8b6cbc',
                  },
                }}
              />
            </Paper>

            {/* Principal Investigator Card */}
            <Paper sx={sectionCardSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                    Principal Investigator
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use your profile, or search ORCID for someone else.
                  </Typography>
                </Box>
                {formData.piOption === 'searchOther' ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SearchIcon />}
                    onClick={() => setPiSearchModalOpen(true)}
                    sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                  >
                    {formData.principalInvestigator ? 'Change PI' : 'Search ORCID'}
                  </Button>
                ) : null}
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                {[
                  { id: 'useProfile', label: 'Use my profile' },
                  { id: 'searchOther', label: 'Search another researcher' },
                ].map((option) => {
                  const active = (formData.piOption || 'useProfile') === option.id;
                  return (
                    <Button
                      key={option.id}
                      size="small"
                      variant={active ? 'contained' : 'outlined'}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          piOption: option.id,
                          ...(option.id === 'useProfile'
                            ? {
                                principalInvestigatorEmail: '',
                                principalInvestigator: '',
                                principalInvestigatorOrcid: '',
                                principalInvestigatorInstitution: '',
                                principalInvestigatorDepartment: '',
                              }
                            : {}),
                        }));
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: active ? PURPLE : 'white',
                        borderColor: PURPLE,
                        color: active ? 'white' : PURPLE,
                        '&:hover': { bgcolor: active ? '#7a5aad' : 'rgba(139, 108, 188, 0.06)', borderColor: PURPLE },
                      }}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </Stack>

              {formData.piOption === 'searchOther' && !formData.principalInvestigator ? (
                <Typography variant="body2" color="text.secondary">
                  Search ORCID to select a principal investigator and add an invite email.
                </Typography>
              ) : (
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: PURPLE }}>
                        <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>ORCID</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Institution</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Department</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow
                        hover
                        onClick={() => setViewingInvestigator({
                          title: 'Principal investigator details',
                          ...selectedPi,
                          role: 'Principal Investigator',
                        })}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <span>{selectedPi.name || 'Not recorded'}</span>
                            {usingProfilePi ? (
                              <Chip
                                size="small"
                                label="You"
                                sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: alpha(PURPLE, 0.12), color: PURPLE }}
                              />
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                          {selectedPi.orcidId || 'Not set'}
                        </TableCell>
                        <TableCell>{selectedPi.institution || 'Not set'}</TableCell>
                        <TableCell>{selectedPi.department || 'Not set'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Click the row to view full details.
                </Typography>
                {!usingProfilePi && selectedPi.email ? (
                  <Chip
                    size="small"
                    label={`Invite: ${selectedPi.email}`}
                    sx={{ height: 22, fontWeight: 700, bgcolor: alpha(PURPLE, 0.1), color: '#6f4fa0' }}
                  />
                ) : null}
              </Stack>
            </Paper>

            {/* Co-Investigators Card */}
            <Paper sx={sectionCardSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                      Co-Investigators
                    </Typography>
                    {formData.coInvestigators.length > 0 ? (
                      <Chip
                        size="small"
                        label={formData.coInvestigators.length}
                        sx={{ height: 20, fontWeight: 700, bgcolor: alpha(PURPLE, 0.12), color: PURPLE }}
                      />
                    ) : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Optional. Search ORCID to add collaborators.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SearchIcon />}
                  onClick={handleAddCoInvestigator}
                  sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                >
                  Add co-investigator
                </Button>
              </Stack>

              {formData.coInvestigators.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No co-investigators added yet.
                </Typography>
              ) : (
                <>
                  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: PURPLE }}>
                          <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Name</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>ORCID</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Institution</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 700, borderBottom: 'none' }}>Department</TableCell>
                          <TableCell align="right" sx={{ color: 'white', fontWeight: 700, borderBottom: 'none', width: 56 }} />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.coInvestigators.map((coInv, index) => (
                          <TableRow
                            key={coInv.orcidId || `${coInv.name}-${index}`}
                            hover
                            onClick={() => setViewingInvestigator({
                              title: 'Co-investigator details',
                              name: coInv.name,
                              orcidId: coInv.orcidId,
                              institution: coInv.institution,
                              department: coInv.department,
                              email: coInv.email,
                              role: coInv.role || 'Co-investigator',
                            })}
                            sx={{ cursor: 'pointer', '&:nth-of-type(even)': { bgcolor: '#fafafa' } }}
                          >
                            <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{coInv.name || 'Not recorded'}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{coInv.orcidId || 'Not set'}</TableCell>
                            <TableCell>{coInv.institution || 'Not set'}</TableCell>
                            <TableCell>{coInv.department || 'Not set'}</TableCell>
                            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                              <Tooltip title="Remove">
                                <IconButton size="small" onClick={() => handleRemoveCoInvestigator(index)} sx={{ color: '#b91c1c' }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Click a row to view full details.
                  </Typography>
                </>
              )}
            </Paper>

            {/* Departments Card */}
            <Paper sx={sectionCardSx}>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Departments
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Required. Search the list or type to add a department.
                </Typography>
              </Box>

              <Autocomplete
                multiple
                freeSolo
                options={DEPARTMENTS}
                value={formData.departments || []}
                onChange={(event, newValue) => {
                  setDepartmentsTouched(true);
                  handleDepartmentChange(event, newValue);
                }}
                onBlur={() => setDepartmentsTouched(true)}
                filterOptions={(options, params) => {
                  const filtered = options.filter((option) =>
                    option.toLowerCase().includes(params.inputValue.toLowerCase())
                  );
                  const { inputValue } = params;
                  const isExisting = options.some((option) =>
                    inputValue.toLowerCase() === option.toLowerCase()
                  );
                  if (inputValue !== '' && !isExisting) {
                    filtered.push(`Add "${inputValue}"`);
                  }
                  return filtered;
                }}
                getOptionLabel={(option) => {
                  if (typeof option === 'string' && option.startsWith('Add "')) {
                    return option.slice(5, -1);
                  }
                  return option;
                }}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      {option.startsWith('Add "') ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AddIcon sx={{ color: PURPLE, fontSize: 18 }} />
                          <Typography>Add {option.slice(5, -1)}</Typography>
                        </Stack>
                      ) : (
                        option
                      )}
                    </Box>
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const isCustom = !DEPARTMENTS.includes(option);
                    return (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                        sx={{
                          fontWeight: 700,
                          borderColor: isCustom ? '#d97706' : PURPLE,
                          color: isCustom ? '#b45309' : PURPLE,
                          bgcolor: isCustom ? 'rgba(217, 119, 6, 0.06)' : alpha(PURPLE, 0.06),
                          '& .MuiChip-deleteIcon': {
                            color: isCustom ? '#d97706' : PURPLE,
                          },
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={formData.departments?.length ? 'Add another department' : 'Search or add a department'}
                    error={departmentsTouched && !formData.departments?.length}
                    helperText={
                      departmentsTouched && !formData.departments?.length
                        ? 'Select at least one department'
                        : formData.departments?.length
                          ? `${formData.departments.length} selected. Custom departments use an amber chip.`
                          : ' '
                    }
                    sx={fieldFocusSx}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-popupIndicator': { color: PURPLE },
                  '& .MuiAutocomplete-clearIndicator': { color: PURPLE },
                }}
              />
            </Paper>

            {/* Project Timeline Card */}
            <Paper sx={sectionCardSx}>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Project Timeline
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Optional start and end dates for the project.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Start date"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={fieldFocusSx}
                />
                <TextField
                  fullWidth
                  label="End date"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  disabled={!formData.startDate}
                  InputLabelProps={{ shrink: true }}
                  helperText={formData.startDate ? ' ' : 'Choose a start date first'}
                  slotProps={{ htmlInput: { min: formData.startDate || undefined } }}
                  sx={fieldFocusSx}
                />
              </Stack>

              {(formData.startDate || formData.endDate) ? (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: PURPLE, fontWeight: 700 }}>
                  {[formatProposalDate(formData.startDate) || 'Start not set', formatProposalDate(formData.endDate) || 'End not set'].join(' - ')}
                  {projectDurationLabel(formData.startDate, formData.endDate) ? ` (${projectDurationLabel(formData.startDate, formData.endDate)})` : ''}
                </Typography>
              ) : null}
            </Paper>

            </Box>
        </Box>
        );

      case 1: // Research Details
        return (
          <Box>
            <StepIntro index={2} title="Research details" hint="Areas, objectives, abstract, and methods" />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Research Areas Card */}
            <Paper sx={sectionCardSx}>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Research Areas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Required. Search the list or type to add a research area.
                </Typography>
              </Box>

              <Autocomplete
                multiple
                freeSolo
                options={RESEARCH_FIELDS}
                value={formData.fields || []}
                onChange={(event, newValue) => {
                  setResearchAreasTouched(true);
                  handleResearchAreasChange(event, newValue);
                }}
                onBlur={() => setResearchAreasTouched(true)}
                filterOptions={(options, params) => {
                  const filtered = options.filter((option) =>
                    option.toLowerCase().includes(params.inputValue.toLowerCase())
                  );
                  const { inputValue } = params;
                  const isExisting = options.some((option) =>
                    inputValue.toLowerCase() === option.toLowerCase()
                  );
                  if (inputValue !== '' && !isExisting) {
                    filtered.push(`Add "${inputValue}"`);
                  }
                  return filtered;
                }}
                getOptionLabel={(option) => {
                  if (typeof option === 'string' && option.startsWith('Add "')) {
                    return option.slice(5, -1);
                  }
                  return option;
                }}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      {option.startsWith('Add "') ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AddIcon sx={{ color: PURPLE, fontSize: 18 }} />
                          <Typography>Add {option.slice(5, -1)}</Typography>
                        </Stack>
                      ) : (
                        option
                      )}
                    </Box>
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const isCustom = !RESEARCH_FIELDS.includes(option);
                    return (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                        sx={{
                          fontWeight: 700,
                          borderColor: isCustom ? '#d97706' : PURPLE,
                          color: isCustom ? '#b45309' : PURPLE,
                          bgcolor: isCustom ? 'rgba(217, 119, 6, 0.06)' : alpha(PURPLE, 0.06),
                          '& .MuiChip-deleteIcon': {
                            color: isCustom ? '#d97706' : PURPLE,
                          },
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={formData.fields?.length ? 'Add another research area' : 'Search or add a research area'}
                    error={researchAreasTouched && !formData.fields?.length}
                    helperText={
                      researchAreasTouched && !formData.fields?.length
                        ? 'Select at least one research area'
                        : formData.fields?.length
                          ? `${formData.fields.length} selected. Custom areas use an amber chip.`
                          : ' '
                    }
                    sx={fieldFocusSx}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-popupIndicator': { color: PURPLE },
                  '& .MuiAutocomplete-clearIndicator': { color: PURPLE },
                }}
              />
            </Paper>

            {/* Research Objectives Card */}
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Research Objectives *
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                Clearly state your research objectives. Use formatting tools to organize your content with bullet points or numbered lists.
              </Typography>
              <TipTapEditor
                value={formData.researchObjectives || ''}
                onChange={(value) => handleInputChange('researchObjectives', value)}
                placeholder="What do you aim to achieve with this research? List your primary and secondary objectives..."
                minHeight="200px"
              />
            </Paper>

            {/* Research Methods Card */}
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Research Methods *
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                Describe your research methodology in detail. Use formatting to organize your methods clearly.
              </Typography>
              <TipTapEditor
                value={formData.methodology || ''}
                onChange={(value) => handleInputChange('methodology', value)}
                placeholder="Include your research design, data collection methods, analysis techniques, and any tools or instruments you will use..."
                minHeight="200px"
              />
            </Paper>

            {/* Abstract Card */}
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Abstract *
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                Provide a comprehensive abstract of your research proposal (recommended 250-500 words).
              </Typography>
              <TipTapEditor
                value={formData.abstract || ''}
                onChange={(value) => handleInputChange('abstract', value)}
                placeholder="Include background, objectives, methodology, expected outcomes, and significance..."
                minHeight="250px"
              />
            </Paper>

            </Box>
          </Box>
        );

      case 2: // Project Management
        return (
          <Box>
            <StepIntro index={3} title="Project Management" hint="Milestones, deliverables, and outputs" />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Project Milestones Card */}
            <Paper sx={sectionCardSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                      Project Milestones
                    </Typography>
                    {formData.milestones.length > 0 ? (
                      <Chip size="small" label={formData.milestones.length} sx={{ height: 20, fontWeight: 700, bgcolor: alpha(PURPLE, 0.12), color: PURPLE }} />
                    ) : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Optional. Key checkpoints. Linked deliverables appear as outputs.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddMilestone}
                  sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                >
                  Add milestone
                </Button>
              </Stack>

              {formData.milestones.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No milestones added yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {formData.milestones.map((milestone, index) => {
                    const outputs = formData.deliverables.filter((item) => item.milestoneId && item.milestoneId === milestone.id);
                    return (
                      <Paper key={milestone.id || index} variant="outlined" sx={{ p: 1.75, borderColor: 'divider', boxShadow: 'none' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            {milestoneLabel(milestone, index)}
                          </Typography>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => handleRemoveMilestone(index)} sx={{ color: '#b91c1c' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        <Stack spacing={1.25}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Title"
                              value={milestone.title}
                              onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                              placeholder="Milestone title"
                              sx={fieldFocusSx}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              label="Target date"
                              type="date"
                              value={milestone.targetDate || ''}
                              onChange={(e) => handleMilestoneChange(index, 'targetDate', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              slotProps={{
                                htmlInput: {
                                  min: formData.startDate || undefined,
                                  max: formData.endDate || undefined,
                                },
                              }}
                              sx={fieldFocusSx}
                            />
                          </Stack>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 0.5 }}>
                              Description
                            </Typography>
                            <TipTapEditor
                              value={milestone.description || ''}
                              onChange={(value) => handleMilestoneChange(index, 'description', value)}
                              placeholder="What this milestone achieves"
                              minHeight="100px"
                            />
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                              Outputs
                            </Typography>
                            {outputs.length === 0 ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Link a deliverable to this milestone to mark it as an output.
                              </Typography>
                            ) : (
                              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                                {outputs.map((item) => (
                                  <Chip
                                    key={item.id || item.title}
                                    size="small"
                                    label={item.title?.trim() || 'Untitled deliverable'}
                                    sx={{ fontWeight: 700, bgcolor: alpha(PURPLE, 0.1), color: PURPLE }}
                                  />
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Paper>

            {/* Project Deliverables Card */}
            <Paper sx={sectionCardSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                      Project Deliverables
                    </Typography>
                    {formData.deliverables.length > 0 ? (
                      <Chip size="small" label={formData.deliverables.length} sx={{ height: 20, fontWeight: 700, bgcolor: alpha(PURPLE, 0.12), color: PURPLE }} />
                    ) : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Optional. Link a deliverable to a milestone to make it that milestone's output.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddDeliverable}
                  sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                >
                  Add deliverable
                </Button>
              </Stack>

              {formData.deliverables.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No deliverables added yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {formData.deliverables.map((deliverable, index) => {
                    const linkedMilestone = formData.milestones.find((item) => item.id && item.id === deliverable.milestoneId);
                    const linkedIndex = formData.milestones.findIndex((item) => item.id && item.id === deliverable.milestoneId);
                    const dueMax = linkedMilestone?.targetDate || formData.endDate || undefined;
                    return (
                      <Paper key={deliverable.id || index} variant="outlined" sx={{ p: 1.75, borderColor: 'divider', boxShadow: 'none' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            {deliverable.title?.trim() || `Deliverable ${index + 1}`}
                          </Typography>
                          <Tooltip title="Remove">
                            <IconButton size="small" onClick={() => handleRemoveDeliverable(index)} sx={{ color: '#b91c1c' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        <Stack spacing={1.25}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Title"
                            value={deliverable.title}
                            onChange={(e) => handleDeliverableChange(index, 'title', e.target.value)}
                            placeholder="Deliverable title"
                            sx={fieldFocusSx}
                          />
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label="Type"
                              value={deliverable.type || ''}
                              onChange={(e) => handleDeliverableChange(index, 'type', e.target.value)}
                              SelectProps={{ displayEmpty: true, MenuProps: selectMenuProps }}
                              sx={fieldFocusSx}
                            >
                              <MenuItem value="">Select type</MenuItem>
                              {DELIVERABLE_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              fullWidth
                              size="small"
                              label="Due date"
                              type="date"
                              value={deliverable.dueDate || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (dueMax && value && value > dueMax) return;
                                if (formData.startDate && value && value < formData.startDate) return;
                                handleDeliverableChange(index, 'dueDate', value);
                              }}
                              InputLabelProps={{ shrink: true }}
                              slotProps={{
                                htmlInput: {
                                  min: formData.startDate || undefined,
                                  max: dueMax,
                                },
                              }}
                              sx={fieldFocusSx}
                            />
                            <TextField
                              select
                              fullWidth
                              size="small"
                              label="Output of milestone"
                              value={deliverable.milestoneId || ''}
                              onChange={(e) => handleDeliverableMilestoneChange(index, e.target.value)}
                              SelectProps={{ displayEmpty: true, MenuProps: selectMenuProps }}
                              helperText={formData.milestones.length === 0 ? 'Add a milestone first' : ' '}
                              sx={fieldFocusSx}
                            >
                              <MenuItem value="">Not linked</MenuItem>
                              {formData.milestones.map((milestone, milestoneIndex) => (
                                <MenuItem key={milestone.id || milestoneIndex} value={milestone.id || ''}>
                                  {milestoneLabel(milestone, milestoneIndex)}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Stack>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 0.5 }}>
                              Description
                            </Typography>
                            <TipTapEditor
                              value={deliverable.description || ''}
                              onChange={(value) => handleDeliverableChange(index, 'description', value)}
                              placeholder="Specifications and expected outcomes"
                              minHeight="100px"
                            />
                          </Box>
                          {linkedMilestone ? (
                            <Typography variant="caption" sx={{ color: PURPLE, fontWeight: 700 }}>
                              Output of {milestoneLabel(linkedMilestone, linkedIndex)}
                              {linkedMilestone.targetDate ? ` (${formatProposalDate(linkedMilestone.targetDate)})` : ''}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Paper>


            </Box>
          </Box>
        );

      case 3: // Funding and Grants
        return (
          <Box>
            <StepIntro index={4} title="Funding and budget" hint="Source, currency, and proposed budget" />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Funding Source Card */}
            <Paper sx={sectionCardSx}>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Funding Source
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Required. Select a source or type a new one.
                </Typography>
              </Box>
              <Autocomplete
                fullWidth
                freeSolo
                options={FUNDING_SOURCES}
                value={formData.fundingSource}
                onChange={(event, newValue) => {
                  handleInputChange('fundingSource', newValue || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search or enter a funding source"
                    sx={fieldFocusSx}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-popupIndicator': { color: PURPLE },
                  '& .MuiAutocomplete-clearIndicator': { color: PURPLE },
                }}
              />
            </Paper>

            {/* Proposed Budget Information Card */}
            <Paper sx={sectionCardSx}>
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Proposed Budget Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Set the currency and total amount, then upload a detailed budget breakdown.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                <Autocomplete
                  fullWidth
                  freeSolo
                  options={CURRENCIES}
                  value={CURRENCIES.find((item) => item.code === formData.budgetCurrency) || formData.budgetCurrency || null}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.name
                  }
                  isOptionEqualToValue={(option, value) =>
                    (option?.code || option) === (value?.code || value)
                  }
                  onChange={(event, newValue) => {
                    if (!newValue) {
                      handleInputChange('budgetCurrency', '');
                      return;
                    }
                    handleInputChange(
                      'budgetCurrency',
                      typeof newValue === 'string' ? newValue.trim().toUpperCase() : newValue.code
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Currency" placeholder="Select or type a currency" sx={fieldFocusSx} />
                  )}
                  sx={{
                    '& .MuiAutocomplete-popupIndicator': { color: PURPLE },
                    '& .MuiAutocomplete-clearIndicator': { color: PURPLE },
                  }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Total proposed amount"
                  value={formData.totalBudgetAmount}
                  onChange={(e) => handleInputChange('totalBudgetAmount', e.target.value)}
                  placeholder="0.00"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: PURPLE, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {currencySymbol(formData.budgetCurrency)}
                      </Box>
                    ),
                  }}
                  sx={fieldFocusSx}
                />
              </Stack>

              <Box
                sx={{
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} flexWrap="wrap" useFlexGap>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      Detailed budget document
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upload a spreadsheet or PDF with line-item breakdowns. PDF, Excel, Word, or CSV.
                    </Typography>
                  </Box>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={handleBudgetDocumentUpload}
                    style={{ display: 'none' }}
                    id="budget-document-upload"
                  />
                  <label htmlFor="budget-document-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      size="small"
                      startIcon={<UploadIcon />}
                      sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                    >
                      Upload breakdown
                    </Button>
                  </label>
                </Stack>

                {(formData.budgetDocuments || []).length > 0 ? (
                  <Stack spacing={1} sx={{ mt: 1.5 }}>
                    {formData.budgetDocuments.map((file, index) => (
                      <Stack
                        key={`${fileDisplayName(file)}-${index}`}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ px: 1.25, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            {fileDisplayName(file)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fileDisplaySize(file) || 'Saved document'}
                          </Typography>
                        </Box>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => removeBudgetDocument(index)} sx={{ color: '#b91c1c' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
                    No budget breakdown uploaded yet.
                  </Typography>
                )}
              </Box>
            </Paper>

            </Box>
          </Box>
        );

      case 4: // Ethical Considerations & Data Management
        return (
          <Box>
            <StepIntro index={5} title="Ethical considerations" hint="Link an application or upload a certificate" />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Ethics approval */}
            <Paper sx={sectionCardSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                    Ethics approval
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Link an existing application or certificate, or upload a clearance certificate. Uploaded certificates are added to Ethics Applications.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SearchIcon />}
                    onClick={() => setEthicsSearchModalOpen(true)}
                    sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                  >
                    Search and link
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UploadIcon />}
                    onClick={() => setEthicsCertUploadOpen(true)}
                    sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                  >
                    Upload certificate
                  </Button>
                </Stack>
              </Stack>
              
              {selectedEthicsApplication || formData.linkedEthicsApplicationId ? (
                <Paper variant="outlined" sx={{ p: 1.75, borderColor: 'divider', boxShadow: 'none', mb: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        {selectedEthicsApplication?.title || 'Linked ethics record'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {[
                          formData.ethicsApprovalReference ? `Ref ${formData.ethicsApprovalReference}` : null,
                          formData.ethicsCommittee,
                          formData.ethicsApprovalStatus,
                          formData.approvalDate ? formatProposalDate(formData.approvalDate) : null,
                        ].filter(Boolean).join(' · ') || 'Linked from Hospitium'}
                      </Typography>
                    </Box>
                    <Button size="small" onClick={handleUnlinkEthicsApplication} sx={{ textTransform: 'none', fontWeight: 700, color: '#b91c1c' }}>
                      Unlink
                    </Button>
                  </Stack>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  No ethics record linked yet.
                </Typography>
              )}

              {(formData.linkedEthicsDocuments?.length > 0 || formData.ethicsDocuments.length > 0) ? (
                <Stack spacing={1}>
                  {(formData.linkedEthicsDocuments || []).map((doc, index) => (
                    <Stack
                      key={`linked-${index}`}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ px: 1.25, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {doc.filename || doc.name || 'Linked document'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          From linked ethics record
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                  {formData.ethicsDocuments.map((file, index) => (
                    <Stack
                      key={`upload-${index}`}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ px: 1.25, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {fileDisplayName(file)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fileDisplaySize(file) || 'Uploaded certificate'}
                        </Typography>
                      </Box>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => removeEthicsDocument(index)} sx={{ color: '#b91c1c' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ))}
                </Stack>
              ) : null}
            </Paper>
            
            {/* Data Management Plan Upload */}
            <Paper sx={sectionCardSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                    Data Management Plan
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Optional. Upload how data will be collected, stored, and shared.
                  </Typography>
                </Box>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleDataManagementPlanUpload}
                  style={{ display: 'none' }}
                  id="data-management-plan-upload"
                />
                <label htmlFor="data-management-plan-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    size="small"
                    startIcon={<UploadIcon />}
                    sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                  >
                    Upload DMP
                  </Button>
                </label>
              </Stack>
              {formData.dataManagementPlan.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No data management plan uploaded yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {formData.dataManagementPlan.map((file, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ px: 1.25, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {fileDisplayName(file)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fileDisplaySize(file) || 'Uploaded file'}
                        </Typography>
                      </Box>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => removeDataManagementPlan(index)} sx={{ color: '#b91c1c' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>

            </Box>
          </Box>
        );

      case 5: // Supporting Files
        return (
          <Box>
            <StepIntro index={6} title="Supporting files" hint="Upload documents and note their relevance" />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper sx={sectionCardSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                      Supporting files
                    </Typography>
                    {formData.otherRelatedFiles.length > 0 ? (
                      <Chip size="small" label={formData.otherRelatedFiles.length} sx={{ height: 20, fontWeight: 700, bgcolor: alpha(PURPLE, 0.12), color: PURPLE }} />
                    ) : null}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Optional. Preliminary data, references, or other supporting documents.
                  </Typography>
                </Box>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.jpg,.png"
                  onChange={handleRelatedFilesUpload}
                  style={{ display: 'none' }}
                  id="related-files-upload"
                />
                <label htmlFor="related-files-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    size="small"
                    startIcon={<UploadIcon />}
                    sx={{ borderColor: PURPLE, color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                  >
                    Upload files
                  </Button>
                </label>
              </Stack>

              {formData.otherRelatedFiles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No supporting files uploaded yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {formData.otherRelatedFiles.map((file, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ px: 1.25, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {fileDisplayName(file)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fileDisplaySize(file) || 'Uploaded file'}
                        </Typography>
                      </Box>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => removeRelatedFile(index)} sx={{ color: '#b91c1c' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ))}
                </Stack>
              )}

              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Relevance"
                value={formData.publicationRelevance}
                onChange={(e) => handleInputChange('publicationRelevance', e.target.value)}
                placeholder="How do these supporting documents relate to this proposal?"
                sx={{ ...fieldFocusSx, mt: 2 }}
              />
            </Paper>

            </Box>
          </Box>
        );

      case 6: // Proposal Summary
        return (
          <Box>
            <StepIntro index={7} title="Proposal summary" hint="Check details, then submit" />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              {
                step: 0,
                title: 'Core Information',
                rows: [
                  ['Title', formData.title],
                  ['Principal investigator', selectedPi.name],
                  ['ORCID', selectedPi.orcidId],
                  ['Departments', (formData.departments || []).join(', ')],
                  ['Timeline', [formatProposalDate(formData.startDate) || 'Start not set', formatProposalDate(formData.endDate) || 'End not set'].join(' - ')],
                  ['Co-investigators', formData.coInvestigators.length ? formData.coInvestigators.map((person) => person.name).filter(Boolean).join(', ') : 'None'],
                ],
              },
              {
                step: 1,
                title: 'Research details',
                rows: [
                  ['Research areas', (formData.fields || []).join(', ')],
                  ['Objectives', truncateText(formData.researchObjectives)],
                  ['Methods', truncateText(formData.methodology)],
                  ['Abstract', truncateText(formData.abstract)],
                ],
              },
              {
                step: 2,
                title: 'Project Management',
                rows: [
                  ['Milestones', formData.milestones.length ? `${formData.milestones.length} added` : 'None'],
                  ['Deliverables', formData.deliverables.length ? `${formData.deliverables.length} added` : 'None'],
                ],
              },
              {
                step: 3,
                title: 'Funding and budget',
                rows: [
                  ['Funding source', formData.fundingSource],
                  ['Proposed amount', formData.totalBudgetAmount ? `${currencySymbol(formData.budgetCurrency)} ${formData.totalBudgetAmount}` : ''],
                  ['Currency', formData.budgetCurrency],
                  ['Budget documents', (formData.budgetDocuments || []).length ? `${formData.budgetDocuments.length} uploaded` : 'None'],
                ],
              },
              {
                step: 4,
                title: 'Ethical considerations',
                rows: [
                  ['Linked record', selectedEthicsApplication?.title || (formData.linkedEthicsApplicationId ? 'Linked ethics record' : '')],
                  ['Reference', formData.ethicsApprovalReference],
                  ['Committee', formData.ethicsCommittee],
                  ['Certificates', (formData.ethicsDocuments.length + (formData.linkedEthicsDocuments?.length || 0)) ? `${formData.ethicsDocuments.length + (formData.linkedEthicsDocuments?.length || 0)} file(s)` : 'None'],
                  ['Data management plan', formData.dataManagementPlan.length ? `${formData.dataManagementPlan.length} file(s)` : 'None'],
                ],
              },
              {
                step: 5,
                title: 'Supporting files',
                rows: [
                  ['Supporting documents', formData.otherRelatedFiles.length ? `${formData.otherRelatedFiles.length} uploaded` : 'None'],
                  ['Relevance', truncateText(formData.publicationRelevance, 140)],
                ],
              },
            ].map((section) => (
              <Paper key={section.title} sx={sectionCardSx}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.25 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                    {section.title}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setActiveStep(section.step)}
                    sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}
                  >
                    Edit
                  </Button>
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
                  {section.rows.map(([label, value]) => (
                    <Box key={label}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                        {label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: value ? '#1e293b' : '#94a3b8' }}>
                        {value || 'Not set'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}

            <Paper sx={sectionCardSx}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Collaborative proposals
                </Typography>
                {formData.linkedCollaborativeProposals.length > 0 ? (
                  <Chip size="small" label={formData.linkedCollaborativeProposals.length} sx={{ height: 20, fontWeight: 700, bgcolor: alpha(PURPLE, 0.12), color: PURPLE }} />
                ) : null}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Optional. Link related collaborative writing work.
              </Typography>
              <Autocomplete
                fullWidth
                options={availableCollaborativeProposals.filter(
                  (item) => !formData.linkedCollaborativeProposals.some((linked) => linked.id === item.id)
                )}
                getOptionLabel={(option) => option.title || ''}
                loading={collaborativeProposalsLoading}
                onInputChange={(event, newInputValue) => setCollaborativeProposalSearch(newInputValue)}
                onChange={(event, newValue) => {
                  if (newValue) {
                    handleCollaborativeProposalSelect(newValue);
                    setCollaborativeProposalSearch('');
                  }
                }}
                value={null}
                inputValue={collaborativeProposalSearch}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search by title or author"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <SearchIcon sx={{ color: PURPLE, fontSize: 20, ml: 0.5, mr: 0.5 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {collaborativeProposalsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={fieldFocusSx}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ width: '100%', py: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        {option.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[option.authors, option.status, option.type].filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                  </li>
                )}
                noOptionsText={
                  collaborativeProposalsError
                    ? collaborativeProposalsError
                    : collaborativeProposalSearch
                      ? 'No collaborative proposals match this search'
                      : 'Start typing to search'
                }
              />
              {formData.linkedCollaborativeProposals.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  No collaborative proposals linked yet.
                </Typography>
              ) : (
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {formData.linkedCollaborativeProposals.map((proposal) => (
                    <Stack
                      key={proposal.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ px: 1.25, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          {proposal.title || 'Untitled proposal'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[proposal.authors, proposal.status, proposal.type].filter(Boolean).join(' · ') || 'Linked record'}
                        </Typography>
                      </Box>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => removeCollaborativeProposal(proposal.id)} sx={{ color: '#b91c1c' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepValid = (step) => {
    switch (step) {
      case 0: // Core Information
        const hasPrincipalInvestigator = formData.piOption === 'useProfile' || 
          (formData.piOption === 'searchOther' && formData.principalInvestigator);
        const hasDepartments = formData.departments && formData.departments.length > 0;
        const hasValidDates = !formData.startDate || !formData.endDate || 
          new Date(formData.endDate) >= new Date(formData.startDate);
        
        // Debug logging
        console.log('Step 0 Validation:', {
          title: formData.title,
          piOption: formData.piOption,
          hasPrincipalInvestigator,
          departments: formData.departments,
          hasDepartments,
          hasValidDates,
          isValid: formData.title && hasPrincipalInvestigator && hasDepartments && hasValidDates
        });
        
        return formData.title && hasPrincipalInvestigator && hasDepartments && hasValidDates;
      case 1: // Research Details
        return formData.fields.length > 0 && formData.researchObjectives && formData.abstract && formData.methodology;
      case 2: // Project Management
        return true; // Optional step - can be left blank and populated later
      case 3: // Funding and Grants
        return formData.fundingSource && formData.totalBudgetAmount && formData.budgetCurrency;
      case 4: // Ethical Considerations
        return true; // Optional step - can be completed as needed
      case 5: // Publications & Files
        return true; // Optional step
      case 6: // Summary
        return true; // Optional step - summary is for review only
      default:
        return false;
    }
  };

  return (
    <>
      <PageHeader
        title={proposalId ? 'Continue proposal' : t('researcher.create_proposal')}
        description={t(
          'researcher.create_proposal_desc',
          'Drafts save automatically when you pause, click Save draft, or leave this page.'
        )}
        icon={<ProposalIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: t('researcher.portal_title', 'Researcher Portal'), path: '/researcher' },
          { label: t('researcher.proposals', 'Proposals'), path: '/researcher/projects/proposals/list' },
        ]}
        actionButton={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {autoSaving ? (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={14} sx={{ color: 'white' }} />
                Saving...
              </Typography>
            ) : hasUnsavedChanges ? (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                Unsaved changes
              </Typography>
            ) : proposalId ? (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                Draft saved
              </Typography>
            ) : null}
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => handleNavigation(() => router.push('/researcher/projects/proposals/list'))}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Back to list
            </Button>
          </Stack>
        }
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap" gap={1}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Step {activeStep + 1} of {steps.length}: {STEP_META[activeStep].title}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: PURPLE }}>
              {Math.round(((activeStep + 1) / steps.length) * 100)}% complete
            </Typography>
          </Stack>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: alpha(PURPLE, 0.12), mb: 1.75, overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                width: `${((activeStep + 1) / steps.length) * 100}%`,
                bgcolor: PURPLE,
                transition: 'width 0.25s ease',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {STEP_META.map((item, index) => {
              const isCompleted = index < activeStep;
              const isActive = index === activeStep;
              return (
                <Box
                  key={item.label}
                  component="button"
                  type="button"
                  onClick={() => setActiveStep(index)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.25,
                    py: 0.7,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isActive ? PURPLE : isCompleted ? alpha(PURPLE, 0.35) : 'divider',
                    bgcolor: isActive ? PURPLE : isCompleted ? alpha(PURPLE, 0.08) : 'white',
                    color: isActive ? 'white' : '#334155',
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      bgcolor: isActive ? 'rgba(255,255,255,0.2)' : isCompleted ? PURPLE : alpha(PURPLE, 0.12),
                      color: isActive || isCompleted ? 'white' : PURPLE,
                    }}
                  >
                    {isCompleted ? <CheckIcon sx={{ fontSize: 13 }} /> : index + 1}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            minHeight: 480,
          }}
        >
          {renderStepContent(activeStep)}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowBackIcon />}
            sx={{ color: PURPLE, textTransform: 'none', fontWeight: 600 }}
          >
            Previous
          </Button>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveDraft}
              disabled={loading}
              sx={{
                borderColor: PURPLE,
                color: PURPLE,
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) },
              }}
            >
              {loading ? 'Saving...' : 'Save draft'}
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SubmitIcon />}
                onClick={handleSubmit}
                disabled={loading}
                sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#7a5aad' } }}
              >
                {loading ? 'Submitting...' : 'Submit proposal'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
                sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#7a5aad' } }}
              >
                Next
              </Button>
            )}
          </Stack>
        </Paper>
      </Container>

      {/* ORCID Search Modals */}
      <OrcidSearchModal
        open={piSearchModalOpen}
        onClose={() => setPiSearchModalOpen(false)}
        onSelect={handlePrincipalInvestigatorSelect}
        title="Search for principal investigator"
        subtitle="Find a researcher, then add an invite email if they are not you."
        requireInvite
        roleLabel="principal investigator"
        currentOrcid={user?.orcidId || ''}
      />

      <OrcidSearchModal
        open={coInvSearchModalOpen}
        onClose={() => setCoInvSearchModalOpen(false)}
        onSelect={handleCoInvestigatorSelect}
        title="Search for co-investigators"
        subtitle="Add one person, then search again. Click Done when you are finished."
        requireInvite
        allowMultiple
        roleLabel="co-investigator"
        currentOrcid={user?.orcidId || ''}
        excludeOrcidIds={formData.coInvestigators.map((person) => person.orcidId).filter(Boolean)}
      />

      <EthicsLinkModal
        open={ethicsSearchModalOpen}
        onClose={() => setEthicsSearchModalOpen(false)}
        onSelect={handleEthicsApplicationSelect}
        applications={existingEthicsApplications}
        loading={loadingEthicsApps}
      />

      <UploadCertificateDialog
        open={ethicsCertUploadOpen}
        onClose={() => setEthicsCertUploadOpen(false)}
        onUploaded={handleEthicsCertificateUploaded}
        user={user}
        defaults={{
          title: formData.title || '',
          principalInvestigator: formData.piOption === 'useProfile'
            ? `${user?.givenName || ''} ${user?.familyName || ''}`.trim()
            : (formData.principalInvestigator || ''),
          department: formData.departments?.[0] || '',
          committeeName: formData.ethicsCommittee || '',
          referenceNumber: formData.ethicsApprovalReference || '',
          approvalDate: formData.approvalDate || '',
        }}
      />

      <Dialog
        open={Boolean(viewingInvestigator)}
        onClose={() => setViewingInvestigator(null)}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.75,
            px: 2.5,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white' }}>
              {viewingInvestigator?.title || 'Investigator details'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.88)' }}>
              {viewingInvestigator?.name || 'Researcher'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setViewingInvestigator(null)}
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.16)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: '24px !important' }}>
          <Stack spacing={1.5}>
            {[
              ['Name', viewingInvestigator?.name],
              ['ORCID', viewingInvestigator?.orcidId],
              ['Institution', viewingInvestigator?.institution],
              ['Department', viewingInvestigator?.department],
              ['Invite email', viewingInvestigator?.email],
              ['Role', viewingInvestigator?.role],
            ].map(([label, value]) => (
              <Box key={label}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ color: value ? '#1e293b' : '#94a3b8' }}>
                  {value || 'Not set'}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#faf8fc' }}>
          <Button onClick={() => setViewingInvestigator(null)} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </>
  );
};

export default CreateProposalPage;