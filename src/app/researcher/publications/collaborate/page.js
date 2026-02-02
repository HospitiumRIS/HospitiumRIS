'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem as MuiMenuItem,
  Popover,
  MenuList,
  Divider,
  Container,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Alert,
  CircularProgress,
  Skeleton,
  Badge,
  Tooltip,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemAvatar,
  Stepper,
  Step,
  StepLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Fade,
  Zoom,
  Slide,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Create as CreateIcon,
  Description as DescriptionIcon,
  Assignment as ProposalIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayArrowIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Groups as GroupsIcon,
  Timeline as TimelineIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  ManageAccounts as ManageAccountsIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Person as PersonIcon,
  MenuBook as MenuBookIcon,
  Science as ScienceIcon,
  DragIndicator as DragIndicatorIcon,
  Restore as RestoreIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  RocketLaunch as RocketLaunchIcon,
  Category as CategoryIcon,
  Title as TitleIcon,
  PersonSearch as PersonSearchIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  Article as ArticleIcon,
  Dashboard as DashboardIcon,
  CloudUpload as CloudUploadIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  MoreHoriz as MoreHorizIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../../../components/AuthProvider';
import PageHeader from '../../../../components/common/PageHeader';
import OrcidCollaboratorInvite from '../../../../components/Manuscripts/OrcidCollaboratorInvite';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

// Dynamic imports for DND components
const DragDropContextComponent = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.DragDropContext),
  { ssr: false }
);

const DroppableComponent = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Droppable),
  { ssr: false }
);

const DraggableComponent = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Draggable),
  { ssr: false }
);

// Constants from reference
const MEDICAL_FIELDS = [
  'Cardiology',
  'Neurology',
  'Oncology',
  'Pediatrics',
  'Immunology',
  'Endocrinology',
  'Genetics',
  'Public Health',
  'Epidemiology',
  'Other'
];

const DEFAULT_SECTIONS = [
  'Abstract',
  'Introduction',
  'Methods',
  'Results',
  'Discussion',
  'Conclusion',
  'References'
];

const PUBLICATION_TYPES = [
  'Article',
  'Book Chapter',
  'Chapter',
  'Proceeding',
  'Monograph',
  'Preprint',
  'Edited Book',
  'Seminar',
  'Research Chapter',
  'Review Article',
  'Book Review',
  'Conference Abstract',
  'Letter to Editor',
  'Editorial',
  'Other Book Content',
  'Correction Erratum'
];

const COLLABORATOR_ROLES = [
  { value: 'Admin', label: 'Admin', icon: AdminPanelSettingsIcon, color: '#f44336', description: 'Full access to manuscript and team management' },
  { value: 'Editor', label: 'Editor', icon: SupervisorAccountIcon, color: '#ff9800', description: 'Can edit content and manage sections' },
  { value: 'Reviewer', label: 'Reviewer', icon: VisibilityIcon, color: '#2196f3', description: 'Can view and comment on content' },
  { value: 'Contributor', label: 'Contributor', icon: PersonIcon, color: '#4caf50', description: 'Can contribute to specific sections' }
];

const STATUS_OPTIONS = [
  { value: 'Draft', label: 'Draft', color: '#9e9e9e', icon: PendingIcon },
  { value: 'In Progress', label: 'In Progress', color: '#ff9800', icon: AccessTimeIcon },
  { value: 'Under Review', label: 'Under Review', color: '#2196f3', icon: VisibilityIcon },
  { value: 'Completed', label: 'Completed', color: '#4caf50', icon: CheckCircleIcon },
  { value: 'Archived', label: 'Archived', color: '#607d8b', icon: ArchiveIcon }
];





// Add custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function CollaborativeWriting() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Hydration-safe client detection (must be at top with other hooks)
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // State management
  const [manuscripts, setManuscripts] = useState([]);
  const [stats, setStats] = useState({
    totalManuscripts: 0,
    draftManuscripts: 0,
    inReviewManuscripts: 0,
    publishedManuscripts: 0,
    totalCollaborators: 0,
    activeInvitations: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  
  // Dialog states
  const [newManuscriptOpen, setNewManuscriptOpen] = useState(false);
  const [teamManagementOpen, setTeamManagementOpen] = useState(false);
  const [selectedManuscript, setSelectedManuscript] = useState(null);
  
  // Team management states
  const [teamData, setTeamData] = useState({ collaborators: [], pendingInvitations: [] });
  const [teamLoading, setTeamLoading] = useState(false);
  const [addCollaboratorOpen, setAddCollaboratorOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState(null);
  const [collaboratorMenuAnchor, setCollaboratorMenuAnchor] = useState(null);
  const [selectedCollaboratorForMenu, setSelectedCollaboratorForMenu] = useState(null);
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuManuscript, setMenuManuscript] = useState(null);

  // New manuscript form state with comprehensive structure
  const [newManuscript, setNewManuscript] = useState({
    title: '',
    type: '',
    field: '', // For simple dialog single selection
    fields: [], // For advanced dialog multiple selection
    description: '',
    collaborators: [],
    sections: DEFAULT_SECTIONS.map((title, index) => ({
      id: `section-${index}-${title.toLowerCase().replace(/\s+/g, '-')}`,
      title,
      description: '',
      order: index
    }))
  });

  // Modal states for comprehensive functionality
  const [newPublicationOpen, setNewPublicationOpen] = useState(false);
  const [collaboratorModalOpen, setCollaboratorModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [creator, setCreator] = useState({ name: '', orcidId: '' });
  const [currentManuscriptId, setCurrentManuscriptId] = useState(null);
  
  // Collaborator form state
  const [collaboratorFormOpen, setCollaboratorFormOpen] = useState(false);
  const [searchMethod, setSearchMethod] = useState('orcid'); // 'orcid' or 'name'
  const [newCollaborator, setNewCollaborator] = useState({
    orcidId: '',
    name: '',
    givenName: '',
    familyName: '',
    institution: '',
    department: '',
    email: ''
  });
  
  const [orcidSearchResults, setOrcidSearchResults] = useState([]);
  const [isSearchingOrcid, setIsSearchingOrcid] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);

  // Steps for manuscript creation
  const manuscriptSteps = ['Manuscript Details', 'Invite Collaborators'];
  const [manuscriptActiveStep, setManuscriptActiveStep] = useState(0);
  const [isSubmittingManuscript, setIsSubmittingManuscript] = useState(false);
  const [manuscriptFormError, setManuscriptFormError] = useState(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [manuscriptToDelete, setManuscriptToDelete] = useState(null);

  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingManuscript, setViewingManuscript] = useState(null);

  // Snackbar notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'warning', 'info'
  });

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');

  // Manuscript submission loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);


  // New proposal modal state
  const [newProposalOpen, setNewProposalOpen] = useState(false);
  const [proposalActiveStep, setProposalActiveStep] = useState(0);
  const [proposalFormError, setProposalFormError] = useState(null);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [currentProposalId, setCurrentProposalId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');

  // Proposal collaborator search state
  const [proposalOrcidInput, setProposalOrcidInput] = useState('');
  const [proposalSearchResults, setProposalSearchResults] = useState([]);
  const [proposalSelectedCollaborator, setProposalSelectedCollaborator] = useState(null);
  const [proposalIsSearching, setProposalIsSearching] = useState(false);
  
  // Name-based search state for proposals
  const [proposalSearchMethod, setProposalSearchMethod] = useState('name'); // 'name' or 'orcid'
  const [proposalNewCollaborator, setProposalNewCollaborator] = useState({
    givenName: '',
    familyName: '',
    affiliation: '',
    orcidId: '',
    name: '',
    email: ''
  });

  const proposalSteps = ['Proposal Details', 'Select Template', 'Invite Collaborators'];

  // New proposal state
  const [newProposal, setNewProposal] = useState({
    title: '',
    type: 'Research Proposal',
    fields: [], // Changed from field to fields array
    otherFields: '', // For custom fields when "Other" is selected
    creator: '', // Will be populated when user data is available
    creatorOrcid: '', // Will be populated when user data is available
    collaborators: [],
    sections: [
      { id: 'section-0-executive-summary', title: 'Executive Summary', description: 'Brief overview of the proposal', order: 0 },
      { id: 'section-1-background-significance', title: 'Background and Significance', description: 'Context and importance of the research', order: 1 },
      { id: 'section-2-research-objectives', title: 'Research Objectives', description: 'Primary and secondary objectives', order: 2 },
      { id: 'section-3-methodology', title: 'Methodology', description: 'Research methods and approach', order: 3 },
      { id: 'section-4-timeline-milestones', title: 'Timeline and Milestones', description: 'Project schedule and deliverables', order: 4 },
      { id: 'section-5-budget-resources', title: 'Budget and Resources', description: 'Financial requirements and resource allocation', order: 5 },
      { id: 'section-6-expected-outcomes', title: 'Expected Outcomes', description: 'Anticipated results and impact', order: 6 },
      { id: 'section-7-references', title: 'References', description: 'Supporting literature', order: 7 }
    ],
    status: 'Draft',
    researchAreas: [],
    keywords: [],
    abstract: '',
    funding: {
      fundingSource: '',
      grantNumber: '',
      budget: { total: 0, items: [] },
      fundingInstitution: ''
    }
  });

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Essential utility functions
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fetch manuscripts from API
  const fetchManuscripts = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/manuscripts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setManuscripts(result.manuscripts || []);
        
        // Calculate stats from fetched data
        const manuscripts = result.manuscripts || [];
        const totalManuscripts = manuscripts.length;
        const draftManuscripts = manuscripts.filter(m => m.status === 'DRAFT').length;
        const inReviewManuscripts = manuscripts.filter(m => m.status === 'IN_REVIEW').length;
        const publishedManuscripts = manuscripts.filter(m => m.status === 'PUBLISHED').length;
        const totalCollaborators = manuscripts.reduce((sum, m) => sum + (m.totalCollaborators || 0), 0);
        const activeInvitations = manuscripts.reduce((sum, m) => sum + (m.pendingInvitations || 0), 0);
        
        setStats({
          totalManuscripts,
          draftManuscripts,
          inReviewManuscripts,
          publishedManuscripts,
          totalCollaborators,
          activeInvitations
        });
      } else {
        throw new Error(result.error || 'Failed to fetch manuscripts');
      }
      
    } catch (error) {
      console.error('Error fetching manuscripts:', error);
      showSnackbar('Failed to fetch manuscripts', 'error');
      // Set empty state on error
      setManuscripts([]);
      setStats({
        totalManuscripts: 0,
        draftManuscripts: 0,
        inReviewManuscripts: 0,
        publishedManuscripts: 0,
        totalCollaborators: 0,
        activeInvitations: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Handler for new proposal modal
  const handleNewProposal = () => {
    console.log('handleNewProposal function called - modal should open');
    // Ensure the creator fields are set to the logged-in user
    try {
      const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
      if (userData) {
        const fullName = userData.name || 
                        (userData.givenName && userData.familyName ? 
                         `${userData.givenName} ${userData.familyName}` : 
                         userData.givenName || userData.familyName || 'Unknown User');
        
        setNewProposal(prev => ({ 
          ...prev, 
          creator: fullName,
          creatorOrcid: userData.orcidId || userData.orcid || ''
        }));
      }
    } catch (error) {
      console.error('Error loading user info for proposal:', error);
    }
    
    console.log('Setting newProposalOpen to true');
    setNewProposalOpen(true);
    console.log('newProposalOpen should now be true');
  };

  // Auto-populate creator when modal opens
  useEffect(() => {
    if (newProposalOpen && typeof window !== 'undefined') {
      try {
        const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
        if (userData) {
          const fullName = userData.name || 
                          (userData.givenName && userData.familyName ? 
                           `${userData.givenName} ${userData.familyName}` : 
                           userData.givenName || userData.familyName || 'Unknown User');
          
          setNewProposal(prev => ({
            ...prev,
            creator: fullName,
            creatorOrcid: userData.orcidId || userData.orcid || ''
          }));
        }
      } catch (error) {
        console.error('Error loading user info for proposal:', error);
      }
    }
  }, [newProposalOpen, user]);

  // Load creator info when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
        if (userData) {
          const creatorInfo = {
            name: userData.name || 'Unknown User',
            orcidId: userData.orcid || ''
          };
          setCreator(creatorInfo);
          setNewManuscript(prev => ({ ...prev, creator: creatorInfo }));
          
          // Update proposal creator as well
          const fullName = userData.name || 
                          (userData.givenName && userData.familyName ? 
                           `${userData.givenName} ${userData.familyName}` : 
                           userData.givenName || userData.familyName || 'Unknown User');
          
          setNewProposal(prev => ({
            ...prev,
            creator: fullName,
            creatorOrcid: userData.orcidId || userData.orcid || ''
          }));
        }
      } catch (error) {
        console.error('Error loading creator info:', error);
      }
    }
  }, [user]);

  // Fetch manuscripts on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchManuscripts();
    }
  }, [user, fetchManuscripts]);

  // Filter and search manuscripts
  const filteredManuscripts = manuscripts.filter(manuscript => {
    const matchesSearch = manuscript.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || manuscript.status === statusFilter;
    const matchesType = typeFilter === 'All Types' || manuscript.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Paginated manuscripts
  const paginatedManuscripts = filteredManuscripts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handlers
  const handleMenuClick = (event, manuscript) => {
    setAnchorEl(event.currentTarget);
    setMenuManuscript(manuscript);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuManuscript(null);
  };

  const handleCreateManuscriptStep1 = async () => {
    if (!newManuscript.title || !newManuscript.type || newManuscript.fields.length === 0) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setFormError(null);

      const manuscriptData = {
        title: newManuscript.title,
        type: newManuscript.type,
        field: newManuscript.fields.join(', '), // Convert array to comma-separated string
        description: newManuscript.description || null
      };

      const response = await fetch('/api/manuscripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manuscriptData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Store the manuscript ID for step 2
        setCurrentManuscriptId(result.data.manuscript.id);
        
        // Add the new manuscript to local state
        const newManuscriptData = {
          ...result.data.manuscript,
          collaborators: [{
            id: result.data.manuscript.creator.id,
            name: `${result.data.manuscript.creator.givenName} ${result.data.manuscript.creator.familyName}`,
            email: result.data.manuscript.creator.email,
            role: 'OWNER',
            canEdit: true,
            canInvite: true,
            canDelete: true
          }],
          totalCollaborators: 1,
          pendingInvitations: 0,
          lastUpdated: result.data.manuscript.updatedAt
        };

        setManuscripts(prev => [newManuscriptData, ...prev]);
        setStats(prev => ({ 
          ...prev, 
          totalManuscripts: prev.totalManuscripts + 1,
          draftManuscripts: prev.draftManuscripts + 1,
          totalCollaborators: prev.totalCollaborators + 1
        }));
        
        // Move to step 2 for collaborator invitations
        setActiveStep(1);
        showSnackbar('Manuscript created! Now you can invite collaborators.', 'success');
      } else {
        throw new Error(result.error || 'Failed to create manuscript');
      }

    } catch (error) {
      console.error('Error creating manuscript:', error);
      setFormError(error.message || 'Failed to create manuscript');
      showSnackbar('Failed to create manuscript', 'error');
    } finally {
      setLoading(false);
    }
  };


  // Proposal navigation functions

  const handleProposalNextStep = () => {
    if (proposalActiveStep === 0) {
      // Proposal details step - validate and move to template selection
    if (!newProposal.title || newProposal.fields.length === 0) {
      setProposalFormError('Please fill in all required fields');
      return;
    }
      setProposalFormError(null);
      setProposalActiveStep(1);
    } else if (proposalActiveStep === 1) {
      // Template selection step - move to collaborators
      setProposalActiveStep(2);
    }
  };

  const handleFinishProposal = async () => {
    try {
      setIsSubmittingProposal(true);
      setProposalFormError(null);

      // Create the proposal first
      const proposalData = {
        title: newProposal.title,
        type: 'Proposal',
        field: newProposal.fields.join(', '),
        description: newProposal.description || null
      };

      const response = await fetch('/api/manuscripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create proposal');
      }

      const createdProposalId = result.data.manuscript.id;

      // If there are collaborators to invite, send invitations
      if (newProposal.collaborators.length > 0) {
        for (const collaborator of newProposal.collaborators) {
          if (collaborator.status === 'PENDING' && !collaborator.invitationId) {
            await fetch('/api/manuscripts/invitations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                manuscriptId: createdProposalId,
                orcidId: collaborator.orcidId,
                email: collaborator.email,
                givenName: collaborator.givenName,
                familyName: collaborator.familyName,
                affiliation: collaborator.affiliation,
                role: collaborator.role || 'CONTRIBUTOR',
                message: ''
              }),
            });
          }
        }
      }
      
      // Reset form and close modal
      setNewProposal({
        title: '',
        type: 'Research Proposal',
        fields: [],
        otherFields: '',
        creator: '', // Will be populated when modal opens
        creatorOrcid: '', // Will be populated when modal opens
        collaborators: [],
        sections: [
          { id: 'section-0-executive-summary', title: 'Executive Summary', description: 'Brief overview of the proposal', order: 0 },
          { id: 'section-1-background-significance', title: 'Background and Significance', description: 'Context and importance of the research', order: 1 },
          { id: 'section-2-research-objectives', title: 'Research Objectives', description: 'Primary and secondary objectives', order: 2 },
          { id: 'section-3-methodology', title: 'Methodology', description: 'Research methods and approach', order: 3 },
          { id: 'section-4-timeline-milestones', title: 'Timeline and Milestones', description: 'Project schedule and deliverables', order: 4 },
          { id: 'section-5-budget-resources', title: 'Budget and Resources', description: 'Financial requirements and resource allocation', order: 5 },
          { id: 'section-6-expected-outcomes', title: 'Expected Outcomes', description: 'Anticipated results and impact', order: 6 },
          { id: 'section-7-references', title: 'References', description: 'Supporting literature', order: 7 }
        ],
        status: 'Draft',
        researchAreas: [],
        keywords: [],
        abstract: '',
        funding: {
          fundingSource: '',
          grantNumber: '',
          budget: { total: 0, items: [] },
          fundingInstitution: ''
        }
      });
      setProposalActiveStep(0);
      setCurrentProposalId(null);
      setSelectedTemplate('blank');
      setNewProposalOpen(false);
      
      // Log activity (TODO: Implement client-safe logging)
      console.log('Proposal created:', {
        manuscriptId: createdProposalId,
        title: newProposal.title,
        type: 'Proposal',
        fields: newProposal.fields,
        collaboratorsCount: newProposal.collaborators.length
      });
      
      // Refresh the manuscripts list to show the new proposal
      await fetchManuscripts();
      
      showSnackbar('Proposal setup complete!', 'success');
    } catch (error) {
      console.error('Error finishing proposal:', error);
      setProposalFormError(error.message || 'Failed to complete proposal setup');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const handleCreateManuscript = async () => {
    if (!newManuscript.title || !newManuscript.type || !newManuscript.field) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);

      const manuscriptData = {
        title: newManuscript.title,
        type: newManuscript.type,
        field: newManuscript.field,
        description: newManuscript.description || null
      };

      const response = await fetch('/api/manuscripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manuscriptData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Add the new manuscript to local state
        const newManuscriptData = {
          ...result.data.manuscript,
          collaborators: [{
            id: result.data.manuscript.creator.id,
            name: `${result.data.manuscript.creator.givenName} ${result.data.manuscript.creator.familyName}`,
            email: result.data.manuscript.creator.email,
            role: 'OWNER',
            canEdit: true,
            canInvite: true,
            canDelete: true
          }],
          totalCollaborators: 1,
          pendingInvitations: 0,
          lastUpdated: result.data.manuscript.updatedAt
        };

        setManuscripts(prev => [newManuscriptData, ...prev]);
        setStats(prev => ({ 
          ...prev, 
          totalManuscripts: prev.totalManuscripts + 1,
          draftManuscripts: prev.draftManuscripts + 1,
          totalCollaborators: prev.totalCollaborators + 1
        }));
        
        // Reset form and close modal
        setNewManuscript({ 
          title: '', 
          type: '', 
          field: '',
          fields: [], 
          description: '',
          collaborators: [],
          sections: DEFAULT_SECTIONS.map((title, index) => ({
            id: `section-${index}-${title.toLowerCase().replace(/\s+/g, '-')}`,
            title,
            description: '',
            order: index
          }))
        });
        setNewManuscriptOpen(false);
        
        showSnackbar('Manuscript created successfully!', 'success');
      } else {
        throw new Error(result.error || 'Failed to create manuscript');
      }

    } catch (error) {
      console.error('Error creating manuscript:', error);
      showSnackbar('Failed to create manuscript', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManageTeam = async (manuscript) => {
    setSelectedManuscript(manuscript);
    setTeamManagementOpen(true);
    handleMenuClose();
    
    // Fetch team data
    await fetchTeamData(manuscript.id);
  };

  // New multi-step manuscript creation functions
  const handleManuscriptNextStep = () => {
    if (manuscriptActiveStep === 0) {
      // Manuscript details step - validate and move to collaborators
      if (!newManuscript.title || !newManuscript.type || newManuscript.fields.length === 0) {
        setManuscriptFormError('Please fill in all required fields: Title, Publication Type, and at least one Research Field');
        return;
      }
      setManuscriptFormError(null);
      setManuscriptActiveStep(1);
    }
  };

  const handleFinishManuscript = async () => {
    try {
      setIsSubmittingManuscript(true);
      setManuscriptFormError(null);

      // Create the manuscript first
      const manuscriptData = {
        title: newManuscript.title,
        type: newManuscript.type,
        field: newManuscript.fields.join(', '), // Convert array to comma-separated string for database
        description: newManuscript.description || null
      };

      const response = await fetch('/api/manuscripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manuscriptData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create manuscript');
      }

      const createdManuscriptId = result.data.manuscript.id;

      // If there are collaborators to invite, send invitations
      if (newManuscript.collaborators.length > 0) {
        for (const collaborator of newManuscript.collaborators) {
          if (collaborator.status === 'PENDING' && !collaborator.invitationId) {
            await fetch('/api/manuscripts/invitations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                manuscriptId: createdManuscriptId,
                orcidId: collaborator.orcidId,
                email: collaborator.email,
                givenName: collaborator.givenName,
                familyName: collaborator.familyName,
                affiliation: collaborator.affiliation,
                role: collaborator.role || 'CONTRIBUTOR',
                message: ''
              }),
            });
          }
        }
      }

      // Add the new manuscript to local state
      const newManuscriptData = {
        ...result.data.manuscript,
        collaborators: [{
          id: result.data.manuscript.creator.id,
          name: `${result.data.manuscript.creator.givenName} ${result.data.manuscript.creator.familyName}`,
          email: result.data.manuscript.creator.email,
          role: 'OWNER',
          canEdit: true,
          canInvite: true,
          canDelete: true
        }],
        totalCollaborators: 1,
        pendingInvitations: 0,
        lastUpdated: result.data.manuscript.updatedAt
      };

      setManuscripts(prev => [newManuscriptData, ...prev]);
      setStats(prev => ({ 
        ...prev, 
        totalManuscripts: prev.totalManuscripts + 1,
        draftManuscripts: prev.draftManuscripts + 1,
        totalCollaborators: prev.totalCollaborators + 1
      }));

      // Reset form and close modal
      setNewManuscript({
        title: '',
        type: '',
        field: '',
        fields: [],
        description: '',
        collaborators: []
      });
      setManuscriptActiveStep(0);
      setNewManuscriptOpen(false);

      // Log activity (TODO: Implement client-safe logging)
      console.log('Manuscript created:', {
        manuscriptId: createdManuscriptId,
        title: newManuscript.title,
        type: newManuscript.type,
        field: newManuscript.field,
        collaboratorsCount: newManuscript.collaborators.length
      });

      // Refresh the manuscripts list to show the new manuscript
      await fetchManuscripts();
      
      showSnackbar('Manuscript created successfully!', 'success');
      
    } catch (error) {
      console.error('Error creating manuscript:', error);
      setManuscriptFormError(error.message || 'Failed to create manuscript');
    } finally {
      setIsSubmittingManuscript(false);
    }
  };

  const handleDeleteManuscript = async (manuscript) => {
    if (window.confirm(`Are you sure you want to delete "${manuscript.title}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/manuscripts/${manuscript.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove manuscript from local state
          setManuscripts(prev => prev.filter(m => m.id !== manuscript.id));
          
          // Update stats
          setStats(prev => ({
            ...prev,
            totalManuscripts: prev.totalManuscripts - 1,
            draftManuscripts: manuscript.status === 'DRAFT' ? prev.draftManuscripts - 1 : prev.draftManuscripts,
            inReviewManuscripts: manuscript.status === 'IN_REVIEW' ? prev.inReviewManuscripts - 1 : prev.inReviewManuscripts,
            publishedManuscripts: manuscript.status === 'PUBLISHED' ? prev.publishedManuscripts - 1 : prev.publishedManuscripts
          }));
          
          showSnackbar('Manuscript deleted successfully', 'success');
        } else {
          throw new Error('Failed to delete manuscript');
        }
      } catch (error) {
        console.error('Error deleting manuscript:', error);
        showSnackbar('Failed to delete manuscript', 'error');
      }
    }
  };

  // Helper function to format dates (hydration-safe)
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    if (!isClient) {
      // Server-side: return simple format to avoid hydration mismatch
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    }

    // Client-side: return full relative format
    const date = new Date(dateString);
    const now = new Date();
    
    // Compare by calendar date (ignoring time) to properly determine today/yesterday
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((todayOnly - dateOnly) / (1000 * 60 * 60 * 24));

    const dateOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (diffDays === 0) {
      return `Today at ${timeStr}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${timeStr}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', dateOptions);
    }
  };

  // Helper function to get user initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Fetch team data (collaborators and pending invitations)
  const fetchTeamData = async (manuscriptId) => {
    if (!manuscriptId) return;
    
    setTeamLoading(true);
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/collaborators`);
      const data = await response.json();
      
      if (data.success) {
        setTeamData(data.data);
      } else {
        console.error('Failed to fetch team data:', data.error);
        showSnackbar('Failed to load team data', 'error');
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      showSnackbar('Error loading team data', 'error');
    } finally {
      setTeamLoading(false);
    }
  };

  // Update collaborator role
  const handleUpdateCollaboratorRole = async (collaboratorId, newRole, permissions = {}) => {
    if (!selectedManuscript) return;
    
    try {
      const response = await fetch(`/api/manuscripts/${selectedManuscript.id}/collaborators/${collaboratorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
          ...permissions
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh team data
        await fetchTeamData(selectedManuscript.id);
        showSnackbar('Collaborator role updated successfully', 'success');
      } else {
        showSnackbar(data.error || 'Failed to update collaborator role', 'error');
      }
    } catch (error) {
      console.error('Error updating collaborator role:', error);
      showSnackbar('Error updating collaborator role', 'error');
    }
  };

  // Remove collaborator
  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!selectedManuscript) return;
    
    try {
      const response = await fetch(`/api/manuscripts/${selectedManuscript.id}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh team data
        await fetchTeamData(selectedManuscript.id);
        showSnackbar('Collaborator removed successfully', 'success');
      } else {
        showSnackbar(data.error || 'Failed to remove collaborator', 'error');
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      showSnackbar('Error removing collaborator', 'error');
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (invitationId) => {
    try {
      const response = await fetch(`/api/manuscripts/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh team data
        await fetchTeamData(selectedManuscript.id);
        showSnackbar('Invitation cancelled successfully', 'success');
      } else {
        showSnackbar(data.error || 'Failed to cancel invitation', 'error');
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      showSnackbar('Error cancelling invitation', 'error');
    }
  };

  // Resend invitation
  const handleResendInvitation = async (invitationId) => {
    try {
      const response = await fetch(`/api/manuscripts/invitations/${invitationId}`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        showSnackbar('Invitation resent successfully', 'success');
      } else {
        showSnackbar(data.error || 'Failed to resend invitation', 'error');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      showSnackbar('Error resending invitation', 'error');
    }
  };

  // Handle collaborator menu
  const handleCollaboratorMenuClick = (event, collaborator) => {
    setCollaboratorMenuAnchor(event.currentTarget);
    setSelectedCollaboratorForMenu(collaborator);
  };

  const handleCollaboratorMenuClose = () => {
    setCollaboratorMenuAnchor(null);
    setSelectedCollaboratorForMenu(null);
  };

  const handleEditManuscript = (manuscript) => {
    // Navigate to edit page using SPA navigation
    router.push(`/researcher/publications/collaborate/edit/${manuscript.id}`);
    handleMenuClose();
  };

  const handleViewManuscript = (manuscript) => {
    setViewingManuscript(manuscript);
    setViewDialogOpen(true);
  };


  // Enhanced Manuscript Card Component
  const ManuscriptCardComponent = ({ manuscript }) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === manuscript.status);
    const StatusIcon = statusOption?.icon || PendingIcon;
    const isProposal = manuscript.type === 'Proposal';

    // Get all team members including creator and collaborators
    const allTeamMembers = [];
    
    // Add creator if available
    if (manuscript.creator) {
      allTeamMembers.push({
        id: `creator-${manuscript.creator.id || 'unknown'}`,
        name: manuscript.creator.name || `${manuscript.creator.givenName || ''} ${manuscript.creator.familyName || ''}`.trim(),
        role: 'Creator',
        isCreator: true,
        initials: getInitials(manuscript.creator.name || `${manuscript.creator.givenName || ''} ${manuscript.creator.familyName || ''}`.trim()),
        isPending: false
      });
    }

    // Add collaborators
    if (manuscript.collaborators && manuscript.collaborators.length > 0) {
      manuscript.collaborators.forEach(collaborator => {
        if (!collaborator.isCreator) { // Don't duplicate creator
          allTeamMembers.push({
            id: collaborator.id,
            name: collaborator.name,
            role: collaborator.role,
            initials: getInitials(collaborator.name),
            isPending: false
          });
        }
      });
    }

    // Add pending invitations
    if (manuscript.pendingInvitationsList && manuscript.pendingInvitationsList.length > 0) {
      manuscript.pendingInvitationsList.forEach((invitation, index) => {
        const name = `${invitation.givenName || ''} ${invitation.familyName || ''}`.trim();
        allTeamMembers.push({
          id: `pending-${index}`,
          name: name || 'Pending User',
          role: 'Invited',
          initials: getInitials(name),
          isPending: true
        });
      });
    }

    // Limit displayed avatars
    const displayedMembers = allTeamMembers.slice(0, 4);
    const remainingCount = allTeamMembers.length - displayedMembers.length;

    return (
      <Card sx={{
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(139, 108, 188, 0.08)',
        border: '1px solid rgba(139, 108, 188, 0.12)',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(139, 108, 188, 0.15)',
          transform: 'translateY(-4px)',
          borderColor: 'rgba(139, 108, 188, 0.25)'
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbfd 100%)',
        overflow: 'hidden'
      }}>
        {/* Proposal Badge */}
        {isProposal && (
          <Box sx={{
            position: 'absolute',
            top: -8,
            right: 16,
            backgroundColor: '#8b6cbc',
            color: 'white',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.75rem',
            fontWeight: 600,
            zIndex: 1,
            boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            PROPOSAL
          </Box>
        )}
        
        <CardContent sx={{ p: 2 }}>
          {/* Header with status chips */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Chip
              icon={<StatusIcon sx={{ fontSize: 12 }} />}
                label={manuscript.status}
                size="small"
                sx={{
                  backgroundColor: '#8b6cbc',
                  color: 'white',
                  fontWeight: 600,
                fontSize: '0.7rem',
                height: 20,
                borderRadius: 1.5
                }}
              />
              <Chip
                label={manuscript.type}
                size="small"
                variant="outlined"
                sx={{ 
                  borderColor: '#8b6cbc', 
                  color: '#8b6cbc',
                fontSize: '0.7rem',
                height: 20,
                  fontWeight: 500,
                borderRadius: 1.5,
                  backgroundColor: 'rgba(139, 108, 188, 0.04)'
                }}
              />
          </Box>

          {/* Title */}
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 1.5, 
              fontSize: '1rem', 
              lineHeight: 1.3,
              fontWeight: 600,
              color: '#2D3748',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              minHeight: '2.6rem'
            }}
          >
            {manuscript.title}
          </Typography>

          {/* Field */}
          {manuscript.field && (
            <Box sx={{ mb: 1.5 }}>
            <Chip
              label={manuscript.field}
              size="small"
            sx={{ 
                backgroundColor: 'rgba(139, 108, 188, 0.1)',
              color: '#8b6cbc',
              fontWeight: 500,
                  fontSize: '0.7rem',
                  height: 18,
                  borderRadius: 1.5
              }}
            />
          </Box>
          )}

          {/* Team Avatars */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                Team ({allTeamMembers.length})
              </Typography>
              <Tooltip title="Last updated">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
                  <Box sx={{ 
                    width: 4, 
                    height: 4, 
                    backgroundColor: '#4caf50', 
                    borderRadius: '50%' 
                  }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {formatDate(manuscript.updatedAt || manuscript.lastUpdated)}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
              <Stack direction="row" spacing={-0.5}>
              {displayedMembers.map((member) => (
                <Tooltip 
                  key={member.id} 
                  title={`${member.name} (${member.role})${member.isPending ? ' - Invitation Pending' : ''}`}
                >
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      fontSize: '0.65rem',
                      backgroundColor: member.isCreator ? '#ff6b35' : member.isPending ? '#e0e0e0' : '#8b6cbc',
                      color: member.isPending ? '#999' : 'white',
                      border: '1.5px solid white',
                      fontWeight: 600,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      opacity: member.isPending ? 0.7 : 1,
                          position: 'relative',
                      ...(member.isPending && {
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                          top: 0.5,
                          right: 0.5,
                            width: 6,
                            height: 6,
                            backgroundColor: '#f57c00',
                            borderRadius: '50%',
                      border: '1px solid white'
                          }
                      })
                        }}
                      >
                    {member.initials}
                      </Avatar>
                    </Tooltip>
              ))}
              
              {/* Show remaining count */}
              {remainingCount > 0 && (
                <Tooltip title={`+${remainingCount} more team members`}>
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      fontSize: '0.6rem',
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      border: '1.5px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      fontWeight: 600
                    }}
                  >
                    +{remainingCount}
                  </Avatar>
                </Tooltip>
                )}
              </Stack>
            </Box>

          {/* Compact Date Info */}
          <Tooltip title="Created date">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
              <Box sx={{ 
                width: 4, 
                height: 4, 
                backgroundColor: '#2196f3', 
                borderRadius: '50%' 
              }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Created: {formatDate(manuscript.createdAt)}
            </Typography>
          </Box>
          </Tooltip>
        </CardContent>

        {/* Compact Action Buttons */}
        <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 0.5 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 14 }} />}
            onClick={() => handleEditManuscript(manuscript)}
            sx={{
              bgcolor: '#8b6cbc',
              '&:hover': {
                bgcolor: '#7b5ca7',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(139, 108, 188, 0.3)'
              },
              textTransform: 'none',
              fontSize: '0.7rem',
              borderRadius: 1.5,
              px: 1.5,
              py: 0.5,
              minWidth: 'auto',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Edit
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<GroupsIcon sx={{ fontSize: 14 }} />}
            onClick={() => handleManageTeam(manuscript)}
            sx={{
              borderColor: '#8b6cbc',
              color: '#8b6cbc',
              '&:hover': {
                borderColor: '#8b6cbc',
                backgroundColor: 'rgba(139, 108, 188, 0.08)',
                transform: 'translateY(-1px)'
              },
              textTransform: 'none',
              fontSize: '0.7rem',
              borderRadius: 1.5,
              px: 1.5,
              py: 0.5,
              minWidth: 'auto',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            Team
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
            onClick={() => handleDeleteManuscript(manuscript)}
            sx={{
              borderColor: '#f44336',
              color: '#f44336',
              '&:hover': {
                borderColor: '#f44336',
                backgroundColor: 'rgba(244, 67, 54, 0.08)',
                transform: 'translateY(-1px)'
              },
              textTransform: 'none',
              fontSize: '0.7rem',
              borderRadius: 1.5,
              px: 1.5,
              py: 0.5,
              minWidth: 'auto',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            Delete
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <>
      {/* Full-width PageHeader */}
      <Box sx={{ width: '100%',mt:8, mb: 0 }}>
        <PageHeader
          title="Collaborative Writing"
          description="Create and manage your collaborative manuscripts with colleagues"
          icon={<CreateIcon />}
          breadcrumbs={[
            { label: 'Dashboard', href: '/researcher' },
            { label: 'Publications', href: '/researcher/publications' },
            { label: 'Collaborative Writing' }
          ]}
          actionButton={
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  sessionStorage.removeItem('manuscripts');
                  fetchManuscripts();
                  showSnackbar('Page refreshed successfully!', 'success');
                }}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  },
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  backdropFilter: 'blur(10px)',
                  minWidth: 'auto'
                }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<DescriptionIcon />}
                onClick={handleNewProposal}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)'
                }}
              >
                New Proposal
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewManuscriptOpen(true)}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                  },
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                New Manuscript
              </Button>
            </Stack>
          }
        />
      </Box>

      {/* Contained content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        mb: 5,
        flexWrap: 'wrap',
        '@media (max-width: 768px)': {
          flexDirection: 'column'
        }
      }}>
        <Card sx={{ 
          flex: '1 1 250px',
          minWidth: '250px',
          background: '#8b6cbc', 
          color: 'white',
          height: '130px',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 16px rgba(139, 108, 188, 0.3)'
          }
        }}>
          <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 1,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DescriptionIcon sx={{ fontSize: 24 }} />
              </Box>
              <Chip 
                label="+0%" 
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: '2rem' }}>
                {stats.totalManuscripts}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.95 }}>
                Publications
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ 
          flex: '1 1 250px',
          minWidth: '250px',
          background: '#8b6cbc', 
          color: 'white',
          height: '130px',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 16px rgba(139, 108, 188, 0.3)'
          }
        }}>
          <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 1,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AccessTimeIcon sx={{ fontSize: 24 }} />
              </Box>
              <Chip 
                label="+0%" 
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: '2rem' }}>
                {stats.inReviewManuscripts}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.95 }}>
                In Progress
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ 
          flex: '1 1 250px',
          minWidth: '250px',
          background: '#8b6cbc',  
          color: 'white',
          height: '130px',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 16px rgba(139, 108, 188, 0.3)'
          }
        }}>
          <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 1,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <VisibilityIcon sx={{ fontSize: 24 }} />
              </Box>
              <Chip 
                label="+0%" 
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: '2rem' }}>
                {stats.publishedManuscripts}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.95 }}>
                Published
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ 
          flex: '1 1 250px',
          minWidth: '250px',
          background: '#8b6cbc', 
          color: 'white',
          height: '130px',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 16px rgba(139, 108, 188, 0.3)'
          }
        }}>
          <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 1,
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GroupsIcon sx={{ fontSize: 24 }} />
              </Box>
              <Chip 
                label="+0%" 
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: '24px'
                }}
              />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: '2rem' }}>
                {stats.totalCollaborators}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, opacity: 0.95 }}>
                Collaborators
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Professional Search and Filters */}
      <Paper sx={{ 
        mb: 3, 
        p: 4, 
        borderRadius: 4, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          alignItems: 'center',
          flexWrap: 'wrap',
          '@media (max-width: 768px)': {
            flexDirection: 'column',
            alignItems: 'stretch'
          }
        }}>
          <Box sx={{ flex: '2 1 300px', minWidth: '300px' }}>
            <TextField
              fullWidth
              placeholder="Search manuscripts, collaborators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#8b6cbc' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchQuery('')} size="small">
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,1)',
                    '& fieldset': {
                      borderColor: '#8b6cbc',
                    }
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                },
              }}
            />
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,1)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b6cbc',
                  },
                }}
              >
                <MenuItem value="All Status">All Status</MenuItem>
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,1)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b6cbc',
                  },
                }}
              >
                <MenuItem value="All Types">All Types</MenuItem>
                {PUBLICATION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: '0 0 auto' }}>
            <Button
              variant="text"
              startIcon={<CloseIcon />}
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All Status');
                setTypeFilter('All Types');
              }}
              sx={{ 
                borderRadius: 3,
                height: '56px',
                px: 3,
                color: '#8b6cbc',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(139, 108, 188, 0.08)',
                  color: '#7a5cac'
                }
              }}
            >
              Clear All
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Manuscripts Display */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item}>
              <Card sx={{ p: 3 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 2 }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredManuscripts.length === 0 ? (
        // Professional Empty State
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'rgba(139, 108, 188, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                mb: 3,
              }}
            >
              <MenuBookIcon sx={{ fontSize: 40, color: '#8b6cbc' }} />
            </Box>
            
            <Typography
              variant="h5"
              sx={{
                color: '#2D3748',
                mb: 2,
                fontWeight: 600,
              }}
            >
              No Manuscripts Yet
            </Typography>
            
            <Typography
              color="text.secondary"
              sx={{ 
                mb: 4, 
                maxWidth: 500, 
                mx: 'auto',
                fontSize: '1rem',
                lineHeight: 1.5
              }}
            >
              Start your collaborative writing journey by creating your first manuscript.
              Invite colleagues and work together seamlessly.
            </Typography>

            {/* Simplified feature highlights */}
            <Grid container spacing={3} sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <GroupsIcon sx={{ fontSize: 24, color: '#8b6cbc', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '0.875rem' }}>
                    Team Collaboration
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <TimelineIcon sx={{ fontSize: 24, color: '#8b6cbc', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '0.875rem' }}>
                    Progress Tracking
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <EditIcon sx={{ fontSize: 24, color: '#8b6cbc', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2D3748', fontSize: '0.875rem' }}>
                    Real-time Editing
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewManuscriptOpen(true)}
            sx={{
              bgcolor: '#8b6cbc',
              color: 'white',
              borderRadius: 2,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              '&:hover': {
                bgcolor: '#7b5ca7',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Create First Manuscript
          </Button>
        </Paper>
      ) : (
        // Manuscripts Table
        <>
          <Paper sx={{ 
            borderRadius: 3, 
            overflow: 'hidden', 
            boxShadow: '0 4px 16px rgba(139, 108, 188, 0.08)', 
            border: '1px solid rgba(139, 108, 188, 0.12)',
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfd 100%)'
          }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#8b6cbc' }}>
                      <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>
                        Title
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>
                        Team
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2 }}>
                        Last Updated
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'white', borderBottom: 'none', py: 2, textAlign: 'center' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedManuscripts.map((manuscript, index) => {
                      const statusOption = STATUS_OPTIONS.find(s => s.value === manuscript.status);
                      const isProposal = manuscript.type === 'Proposal';
                      return (
                        <TableRow 
                          key={manuscript.id} 
                          sx={{ 
                            bgcolor: index % 2 === 0 ? '#fafafa' : 'white',
                            '&:hover': { backgroundColor: '#f0f0f0' },
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          {/* Title */}
                          <TableCell sx={{ py: 2, maxWidth: 400 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <Box sx={{ 
                                color: '#8b6cbc',
                                mt: 0.5
                              }}>
                                {isProposal ? <ProposalIcon /> : <DescriptionIcon />}
                              </Box>
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography 
                                  variant="subtitle1" 
                                  onClick={() => handleEditManuscript(manuscript)}
                                  sx={{ 
                                    fontWeight: 600, 
                                    color: '#2D3748', 
                                    mb: 0.5,
                                    fontSize: '0.95rem',
                                    lineHeight: 1.3,
                                    display: '-webkit-box',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: 2,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      color: '#8b6cbc',
                                      textDecoration: 'underline'
                                    },
                                    transition: 'color 0.2s ease'
                                  }}
                                >
                                  {manuscript.title}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                  {isProposal && (
                                    <Chip
                                      label="PROPOSAL"
                                      size="small"
                                      sx={{
                                        backgroundColor: '#8b6cbc',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.65rem',
                                        height: 18,
                                        borderRadius: 1
                                      }}
                                    />
                                  )}
                                  <Chip
                                    label={manuscript.field}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(139, 108, 188, 0.1)',
                                      color: '#8b6cbc',
                                      fontWeight: 500,
                                      fontSize: '0.75rem',
                                      height: 20,
                                      borderRadius: 1
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Status */}
                          <TableCell sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Chip
                                label={manuscript.status}
                                size="small"
                                sx={{
                                  backgroundColor: statusOption?.color || '#8b6cbc',
                                  color: 'white',
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                  textTransform: 'capitalize'
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {manuscript.type}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Team */}
                          <TableCell sx={{ py: 2 }}>
                            {(() => {
                              // Build complete team list
                              const allMembers = [];
                              
                              // Add creator first if exists
                              if (manuscript.creator) {
                                const creatorName = manuscript.creator.name || 
                                  `${manuscript.creator.givenName || ''} ${manuscript.creator.familyName || ''}`.trim();
                                allMembers.push({
                                  id: `creator-${manuscript.creator.id || 'unknown'}`,
                                  name: creatorName,
                                  initials: creatorName ? creatorName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() : '?',
                                  role: 'Owner',
                                  isCreator: true,
                                  isPending: false
                                });
                              }
                              
                              // Add collaborators (excluding creator if already added)
                              if (manuscript.collaborators && manuscript.collaborators.length > 0) {
                                manuscript.collaborators.forEach(collaborator => {
                                  // Skip if this is the creator we already added
                                  if (manuscript.creator && collaborator.name === manuscript.creator.name) return;
                                  allMembers.push({
                                    id: collaborator.id,
                                    name: collaborator.name,
                                    initials: collaborator.avatar || (collaborator.name ? collaborator.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() : '?'),
                                    role: collaborator.role,
                                    isCreator: collaborator.role === 'OWNER',
                                    isPending: false
                                  });
                                });
                              }
                              
                              // Add pending invitations
                              if (manuscript.pendingInvitationsList && manuscript.pendingInvitationsList.length > 0) {
                                manuscript.pendingInvitationsList.forEach((invitation, idx) => {
                                  const name = `${invitation.givenName || ''} ${invitation.familyName || ''}`.trim();
                                  allMembers.push({
                                    id: `pending-${idx}`,
                                    name: name || 'Pending',
                                    initials: name ? name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() : '?',
                                    role: invitation.role || 'Invited',
                                    isCreator: false,
                                    isPending: true
                                  });
                                });
                              }
                              
                              // Display up to 5 avatars, then show +X
                              const maxDisplay = 5;
                              const displayedMembers = allMembers.slice(0, maxDisplay);
                              const remainingCount = allMembers.length - displayedMembers.length;
                              
                              return (
                                <Tooltip 
                                  title={
                                    <Box sx={{ p: 1 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                                        Team Members ({allMembers.length})
                                      </Typography>
                                      {allMembers.map((member, idx) => (
                                        <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                                          <Box sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            backgroundColor: member.isPending ? '#f57c00' : member.isCreator ? '#8b6cbc' : '#4caf50'
                                          }} />
                                          <Typography variant="caption">
                                            {member.name} ({member.isPending ? 'Pending' : member.role})
                                          </Typography>
                                        </Box>
                                      ))}
                                    </Box>
                                  }
                                  arrow
                                  placement="top"
                                >
                                  <Stack direction="row" spacing={-0.5} sx={{ alignItems: 'center', cursor: 'pointer' }}>
                                    {displayedMembers.map((member, idx) => (
                                      <Avatar
                                        key={member.id}
                                        sx={{
                                          width: 28,
                                          height: 28,
                                          fontSize: '0.7rem',
                                          backgroundColor: member.isPending ? '#e0e0e0' : member.isCreator ? '#8b6cbc' : '#7c9abd',
                                          color: member.isPending ? '#999' : 'white',
                                          border: '2px solid white',
                                          fontWeight: 600,
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                          zIndex: 10 - idx,
                                          opacity: member.isPending ? 0.7 : 1,
                                          position: 'relative',
                                          ...(member.isPending && {
                                            '&::after': {
                                              content: '""',
                                              position: 'absolute',
                                              top: -2,
                                              right: -2,
                                              width: 8,
                                              height: 8,
                                              backgroundColor: '#f57c00',
                                              borderRadius: '50%',
                                              border: '1.5px solid white'
                                            }
                                          })
                                        }}
                                      >
                                        {member.initials}
                                      </Avatar>
                                    ))}
                                    
                                    {/* Remaining count */}
                                    {remainingCount > 0 && (
                                      <Avatar
                                        sx={{
                                          width: 28,
                                          height: 28,
                                          fontSize: '0.7rem',
                                          backgroundColor: '#f5f5f5',
                                          color: '#666',
                                          border: '2px solid white',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                          zIndex: 5,
                                          fontWeight: 600
                                        }}
                                      >
                                        +{remainingCount}
                                      </Avatar>
                                    )}
                                  </Stack>
                                </Tooltip>
                              );
                            })()}
                          </TableCell>

                          {/* Last Updated */}
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatDate(manuscript.lastUpdated || manuscript.updatedAt)}
                            </Typography>
                            {manuscript.lastUpdater && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                by {manuscript.lastUpdater.name || `${manuscript.lastUpdater.givenName || ''} ${manuscript.lastUpdater.familyName || ''}`.trim()}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell sx={{ py: 2, textAlign: 'center' }}>
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 0.5, 
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <Tooltip title="View Details" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewManuscript(manuscript)}
                                  sx={{ 
                                    color: '#8b6cbc',
                                    '&:hover': { bgcolor: '#8b6cbc10' }
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Manuscript" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditManuscript(manuscript)}
                                  sx={{ 
                                    color: '#666',
                                    '&:hover': { bgcolor: '#66666610' }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Manage Team" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleManageTeam(manuscript)}
                                  sx={{ 
                                    color: '#4caf50',
                                    '&:hover': { bgcolor: '#4caf5010' }
                                  }}
                                >
                                  <GroupsIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteManuscript(manuscript)}
                                  sx={{ 
                                    color: '#f44336',
                                    '&:hover': { bgcolor: '#f4433610' }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
              <TablePagination
                component="div"
                count={filteredManuscripts.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                sx={{
                  borderTop: '1px solid rgba(139, 108, 188, 0.12)',
                  bgcolor: '#fafbfd',
                  '.MuiTablePagination-toolbar': {
                    minHeight: 52
                  },
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                    fontWeight: 500,
                    color: '#6b7280'
                  }
                }}
              />
            </Paper>
        </>
      )}

      {/* Professional Context Menu */}
      <Popover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        disablePortal={false}
        disableScrollLock={true}
        sx={{
          zIndex: 1300,
          '& .MuiPaper-root': {
            minWidth: 180,
            mt: 0.5,
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
            overflow: 'visible'
          }
        }}
      >
        <MenuList sx={{ py: 1 }}>
          <MuiMenuItem 
            onClick={() => handleEditManuscript(menuManuscript)}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: '#8b6cbc10',
          },
        }}
      >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Manuscript
        </MuiMenuItem>
          <MuiMenuItem 
            onClick={() => handleManageTeam(menuManuscript)}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: '#8b6cbc10',
              },
            }}
          >
          <ListItemIcon>
            <GroupsIcon fontSize="small" />
          </ListItemIcon>
          Manage Team
        </MuiMenuItem>
        <Divider sx={{ mx: 0.5 }} />
          <MuiMenuItem 
            onClick={handleMenuClose}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: '#8b6cbc10',
              },
            }}
          >
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          Share
        </MuiMenuItem>
          <MuiMenuItem 
            onClick={handleMenuClose}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: '#8b6cbc10',
              },
            }}
          >
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          Archive
        </MuiMenuItem>
        </MenuList>
      </Popover>

      {/* New Manuscript Dialog */}
      <Dialog
        open={newManuscriptOpen}
        onClose={() => {
          setNewManuscriptOpen(false);
          setManuscriptActiveStep(0);
          setManuscriptFormError(null);
          setNewManuscript({
            title: '',
            type: '',
            field: '',
            fields: [],
            description: '',
            collaborators: []
          });
        }}
        maxWidth="lg"
        fullWidth
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            minHeight: '70vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
            color: 'white',
            p: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 48, 
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white'
            }}>
              <AddIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                Create New Manuscript
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Start a new collaborative writing project
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {manuscriptFormError && (
            <Alert severity="error" sx={{ m: 3, mb: 0 }}>
              {manuscriptFormError}
            </Alert>
          )}

          {/* Stepper */}
          <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafbfd' }}>
            <Stepper activeStep={manuscriptActiveStep} sx={{ mb: 2 }}>
              {manuscriptSteps.map((label) => (
                <Step key={label}>
                  <StepLabel 
                    sx={{
                      '& .MuiStepLabel-root .Mui-completed': { color: '#8b6cbc' },
                      '& .MuiStepLabel-root .Mui-active': { color: '#8b6cbc' },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Step Content */}
          {manuscriptActiveStep === 0 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2D3748' }}>
                Manuscript Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Manuscript Title */}
                <TextField
                  fullWidth
                  label="Manuscript Title *"
                  value={newManuscript.title}
                  onChange={(e) => setNewManuscript(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a descriptive title for your manuscript..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#8b6cbc' },
                      '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                    },
                  }}
                />

                {/* Publication Type */}
                <FormControl fullWidth required>
                  <InputLabel sx={{ '&.Mui-focused': { color: '#8b6cbc' } }}>Publication Type *</InputLabel>
                  <Select
                    value={newManuscript.type}
                    label="Publication Type *"
                    onChange={(e) => setNewManuscript(prev => ({ ...prev, type: e.target.value }))}
                    sx={{
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' },
                    }}
                  >
                    {PUBLICATION_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Research Fields - Multiple Selection Dropdown with Custom Entry */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Research Fields * (Select multiple or add custom)
                  </Typography>
                  
                  <Autocomplete
                    multiple
                    freeSolo
                    value={newManuscript.fields}
                    onChange={(event, newValue) => {
                      // Handle both predefined selections and custom entries
                      const processedValues = newValue.map(value => 
                        typeof value === 'string' ? value.trim() : value
                      ).filter(value => value !== ''); // Remove empty strings
                      
                      setNewManuscript(prev => ({
                        ...prev,
                        fields: processedValues
                      }));
                    }}
                    options={MEDICAL_FIELDS.filter(field => field !== 'Other')}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="filled"
                          label={option}
                          {...getTagProps({ index })}
                          key={`${option}-${index}`}
                          sx={{
                            backgroundColor: '#8b6cbc',
                            color: 'white',
                            '& .MuiChip-deleteIcon': {
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': { color: 'white' }
                            }
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        placeholder="Select existing fields or type custom ones..."
                        helperText="Type and press Enter to add custom fields, or select from dropdown"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#8b6cbc' },
                            '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                          },
                          '& .MuiFormLabel-root.Mui-focused': { color: '#8b6cbc' }
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScienceIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                            <Typography variant="body2">{option}</Typography>
                          </Box>
                        </Box>
                      );
                    }}
                    sx={{
                      '& .MuiAutocomplete-tag': {
                        margin: '2px',
                      },
                      '& .MuiAutocomplete-inputRoot': {
                        paddingTop: '8px',
                        paddingBottom: '8px',
                      }
                    }}
                    ChipProps={{
                      sx: {
                        backgroundColor: '#8b6cbc',
                        color: 'white',
                        '& .MuiChip-deleteIcon': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': { color: 'white' }
                        }
                      }
                    }}
                  />
                  
                  {/* Information about custom fields */}
                  {newManuscript.fields.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CategoryIcon sx={{ fontSize: 14 }} />
                        {newManuscript.fields.length} field{newManuscript.fields.length !== 1 ? 's' : ''} selected
                        {newManuscript.fields.some(field => !MEDICAL_FIELDS.includes(field)) && (
                          <Chip 
                            label="Custom fields included" 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              ml: 1, 
                              height: 18, 
                              fontSize: '0.65rem',
                              borderColor: '#8b6cbc',
                              color: '#8b6cbc'
                            }} 
                          />
                        )}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Description */}
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={newManuscript.description}
                  onChange={(e) => setNewManuscript(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Briefly describe your manuscript objectives, methodology, or key themes..."
                  multiline
                  rows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': { borderColor: '#8b6cbc' },
                      '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                    },
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Step 2: Invite Collaborators */}
          {manuscriptActiveStep === 1 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2D3748' }}>
                Invite Collaborators
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add team members to your manuscript using their ORCID IDs or by searching their names.
              </Typography>
              
              {/* ORCID Collaborator Invite Component */}
              <OrcidCollaboratorInvite
                manuscriptId={null}
                collaborators={newManuscript.collaborators}
                onCollaboratorsChange={(updatedCollaborators) => {
                  setNewManuscript(prev => ({
                    ...prev,
                    collaborators: updatedCollaborators
                  }));
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2, borderTop: '1px solid #e0e0e0', backgroundColor: '#fafbfd' }}>
          <Button 
            onClick={() => {
            setNewManuscriptOpen(false);
            setManuscriptActiveStep(0);
            setManuscriptFormError(null);
            setNewManuscript({
              title: '',
              type: '',
              field: '',
              fields: [],
              description: '',
              collaborators: []
            });
            }}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            Cancel
          </Button>
          
          <Box sx={{ flex: 1 }} />
          
          {manuscriptActiveStep > 0 && (
            <Button 
              onClick={() => setManuscriptActiveStep(prev => prev - 1)}
              variant="outlined"
              sx={{
                borderColor: '#8b6cbc',
                color: '#8b6cbc',
                '&:hover': {
                  borderColor: '#8b6cbc',
                  backgroundColor: 'rgba(139, 108, 188, 0.08)'
                }
              }}
            >
              <ArrowBackIcon sx={{ mr: 1, fontSize: 18 }} />
              Back
            </Button>
          )}
          
          {manuscriptActiveStep === 0 ? (
          <Button
            variant="contained"
              disabled={!newManuscript.title || !newManuscript.type || newManuscript.fields.length === 0}
              onClick={handleManuscriptNextStep}
              sx={{ 
                background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
                px: 3,
                py: 1,
                '&:hover': {
                  background: 'linear-gradient(135deg, #7b5ca7 0%, #8565c1 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)'
                },
                '&:disabled': {
                  background: '#e0e0e0',
                  color: '#999'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Continue to Collaborators
              <ArrowForwardIcon sx={{ ml: 1, fontSize: 18 }} />
          </Button>
          ) : (
            <Button
              variant="contained"
              disabled={isSubmittingManuscript}
              startIcon={isSubmittingManuscript ? <CircularProgress size={20} color="inherit" /> : <RocketLaunchIcon />}
              onClick={handleFinishManuscript}
              sx={{ 
                background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                px: 3,
                py: 1,
                '&:hover': {
                  background: 'linear-gradient(135deg, #43a047 0%, #5cb85c 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                },
                '&:disabled': {
                  background: '#e0e0e0',
                  color: '#999'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {isSubmittingManuscript ? 'Creating Manuscript...' : 'Create & Send Invites'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Team Management Dialog */}
      <Dialog
        open={teamManagementOpen}
        onClose={() => {
          setTeamManagementOpen(false);
          setTeamData({ collaborators: [], pendingInvitations: [] });
          setAddCollaboratorOpen(false);
          setEditingCollaborator(null);
        }}
        maxWidth="lg"
        fullWidth
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            minHeight: '70vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #e0e0e0',
          background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
          color: 'white',
          p: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              width: 40, 
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white'
            }}>
              <GroupsIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Manage Team
              </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {selectedManuscript?.title}
              </Typography>
            </Box>
            </Box>
            <IconButton 
              onClick={() => setTeamManagementOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {teamLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <CircularProgress sx={{ color: '#8b6cbc' }} />
            </Box>
          ) : (
            <Box sx={{ height: '60vh', overflow: 'hidden' }}>
              {/* Tabs for different sections */}
              <Box sx={{ borderBottom: '1px solid #e0e0e0', px: 3, pt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Team Overview
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                  <Chip 
                    icon={<GroupsIcon fontSize="small" />}
                    label={`${teamData.collaborators.length} Members`}
                    variant="outlined"
                    sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
                  />
                  <Chip 
                    icon={<ScheduleIcon fontSize="small" />}
                    label={`${teamData.pendingInvitations.length} Pending`}
                    variant="outlined"
                    sx={{ borderColor: '#f57c00', color: '#f57c00' }}
                  />
                </Box>
              </Box>

              <Box sx={{ height: 'calc(100% - 100px)', overflow: 'auto', p: 3 }}>
                {/* Current Team Members */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Team Members ({teamData.collaborators.length})
                    </Typography>
                    <Button
                      startIcon={<PersonAddIcon />}
                      variant="outlined"
                      size="small"
                      onClick={() => setAddCollaboratorOpen(true)}
                      sx={{
                        borderColor: '#8b6cbc',
                        color: '#8b6cbc',
                        '&:hover': {
                          borderColor: '#8b6cbc',
                          backgroundColor: '#8b6cbc10'
                        }
                      }}
                    >
                      Add Member
                    </Button>
                  </Box>

                  {teamData.collaborators.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f9f9f9' }}>
                      <GroupsIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                      <Typography color="textSecondary">
                        No team members yet. Add collaborators to get started.
                      </Typography>
                    </Paper>
                  ) : (
                    <List sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      {teamData.collaborators.map((collaborator) => {
                const role = COLLABORATOR_ROLES.find(r => r.value === collaborator.role);
                const RoleIcon = role?.icon || PersonIcon;
                        const isOwner = collaborator.role === 'OWNER';
                
                return (
                          <ListItem key={collaborator.id} divider>
                    <ListItemAvatar>
                              <Avatar sx={{
                                backgroundColor: isOwner ? '#8b6cbc' : '#2196f3',
                          fontWeight: 600
                              }}>
                                {collaborator.user.givenName?.charAt(0)}{collaborator.user.familyName?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                            
                    <ListItemText
                              primary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
                                    {collaborator.user.givenName} {collaborator.user.familyName}
                                  </Typography>
                                  {isOwner && (
                                    <Chip 
                                      label="Creator" 
                                      size="small" 
                                      sx={{ 
                                        backgroundColor: '#8b6cbc', 
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        height: 20
                                      }} 
                                    />
                                  )}
                                </Box>
                              }
                      secondary={
                                <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <RoleIcon sx={{ fontSize: 16, color: role?.color }} />
                          <Typography variant="caption" sx={{ color: role?.color, fontWeight: 600 }} component="span">
                            {isOwner ? 'Creator' : collaborator.role}
                          </Typography>
                                  </Box>
                                  {collaborator.user.orcidId && (
                                    <Typography variant="caption" color="textSecondary" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <img src="/orcid.svg" alt="ORCID" style={{ width: 12, height: 12 }} />
                                      {collaborator.user.orcidId}
                                    </Typography>
                                  )}
                                  {collaborator.user.primaryInstitution && (
                                    <Typography variant="caption" color="textSecondary" component="span" sx={{ display: 'block' }}>
                                      {collaborator.user.primaryInstitution}
                                    </Typography>
                                  )}
                        </Box>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                            
                    <ListItemSecondaryAction>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {/* Permissions indicators */}
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title={collaborator.canEdit ? "Can Edit Content" : "Cannot Edit"} arrow>
                                    <Chip 
                                      size="small" 
                                      icon={<EditIcon sx={{ fontSize: '14px !important' }} />}
                                      label="Edit" 
                                      sx={{ 
                                        fontSize: '0.65rem', 
                                        height: 22,
                                        bgcolor: collaborator.canEdit ? '#e8f5e9' : '#f5f5f5',
                                        color: collaborator.canEdit ? '#2e7d32' : '#9e9e9e',
                                        '& .MuiChip-icon': { 
                                          color: collaborator.canEdit ? '#2e7d32' : '#9e9e9e' 
                                        },
                                        border: collaborator.canEdit ? '1px solid #a5d6a7' : '1px solid #e0e0e0'
                                      }} 
                                    />
                                  </Tooltip>
                                  <Tooltip title={collaborator.canInvite ? "Can Invite Members" : "Cannot Invite"} arrow>
                                    <Chip 
                                      size="small" 
                                      icon={<PersonAddIcon sx={{ fontSize: '14px !important' }} />}
                                      label="Invite" 
                                      sx={{ 
                                        fontSize: '0.65rem', 
                                        height: 22,
                                        bgcolor: collaborator.canInvite ? '#e3f2fd' : '#f5f5f5',
                                        color: collaborator.canInvite ? '#1565c0' : '#9e9e9e',
                                        '& .MuiChip-icon': { 
                                          color: collaborator.canInvite ? '#1565c0' : '#9e9e9e' 
                                        },
                                        border: collaborator.canInvite ? '1px solid #90caf9' : '1px solid #e0e0e0'
                                      }} 
                                    />
                                  </Tooltip>
                                  <Tooltip title={collaborator.canDelete ? "Can Delete Content" : "Cannot Delete"} arrow>
                                    <Chip 
                                      size="small" 
                                      icon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
                                      label="Delete" 
                                      sx={{ 
                                        fontSize: '0.65rem', 
                                        height: 22,
                                        bgcolor: collaborator.canDelete ? '#ffebee' : '#f5f5f5',
                                        color: collaborator.canDelete ? '#c62828' : '#9e9e9e',
                                        '& .MuiChip-icon': { 
                                          color: collaborator.canDelete ? '#c62828' : '#9e9e9e' 
                                        },
                                        border: collaborator.canDelete ? '1px solid #ef9a9a' : '1px solid #e0e0e0'
                                      }} 
                                    />
                                  </Tooltip>
                                </Box>
                                
                                {/* Action buttons */}
                                {!isOwner && (
                                  <Box sx={{ display: 'flex', gap: 0.5, ml: 1, borderLeft: '1px solid #e0e0e0', pl: 1.5 }}>
                                    <Tooltip title="Edit Role & Permissions" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setEditingCollaborator(collaborator);
                                        }}
                                        sx={{ 
                                          color: '#8b6cbc',
                                          '&:hover': { bgcolor: '#8b6cbc10' }
                                        }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove from Team" arrow>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                                        sx={{ 
                                          color: '#f44336',
                                          '&:hover': { bgcolor: '#f4433610' }
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}
                </Box>

                {/* Pending Invitations */}
                {teamData.pendingInvitations.length > 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Pending Invitations ({teamData.pendingInvitations.length})
                    </Typography>
                    
                    <List sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                      {teamData.pendingInvitations.map((invitation) => (
                        <ListItem key={invitation.id} divider>
                          <ListItemAvatar>
                            <Avatar sx={{ backgroundColor: '#f57c00' }}>
                              <PendingIcon />
                            </Avatar>
                          </ListItemAvatar>
                          
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {invitation.givenName} {invitation.familyName}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="textSecondary" component="span" sx={{ display: 'block' }}>
                                  {invitation.email}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Chip 
                                    label={invitation.role} 
                                    size="small" 
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                  <Typography variant="caption" color="textSecondary" component="span">
                                    Invited {new Date(invitation.createdAt).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                            primaryTypographyProps={{ component: 'div' }}
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                          
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Resend Invitation">
                                <IconButton
                                  size="small"
                                  onClick={() => handleResendInvitation(invitation.id)}
                                  sx={{ color: '#2196f3' }}
                                >
                                  <RefreshIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel Invitation">
                                <IconButton
                                  size="small"
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                  sx={{ color: '#f44336' }}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Collaborator Menu */}
      <Menu
        anchorEl={collaboratorMenuAnchor}
        open={Boolean(collaboratorMenuAnchor)}
        onClose={handleCollaboratorMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 200
          }
        }}
      >
        <MenuItem onClick={() => {
          setEditingCollaborator(selectedCollaboratorForMenu);
          handleCollaboratorMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Role</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            if (selectedCollaboratorForMenu) {
              handleRemoveCollaborator(selectedCollaboratorForMenu.id);
            }
            handleCollaboratorMenuClose();
          }}
          sx={{ color: '#f44336' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
          </ListItemIcon>
          <ListItemText>Remove from Team</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Collaborator Dialog */}
      <Dialog
        open={addCollaboratorOpen}
        onClose={() => setAddCollaboratorOpen(false)}
        maxWidth="md"
        fullWidth
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: 1,
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonAddIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Add Team Member
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {selectedManuscript && (
            <OrcidCollaboratorInvite
              manuscriptId={selectedManuscript.id}
              collaborators={[]}
              onCollaboratorsChange={async () => {
                // Refresh team data after adding collaborator
                await fetchTeamData(selectedManuscript.id);
                setAddCollaboratorOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Collaborator Role Dialog */}
      <Dialog
        open={Boolean(editingCollaborator)}
        onClose={() => setEditingCollaborator(null)}
        maxWidth="sm"
        fullWidth
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: 1,
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Edit Role & Permissions
            </Typography>
          </Box>
          <IconButton onClick={() => setEditingCollaborator(null)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {editingCollaborator && (
            <Box>
              {/* Collaborator Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Avatar sx={{ bgcolor: '#8b6cbc', width: 48, height: 48 }}>
                  {editingCollaborator.user?.givenName?.charAt(0)}{editingCollaborator.user?.familyName?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {editingCollaborator.user?.givenName} {editingCollaborator.user?.familyName}
                  </Typography>
                  {editingCollaborator.user?.orcidId && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <img src="/orcid.svg" alt="ORCID" style={{ width: 12, height: 12 }} />
                      {editingCollaborator.user.orcidId}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Role Selection */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Role
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <Select
                  value={(() => {
                    // Map the current role to match COLLABORATOR_ROLES values
                    const currentRole = editingCollaborator.role;
                    if (!currentRole) return 'Contributor';
                    // Handle uppercase roles from API (e.g., ADMIN -> Admin)
                    const normalizedRole = currentRole.charAt(0).toUpperCase() + currentRole.slice(1).toLowerCase();
                    // Check if it matches any of our roles
                    const matchedRole = COLLABORATOR_ROLES.find(r => 
                      r.value.toLowerCase() === currentRole.toLowerCase()
                    );
                    return matchedRole ? matchedRole.value : 'Contributor';
                  })()}
                  onChange={(e) => setEditingCollaborator(prev => ({ ...prev, role: e.target.value }))}
                  MenuProps={{ disableScrollLock: true }}
                  renderValue={(selected) => {
                    const selectedRole = COLLABORATOR_ROLES.find(r => r.value === selected);
                    if (!selectedRole) return selected;
                    const RoleIcon = selectedRole.icon;
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RoleIcon sx={{ color: selectedRole.color, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRole.label}</Typography>
                      </Box>
                    );
                  }}
                >
                  {COLLABORATOR_ROLES.filter(r => r.value !== 'Owner').map((role) => {
                    const RoleIcon = role.icon;
                    return (
                      <MenuItem key={role.value} value={role.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <RoleIcon sx={{ color: role.color, fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{role.label}</Typography>
                            <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {/* Permissions */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Permissions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    border: editingCollaborator.canEdit ? '1px solid #a5d6a7' : '1px solid #e0e0e0',
                    bgcolor: editingCollaborator.canEdit ? '#e8f5e9' : 'white',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EditIcon sx={{ color: editingCollaborator.canEdit ? '#2e7d32' : '#9e9e9e' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Can Edit</Typography>
                      <Typography variant="caption" color="text.secondary">Allow editing manuscript content</Typography>
                    </Box>
                  </Box>
                  <Checkbox
                    checked={editingCollaborator.canEdit || false}
                    onChange={(e) => setEditingCollaborator(prev => ({ ...prev, canEdit: e.target.checked }))}
                    sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#2e7d32' } }}
                  />
                </Paper>

                <Paper 
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    border: editingCollaborator.canInvite ? '1px solid #90caf9' : '1px solid #e0e0e0',
                    bgcolor: editingCollaborator.canInvite ? '#e3f2fd' : 'white',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PersonAddIcon sx={{ color: editingCollaborator.canInvite ? '#1565c0' : '#9e9e9e' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Can Invite</Typography>
                      <Typography variant="caption" color="text.secondary">Allow inviting new team members</Typography>
                    </Box>
                  </Box>
                  <Checkbox
                    checked={editingCollaborator.canInvite || false}
                    onChange={(e) => setEditingCollaborator(prev => ({ ...prev, canInvite: e.target.checked }))}
                    sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#1565c0' } }}
                  />
                </Paper>

                <Paper 
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    border: editingCollaborator.canDelete ? '1px solid #ef9a9a' : '1px solid #e0e0e0',
                    bgcolor: editingCollaborator.canDelete ? '#ffebee' : 'white',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <DeleteIcon sx={{ color: editingCollaborator.canDelete ? '#c62828' : '#9e9e9e' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Can Delete</Typography>
                      <Typography variant="caption" color="text.secondary">Allow deleting content and sections</Typography>
                    </Box>
                  </Box>
                  <Checkbox
                    checked={editingCollaborator.canDelete || false}
                    onChange={(e) => setEditingCollaborator(prev => ({ ...prev, canDelete: e.target.checked }))}
                    sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#c62828' } }}
                  />
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setEditingCollaborator(null)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={async () => {
              if (editingCollaborator) {
                await handleUpdateCollaboratorRole(
                  editingCollaborator.id,
                  editingCollaborator.role,
                  {
                    canEdit: editingCollaborator.canEdit,
                    canInvite: editingCollaborator.canInvite,
                    canDelete: editingCollaborator.canDelete
                  }
                );
                setEditingCollaborator(null);
              }
            }}
            sx={{ 
              bgcolor: '#8b6cbc', 
              '&:hover': { bgcolor: '#7559a3' } 
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced New Manuscript Modal */}
      <Dialog
        open={newPublicationOpen}
        onClose={() => {
          setNewPublicationOpen(false);
          setActiveStep(0);
          setFormError(null);
        }}
        maxWidth="lg"
        fullWidth
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfd 100%)',
            border: '1px solid rgba(139, 108, 188, 0.08)',
            minHeight: '70vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Professional Header */}
        <DialogTitle
          sx={{
            position: 'relative',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5ca7 100%)',
            color: 'white',
            p: 3,
            overflow: 'hidden',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Subtle background pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '50%',
              transform: 'translate(50px, -50px)',
              zIndex: 0
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}
              >
                <AddIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 0.5,
                    fontSize: '1.5rem',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Create New Manuscript
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 400,
                    fontSize: '0.875rem'
                  }}
                >
                  Set up a new collaborative research project
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogTitle>

        {/* Professional Stepper */}
        <Box sx={{ 
          px: 4, 
          pt: 2.5, 
          pb: 2, 
          background: '#fafbfd',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}>
          <Stepper 
            activeStep={activeStep}
            sx={{
              '& .MuiStepLabel-root .Mui-completed': {
                color: '#8b6cbc',
              },
              '& .MuiStepLabel-root .Mui-active': {
                color: '#8b6cbc',
              },
              '& .MuiStepConnector-alternativeLabel': {
                top: 10,
                left: 'calc(-50% + 16px)',
                right: 'calc(50% + 16px)',
              },
              '& .MuiStepConnector-alternativeLabel.Mui-active .MuiStepConnector-line': {
                borderColor: '#8b6cbc',
              },
              '& .MuiStepConnector-alternativeLabel.Mui-completed .MuiStepConnector-line': {
                borderColor: '#8b6cbc',
              },
            }}
          >
            {manuscriptSteps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {formError && (
          <Box sx={{ px: 4, pb: 2 }}>
            <Alert
              severity="error"
              sx={{
                borderRadius: 3,
                border: '1px solid rgba(244, 67, 54, 0.2)',
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(244, 67, 54, 0.02) 100%)'
              }}
              icon={<ErrorIcon />}
            >
              {formError}
            </Alert>
          </Box>
        )}

        <DialogContent sx={{ p: 0, flex: 1 }}>
          {activeStep === 0 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Manuscript Information
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Title Field */}
                <TextField
                  fullWidth
                  label="Manuscript Title *"
                  value={newManuscript.title}
                  onChange={(e) => setNewManuscript(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Enter a descriptive title for your manuscript"
                />
                
                {/* Publication Type Field */}
                <FormControl fullWidth required>
                  <InputLabel>Publication Type *</InputLabel>
                  <Select
                    value={newManuscript.type}
                    label="Publication Type *"
                    onChange={(e) => setNewManuscript(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {PUBLICATION_TYPES.map(type => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Research Fields - Multiple Selection */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                    Research Fields * (Select multiple)
                  </Typography>
                  
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                    <FormGroup>
                      {MEDICAL_FIELDS.map((field) => (
                        <FormControlLabel
                          key={field}
                          control={
                            <Checkbox
                              checked={newManuscript.fields.includes(field)}
                              onChange={(e) => {
                                const fieldValue = e.target.value;
                                setNewManuscript(prev => ({
                                  ...prev,
                                  fields: e.target.checked
                                    ? [...prev.fields, fieldValue]
                                    : prev.fields.filter(f => f !== fieldValue)
                                }));
                              }}
                              value={field}
                              sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                            />
                          }
                          label={field}
                        />
                      ))}
                    </FormGroup>
                    
                    {/* Selected fields display */}
                    {newManuscript.fields.length > 0 && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                          Selected Fields:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {newManuscript.fields.map((field) => (
                            <Chip
                              key={field}
                              label={field}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
                              onDelete={() => {
                                setNewManuscript(prev => ({
                                  ...prev,
                                  fields: prev.fields.filter(f => f !== field)
                                }));
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <OrcidCollaboratorInvite
              manuscriptId={currentManuscriptId}
              collaborators={newManuscript.collaborators}
              onCollaboratorsChange={(collaborators) => 
                setNewManuscript(prev => ({ ...prev, collaborators }))
              }
            />
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => {
            setNewPublicationOpen(false);
            setActiveStep(0);
            setCurrentManuscriptId(null);
            setFormError(null);
            setNewManuscript({
              title: '',
              type: '',
              field: '',
              fields: [],
              description: '',
              collaborators: [],
              sections: DEFAULT_SECTIONS.map((title, index) => ({
                id: `section-${index}-${title.toLowerCase().replace(/\s+/g, '-')}`,
                title,
                description: '',
                order: index
              }))
            });
          }}>
            Cancel
          </Button>
          
          <Box sx={{ flex: 1 }} />
          
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(prev => prev - 1)}>
              Back
            </Button>
          )}
          
          {activeStep === 0 ? (
            <Button
              variant="contained"
              disabled={!newManuscript.title || !newManuscript.type || newManuscript.fields.length === 0 || loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              onClick={handleCreateManuscriptStep1}
              sx={{ background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)' }}
            >
              {loading ? 'Creating...' : 'Create & Continue'}
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<CheckIcon />}
              onClick={handleFinishManuscript}
              sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' }}
            >
              Finish
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* New Proposal Modal */}
      <Dialog
        open={newProposalOpen}
        onClose={() => {
          setNewProposalOpen(false);
          setProposalActiveStep(0);
          setCurrentProposalId(null);
          setSelectedTemplate('blank');
          setProposalFormError(null);
          setNewProposal({
            title: '',
            type: 'Research Proposal',
            fields: [],
            otherFields: '',
            creator: '', // Will be populated when modal opens
            creatorOrcid: '', // Will be populated when modal opens
            collaborators: [],
            sections: [
              { id: 'section-0-executive-summary', title: 'Executive Summary', description: 'Brief overview of the proposal', order: 0 },
              { id: 'section-1-background-significance', title: 'Background and Significance', description: 'Context and importance of the research', order: 1 },
              { id: 'section-2-research-objectives', title: 'Research Objectives', description: 'Primary and secondary objectives', order: 2 },
              { id: 'section-3-methodology', title: 'Methodology', description: 'Research methods and approach', order: 3 },
              { id: 'section-4-timeline-milestones', title: 'Timeline and Milestones', description: 'Project schedule and deliverables', order: 4 },
              { id: 'section-5-budget-resources', title: 'Budget and Resources', description: 'Financial requirements and resource allocation', order: 5 },
              { id: 'section-6-expected-outcomes', title: 'Expected Outcomes', description: 'Anticipated results and impact', order: 6 },
              { id: 'section-7-references', title: 'References', description: 'Supporting literature', order: 7 }
            ],
            status: 'Draft',
            researchAreas: [],
            keywords: [],
            abstract: '',
            funding: {
              fundingSource: '',
              grantNumber: '',
              budget: { total: 0, items: [] },
              fundingInstitution: ''
            }
          });
        }}
        maxWidth="md"
        fullWidth
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            minHeight: 600
          }
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pb: 2
          }}
        >
          <DescriptionIcon />
          Create New Proposal
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {proposalFormError && (
            <Alert severity="error" sx={{ m: 3, mb: 0 }}>
              {proposalFormError}
            </Alert>
          )}

          {/* Stepper */}
          <Box sx={{ px: 3, pt: 3 }}>
            <Stepper activeStep={proposalActiveStep} sx={{ mb: 4 }}>
              {proposalSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Step Content */}
          {proposalActiveStep === 0 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Proposal Details
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Proposal Title */}
              <TextField
                fullWidth
                label="Proposal Title *"
                value={newProposal.title}
                onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter proposal title..."
              />

              {/* Research Fields */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Research Fields *
                </Typography>
                <FormControl fullWidth required>
                  <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
                    <FormGroup>
                      {MEDICAL_FIELDS.map((field) => (
                        <FormControlLabel
                          key={field}
                          control={
                            <Checkbox
                              checked={newProposal.fields.includes(field)}
                              onChange={(e) => {
                                const fieldValue = e.target.value;
                                setNewProposal(prev => ({
                                  ...prev,
                                  fields: e.target.checked
                                    ? [...prev.fields, fieldValue]
                                    : prev.fields.filter(f => f !== fieldValue)
                                }));
                              }}
                              value={field}
                              sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                            />
                          }
                          label={field}
                        />
                      ))}
                    </FormGroup>
                    
                    {/* Selected fields display */}
                    {newProposal.fields.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {newProposal.fields.map((field) => (
                          <Chip
                            key={field}
                            label={field}
                            onDelete={() => {
                              setNewProposal(prev => ({
                                ...prev,
                                fields: prev.fields.filter(f => f !== field)
                              }));
                            }}
                            size="small"
                            sx={{
                              backgroundColor: '#8b6cbc',
                              color: 'white',
                              '& .MuiChip-deleteIcon': {
                                color: 'rgba(255, 255, 255, 0.7)',
                                '&:hover': { color: 'white' }
                              }
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </FormControl>
              </Box>

              {/* Creator (Read-only) */}
              <TextField
                fullWidth
                label="Creator"
                value={newProposal.creator}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <Box sx={{ mr: 1, px: 1.5, py: 0.5, backgroundColor: '#e1f5fe', borderRadius: 1, fontSize: '0.75rem', fontWeight: 600, color: '#0277bd' }}>
                      YOU
                    </Box>
                  )
                }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#f8fafc' } }}
              />
            </Box>
          </Box>
          )}

          {/* Step 2: Select Template */}
          {proposalActiveStep === 1 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Select Template
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Template Options */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Choose a proposal template
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* Blank Template */}
                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={selectedTemplate === 'blank' ? 4 : 1}
                        sx={{
                          p: 3,
                          cursor: 'pointer',
                          border: selectedTemplate === 'blank' ? '2px solid #8b6cbc' : '2px solid transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            elevation: 3,
                            transform: 'translateY(-2px)'
                          }
                        }}
                        onClick={() => setSelectedTemplate('blank')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <DescriptionIcon sx={{ mr: 2, color: '#8b6cbc', fontSize: 28 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Blank Template
                          </Typography>
                          {selectedTemplate === 'blank' && (
                            <CheckCircleIcon sx={{ ml: 'auto', color: '#8b6cbc' }} />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Start with a blank proposal template with standard sections including Executive Summary, Background, Methodology, and more.
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Chip label="Recommended" size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1976d2' }} />
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Upload Template (Disabled) */}
                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          backgroundColor: '#f5f5f5',
                          border: '2px solid #e0e0e0',
                          opacity: 0.6
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CloudUploadIcon sx={{ mr: 2, color: '#9e9e9e', fontSize: 28 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#9e9e9e' }}>
                            Upload Template
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Upload your own proposal template file (Word, PDF, or Google Docs).
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Chip label="Coming Soon" size="small" sx={{ backgroundColor: '#fff3e0', color: '#f57c00' }} />
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Box>
          )}

          {/* Step 3: Invite Collaborators */}
          {proposalActiveStep === 2 && (
            <Box sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Invite Collaborators
              </Typography>

              {/* ORCID Collaborator Invite Component */}
              <OrcidCollaboratorInvite
                manuscriptId={currentProposalId}
                collaborators={newProposal.collaborators}
                onCollaboratorsChange={(updatedCollaborators) => {
                  setNewProposal(prev => ({
                    ...prev,
                    collaborators: updatedCollaborators
                  }));
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button onClick={() => {
              setNewProposalOpen(false);
            setProposalActiveStep(0);
            setCurrentProposalId(null);
            setSelectedTemplate('blank');
            setProposalFormError(null);
              setNewProposal({
                title: '',
                type: 'Research Proposal',
                fields: [],
                otherFields: '',
                creator: '', // Will be populated when modal opens
                creatorOrcid: '', // Will be populated when modal opens
                collaborators: [],
              sections: [
                { id: 'section-0-executive-summary', title: 'Executive Summary', description: 'Brief overview of the proposal', order: 0 },
                { id: 'section-1-background-significance', title: 'Background and Significance', description: 'Context and importance of the research', order: 1 },
                { id: 'section-2-research-objectives', title: 'Research Objectives', description: 'Primary and secondary objectives', order: 2 },
                { id: 'section-3-methodology', title: 'Methodology', description: 'Research methods and approach', order: 3 },
                { id: 'section-4-timeline-milestones', title: 'Timeline and Milestones', description: 'Project schedule and deliverables', order: 4 },
                { id: 'section-5-budget-resources', title: 'Budget and Resources', description: 'Financial requirements and resource allocation', order: 5 },
                { id: 'section-6-expected-outcomes', title: 'Expected Outcomes', description: 'Anticipated results and impact', order: 6 },
                { id: 'section-7-references', title: 'References', description: 'Supporting literature', order: 7 }
              ],
                status: 'Draft',
                researchAreas: [],
                keywords: [],
                abstract: '',
                funding: {
                  fundingSource: '',
                  grantNumber: '',
                  budget: { total: 0, items: [] },
                  fundingInstitution: ''
                }
              });
          }}>
            Cancel
          </Button>
          
          <Box sx={{ flex: 1 }} />
          
          {proposalActiveStep > 0 && (
            <Button onClick={() => setProposalActiveStep(prev => prev - 1)}>
              Back
            </Button>
          )}
          
          {proposalActiveStep === 0 ? (
            <Button
              variant="contained"
              disabled={!newProposal.title || newProposal.fields.length === 0}
              onClick={handleProposalNextStep}
              sx={{ background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)' }}
            >
              Continue
          </Button>
          ) : proposalActiveStep === 1 ? (
            <Button
              variant="contained"
              onClick={handleProposalNextStep}
              sx={{ background: 'linear-gradient(135deg, #8b6cbc 0%, #9575d1 100%)' }}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              disabled={isSubmittingProposal}
              startIcon={isSubmittingProposal ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
              onClick={handleFinishProposal}
              sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' }}
            >
              {isSubmittingProposal ? 'Creating Proposal...' : 'Finish'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Manuscript Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewingManuscript(null);
        }}
        maxWidth="md"
        fullWidth
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#8b6cbc', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Manuscript Details
            </Typography>
          </Box>
          <IconButton 
            onClick={() => {
              setViewDialogOpen(false);
              setViewingManuscript(null);
            }}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {viewingManuscript && (
            <Box>
              {/* Title Section */}
              <Box sx={{ p: 3, bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#2D3748' }}>
                  {viewingManuscript.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  {viewingManuscript.type === 'Proposal' && (
                    <Chip
                      label="PROPOSAL"
                      size="small"
                      sx={{
                        backgroundColor: '#8b6cbc',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                  <Chip
                    label={viewingManuscript.status}
                    size="small"
                    sx={{
                      backgroundColor: STATUS_OPTIONS.find(s => s.value === viewingManuscript.status)?.color || '#9e9e9e',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                  <Chip
                    label={viewingManuscript.field}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: '#8b6cbc',
                      color: '#8b6cbc'
                    }}
                  />
                </Box>
              </Box>

              {/* Details Grid */}
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Type */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Publication Type
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {viewingManuscript.type}
                    </Typography>
                  </Grid>

                  {/* Status */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Status
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {viewingManuscript.status}
                    </Typography>
                  </Grid>

                  {/* Field */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Research Field
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {viewingManuscript.field}
                    </Typography>
                  </Grid>

                  {/* Last Updated */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Last Updated
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatDate(viewingManuscript.lastUpdated || viewingManuscript.updatedAt)}
                    </Typography>
                    {viewingManuscript.lastUpdater && (
                      <Typography variant="body2" color="text.secondary">
                        by {viewingManuscript.lastUpdater.name || `${viewingManuscript.lastUpdater.givenName || ''} ${viewingManuscript.lastUpdater.familyName || ''}`.trim()}
                      </Typography>
                    )}
                  </Grid>

                  {/* Creator */}
                  {viewingManuscript.creator && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Created By
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#8b6cbc', fontSize: '0.75rem' }}>
                          {(viewingManuscript.creator.name || 
                            `${viewingManuscript.creator.givenName || ''} ${viewingManuscript.creator.familyName || ''}`.trim())
                            .split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() || '?'}
                        </Avatar>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {viewingManuscript.creator.name || 
                            `${viewingManuscript.creator.givenName || ''} ${viewingManuscript.creator.familyName || ''}`.trim() || 
                            'Unknown'}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Team Members Count */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Team Members
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {(viewingManuscript.collaborators?.length || 0) + 
                       (viewingManuscript.pendingInvitations?.length || 0) + 1} member(s)
                      {viewingManuscript.pendingInvitations?.length > 0 && (
                        <Typography component="span" variant="body2" color="warning.main" sx={{ ml: 1 }}>
                          ({viewingManuscript.pendingInvitations.length} pending)
                        </Typography>
                      )}
                    </Typography>
                  </Grid>

                  {/* Description */}
                  {viewingManuscript.description && (
                    <Grid size={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Description
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {viewingManuscript.description}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Sections */}
                  {viewingManuscript.sections && viewingManuscript.sections.length > 0 && (
                    <Grid size={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Sections ({viewingManuscript.sections.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {viewingManuscript.sections.map((section, idx) => (
                          <Chip
                            key={idx}
                            label={section.title || section}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: '#e0e0e0' }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={() => {
              setViewDialogOpen(false);
              setViewingManuscript(null);
            }}
          >
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<EditIcon />}
            onClick={() => {
              setViewDialogOpen(false);
              handleEditManuscript(viewingManuscript);
            }}
            sx={{ 
              bgcolor: '#8b6cbc', 
              '&:hover': { bgcolor: '#7559a3' } 
            }}
          >
            Edit Manuscript
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
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

      </Container>
    </>
  );
}
