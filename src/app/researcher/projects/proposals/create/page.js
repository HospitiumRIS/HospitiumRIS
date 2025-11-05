'use client';

import React, { useState, useEffect } from 'react';
import OrcidSearchModal from './components/OrcidSearchModal';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  'Health Informatics'
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
  'Related Publications & Files',
  'Proposal Summary'
];

const CreateProposalPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  
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
  
  // Unsaved changes and auto-save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [proposalId, setProposalId] = useState(null); // For updating existing drafts

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
        setFormData({
          // Step 1: Core Information
          title: proposal.title || '',
          type: proposal.type || '',
          piOption: 'useProfile',
          principalInvestigator: proposal.principalInvestigator || '',
          principalInvestigatorOrcid: proposal.principalInvestigatorOrcid || '',
          principalInvestigatorAffiliations: [],
          coInvestigators: proposal.coInvestigators || [],
          institution: proposal.institution || '',
          departments: proposal.departments || [],
          email: proposal.email || '',
          phone: proposal.phone || '',
          orcidId: proposal.orcidId || '',
          
          // Step 2: Research Details
          fields: proposal.researchAreas || [],
          researchObjectives: proposal.researchObjectives || '',
          abstract: proposal.abstract || '',
          methodology: proposal.methodology || '',
          
          // Step 3: Project Management
          milestones: proposal.milestones || [],
          deliverables: proposal.deliverables || [],
          
          // Step 4: Funding and Grants
          fundingSource: proposal.fundingSource || '',
          grantNumber: proposal.grantNumber || '',
          fundingInstitution: proposal.fundingInstitution || '',
          grantStartDate: proposal.grantStartDate || '',
          grantEndDate: proposal.grantEndDate || '',
          totalBudgetAmount: proposal.totalBudgetAmount || '',
          
          // Step 5: Ethical Considerations & Data Management
          ethicalConsiderationsOverview: proposal.ethicalConsiderationsOverview || '',
          consentProcedures: proposal.consentProcedures || '',
          ethicsApprovalStatus: proposal.ethicsApprovalStatus || '',
          ethicsApprovalReference: proposal.ethicsApprovalReference || '',
          ethicsCommittee: proposal.ethicsCommittee || '',
          approvalDate: proposal.approvalDate || '',
          dataSecurityMeasures: proposal.dataSecurityMeasures || '',
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
        });

        // Set as last saved data to prevent unsaved changes detection
        setLastSavedData({...formData});
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
    principalInvestigatorAffiliations: [],
    coInvestigators: [],
    institution: '',
    departments: [],
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
    
    // Step 5: Ethical Considerations & Data Management
    ethicalConsiderationsOverview: '',
    consentProcedures: '',
    ethicsApprovalStatus: '',
    ethicsApprovalReference: '',
    ethicsCommittee: '',
    approvalDate: '',
    dataSecurityMeasures: '',
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
    if (lastSavedData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(lastSavedData);
      setHasUnsavedChanges(hasChanges);
    } else {
      // If no saved data yet, consider any non-empty form as having changes
      const hasAnyData = Object.values(formData).some(value => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim() !== '';
        return value !== null && value !== undefined && value !== '';
      });
      setHasUnsavedChanges(hasAnyData);
    }
  }, [formData, lastSavedData]);

  // Auto-save when moving between steps
  useEffect(() => {
    if (hasUnsavedChanges && !autoSaving && formData.title?.trim()) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 3000); // Auto-save after 3 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [activeStep, hasUnsavedChanges, formData.title]);

  // Handle browser navigation/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-save function
  const handleAutoSave = async () => {
    if (autoSaving) return;
    
    // Don't auto-save if there's no meaningful content
    if (!formData.title?.trim()) {
      return;
    }
    
    setAutoSaving(true);
    try {
      await saveDraftToDatabase('DRAFT', false); // Silent save
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error notifications for auto-save failures
      // The user can still manually save
    } finally {
      setAutoSaving(false);
    }
  };

  // Generic save function
  const saveDraftToDatabase = async (status = 'DRAFT', showNotification = true) => {
    try {
      // Validate required fields for saving
      if (!formData.title?.trim()) {
        if (showNotification) {
          setSnackbar({
            open: true,
            message: 'Please enter a proposal title before saving.',
            severity: 'warning'
          });
        }
        throw new Error('Title is required');
      }

      // Create FormData for file uploads
      const submitData = new FormData();

      // Add all form fields as JSON
      const proposalData = {
        // Core Information
        title: formData.title,
        principalInvestigator: formData.piOption === 'useProfile' ? 
          `${user?.givenName || ''} ${user?.familyName || ''}`.trim() || 'Current User' : 
          formData.principalInvestigatorName,
        principalInvestigatorOrcid: formData.piOption === 'useProfile' ? 
          user?.orcidId || null : 
          formData.principalInvestigatorOrcid,
        coInvestigators: formData.coInvestigators,
        departments: formData.departments,
        startDate: formData.startDate,
        endDate: formData.endDate,

        // Research Details
        researchAreas: formData.fields,
        researchObjectives: formData.researchObjectives,
        methodology: formData.methodology,
        abstract: formData.abstract,

        // Project Management
        milestones: formData.milestones,
        deliverables: formData.deliverables,

        // Funding and Grants
        fundingSource: formData.fundingSource,
        grantNumber: formData.grantNumber,
        fundingInstitution: formData.fundingInstitution,
        grantStartDate: formData.grantStartDate,
        grantEndDate: formData.grantEndDate,
        totalBudgetAmount: formData.totalBudgetAmount,

        // Ethical Considerations
        ethicalConsiderationsOverview: formData.ethicalConsiderationsOverview,
        consentProcedures: formData.consentProcedures,
        dataSecurityMeasures: formData.dataSecurityMeasures,
        ethicsApprovalStatus: formData.ethicsApprovalStatus,
        ethicsApprovalReference: formData.ethicsApprovalReference,
        ethicsCommittee: formData.ethicsCommittee,
        approvalDate: formData.approvalDate,

        // Related Publications & Files
        selectedPublications: formData.selectedPublications,
        publicationRelevance: formData.publicationRelevance,
        linkedCollaborativeProposals: formData.linkedCollaborativeProposals,

        // Summary
        impactStatement: formData.impactStatement,
        disseminationPlan: formData.disseminationPlan,

        // Status
        status: status
      };

      submitData.append('proposalData', JSON.stringify(proposalData));

      // Add files
      formData.ethicsDocuments.forEach((file) => {
        submitData.append(`ethicsDocuments`, file);
      });

      formData.dataManagementPlan.forEach((file) => {
        submitData.append(`dataManagementPlan`, file);
      });

      formData.otherRelatedFiles.forEach((file) => {
        submitData.append(`otherRelatedFiles`, file);
      });

      // Use PUT if updating existing proposal, POST if creating new
      const method = proposalId ? 'PUT' : 'POST';
      const url = proposalId ? `/api/proposals/${proposalId}` : '/api/proposals';

      const response = await fetch(url, {
        method: method,
        body: submitData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to save proposal: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update proposal ID if this was a new proposal
        if (!proposalId && result.proposal?.id) {
          setProposalId(result.proposal.id);
        }
        
        // Update last saved data
        setLastSavedData({ ...formData });
        setHasUnsavedChanges(false);

        if (showNotification) {
          setSnackbar({
            open: true,
            message: status === 'DRAFT' ? 'Draft saved successfully!' : 'Proposal submitted successfully!',
            severity: 'success'
          });
        }

        return result;
      } else {
        throw new Error(result.error || 'Failed to save proposal');
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
      if (showNotification) {
        setSnackbar({
          open: true,
          message: 'Failed to save proposal. Please try again.',
          severity: 'error'
        });
      }
      throw error;
    }
  };

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
    setFormData(prev => ({
      ...prev,
      departments: newValue
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
      
      // Redirect after a short delay to show the snackbar
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

  // Navigation with unsaved changes check
  const handleNavigation = (navigationFn) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationFn);
      setShowUnsavedModal(true);
    } else {
      navigationFn();
    }
  };

  const handleUnsavedModalSave = async () => {
    try {
      await saveDraftToDatabase('DRAFT', true);
      setShowUnsavedModal(false);
      if (pendingNavigation) {
        pendingNavigation();
        setPendingNavigation(null);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const handleUnsavedModalDiscard = () => {
    setShowUnsavedModal(false);
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleUnsavedModalCancel = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
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
      milestones: [...prev.milestones, { title: '', targetDate: '', description: '' }]
    }));
  };

  const handleRemoveMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const handleMilestoneChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Deliverable handlers
  const handleAddDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, { title: '', dueDate: '', description: '', type: '' }]
    }));
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
  const handlePrincipalInvestigatorSelect = (researcher) => {
    setFormData(prev => ({
      ...prev,
      principalInvestigator: researcher.creditName,
      principalInvestigatorOrcid: researcher.orcidId,
      principalInvestigatorAffiliations: researcher.affiliations || []
    }));
  };

  const handleCoInvestigatorSelect = (researcher) => {
    const newCoInvestigator = {
      name: researcher.creditName,
      email: '', // Will need to be filled manually
      role: researcher.employmentSummary || '',
      institution: researcher.affiliations?.[0] || '',
      orcidId: researcher.orcidId,
      affiliations: researcher.affiliations || []
    };

    setFormData(prev => ({
      ...prev,
      coInvestigators: [...prev.coInvestigators, newCoInvestigator]
    }));
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
      await saveDraftToDatabase('DRAFT', true);
      // Navigate to proposals list after successful save
      setTimeout(() => {
        router.push('/researcher/projects/proposals/list');
      }, 1000);
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
            {/* Step Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.1) 0%, rgba(139, 108, 188, 0.05) 100%)',
              border: '1px solid rgba(139, 108, 188, 0.2)'
            }}>
              <InfoIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.25, fontSize: '1.3rem' }}>
                  Core Information
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500, fontSize: '0.85rem' }}>
                  Basic details about your research proposal
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Basic Project Information Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
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
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Principal Investigator
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                  Who will be the principal investigator for this proposal?
                </Typography>
                
                <RadioGroup
                  value={formData.piOption || 'useProfile'}
                  onChange={(e) => handleInputChange('piOption', e.target.value)}
                  sx={{ mb: 2 }}
                >
                  <FormControlLabel
                    value="useProfile"
                    control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />}
                    label={
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Use my profile as Principal Investigator
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Steve Gaita (0009-0009-4810-6393)
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="searchOther"
                    control={<Radio sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }} />}
                    label={
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Search for a different Principal Investigator
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Find and select another researcher using ORCID search
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>

                {formData.piOption === 'searchOther' && (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<SearchIcon />}
                      onClick={() => setPiSearchModalOpen(true)}
                      sx={{
                        borderColor: '#8b6cbc',
                        color: '#8b6cbc',
                        '&:hover': {
                          borderColor: '#7a5aa8',
                          backgroundColor: 'rgba(139, 108, 188, 0.04)'
                        }
                      }}
                    >
                      Search ORCID Database
                    </Button>
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
              <TextField
                fullWidth
                      label="Principal Investigator Name *"
                      value={
                        formData.piOption === 'useProfile' || !formData.piOption
                          ? 'Steve Gaita'
                          : formData.principalInvestigator
                      }
                      onChange={(e) => handleInputChange('principalInvestigator', e.target.value)}
                      placeholder="Name from your ORCID profile"
                      disabled={formData.piOption === 'useProfile' || !formData.piOption}
                      InputProps={{
                        startAdornment: (
                          <PersonIcon sx={{ mr: 1, color: '#8b6cbc' }} />
                        ),
                      }}
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
                    <Typography variant="caption" sx={{ color: '#666', mt: 0.5, display: 'block' }}>
                      {formData.piOption === 'searchOther' && formData.principalInvestigator
                        ? `Selected from ORCID: ${formData.principalInvestigator}`
                        : 'Name from your ORCID profile'
                      }
                    </Typography>
                  </Box>

                  <Box>
              <TextField
                fullWidth
                      label="Principal Investigator ORCID ID"
                      value={
                        formData.piOption === 'useProfile' || !formData.piOption
                          ? '0009-0009-4810-6393'
                          : formData.principalInvestigatorOrcid
                      }
                      onChange={(e) => handleInputChange('principalInvestigatorOrcid', e.target.value)}
                      placeholder="ORCID ID from your profile"
                      disabled={formData.piOption === 'useProfile' || !formData.piOption}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ 
                            backgroundColor: '#8b6cbc', 
                            color: 'white', 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1, 
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            mr: 1
                          }}>
                            ORCID
                          </Box>
                        ),
                      }}
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
                    <Typography variant="caption" sx={{ color: '#666', mt: 0.5, display: 'block' }}>
                      ORCID ID from your profile
                    </Typography>
                  </Box>
                </Box>
              </Paper>

            {/* Co-Investigators Card */}
            <Paper 
              sx={{ 
                p: 2.5, 
                border: '1px solid #e0e0e0', 
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.02) 0%, rgba(255, 255, 255, 0.8) 100%)',
                width: '100%'
              }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <TeamIcon sx={{ mr: 2, color: '#8b6cbc', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Co-Investigators
                </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.85rem' }}>
                  Add team members and collaborators for this research proposal
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                    size="medium"
                    startIcon={<SearchIcon />}
                  onClick={handleAddCoInvestigator}
                    sx={{ 
                      borderColor: '#8b6cbc', 
                      color: '#8b6cbc',
                      alignSelf: 'flex-start',
                      '&:hover': {
                        borderColor: '#7a5aa8',
                        backgroundColor: 'rgba(139, 108, 188, 0.04)'
                      }
                    }}
                  >
                    Search & Add Co-Investigator
                </Button>
              
                  {formData.coInvestigators.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#2D3748' }}>
                        Selected Co-Investigators ({formData.coInvestigators.length})
                      </Typography>
              
              {formData.coInvestigators.map((coInv, index) => (
                    <Paper 
                      key={index} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.9)'
                      }}
                    >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1rem' }}>
                      Co-Investigator {index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveCoInvestigator(index)}
                          sx={{ 
                            color: '#f44336',
                            '&:hover': {
                              backgroundColor: 'rgba(244, 67, 54, 0.04)'
                            }
                          }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={coInv.name}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <PersonIcon sx={{ mr: 1, color: '#8b6cbc' }} />
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#f8f9fa',
                            },
                          }}
                        />
                        
                        {coInv.orcidId && (
                      <TextField
                        fullWidth
                            label="ORCID ID"
                            value={coInv.orcidId}
                            disabled
                            InputProps={{
                              startAdornment: (
                                <Box sx={{ 
                                  backgroundColor: '#8b6cbc', 
                                  color: 'white', 
                                  px: 1, 
                                  py: 0.5, 
                                  borderRadius: 1, 
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  mr: 1
                                }}>
                                  ORCID
                                </Box>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: '#f8f9fa',
                              },
                            }}
                          />
                        )}
                        
                        <TextField
                          fullWidth
                          label="Email *"
                        type="email"
                        value={coInv.email}
                        onChange={(e) => handleCoInvestigatorChange(index, 'email', e.target.value)}
                          placeholder="Enter email address"
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
                        
                      <TextField
                        fullWidth
                          label="Role/Position"
                        value={coInv.role}
                          disabled
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#f8f9fa',
                            },
                          }}
                        />
                        
                      <TextField
                        fullWidth
                        label="Institution"
                        value={coInv.institution}
                          disabled
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#f8f9fa',
                            },
                          }}
                        />
                      </Box>
                </Paper>
              ))}
                    </Box>
                  )}
                </Box>
              </Paper>

            {/* Departments Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ManagementIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Departments *
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                Select one or more departments. You can also add new departments not in the list.
              </Typography>
              
              <Autocomplete
                multiple
                freeSolo
                options={DEPARTMENTS}
                value={formData.departments || []}
                onChange={handleDepartmentChange}
                filterOptions={(options, params) => {
                  const filtered = options.filter(option =>
                    option.toLowerCase().includes(params.inputValue.toLowerCase())
                  );
                  
                  // Add option to create new department if input doesn't match any existing
                  const { inputValue } = params;
                  const isExisting = options.some(option => 
                    inputValue.toLowerCase() === option.toLowerCase()
                  );
                  
                  if (inputValue !== '' && !isExisting) {
                    filtered.push(`Add "${inputValue}"`);
                  }
                  
                  return filtered;
                }}
                getOptionLabel={(option) => {
                  // Handle "Add new" options
                  if (typeof option === 'string' && option.startsWith('Add "')) {
                    return option.slice(5, -1); // Remove 'Add "' and '"'
                  }
                  return option;
                }}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      {option.startsWith('Add "') ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AddIcon sx={{ mr: 1, color: '#8b6cbc', fontSize: 18 }} />
                          <Typography>
                            Add "{option.slice(5, -1)}"
                          </Typography>
                        </Box>
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
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                        sx={{
                          borderColor: isCustom ? '#ff9800' : '#8b6cbc',
                          color: isCustom ? '#ff9800' : '#8b6cbc',
                          backgroundColor: isCustom ? 'rgba(255, 152, 0, 0.04)' : 'transparent',
                          '& .MuiChip-deleteIcon': {
                            color: isCustom ? '#ff9800' : '#8b6cbc',
                            '&:hover': {
                              color: isCustom ? '#f57c00' : '#7a5aa8'
                            }
                          }
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select or add departments"
                    placeholder={formData.departments?.length === 0 ? "Type to search or add new department" : "Add more departments"}
                    error={formData.departments && formData.departments.length === 0}
                    helperText={
                      formData.departments && formData.departments.length === 0
                        ? "At least one department is required"
                        : `${formData.departments?.length || 0} department(s) selected`
                    }
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
                )}
                sx={{
                  '& .MuiAutocomplete-popupIndicator': {
                    color: '#8b6cbc',
                  },
                  '& .MuiAutocomplete-clearIndicator': {
                    color: '#8b6cbc',
                  },
                }}
              />
              
              {formData.departments && formData.departments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>
                    Selected Departments ({formData.departments.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {formData.departments.map((dept, index) => {
                      const isCustom = !DEPARTMENTS.includes(dept);
                      return (
                        <Chip
                          key={index}
                          label={dept}
                          size="small"
                          sx={{
                            backgroundColor: isCustom ? '#ff9800' : '#8b6cbc',
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        />
                      );
                    })}
                  </Box>
                  
                  {/* Legend */}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        backgroundColor: '#8b6cbc', 
                        borderRadius: 1 
                      }} />
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                        Standard
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        backgroundColor: '#ff9800', 
                        borderRadius: 1 
                      }} />
                      <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                        Custom
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Project Timeline Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Project Timeline
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                Specify the expected start and end dates for your project (optional).
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Optional - When do you plan to start?"
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

                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Optional - Expected completion date"
                  error={
                    formData.startDate && 
                    formData.endDate && 
                    new Date(formData.endDate) < new Date(formData.startDate)
                  }
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
              </Box>
              
              {/* Date validation error */}
              {formData.startDate && 
               formData.endDate && 
               new Date(formData.endDate) < new Date(formData.startDate) && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: '#f44336' }}>
                    End date cannot be before start date
                  </Typography>
                </Box>
              )}
              
              {(formData.startDate || formData.endDate) && (
                <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'rgba(139, 108, 188, 0.04)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                    Project Duration:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#2D3748', fontWeight: 500 }}>
                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Not specified'} 
                    {' → '}
                    {formData.endDate ? new Date(formData.endDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Not specified'}
                  </Typography>
                  {formData.startDate && formData.endDate && (
                    <Typography variant="caption" sx={{ color: '#8b6cbc', display: 'block', mt: 0.5 }}>
                      Duration: {Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>

            </Box>
        </Box>
        );

      case 1: // Research Details
        return (
          <Box>
            {/* Step Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.1) 0%, rgba(139, 108, 188, 0.05) 100%)',
              border: '1px solid rgba(139, 108, 188, 0.2)'
            }}>
              <ScienceIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.25, fontSize: '1.3rem' }}>
                  Research Scope & Details
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500, fontSize: '0.85rem' }}>
                  Define your research areas, objectives, methods, and provide an abstract.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Research Areas Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScienceIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Research Areas *
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                Select all relevant research areas for your project
              </Typography>
              
              <Autocomplete
                multiple
                freeSolo
                options={RESEARCH_FIELDS}
                value={formData.fields || []}
                onChange={(event, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    fields: newValue
                  }));
                }}
                filterOptions={(options, params) => {
                  const filtered = options.filter(option =>
                    option.toLowerCase().includes(params.inputValue.toLowerCase())
                  );
                  
                  const { inputValue } = params;
                  const isExisting = options.some(option => 
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AddIcon sx={{ mr: 1, color: '#8b6cbc', fontSize: 18 }} />
                          <Typography>
                            Add "{option.slice(5, -1)}"
                          </Typography>
                        </Box>
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
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                        sx={{
                          borderColor: isCustom ? '#ff9800' : '#8b6cbc',
                          color: isCustom ? '#ff9800' : '#8b6cbc',
                          backgroundColor: isCustom ? 'rgba(255, 152, 0, 0.04)' : 'transparent',
                          '& .MuiChip-deleteIcon': {
                            color: isCustom ? '#ff9800' : '#8b6cbc',
                            '&:hover': {
                              color: isCustom ? '#f57c00' : '#7a5aa8'
                            }
                          }
                        }}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select or add research areas"
                    placeholder={formData.fields?.length === 0 ? "Type to search or add new area" : "Add more areas"}
                    error={formData.fields && formData.fields.length === 0}
                    helperText={
                      formData.fields && formData.fields.length === 0
                        ? "At least one research area is required"
                        : `${formData.fields?.length || 0} area(s) selected`
                    }
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
                )}
                sx={{
                  '& .MuiAutocomplete-popupIndicator': {
                    color: '#8b6cbc',
                  },
                  '& .MuiAutocomplete-clearIndicator': {
                    color: '#8b6cbc',
                  },
                }}
              />
            </Paper>

            {/* Research Objectives Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Research Objectives *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Research Objectives"
                value={formData.researchObjectives || ''}
                onChange={(e) => handleInputChange('researchObjectives', e.target.value)}
                placeholder="Clearly state your research objectives. What do you aim to achieve with this research? List your primary and secondary objectives..."
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

            {/* Research Methods Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Research Methods *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Research Methods"
                value={formData.methodology || ''}
                onChange={(e) => handleInputChange('methodology', e.target.value)}
                placeholder="Describe your research methodology in detail. Include your research design, data collection methods, analysis techniques, and any tools or instruments you will use..."
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

            {/* Abstract Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Abstract *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="Abstract"
                value={formData.abstract || ''}
                onChange={(e) => handleInputChange('abstract', e.target.value)}
                placeholder="Provide a comprehensive abstract of your research proposal. Include background, objectives, methodology, expected outcomes, and significance (recommended 250-500 words)..."
                helperText={`${formData.abstract?.length || 0}/2000 characters`}
                inputProps={{ maxLength: 2000 }}
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

            </Box>
          </Box>
        );

      case 2: // Project Management
        return (
          <Box>
            {/* Step Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.1) 0%, rgba(139, 108, 188, 0.05) 100%)',
              border: '1px solid rgba(139, 108, 188, 0.2)'
            }}>
              <ManagementIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.25, fontSize: '1.3rem' }}>
                  Project Management & Timeline
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500, fontSize: '0.85rem' }}>
                  Define project milestones, deliverables, and potential risks.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Project Milestones Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                    Project Milestones
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddMilestone}
                  sx={{
                    borderColor: '#8b6cbc',
                    color: '#8b6cbc',
                    '&:hover': {
                      borderColor: '#7a5aa8',
                      backgroundColor: 'rgba(139, 108, 188, 0.04)'
                    }
                  }}
                >
                  Add Milestone
                </Button>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                Add key milestones and target dates for your project (optional).
              </Typography>

              {formData.milestones.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 3, 
                  border: '2px dashed #e0e0e0', 
                  borderRadius: 2,
                  backgroundColor: '#fafafa'
                }}>
                  <TimelineIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    No milestones added yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    Click "Add Milestone" to get started, or leave blank to populate later
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {formData.milestones.map((milestone, index) => (
                    <Paper 
                      key={index}
                      sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                          Milestone {index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveMilestone(index)}
                          sx={{ 
                            color: '#f44336',
                            '&:hover': {
                              backgroundColor: 'rgba(244, 67, 54, 0.04)'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Milestone Title"
                          value={milestone.title}
                          onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                          placeholder="Enter milestone title"
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
                        
                        <TextField
                          fullWidth
                          label="Target Date"
                          type="date"
                          value={milestone.targetDate}
                          onChange={(e) => handleMilestoneChange(index, 'targetDate', e.target.value)}
                          InputLabelProps={{
                            shrink: true,
                          }}
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
                        
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Description"
                          value={milestone.description}
                          onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                          placeholder="Describe what will be achieved at this milestone"
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
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Paper>

            {/* Project Deliverables Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                    Project Deliverables
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddDeliverable}
                  sx={{
                    borderColor: '#8b6cbc',
                    color: '#8b6cbc',
                    '&:hover': {
                      borderColor: '#7a5aa8',
                      backgroundColor: 'rgba(139, 108, 188, 0.04)'
                    }
                  }}
                >
                  Add Deliverable
                </Button>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                Define specific deliverables and their due dates (optional).
              </Typography>

              {formData.deliverables.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 3, 
                  border: '2px dashed #e0e0e0', 
                  borderRadius: 2,
                  backgroundColor: '#fafafa'
                }}>
                  <AssignmentIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    No deliverables added yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    Click "Add Deliverable" to get started, or leave blank to populate later
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {formData.deliverables.map((deliverable, index) => (
                    <Paper 
                      key={index}
                      sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 2,
                        background: 'rgba(255, 255, 255, 0.9)'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2D3748' }}>
                          Deliverable {index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveDeliverable(index)}
                          sx={{ 
                            color: '#f44336',
                            '&:hover': {
                              backgroundColor: 'rgba(244, 67, 54, 0.04)'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {/* Title - Full Width */}
                        <TextField
                          fullWidth
                          label="Deliverable Title"
                          value={deliverable.title}
                          onChange={(e) => handleDeliverableChange(index, 'title', e.target.value)}
                          placeholder="Enter deliverable title"
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
                        
                        {/* Type and Due Date - Side by Side */}
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                          gap: 2 
                        }}>
                          <Box>
                            <InputLabel 
                              id={`deliverable-type-label-${index}`} 
                              sx={{ 
                                color: '#666',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                mb: 0.5,
                                '&.Mui-focused': {
                                  color: '#8b6cbc',
                                }
                              }}
                            >
                              Type *
                            </InputLabel>
                            <Select
                              labelId={`deliverable-type-label-${index}`}
                              fullWidth
                              value={deliverable.type}
                              displayEmpty
                              sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(0, 0, 0, 0.23)',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#8b6cbc',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#8b6cbc',
                                },
                                '& .MuiSelect-select': {
                                  py: 1.5,
                                }
                              }}
                              onChange={(e) => handleDeliverableChange(index, 'type', e.target.value)}
                            >
                              <MenuItem value="" disabled>
                                <em>Select deliverable type</em>
                              </MenuItem>
                              {DELIVERABLE_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                  {type}
                                </MenuItem>
                              ))}
                            </Select>
                          </Box>
                          
                          <Box>
                            <InputLabel 
                              sx={{ 
                                color: '#666',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                mb: 0.5
                              }}
                            >
                              Due Date
                            </InputLabel>
                            <TextField
                              fullWidth
                              type="date"
                              value={deliverable.dueDate}
                              onChange={(e) => handleDeliverableChange(index, 'dueDate', e.target.value)}
                              InputProps={{
                                sx: {
                                  '& input': {
                                    py: 1.5,
                                  }
                                }
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: '#8b6cbc',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#8b6cbc',
                                  },
                                },
                              }}
                            />
                          </Box>
                        </Box>
                        
                        {/* Description - Full Width */}
                        <Box>
                          <InputLabel 
                            sx={{ 
                              color: '#666',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              mb: 0.5
                            }}
                          >
                            Description
                          </InputLabel>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={deliverable.description}
                            onChange={(e) => handleDeliverableChange(index, 'description', e.target.value)}
                            placeholder="Describe the deliverable, its specifications, and expected outcomes..."
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: '#8b6cbc',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#8b6cbc',
                                },
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Paper>


            </Box>
          </Box>
        );

      case 3: // Funding and Grants
        return (
          <Box>
            {/* Step Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.1) 0%, rgba(139, 108, 188, 0.05) 100%)',
              border: '1px solid rgba(139, 108, 188, 0.2)'
            }}>
              <BudgetIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.25, fontSize: '1.3rem' }}>
                  Funding & Budget
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500, fontSize: '0.85rem' }}>
                  Specify the funding source, grant details, and budget breakdown.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Funding Source Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Funding Source
              </Typography>
              
              <Box>
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
                      label="Funding Source *"
                      placeholder="Select or enter a funding source"
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
                  )}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        {option}
                      </Box>
                    );
                  }}
                  sx={{
                    '& .MuiAutocomplete-popupIndicator': {
                      color: '#8b6cbc',
                    },
                    '& .MuiAutocomplete-clearIndicator': {
                      color: '#8b6cbc',
                    },
                  }}
                />
              </Box>
            </Paper>

            {/* Grant Details Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Grant Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Grant Number and Funding Institution - Side by Side */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2 
                }}>
                  <TextField
                    fullWidth
                    label="Grant Number"
                    value={formData.grantNumber}
                    onChange={(e) => handleInputChange('grantNumber', e.target.value)}
                    placeholder="Enter the unique identifier for the grant"
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
                  
                  <TextField
                    fullWidth
                    label="Funding Institution"
                    value={formData.fundingInstitution}
                    onChange={(e) => handleInputChange('fundingInstitution', e.target.value)}
                    placeholder="Enter the name of the funding institution"
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
                </Box>

                {/* Grant Start Date and End Date - Side by Side */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2 
                }}>
                  <Box>
                    <InputLabel 
                      sx={{ 
                        color: '#666',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Grant Start Date *
                    </InputLabel>
                    <TextField
                      fullWidth
                      type="date"
                      value={formData.grantStartDate}
                      onChange={(e) => handleInputChange('grantStartDate', e.target.value)}
                      InputProps={{
                        sx: {
                          '& input': {
                            py: 1.5,
                          }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#8b6cbc',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#8b6cbc',
                          },
                        },
                      }}
                    />
                  </Box>
                  
                  <Box>
                    <InputLabel 
                      sx={{ 
                        color: '#666',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Grant End Date *
                    </InputLabel>
                    <TextField
                      fullWidth
                      type="date"
                      value={formData.grantEndDate}
                      onChange={(e) => handleInputChange('grantEndDate', e.target.value)}
                      InputProps={{
                        sx: {
                          '& input': {
                            py: 1.5,
                          }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#8b6cbc',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#8b6cbc',
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Budget Information Card */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                <BudgetIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                  Budget Information
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.85rem' }}>
                Specify the total budget amount for this research proposal
              </Typography>
              
              <Box>
                <InputLabel 
                  sx={{ 
                    color: '#666',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mb: 0.5
                  }}
                >
                  Total Budget Amount *
                </InputLabel>
                <TextField
                  fullWidth
                  type="number"
                  value={formData.totalBudgetAmount}
                  onChange={(e) => handleInputChange('totalBudgetAmount', e.target.value)}
                  placeholder="Enter the total budget amount for the entire research project"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mr: 1,
                        color: '#8b6cbc',
                        fontWeight: 600,
                        fontSize: '1.1rem'
                      }}>
                        $
                      </Box>
                    ),
                    sx: {
                      '& input': {
                        py: 1.5,
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#8b6cbc',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#8b6cbc',
                      },
                    },
                  }}
                />
              </Box>
            </Paper>

            </Box>
          </Box>
        );

      case 4: // Ethical Considerations & Data Management
        return (
          <Box>
            {/* Step Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.1) 0%, rgba(139, 108, 188, 0.05) 100%)',
              border: '1px solid rgba(139, 108, 188, 0.2)'
            }}>
              <EthicsIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.25, fontSize: '1.3rem' }}>
                  Ethical Considerations
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500, fontSize: '0.85rem' }}>
                  Detail any ethical considerations, consent procedures, and data security measures.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Ethical Considerations Overview */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Ethical Considerations Overview"
                value={formData.ethicalConsiderationsOverview}
                onChange={(e) => handleInputChange('ethicalConsiderationsOverview', e.target.value)}
                placeholder="Provide a comprehensive overview of ethical considerations for your research"
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

            {/* Consent Procedures */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Consent Procedures"
                value={formData.consentProcedures}
                onChange={(e) => handleInputChange('consentProcedures', e.target.value)}
                placeholder="Explain your informed consent process"
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

            {/* Data Security and Privacy Measures */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Data Security and Privacy Measures"
                value={formData.dataSecurityMeasures}
                onChange={(e) => handleInputChange('dataSecurityMeasures', e.target.value)}
                placeholder="Detail your data protection and security measures"
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

            {/* Ethics Approval Details */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Ethics Approval Information
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Ethics Approval Status and Reference Number - Side by Side */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2 
                }}>
                  <Box>
                    <InputLabel 
                      sx={{ 
                        color: '#666',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Ethics Approval Status
                    </InputLabel>
                    <Select
                      fullWidth
                      value={formData.ethicsApprovalStatus}
                      displayEmpty
                      onChange={(e) => handleInputChange('ethicsApprovalStatus', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc',
                        },
                        '& .MuiSelect-select': {
                          py: 1.5,
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>Select approval status</em>
                      </MenuItem>
                      {ETHICS_APPROVAL_STATUS.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="Ethics Approval Reference Number"
                    value={formData.ethicsApprovalReference}
                    onChange={(e) => handleInputChange('ethicsApprovalReference', e.target.value)}
                    placeholder="Enter the reference number if approval has been obtained"
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
                </Box>

                {/* Ethics Committee and Approval Date - Side by Side */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2 
                }}>
                  <TextField
                    fullWidth
                    label="Ethics Committee/IRB"
                    value={formData.ethicsCommittee}
                    onChange={(e) => handleInputChange('ethicsCommittee', e.target.value)}
                    placeholder="Specify which ethics committee will review/has reviewed this research"
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
                  
                  <Box>
                    <InputLabel 
                      sx={{ 
                        color: '#666',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      Approval Date
                    </InputLabel>
                    <TextField
                      fullWidth
                      type="date"
                      value={formData.approvalDate}
                      onChange={(e) => handleInputChange('approvalDate', e.target.value)}
                      helperText="Date of ethics approval (if obtained)"
                      InputProps={{
                        sx: {
                          '& input': {
                            py: 1.5,
                          }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                            borderColor: '#8b6cbc',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#8b6cbc',
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Ethics Documentation Upload */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2, 
              border: '2px dashed #8b6cbc',
              background: 'rgba(139, 108, 188, 0.02)',
              width: '100%'
            }}>
              <Box sx={{ textAlign: 'center', mb: formData.ethicsDocuments.length > 0 ? 2 : 0 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                  Ethics Documentation
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                  Upload supporting documents such as ethics approval letters, consent forms, participant information sheets, or protocols.
                </Typography>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleEthicsDocumentUpload}
                  style={{ display: 'none' }}
                  id="ethics-documents-upload"
                />
                <label htmlFor="ethics-documents-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    sx={{
                      borderColor: '#8b6cbc',
                      color: '#8b6cbc',
                      '&:hover': {
                        borderColor: '#7a5aa8',
                        backgroundColor: 'rgba(139, 108, 188, 0.04)'
                      }
                    }}
                  >
                    Upload Ethics Documents
                  </Button>
                </label>
              </Box>

              {/* Display uploaded files */}
              {formData.ethicsDocuments.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                    Uploaded Files ({formData.ethicsDocuments.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {formData.ethicsDocuments.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          backgroundColor: 'white',
                          borderRadius: 1,
                          border: '1px solid rgba(139, 108, 188, 0.2)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FilesIcon sx={{ mr: 1, color: '#8b6cbc', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" sx={{ ml: 1, color: '#666' }}>
                            ({(file.size / 1024).toFixed(1)} KB)
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeEthicsDocument(index)}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Data Management Plan Upload */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2, 
              border: '2px dashed #4caf50',
              background: 'rgba(76, 175, 80, 0.02)',
              width: '100%'
            }}>
              <Box sx={{ textAlign: 'center', mb: formData.dataManagementPlan.length > 0 ? 2 : 0 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                  Data Management Plan
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                  Upload your Data Management Plan (DMP) document outlining how research data will be collected, stored, managed, and shared throughout the project lifecycle.
                </Typography>
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
                    startIcon={<UploadIcon />}
                    sx={{
                      borderColor: '#4caf50',
                      color: '#4caf50',
                      '&:hover': {
                        borderColor: '#45a049',
                        backgroundColor: 'rgba(76, 175, 80, 0.04)'
                      }
                    }}
                  >
                    Upload Data Management Plan
                  </Button>
                </label>
              </Box>

              {/* Display uploaded files */}
              {formData.dataManagementPlan.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                    Uploaded Files ({formData.dataManagementPlan.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {formData.dataManagementPlan.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          backgroundColor: 'white',
                          borderRadius: 1,
                          border: '1px solid rgba(76, 175, 80, 0.2)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FilesIcon sx={{ mr: 1, color: '#4caf50', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" sx={{ ml: 1, color: '#666' }}>
                            ({(file.size / 1024).toFixed(1)} KB)
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeDataManagementPlan(index)}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            </Box>
          </Box>
        );

      case 5: // Related Publications & Files
        return (
          <Box>
            {/* Step Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.1) 0%, rgba(139, 108, 188, 0.05) 100%)',
              border: '1px solid rgba(139, 108, 188, 0.2)'
            }}>
              <FilesIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.25, fontSize: '1.3rem' }}>
                  Related Publications & Files
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500, fontSize: '0.85rem' }}>
                  Link existing publications from your library and upload other related files for this research proposal.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Available Publications Section */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Available Publications
              </Typography>
              <Typography variant="body2" sx={{ mb: 2.5, color: '#666', fontSize: '0.85rem' }}>
                Select publications from the database that are relevant to this research proposal. These could be preliminary studies, related work, or publications that inform this research. All publications imported into the system are available for selection.
              </Typography>
              
              {/* Search Field */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: '#666', fontSize: '0.875rem' }}>
                  Search and Select Publications
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Search publications from database by title, author, journal, or keywords..."
                  value={publicationSearch}
                  onChange={(e) => setPublicationSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <SearchIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                      </Box>
                    ),
                    endAdornment: (
                      <IconButton sx={{ color: '#8b6cbc' }}>
                        <ExpandMoreIcon />
                      </IconButton>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#8b6cbc',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#8b6cbc',
                      },
                    },
                  }}
                />
              </Box>

              {/* Publication Search Results */}
              {(publicationSearch || availablePublications.length > 0) && (
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#2D3748' }}>
                    {publicationSearch ? 'Search Results' : 'Available Publications'}
                  </Typography>
                  
                  {publicationsLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={24} sx={{ color: '#8b6cbc', mr: 2 }} />
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Loading publications...
                      </Typography>
                    </Box>
                  ) : publicationsError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {publicationsError}
                      <Button 
                        size="small" 
                        onClick={() => fetchPublications(publicationSearch)}
                        sx={{ ml: 1, color: '#f44336' }}
                      >
                        Retry
                      </Button>
                    </Alert>
                  ) : availablePublications.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {availablePublications.map((publication) => (
                        <Box
                          key={publication.id}
                          sx={{
                            p: 2,
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'rgba(139, 108, 188, 0.04)',
                              borderColor: '#8b6cbc'
                            }
                          }}
                          onClick={() => handlePublicationSelect(publication)}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
                            {publication.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                            {publication.authors} {publication.year && `(${publication.year})`}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {publication.journal && (
                              <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                                {publication.journal}
                              </Typography>
                            )}
                            {publication.publicationType && (
                              <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                                {publication.publicationType}
                              </Typography>
                            )}
                            {publication.doi && (
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                DOI: {publication.doi}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                      {availablePublications.length === 50 && (
                        <Typography variant="caption" sx={{ color: '#8b6cbc', fontStyle: 'italic', textAlign: 'center', mt: 1 }}>
                          Showing first 50 results. Use search to narrow down results.
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      {publicationSearch ? 'No publications found matching your search.' : 'No publications available in the system.'}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Selected Publications Display */}
              {formData.selectedPublications.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  border: '2px dashed #e0e0e0', 
                  borderRadius: 2,
                  backgroundColor: '#fafafa'
                }}>
                  <FilesIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    No publications selected yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    Use the search field above to find and select relevant publications from your library
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#2D3748' }}>
                    Selected Publications ({formData.selectedPublications.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {formData.selectedPublications.map((publication) => (
                      <Box
                        key={publication.id}
                        sx={{
                          p: 2,
                          backgroundColor: 'rgba(139, 108, 188, 0.04)',
                          border: '1px solid rgba(139, 108, 188, 0.2)',
                          borderRadius: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
                            {publication.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                            {publication.authors} ({publication.year})
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                            {publication.journal} • {publication.type}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeSelectedPublication(publication.id)}
                          sx={{ color: '#f44336', ml: 2 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Publication Relevance */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="How are these publications and files related to your proposal?"
                value={formData.publicationRelevance}
                onChange={(e) => handleInputChange('publicationRelevance', e.target.value)}
                placeholder="Explain the relevance of the linked publications and files to this research proposal"
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

            {/* Other Related Files Upload */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2, 
              border: '2px dashed #ff9800',
              background: 'rgba(255, 152, 0, 0.02)',
              width: '100%'
            }}>
              <Box sx={{ textAlign: 'center', mb: formData.otherRelatedFiles.length > 0 ? 2 : 0 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                  Other Related Files
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                  Upload other files related to this research proposal such as preliminary data, additional references, supplementary materials, or supporting documents.
                </Typography>
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
                    startIcon={<UploadIcon />}
                    sx={{
                      borderColor: '#ff9800',
                      color: '#ff9800',
                      '&:hover': {
                        borderColor: '#f57c00',
                        backgroundColor: 'rgba(255, 152, 0, 0.04)'
                      }
                    }}
                  >
                    Upload Related Files
                  </Button>
                </label>
              </Box>

              {/* Display uploaded files */}
              {formData.otherRelatedFiles.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                    Uploaded Files ({formData.otherRelatedFiles.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {formData.otherRelatedFiles.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1.5,
                          backgroundColor: 'white',
                          borderRadius: 1,
                          border: '1px solid rgba(255, 152, 0, 0.2)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FilesIcon sx={{ mr: 1, color: '#ff9800', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" sx={{ ml: 1, color: '#666' }}>
                            ({(file.size / 1024).toFixed(1)} KB)
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeRelatedFile(index)}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            </Box>
          </Box>
        );

      case 6: // Proposal Summary
        return (
          <Box>
            {/* Step Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(139, 108, 188, 0.1) 0%, rgba(139, 108, 188, 0.05) 100%)',
              border: '1px solid rgba(139, 108, 188, 0.2)'
            }}>
              <CheckIcon sx={{ mr: 1.5, color: '#8b6cbc', fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.25, fontSize: '1.3rem' }}>
                  Proposal Summary
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500, fontSize: '0.85rem' }}>
                  Review all attached files and link with collaborative proposals to complete your research proposal.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Link with Collaborative Proposals */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(139, 108, 188, 0.12)',
              background: 'white',
              boxShadow: '0 1px 4px rgba(139, 108, 188, 0.06)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Link with Collaborative Proposals
              </Typography>
              <Typography variant="body2" sx={{ mb: 2.5, color: '#666', fontSize: '0.85rem' }}>
                Choose from existing collaborative proposals that have been created in the system. This includes both completed collaborative proposals and those currently being written collaboratively.
              </Typography>
              
              {/* Search Field */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: '#666', fontSize: '0.875rem' }}>
                  Search Collaborative Proposals
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Type to search for collaborative proposals by title or author..."
                  value={collaborativeProposalSearch}
                  onChange={(e) => setCollaborativeProposalSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <FilesIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                      </Box>
                    ),
                    endAdornment: (
                      <IconButton sx={{ color: '#8b6cbc' }}>
                        <ExpandMoreIcon />
                      </IconButton>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#8b6cbc',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#8b6cbc',
                      },
                    },
                  }}
                />
              </Box>

              {/* Collaborative Proposal Search Results */}
              {(collaborativeProposalSearch || availableCollaborativeProposals.length > 0) && (
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#2D3748' }}>
                    {collaborativeProposalSearch ? 'Search Results' : 'Available Collaborative Proposals'}
                  </Typography>
                  
                  {collaborativeProposalsLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                      <CircularProgress size={24} sx={{ color: '#8b6cbc', mr: 2 }} />
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        Loading collaborative proposals...
                      </Typography>
                    </Box>
                  ) : collaborativeProposalsError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {collaborativeProposalsError}
                      <Button 
                        size="small" 
                        onClick={() => fetchCollaborativeProposals(collaborativeProposalSearch)}
                        sx={{ ml: 1, color: '#f44336' }}
                      >
                        Retry
                      </Button>
                    </Alert>
                  ) : availableCollaborativeProposals.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {availableCollaborativeProposals.map((proposal) => (
                        <Box
                          key={proposal.id}
                          sx={{
                            p: 2,
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'rgba(139, 108, 188, 0.04)',
                              borderColor: '#8b6cbc'
                            }
                          }}
                          onClick={() => handleCollaborativeProposalSelect(proposal)}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
                            {proposal.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                            {proposal.authors} • {proposal.collaboratorCount} collaborator(s)
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                              Status: {proposal.status}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                              Type: {proposal.type}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Updated: {proposal.lastUpdated}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                      {availableCollaborativeProposals.length === 20 && (
                        <Typography variant="caption" sx={{ color: '#8b6cbc', fontStyle: 'italic', textAlign: 'center', mt: 1 }}>
                          Showing first 20 results. Use search to narrow down results.
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      {collaborativeProposalSearch ? 'No collaborative proposals found matching your search.' : 'No collaborative proposals available in the system.'}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Selected Collaborative Proposals */}
              {formData.linkedCollaborativeProposals.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 3, 
                  border: '2px dashed #e0e0e0', 
                  borderRadius: 2,
                  backgroundColor: '#fafafa'
                }}>
                  <FilesIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    No collaborative proposals linked yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#999' }}>
                    Use the search field above to find and link collaborative proposals
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#2D3748' }}>
                    Linked Collaborative Proposals ({formData.linkedCollaborativeProposals.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {formData.linkedCollaborativeProposals.map((proposal) => (
                      <Box
                        key={proposal.id}
                        sx={{
                          p: 2,
                          backgroundColor: 'rgba(139, 108, 188, 0.04)',
                          border: '1px solid rgba(139, 108, 188, 0.2)',
                          borderRadius: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
                            {proposal.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                            {proposal.authors}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                              Status: {proposal.status}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                              Type: {proposal.type}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeCollaborativeProposal(proposal.id)}
                          sx={{ color: '#f44336', ml: 2 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Attached Files Summary */}
            <Paper sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid rgba(76, 175, 80, 0.2)',
              background: 'rgba(76, 175, 80, 0.02)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600, color: '#2D3748', fontSize: '1.1rem' }}>
                Attached Files Summary
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
                {/* Ethics Documents */}
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  border: '1px solid rgba(139, 108, 188, 0.2)',
                  background: 'white'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 1 }}>
                    Ethics Documents
                  </Typography>
                  {formData.ethicsDocuments.length > 0 ? (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#2D3748', mb: 1 }}>
                        {formData.ethicsDocuments.length} file(s) uploaded
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {formData.ethicsDocuments.slice(0, 3).map((file, index) => (
                          <Typography key={index} variant="caption" sx={{ color: '#666' }}>
                            • {file.name}
                          </Typography>
                        ))}
                        {formData.ethicsDocuments.length > 3 && (
                          <Typography variant="caption" sx={{ color: '#8b6cbc', fontStyle: 'italic' }}>
                            +{formData.ethicsDocuments.length - 3} more files
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      No ethics documents uploaded
                    </Typography>
                  )}
                </Paper>

                {/* Data Management Plan */}
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  border: '1px solid rgba(76, 175, 80, 0.2)',
                  background: 'white'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                    Data Management Plan
                  </Typography>
                  {formData.dataManagementPlan.length > 0 ? (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#2D3748', mb: 1 }}>
                        {formData.dataManagementPlan.length} file(s) uploaded
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {formData.dataManagementPlan.slice(0, 3).map((file, index) => (
                          <Typography key={index} variant="caption" sx={{ color: '#666' }}>
                            • {file.name}
                          </Typography>
                        ))}
                        {formData.dataManagementPlan.length > 3 && (
                          <Typography variant="caption" sx={{ color: '#4caf50', fontStyle: 'italic' }}>
                            +{formData.dataManagementPlan.length - 3} more files
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      No data management plan uploaded
                    </Typography>
                  )}
                </Paper>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {/* Other Related Files */}
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  border: '1px solid rgba(255, 152, 0, 0.2)',
                  background: 'white'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ff9800', mb: 1 }}>
                    Other Related Files
                  </Typography>
                  {formData.otherRelatedFiles.length > 0 ? (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#2D3748', mb: 1 }}>
                        {formData.otherRelatedFiles.length} file(s) uploaded
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {formData.otherRelatedFiles.slice(0, 3).map((file, index) => (
                          <Typography key={index} variant="caption" sx={{ color: '#666' }}>
                            • {file.name}
                          </Typography>
                        ))}
                        {formData.otherRelatedFiles.length > 3 && (
                          <Typography variant="caption" sx={{ color: '#ff9800', fontStyle: 'italic' }}>
                            +{formData.otherRelatedFiles.length - 3} more files
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      No related files uploaded
                    </Typography>
                  )}
                </Paper>

                {/* Linked Publications */}
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  border: '1px solid rgba(33, 150, 243, 0.2)',
                  background: 'white'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2196f3', mb: 1 }}>
                    Linked Publications
                  </Typography>
                  {formData.selectedPublications.length > 0 ? (
                    <Box>
                      <Typography variant="body2" sx={{ color: '#2D3748', mb: 1 }}>
                        {formData.selectedPublications.length} publication(s) linked
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {formData.selectedPublications.slice(0, 2).map((pub, index) => (
                          <Typography key={index} variant="caption" sx={{ color: '#666' }}>
                            • {pub.title}
                          </Typography>
                        ))}
                        {formData.selectedPublications.length > 2 && (
                          <Typography variant="caption" sx={{ color: '#2196f3', fontStyle: 'italic' }}>
                            +{formData.selectedPublications.length - 2} more publications
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                      No publications linked
                    </Typography>
                  )}
                </Paper>
              </Box>

              {/* Summary Statistics */}
              <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
                  Summary
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>Ethics Documents:</strong> {formData.ethicsDocuments.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>Data Management Plans:</strong> {formData.dataManagementPlan.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>Related Files:</strong> {formData.otherRelatedFiles.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>Linked Publications:</strong> {formData.selectedPublications.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    <strong>Collaborative Proposals:</strong> {formData.linkedCollaborativeProposals.length}
                  </Typography>
                </Box>
              </Box>
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
        return formData.fundingSource && formData.totalBudgetAmount;
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
      <Box sx={{ mt: '50px' }}>
        <PageHeader
        title="Create New Proposal"
        description="Submit your research proposal for review and funding consideration"
        icon={<ProposalIcon sx={{ fontSize: 32 }} />}
        actionButton={
          <Stack direction="row" spacing={2} alignItems="center">
            {autoSaving && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.8)' }}>
                <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.8)' }} />
                <Typography variant="caption">Auto-saving...</Typography>
              </Box>
            )}
            {hasUnsavedChanges && !autoSaving && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.6)' }}>
                <Typography variant="caption">Unsaved changes</Typography>
              </Box>
            )}
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => handleNavigation(() => router.push('/researcher/projects/proposals/list'))}
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.5)',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Back to List
            </Button>
          </Stack>
        }
      />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              border: '1px solid rgba(244, 67, 54, 0.2)',
              background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.02) 100%)'
            }}
          >
            {error}
          </Alert>
        )}

        {/* Enhanced Stepper */}
        <Paper sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(139, 108, 188, 0.08)',
          border: '1px solid rgba(139, 108, 188, 0.12)',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfd 100%)'
        }}>
          {/* Progress Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              color: '#2D3748', 
              mb: 1,
              textAlign: 'center'
            }}>
              Create Research Proposal
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#8b6cbc', 
              textAlign: 'center',
              fontWeight: 500
            }}>
              Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
            </Typography>
          </Box>

          {/* Custom Horizontal Progress Stepper */}
          <Box sx={{ mb: 4 }}>
            {/* Progress Line */}
            <Box sx={{ 
              position: 'relative', 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Box sx={{ 
                position: 'absolute',
                top: '50%',
                left: '5%',
                right: '5%',
                height: 4,
                backgroundColor: '#e0e0e0',
                borderRadius: 2,
                zIndex: 1
              }} />
              
              {/* Progress Fill */}
              <Box sx={{ 
                position: 'absolute',
                top: '50%',
                left: '5%',
                width: `${(activeStep / (steps.length - 1)) * 90}%`,
                height: 4,
                background: 'linear-gradient(90deg, #4caf50 0%, #8b6cbc 100%)',
                borderRadius: 2,
                zIndex: 2,
                transition: 'width 0.3s ease'
              }} />
              
              {/* Step Circles */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                width: '90%',
                mx: 'auto',
                position: 'relative',
                zIndex: 3
              }}>
                {steps.map((label, index) => {
                  const isCompleted = index < activeStep;
                  const isActive = index === activeStep;
                  const isClickable = true; // Allow clicking on any step
                  
                  return (
                    <Box
                      key={index}
                      onClick={() => isClickable && setActiveStep(index)}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: isClickable ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        '&:hover': isClickable ? {
                          transform: 'translateY(-2px)'
                        } : {}
                      }}
                    >
                      {/* Circle */}
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isCompleted ? '#4caf50' : isActive ? '#8b6cbc' : '#9e9e9e',
                          color: 'white',
                          fontSize: '1rem',
                          fontWeight: 600,
                          boxShadow: isCompleted || isActive ? '0 4px 12px rgba(139, 108, 188, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          border: '3px solid white'
                        }}
                      >
                        {isCompleted ? <CheckIcon fontSize="small" /> : index + 1}
                      </Box>
                      
                      {/* Label */}
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 1,
                          fontSize: '0.75rem',
                          fontWeight: isActive ? 600 : 500,
                          color: isCompleted || isActive ? '#2D3748' : '#666',
                          textAlign: 'center',
                          maxWidth: '120px',
                          lineHeight: 1.2
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* Enhanced Step Content */}
          <Box sx={{ 
            minHeight: '500px',
            backgroundColor: 'rgba(139, 108, 188, 0.02)',
            borderRadius: 3,
            p: 4,
            border: '1px solid rgba(139, 108, 188, 0.08)'
          }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* Enhanced Navigation Buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 4, 
            pt: 3, 
            borderTop: '2px solid rgba(139, 108, 188, 0.1)'
          }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBackIcon />}
              sx={{ 
                color: '#8b6cbc',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(139, 108, 188, 0.08)'
                },
                '&:disabled': {
                  color: 'rgba(139, 108, 188, 0.3)'
                }
              }}
            >
              Previous Step
            </Button>

            {/* Step Progress Indicator */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 3,
              py: 1,
              borderRadius: 2,
              backgroundColor: 'rgba(139, 108, 188, 0.1)',
              border: '1px solid rgba(139, 108, 188, 0.2)'
            }}>
              <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 600 }}>
                Progress: {Math.round(((activeStep + 1) / steps.length) * 100)}%
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSaveDraft}
                disabled={loading}
                sx={{
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  fontWeight: 500,
                  borderRadius: 2,
                  px: 3,
                  '&:hover': {
                    borderColor: '#8b6cbc',
                    backgroundColor: 'rgba(139, 108, 188, 0.08)'
                  }
                }}
              >
                {loading ? 'Saving...' : 'Save Draft'}
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SubmitIcon />}
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    boxShadow: '0 4px 16px rgba(139, 108, 188, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7b5ca7 0%, #8b6cbc 100%)',
                      boxShadow: '0 6px 20px rgba(139, 108, 188, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Proposal'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={false}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    boxShadow: '0 4px 16px rgba(139, 108, 188, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7b5ca7 0%, #8b6cbc 100%)',
                      boxShadow: '0 6px 20px rgba(139, 108, 188, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      background: 'rgba(139, 108, 188, 0.3)',
                      boxShadow: 'none'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Next Step
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* ORCID Search Modals */}
      <OrcidSearchModal
        open={piSearchModalOpen}
        onClose={() => setPiSearchModalOpen(false)}
        onSelect={handlePrincipalInvestigatorSelect}
        title="Search for Principal Investigator"
        subtitle="Find and select the principal investigator using ORCID database"
      />

      <OrcidSearchModal
        open={coInvSearchModalOpen}
        onClose={() => setCoInvSearchModalOpen(false)}
        onSelect={handleCoInvestigatorSelect}
        title="Search for Co-Investigator"
        subtitle="Find and add co-investigators using ORCID database"
      />

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

      {/* Unsaved Changes Modal */}
      <Dialog
        open={showUnsavedModal}
        onClose={handleUnsavedModalCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          pb: 1,
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white'
        }}>
          <WarningIcon />
          Unsaved Changes
          <Box sx={{ flexGrow: 1 }} />
          <IconButton 
            onClick={handleUnsavedModalCancel}
            sx={{ color: 'white' }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You have unsaved changes to your proposal. What would you like to do?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Save Draft:</strong> Save your current progress and continue navigation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Discard:</strong> Lose all unsaved changes and continue navigation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>Cancel:</strong> Stay on this page and continue editing
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
          <Button
            onClick={handleUnsavedModalCancel}
            variant="outlined"
            sx={{ borderColor: '#6b7280', color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUnsavedModalDiscard}
            variant="outlined"
            sx={{ borderColor: '#dc2626', color: '#dc2626' }}
          >
            Discard Changes
          </Button>
          <Button
            onClick={handleUnsavedModalSave}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)'
              }
            }}
          >
            Save Draft
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateProposalPage;