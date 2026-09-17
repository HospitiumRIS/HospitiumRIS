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
  MoreHoriz as MoreHorizIcon,
  RateReview as RateReviewIcon,
  InfoOutlined as InfoOutlinedIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../../../components/AuthProvider';
import PageHeader from '../../../../components/common/PageHeader';
import OrcidCollaboratorInvite from '../../../../components/Manuscripts/OrcidCollaboratorInvite';
import StagePipeline from '../../../../components/Manuscripts/StagePipeline';
import TipTapEditor from '../../../../components/common/TipTapEditor';
import ManuscriptWorkflowDialog from '../../../../components/Manuscripts/ManuscriptWorkflowDialog';
import {
  MANUSCRIPT_STAGES,
  MANUSCRIPT_STAGE_ORDER,
  getStageTranslationKey
} from '../../../../lib/manuscript-workflow';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

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

const PROPOSAL_SECTIONS = [
  { id: 'section-0-executive-summary', title: 'Executive Summary', description: 'Brief overview of the proposal', order: 0 },
  { id: 'section-1-background-significance', title: 'Background and Significance', description: 'Context and importance of the research', order: 1 },
  { id: 'section-2-research-objectives', title: 'Research Objectives', description: 'Primary and secondary objectives', order: 2 },
  { id: 'section-3-methodology', title: 'Methodology', description: 'Research methods and approach', order: 3 },
  { id: 'section-4-timeline-milestones', title: 'Timeline and Milestones', description: 'Project schedule and deliverables', order: 4 },
  { id: 'section-5-budget-resources', title: 'Budget and Resources', description: 'Financial requirements and resource allocation', order: 5 },
  { id: 'section-6-expected-outcomes', title: 'Expected Outcomes', description: 'Anticipated results and impact', order: 6 },
  { id: 'section-7-references', title: 'References', description: 'Supporting literature', order: 7 }
];

const createEmptyProposal = () => ({
  title: '',
  type: 'Research Proposal',
  fields: [],
  otherFields: '',
  description: '',
  creator: '', // Populated when the modal opens
  creatorOrcid: '', // Populated when the modal opens
  collaborators: [],
  sections: PROPOSAL_SECTIONS.map((section) => ({ ...section })),
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

const STATUS_OPTIONS = MANUSCRIPT_STAGE_ORDER.map((value) => ({
  value,
  label: MANUSCRIPT_STAGES[value].label,
  color: MANUSCRIPT_STAGES[value].color
}));





const isEmptyRichText = (value) => {
  if (!value) return true;
  return !value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

const ManuscriptDetailsPreview = ({ manuscript, canEdit = false, onAddField }) => {
  const description = manuscript.description;
  const keywords = manuscript.keywords || [];
  const hasDescription = !isEmptyRichText(description);
  const hasKeywords = keywords.length > 0;

  const addHintSx = {
    mt: 1,
    p: 1,
    borderRadius: 1,
    border: '1px dashed rgba(255,255,255,0.25)',
    cursor: canEdit ? 'pointer' : 'default',
    transition: 'background-color 0.15s ease',
    '&:hover': canEdit ? { bgcolor: 'rgba(255,255,255,0.08)' } : {}
  };

  if (!hasDescription && !hasKeywords) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block' }}>
          No description or keywords added yet.
        </Typography>
        {canEdit && (
          <Box
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onAddField?.('both');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onAddField?.('both');
              }
            }}
            sx={{ ...addHintSx, mt: 1.5 }}
          >
            <Typography variant="caption" sx={{ color: '#c4b5fd', fontWeight: 600 }}>
              + Click to add description & keywords
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, width: '100%' }}>
      {hasKeywords ? (
        <Box sx={{ mb: hasDescription ? 1.5 : 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.75, color: 'rgba(255,255,255,0.9)' }}>
            Keywords
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {keywords.map((keyword, idx) => (
              <Chip
                key={idx}
                label={keyword}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  bgcolor: alpha('#fff', 0.15),
                  color: '#fff',
                  fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              />
            ))}
          </Box>
        </Box>
      ) : canEdit ? (
        <Box
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onAddField?.('keywords');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onAddField?.('keywords');
            }
          }}
          sx={{ ...addHintSx, mb: hasDescription ? 1.5 : 0 }}
        >
          <Typography variant="caption" sx={{ color: '#c4b5fd', fontWeight: 600 }}>
            + Add keywords
          </Typography>
        </Box>
      ) : null}
      {hasDescription ? (
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.75, color: 'rgba(255,255,255,0.9)' }}>
            Description
          </Typography>
          <Box
            sx={{
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.85)',
              maxHeight: 200,
              overflow: 'auto',
              '& p': { m: 0, mb: 0.5 },
              '& ul, & ol': { pl: 2, my: 0.5 },
              '& li': { mb: 0.25 },
              '& strong, & b': { color: '#fff' },
              '& a': { color: '#c4b5fd' }
            }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </Box>
      ) : canEdit ? (
        <Box
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onAddField?.('description');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onAddField?.('description');
            }
          }}
          sx={addHintSx}
        >
          <Typography variant="caption" sx={{ color: '#c4b5fd', fontWeight: 600 }}>
            + Add description
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
};

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
  const { t } = useTranslation();
  
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
  const [resendingInvitationId, setResendingInvitationId] = useState(null);
  const [addCollaboratorOpen, setAddCollaboratorOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState(null);
  const [collaboratorMenuAnchor, setCollaboratorMenuAnchor] = useState(null);
  const [selectedCollaboratorForMenu, setSelectedCollaboratorForMenu] = useState(null);
  
  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuManuscript, setMenuManuscript] = useState(null);

  // Manuscript details popover (description & keywords)
  const [detailsAnchorEl, setDetailsAnchorEl] = useState(null);
  const [detailsManuscript, setDetailsManuscript] = useState(null);
  const [detailsForm, setDetailsForm] = useState({ description: '', keywords: [] });
  const [detailsEditMode, setDetailsEditMode] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);

  // New manuscript form state with comprehensive structure
  const [newManuscript, setNewManuscript] = useState({
    title: '',
    type: '',
    field: '', // For simple dialog single selection
    fields: [], // For advanced dialog multiple selection
    description: '',
    keywords: [],
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

  // Peer review and publication workflow dialog
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [workflowManuscript, setWorkflowManuscript] = useState(null);

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

  // Pending invitations state
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [respondingInvitationId, setRespondingInvitationId] = useState(null);


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
  const [newProposal, setNewProposal] = useState(createEmptyProposal);

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
        const inReviewManuscripts = manuscripts.filter(m => m.status === 'IN_REVIEW' || m.status === 'UNDER_REVISION').length;
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

  // Fetch pending invitations for current user
  const fetchPendingInvitations = useCallback(async () => {
    try {
      setInvitationsLoading(true);
      
      const response = await fetch('/api/manuscripts/invitations/pending', {
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
        setPendingInvitations(result.data.invitations || []);
      } else {
        throw new Error(result.error || 'Failed to fetch pending invitations');
      }
      
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      setPendingInvitations([]);
    } finally {
      setInvitationsLoading(false);
    }
  }, []);

  // Handle responding to invitation (accept/decline)
  const handleRespondToInvitation = useCallback(async (invitationId, action) => {
    setRespondingInvitationId(invitationId);

    try {
      const response = await fetch(`/api/manuscripts/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} invitation`);
      }

      showSnackbar(
        action === 'accept' 
          ? `Invitation accepted! You are now a collaborator.` 
          : 'Invitation declined',
        'success'
      );

      // Refresh both invitations and manuscripts
      await Promise.all([
        fetchPendingInvitations(),
        fetchManuscripts()
      ]);

      // If accepted, optionally navigate to the manuscript
      if (action === 'accept' && data.data?.manuscriptId) {
        // User can choose to navigate or stay on the page
        setTimeout(() => {
          router.push(`/researcher/publications/collaborate/edit/${data.data.manuscriptId}`);
        }, 1500);
      }

    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error);
      showSnackbar(error.message || `Failed to ${action} invitation`, 'error');
    } finally {
      setRespondingInvitationId(null);
    }
  }, [fetchPendingInvitations, fetchManuscripts, router]);

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
      fetchPendingInvitations();
    }
  }, [user, fetchManuscripts, fetchPendingInvitations]);

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
        description: newManuscript.description || null,
        keywords: newManuscript.keywords
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

  const closeProposalDialog = () => {
    setNewProposalOpen(false);
    setProposalActiveStep(0);
    setCurrentProposalId(null);
    setSelectedTemplate('blank');
    setProposalFormError(null);
    setNewProposal(createEmptyProposal());
  };

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
                message: collaborator.message || ''
              }),
            });
          }
        }
      }
      
      // Reset form and close modal
      setNewProposal(createEmptyProposal());
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
        description: newManuscript.description || null,
        keywords: newManuscript.keywords
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
          keywords: [],
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
        description: newManuscript.description || null,
        keywords: newManuscript.keywords
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
                message: collaborator.message || ''
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
        keywords: [],
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
            inReviewManuscripts: (manuscript.status === 'IN_REVIEW' || manuscript.status === 'UNDER_REVISION') ? prev.inReviewManuscripts - 1 : prev.inReviewManuscripts,
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
        await fetchTeamData(selectedManuscript.id);
        await fetchManuscripts();
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
    if (!selectedManuscript) return;

    setResendingInvitationId(invitationId);
    try {
      const response = await fetch(`/api/manuscripts/invitations/${invitationId}`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchTeamData(selectedManuscript.id);
        await fetchManuscripts();
        showSnackbar('Invitation resent by email and in-app notification', 'success');
      } else {
        showSnackbar(data.error || 'Failed to resend invitation', 'error');
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      showSnackbar('Error resending invitation', 'error');
    } finally {
      setResendingInvitationId(null);
    }
  };

  const formatInviteSentAt = (dateValue) => {
    if (!dateValue) return 'Unknown';
    try {
      return format(new Date(dateValue), 'MMM d, yyyy · h:mm a');
    } catch {
      return 'Unknown';
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

  const canEditManuscriptDetails = (manuscript) => (
    manuscript?.isOwner || manuscript?.permissions?.canEdit
  );

  const openDetailsEditor = (manuscript, anchorEl, forceEdit = false) => {
    const missingDescription = isEmptyRichText(manuscript.description);
    const missingKeywords = !(manuscript.keywords?.length);
    const canEdit = canEditManuscriptDetails(manuscript);

    setDetailsAnchorEl(anchorEl);
    setDetailsManuscript(manuscript);
    setDetailsForm({
      description: manuscript.description || '',
      keywords: manuscript.keywords || []
    });
    setDetailsEditMode(forceEdit || (canEdit && (missingDescription || missingKeywords)));
  };

  const handleOpenDetailsPopover = (event, manuscript) => {
    event.stopPropagation();
    openDetailsEditor(manuscript, event.currentTarget);
  };

  const handleCloseDetailsPopover = () => {
    setDetailsAnchorEl(null);
    setDetailsManuscript(null);
    setDetailsEditMode(false);
    setDetailsForm({ description: '', keywords: [] });
  };

  const handleSaveDetails = async () => {
    if (!detailsManuscript) return;

    try {
      setSavingDetails(true);

      const payload = {
        description: isEmptyRichText(detailsForm.description) ? null : detailsForm.description,
        keywords: detailsForm.keywords
      };

      const response = await fetch(`/api/manuscripts/${detailsManuscript.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save details');
      }

      const savedDescription = result.data.description;
      const savedKeywords = result.data.keywords || detailsForm.keywords;

      setManuscripts(prev => prev.map(m => (
        m.id === detailsManuscript.id
          ? { ...m, description: savedDescription, keywords: savedKeywords }
          : m
      )));

      setDetailsManuscript(prev => prev ? {
        ...prev,
        description: savedDescription,
        keywords: savedKeywords
      } : prev);

      setDetailsForm({
        description: savedDescription || '',
        keywords: savedKeywords
      });
      setDetailsEditMode(false);
      showSnackbar('Details saved successfully', 'success');
    } catch (error) {
      console.error('Error saving manuscript details:', error);
      showSnackbar(error.message || 'Failed to save details', 'error');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleOpenWorkflow = (manuscript) => {
    setWorkflowManuscript(manuscript);
    setWorkflowDialogOpen(true);
    handleMenuClose();
  };

  // Reflect a stage change without refetching the whole list
  const handleWorkflowUpdated = (result, message) => {
    setManuscripts(prev => prev.map(m => (
      m.id === workflowManuscript?.id
        ? { ...m, status: result.status, publicationId: result.publicationId }
        : m
    )));
    setWorkflowManuscript(prev => (prev ? { ...prev, status: result.status } : prev));
    setViewingManuscript(prev => (
      prev && prev.id === workflowManuscript?.id ? { ...prev, status: result.status } : prev
    ));
    fetchManuscripts();
    showSnackbar(message || 'Workflow stage updated', 'success');
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
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
              {/* User Role Badge */}
              {manuscript.currentUserRole && (
                <Chip
                  label={manuscript.currentUserRole}
                  size="small"
                  icon={manuscript.isOwner ? <AdminPanelSettingsIcon sx={{ fontSize: 12 }} /> : undefined}
                  sx={{
                    backgroundColor: manuscript.isOwner 
                      ? '#ff6b35' 
                      : manuscript.currentUserRole === 'ADMIN' 
                        ? '#f44336' 
                        : manuscript.currentUserRole === 'EDITOR'
                          ? '#ff9800'
                          : manuscript.currentUserRole === 'CONTRIBUTOR'
                            ? '#4caf50'
                            : '#2196f3',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    height: 20,
                    borderRadius: 1.5
                  }}
                />
              )}
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
            disabled={manuscript.permissions && !manuscript.permissions.canEdit}
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
          
          {/* Only show Team button if user has permission */}
          {manuscript.permissions?.canManageTeam && (
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
          )}

          {/* Only show Delete button if user has permission */}
          {manuscript.permissions?.canDelete && (
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
          )}
        </CardActions>
      </Card>
    );
  };

  return (
    <>
      {/* Full-width PageHeader */}
      <Box sx={{ width: '100%', mb: 0 }}>
        <PageHeader
          title={t("researcher.collaborate")}
          description={t("researcher.collaborate_desc")}
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
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Total Manuscripts
              </Typography>
              <DescriptionIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.totalManuscripts}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              All collaborative works
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                {t('manuscript_workflow.stat_in_review')}
              </Typography>
              <AccessTimeIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.inReviewManuscripts}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              {t('manuscript_workflow.stat_in_review_sub')}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Published
              </Typography>
              <CheckCircleIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.publishedManuscripts}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Completed manuscripts
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2,
            bgcolor: '#8b6cbc',
            boxShadow: '0 2px 8px rgba(139, 108, 188, 0.2)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ position: 'absolute', top: -10, right: -10, width: 40, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                Collaborators
              </Typography>
              <GroupsIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {stats.totalCollaborators}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Active team members
            </Typography>
          </Paper>
        </Grid>
      </Grid>

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
                    {t(getStageTranslationKey(status.value))}
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

      {/* Pending Invitations Section */}
      {!invitationsLoading && pendingInvitations.length > 0 && (
        <Paper sx={{ 
          mb: 3, 
          p: 3, 
          borderRadius: 3, 
          boxShadow: '0 4px 20px rgba(255, 152, 0, 0.15)',
          border: '2px solid rgba(255, 152, 0, 0.3)',
          background: 'linear-gradient(135deg, #fff9e6 0%, #ffffff 100%)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EmailIcon sx={{ color: '#ff9800', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#e65100' }}>
              Pending Invitations ({pendingInvitations.length})
            </Typography>
            <Chip 
              label="Action Required" 
              size="small" 
              sx={{ 
                bgcolor: '#ff9800', 
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem'
              }} 
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You have been invited to collaborate on the following manuscripts/proposals
          </Typography>
          
          <Grid container spacing={2}>
            {pendingInvitations.map((invitation) => (
              <Grid size={{ xs: 12, md: 6 }} key={invitation.id}>
                <Card sx={{
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(255, 152, 0, 0.2)',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(255, 152, 0, 0.2)',
                    borderColor: 'rgba(255, 152, 0, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                      <Chip
                        label={invitation.manuscriptType}
                        size="small"
                        sx={{
                          bgcolor: invitation.manuscriptType === 'Proposal' ? '#8b6cbc' : '#2196f3',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                      <Chip
                        label={invitation.role}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: '#ff9800',
                          color: '#ff9800',
                          fontWeight: 500,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                    
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#2D3748' }}>
                      {invitation.manuscriptTitle}
                    </Typography>
                    
                    {invitation.manuscriptField && (
                      <Chip
                        label={invitation.manuscriptField}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(139, 108, 188, 0.1)',
                          color: '#8b6cbc',
                          fontSize: '0.7rem',
                          mb: 1.5
                        }}
                      />
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Invited by: <strong>{invitation.inviterName}</strong>
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(invitation.invitedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={respondingInvitationId === invitation.id ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                      onClick={() => handleRespondToInvitation(invitation.id, 'accept')}
                      disabled={respondingInvitationId === invitation.id}
                      sx={{
                        bgcolor: '#4caf50',
                        '&:hover': { bgcolor: '#43a047' },
                        textTransform: 'none',
                        fontWeight: 600,
                        flex: 1,
                        fontSize: '0.8rem'
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={respondingInvitationId === invitation.id ? <CircularProgress size={14} /> : <CloseIcon />}
                      onClick={() => handleRespondToInvitation(invitation.id, 'decline')}
                      disabled={respondingInvitationId === invitation.id}
                      sx={{
                        borderColor: '#f44336',
                        color: '#f44336',
                        '&:hover': { 
                          borderColor: '#d32f2f',
                          bgcolor: 'rgba(244, 67, 54, 0.04)'
                        },
                        textTransform: 'none',
                        fontWeight: 600,
                        flex: 1,
                        fontSize: '0.8rem'
                      }}
                    >
                      Decline
                    </Button>
                    <Tooltip title="View details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setViewingManuscript(invitation.manuscript);
                          setViewDialogOpen(true);
                        }}
                        sx={{ color: '#8b6cbc' }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

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
                                  <Tooltip
                                    title={
                                      <ManuscriptDetailsPreview
                                        manuscript={manuscript}
                                        canEdit={canEditManuscriptDetails(manuscript)}
                                        onAddField={() => {
                                          const anchor = document.getElementById(`details-trigger-${manuscript.id}`);
                                          if (anchor) {
                                            openDetailsEditor(manuscript, anchor, true);
                                          }
                                        }}
                                      />
                                    }
                                    arrow
                                    placement="right"
                                    enterDelay={200}
                                    leaveDelay={100}
                                    disableInteractive={false}
                                    slotProps={{
                                      tooltip: {
                                        sx: {
                                          bgcolor: 'rgba(0, 0, 0, 0.82)',
                                          backdropFilter: 'blur(8px)',
                                          color: '#fff',
                                          boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                                          border: '1px solid rgba(255, 255, 255, 0.1)',
                                          borderRadius: 2,
                                          minWidth: 420,
                                          maxWidth: 560,
                                          p: 0
                                        }
                                      },
                                      arrow: {
                                        sx: { color: 'rgba(0, 0, 0, 0.82)' }
                                      }
                                    }}
                                  >
                                    <IconButton
                                      id={`details-trigger-${manuscript.id}`}
                                      size="small"
                                      onClick={(e) => handleOpenDetailsPopover(e, manuscript)}
                                      aria-label="View or edit description and keywords"
                                      sx={{
                                        color: '#8b6cbc',
                                        opacity: 0.65,
                                        p: 0.25,
                                        ml: -0.25,
                                        '&:hover': {
                                          opacity: 1,
                                          bgcolor: alpha('#8b6cbc', 0.08)
                                        }
                                      }}
                                    >
                                      <InfoOutlinedIcon sx={{ fontSize: 17 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Status */}
                          <TableCell sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                              <Chip
                                label={t(getStageTranslationKey(manuscript.status))}
                                size="small"
                                sx={{
                                  backgroundColor: statusOption?.color || '#8b6cbc',
                                  color: 'white',
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                  alignSelf: 'flex-start'
                                }}
                              />
                              <StagePipeline currentStatus={manuscript.status} size={18} />
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
                                    <Box sx={{ p: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.75, display: 'block' }}>
                                        Team ({allMembers.length}) — click to manage
                                      </Typography>
                                      {allMembers.map((member) => (
                                        <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.35 }}>
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
                                  <Stack
                                    direction="row"
                                    spacing={-0.5}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Manage team for ${manuscript.title}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleManageTeam(manuscript);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleManageTeam(manuscript);
                                      }
                                    }}
                                    sx={{
                                      alignItems: 'center',
                                      cursor: 'pointer',
                                      width: 'fit-content',
                                      borderRadius: 2,
                                      px: 0.5,
                                      py: 0.25,
                                      transition: 'background-color 0.15s ease',
                                      '&:hover': { bgcolor: alpha('#8b6cbc', 0.08) },
                                      '&:focus-visible': { outline: '2px solid #8b6cbc', outlineOffset: 2 }
                                    }}
                                  >
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
                                  disabled={manuscript.permissions && !manuscript.permissions.canEdit}
                                  sx={{ 
                                    color: '#666',
                                    '&:hover': { bgcolor: '#66666610' }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {/* Advance through peer review and publication */}
                              {manuscript.permissions?.canManageTeam && (
                                <Tooltip title={t('manuscript_workflow.title')} arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenWorkflow(manuscript)}
                                    sx={{
                                      color: '#3b82f6',
                                      '&:hover': { bgcolor: '#3b82f610' }
                                    }}
                                  >
                                    <RateReviewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {/* Only show Team button if user has permission */}
                              {manuscript.permissions?.canManageTeam && (
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
                              )}
                              {/* Only show Delete button if user has permission */}
                              {manuscript.permissions?.canDelete && (
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
                              )}
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
            onClick={() => handleOpenWorkflow(menuManuscript)}
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
            <RateReviewIcon fontSize="small" />
          </ListItemIcon>
          {t('manuscript_workflow.title')}
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
            keywords: [],
            collaborators: []
          });
        }}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
            border: '1px solid rgba(139, 108, 188, 0.08)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            px: 3,
            py: 2.25,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5ca7 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                flexShrink: 0
              }}>
                <AddIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  Create New Manuscript
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.8125rem', mt: 0.25 }}>
                  Start a new collaborative writing project
                </Typography>
              </Box>
            </Box>
            <IconButton
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
                  keywords: [],
                  collaborators: []
                });
              }}
              size="small"
              sx={{ color: 'white', opacity: 0.9, '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <Box sx={{
          px: 3,
          py: 2,
          bgcolor: '#f8f9fb',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}>
          <Stepper
            activeStep={manuscriptActiveStep}
            sx={{
              '& .MuiStepLabel-label': { fontSize: '0.8125rem', fontWeight: 500 },
              '& .MuiStepLabel-label.Mui-active': { color: '#8b6cbc', fontWeight: 600 },
              '& .MuiStepLabel-label.Mui-completed': { color: '#8b6cbc' },
              '& .MuiStepIcon-root.Mui-active': { color: '#8b6cbc' },
              '& .MuiStepIcon-root.Mui-completed': { color: '#8b6cbc' },
              '& .MuiStepConnector-line': { borderColor: '#e2e8f0' },
              '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': { borderColor: '#8b6cbc' },
              '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': { borderColor: '#8b6cbc' }
            }}
          >
            {manuscriptSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <DialogContent sx={{ p: 0, flex: 1, overflow: 'auto' }}>
          {manuscriptFormError && (
            <Alert severity="error" sx={{ mx: 3, mt: 2.5, borderRadius: 2 }}>
              {manuscriptFormError}
            </Alert>
          )}

          {manuscriptActiveStep === 0 && (
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.8125rem', lineHeight: 1.6 }}>
                Provide the basic details for your manuscript. You can invite co-authors in the next step.
              </Typography>

              <Stack spacing={2.25}>
                <TextField
                  fullWidth
                  required
                  label="Manuscript Title"
                  value={newManuscript.title}
                  onChange={(e) => setNewManuscript(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Comparative efficacy of treatment protocols in..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: '#8b6cbc' },
                      '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
                  }}
                />

                <FormControl fullWidth required sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#8b6cbc' },
                    '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
                }}>
                  <InputLabel>Publication Type</InputLabel>
                  <Select
                    value={newManuscript.type}
                    label="Publication Type"
                    onChange={(e) => setNewManuscript(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {PUBLICATION_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box>
                  <Autocomplete
                    multiple
                    freeSolo
                    value={newManuscript.fields}
                    onChange={(event, newValue) => {
                      const processedValues = newValue.flatMap(value => {
                        if (typeof value === 'string') {
                          return value.split(',').map(v => v.trim()).filter(v => v !== '');
                        }
                        return value;
                      });
                      setNewManuscript(prev => ({
                        ...prev,
                        fields: [...new Set(processedValues)]
                      }));
                    }}
                    options={MEDICAL_FIELDS.filter(field => field !== 'Other')}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                          key={`${option}-${index}`}
                          sx={{
                            bgcolor: alpha('#8b6cbc', 0.12),
                            color: '#6b4fa8',
                            fontWeight: 500,
                            '& .MuiChip-deleteIcon': { color: '#8b6cbc' }
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Research Fields"
                        placeholder="Select or type a field, then press Enter"
                        helperText="Choose from the list or add custom fields"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': { borderColor: '#8b6cbc' },
                            '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
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
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#2D3748' }}>
                    Description
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: 'text.secondary' }}>
                    Objectives, methodology, or key themes (optional)
                  </Typography>
                  <TipTapEditor
                    value={newManuscript.description}
                    onChange={(value) => setNewManuscript(prev => ({ ...prev, description: value }))}
                    placeholder="Describe the scope, objectives, and key themes of your manuscript..."
                    minHeight="140px"
                  />
                </Box>

                <Box>
                  <Autocomplete
                    multiple
                    freeSolo
                    value={newManuscript.keywords}
                    onChange={(event, newValue) => {
                      const processedValues = newValue.flatMap(value => {
                        if (typeof value === 'string') {
                          return value.split(',').map(v => v.trim()).filter(v => v !== '');
                        }
                        return value;
                      });
                      setNewManuscript(prev => ({
                        ...prev,
                        keywords: [...new Set(processedValues)]
                      }));
                    }}
                    options={[]}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                          key={`${option}-${index}`}
                          sx={{
                            bgcolor: alpha('#8b6cbc', 0.12),
                            color: '#6b4fa8',
                            fontWeight: 500,
                            '& .MuiChip-deleteIcon': { color: '#8b6cbc' }
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Keywords"
                        placeholder="Type a keyword and press Enter"
                        helperText="Add terms that describe your manuscript for search and discovery"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover fieldset': { borderColor: '#8b6cbc' },
                            '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
                        }}
                      />
                    )}
                  />
                </Box>
              </Stack>
            </Box>
          )}

          {manuscriptActiveStep === 1 && (
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8125rem', lineHeight: 1.6 }}>
                Search by ORCID, then enter each co-author&apos;s institution email. Invitations are sent by email and in-app when they already have an account.
              </Typography>
              <OrcidCollaboratorInvite
                embedded
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

        <DialogActions sx={{
          px: 3,
          py: 2,
          gap: 1,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          bgcolor: '#fff'
        }}>
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
                keywords: [],
                collaborators: []
              });
            }}
            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>

          <Box sx={{ flex: 1 }} />

          {manuscriptActiveStep > 0 && (
            <Button
              onClick={() => setManuscriptActiveStep(prev => prev - 1)}
              variant="outlined"
              startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: alpha('#8b6cbc', 0.4),
                color: '#8b6cbc',
                borderRadius: 2,
                '&:hover': { borderColor: '#8b6cbc', bgcolor: alpha('#8b6cbc', 0.06) }
              }}
            >
              Back
            </Button>
          )}

          {manuscriptActiveStep === 0 ? (
            <Button
              variant="contained"
              disabled={!newManuscript.title || !newManuscript.type || newManuscript.fields.length === 0}
              onClick={handleManuscriptNextStep}
              endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                bgcolor: '#8b6cbc',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#7b5ca7', boxShadow: '0 4px 14px rgba(139, 108, 188, 0.35)' },
                '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              disabled={isSubmittingManuscript}
              onClick={handleFinishManuscript}
              startIcon={isSubmittingManuscript ? <CircularProgress size={16} color="inherit" /> : <CheckIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                bgcolor: '#8b6cbc',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#7b5ca7', boxShadow: '0 4px 14px rgba(139, 108, 188, 0.35)' },
                '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
              }}
            >
              {isSubmittingManuscript ? 'Creating...' : 'Create Manuscript'}
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
          setResendingInvitationId(null);
        }}
        maxWidth="md"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
            border: '1px solid rgba(139, 108, 188, 0.08)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            px: 3,
            py: 2.25,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5ca7 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.75, minWidth: 0 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
                mt: 0.25
              }}>
                <GroupsIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.0625rem', lineHeight: 1.3 }}>
                  Manage Team
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.85,
                    fontSize: '0.8125rem',
                    mt: 0.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {selectedManuscript?.title}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setTeamManagementOpen(false)}
              size="small"
              sx={{ color: 'white', opacity: 0.9, '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <Box sx={{
          px: 3,
          py: 1.75,
          bgcolor: '#f8f9fb',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<GroupsIcon sx={{ fontSize: '16px !important' }} />}
              label={`${teamData.collaborators.length} member${teamData.collaborators.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{ bgcolor: alpha('#8b6cbc', 0.08), color: '#6b4fa8', fontWeight: 600, border: 'none' }}
            />
            <Chip
              icon={<ScheduleIcon sx={{ fontSize: '16px !important' }} />}
              label={`${teamData.pendingInvitations.length} pending`}
              size="small"
              sx={{
                bgcolor: teamData.pendingInvitations.length > 0 ? alpha('#f57c00', 0.1) : alpha('#64748b', 0.08),
                color: teamData.pendingInvitations.length > 0 ? '#e65100' : '#64748b',
                fontWeight: 600,
                border: 'none'
              }}
            />
          </Box>
          <Button
            startIcon={<PersonAddIcon />}
            variant="outlined"
            size="small"
            onClick={() => setAddCollaboratorOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              borderColor: alpha('#8b6cbc', 0.4),
              color: '#8b6cbc',
              '&:hover': { borderColor: '#8b6cbc', bgcolor: alpha('#8b6cbc', 0.06) }
            }}
          >
            Add Member
          </Button>
        </Box>

        <DialogContent sx={{ p: 0, flex: 1, overflow: 'auto' }}>
          {teamLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240, py: 6 }}>
              <CircularProgress sx={{ color: '#8b6cbc' }} />
            </Box>
          ) : (
            <Box sx={{ px: 3, py: 2.5 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#334155' }}>
                    Active members
                  </Typography>
                  {teamData.collaborators.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: '1px dashed rgba(139, 108, 188, 0.25)', bgcolor: '#fafbfd' }}>
                      <GroupsIcon sx={{ fontSize: 40, color: '#cbd5e0', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No team members yet. Add collaborators to get started.
                      </Typography>
                    </Paper>
                  ) : (
                    <Stack spacing={1.25}>
                      {teamData.collaborators.map((collaborator) => {
                        const role = COLLABORATOR_ROLES.find(r => r.value === collaborator.role);
                        const isOwner = collaborator.role === 'OWNER';

                        return (
                          <Paper
                            key={collaborator.id}
                            variant="outlined"
                            sx={{
                              p: 1.75,
                              borderRadius: 2,
                              borderColor: 'rgba(0,0,0,0.08)',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.5
                            }}
                          >
                            <Avatar sx={{
                              width: 40,
                              height: 40,
                              bgcolor: isOwner ? '#8b6cbc' : '#7c9abd',
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}>
                              {collaborator.user.givenName?.charAt(0)}{collaborator.user.familyName?.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {collaborator.user.givenName} {collaborator.user.familyName}
                                </Typography>
                                <Chip
                                  label={isOwner ? 'Creator' : collaborator.role}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    bgcolor: isOwner ? alpha('#8b6cbc', 0.12) : alpha(role?.color || '#64748b', 0.12),
                                    color: isOwner ? '#6b4fa8' : role?.color || '#64748b'
                                  }}
                                />
                              </Box>
                              {collaborator.user.email && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <EmailIcon sx={{ fontSize: 13 }} />
                                  {collaborator.user.email}
                                </Typography>
                              )}
                              {collaborator.user.primaryInstitution && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                  {collaborator.user.primaryInstitution}
                                </Typography>
                              )}
                            </Box>
                            {!isOwner && (
                              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                <Tooltip title="Edit role & permissions">
                                  <IconButton
                                    size="small"
                                    onClick={() => setEditingCollaborator(collaborator)}
                                    sx={{ color: '#8b6cbc', '&:hover': { bgcolor: alpha('#8b6cbc', 0.08) } }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove from team">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                                    sx={{ color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.08) } }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </Paper>
                        );
                      })}
                    </Stack>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#334155' }}>
                    Pending invitations
                  </Typography>
                  {teamData.pendingInvitations.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                      No outstanding invitations for this manuscript.
                    </Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {teamData.pendingInvitations.map((invitation) => {
                        const wasReminded = invitation.updatedAt &&
                          new Date(invitation.updatedAt).getTime() - new Date(invitation.createdAt).getTime() > 60000;

                        return (
                          <Paper
                            key={invitation.id}
                            variant="outlined"
                            sx={{
                              p: 1.75,
                              borderRadius: 2,
                              borderColor: alpha('#f57c00', 0.25),
                              bgcolor: alpha('#f57c00', 0.03)
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                              <Avatar sx={{ width: 40, height: 40, bgcolor: alpha('#f57c00', 0.15), color: '#e65100' }}>
                                <PendingIcon fontSize="small" />
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {`${invitation.givenName || ''} ${invitation.familyName || ''}`.trim() || 'Invited researcher'}
                                  </Typography>
                                  <Chip label={invitation.role} size="small" sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600 }} />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <EmailIcon sx={{ fontSize: 13 }} />
                                  {invitation.email}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                  Sent {formatInviteSentAt(invitation.createdAt)}
                                </Typography>
                                {wasReminded && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                    Last resent {formatInviteSentAt(invitation.updatedAt)}
                                  </Typography>
                                )}
                                {invitation.expiresAt && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 0.25, color: '#b45309' }}>
                                    Expires {formatInviteSentAt(invitation.expiresAt)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5, pt: 1.25, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={
                                  resendingInvitationId === invitation.id
                                    ? <CircularProgress size={14} color="inherit" />
                                    : <RefreshIcon sx={{ fontSize: 16 }} />
                                }
                                disabled={resendingInvitationId === invitation.id}
                                onClick={() => handleResendInvitation(invitation.id)}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  borderRadius: 2,
                                  borderColor: alpha('#8b6cbc', 0.4),
                                  color: '#8b6cbc',
                                  '&:hover': { borderColor: '#8b6cbc', bgcolor: alpha('#8b6cbc', 0.06) }
                                }}
                              >
                                {resendingInvitationId === invitation.id ? 'Sending...' : 'Resend Invite'}
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                variant="text"
                                startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                                onClick={() => handleCancelInvitation(invitation.id)}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Stack>
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
        maxWidth="sm"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
            border: '1px solid rgba(139, 108, 188, 0.08)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            px: 3,
            py: 2.25,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5ca7 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <PersonAddIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.0625rem' }}>
                  Add Team Member
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.8125rem' }}>
                  Invite by ORCID and institution email
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setAddCollaboratorOpen(false)}
              size="small"
              sx={{ color: 'white', opacity: 0.9, '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent
          sx={{
            px: 3,
            pt: 3,
            pb: 3.5,
            '&.MuiDialogContent-root': { pt: 3 }
          }}
        >
          <Stack spacing={3}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.8125rem', lineHeight: 1.65 }}
            >
              Search for a researcher by name, then enter their institution email. Invitations are sent by email and in-app when they already have an account.
            </Typography>
            {selectedManuscript && (
              <OrcidCollaboratorInvite
                embedded
                manuscriptId={selectedManuscript.id}
                collaborators={[]}
                onCollaboratorsChange={async () => {
                  await fetchTeamData(selectedManuscript.id);
                  await fetchManuscripts();
                  setAddCollaboratorOpen(false);
                }}
              />
            )}
          </Stack>
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
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setEditingCollaborator(prev => ({
                      ...prev,
                      role: newRole,
                      // ADMIN role gets all permissions by default
                      canEdit: newRole === 'Admin' ? true : prev.canEdit,
                      canInvite: newRole === 'Admin' ? true : prev.canInvite,
                      canDelete: newRole === 'Admin' ? true : prev.canDelete
                    }));
                  }}
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
              keywords: [],
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
        onClose={closeProposalDialog}
        maxWidth="md"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
            border: '1px solid rgba(139, 108, 188, 0.08)',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            px: 3,
            py: 2.25,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5ca7 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                flexShrink: 0
              }}>
                <DescriptionIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  Create New Proposal
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.8125rem', mt: 0.25 }}>
                  Set up a research proposal and invite your co-investigators
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={closeProposalDialog}
              size="small"
              sx={{ color: 'white', opacity: 0.9, '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <Box sx={{
          px: 3,
          py: 2,
          bgcolor: '#f8f9fb',
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}>
          <Stepper
            activeStep={proposalActiveStep}
            sx={{
              '& .MuiStepLabel-label': { fontSize: '0.8125rem', fontWeight: 500 },
              '& .MuiStepLabel-label.Mui-active': { color: '#8b6cbc', fontWeight: 600 },
              '& .MuiStepLabel-label.Mui-completed': { color: '#8b6cbc' },
              '& .MuiStepIcon-root.Mui-active': { color: '#8b6cbc' },
              '& .MuiStepIcon-root.Mui-completed': { color: '#8b6cbc' },
              '& .MuiStepConnector-line': { borderColor: '#e2e8f0' },
              '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': { borderColor: '#8b6cbc' },
              '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': { borderColor: '#8b6cbc' }
            }}
          >
            {proposalSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <DialogContent sx={{ p: 0, flex: 1, overflow: 'auto' }}>
          {proposalFormError && (
            <Alert severity="error" sx={{ mx: 3, mt: 2.5, borderRadius: 2 }}>
              {proposalFormError}
            </Alert>
          )}

          {/* Step Content */}
          {proposalActiveStep === 0 && (
          <Box sx={{ px: 3, py: 2.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.8125rem', lineHeight: 1.6 }}>
              Provide the basic details for your proposal. You will choose a template and invite co-investigators in the next steps.
            </Typography>

            <Stack spacing={2.25}>
              {/* Proposal Title */}
              <TextField
                fullWidth
                required
                label="Proposal Title"
                value={newProposal.title}
                onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. A multicentre trial of early mobilisation after..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#8b6cbc' },
                    '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
                }}
              />

              {/* Research Fields */}
              <Box>
                
                <Autocomplete
                  multiple
                  freeSolo
                  value={newProposal.fields}
                  onChange={(event, newValue) => {
                    // Handle both predefined selections and custom entries
                    // Split comma-separated values into individual fields
                    const processedValues = newValue.flatMap(value => {
                      if (typeof value === 'string') {
                        // Split by comma and trim each field
                        return value.split(',').map(v => v.trim()).filter(v => v !== '');
                      }
                      return value;
                    });
                    
                    // Remove duplicates
                    const uniqueValues = [...new Set(processedValues)];
                    
                    setNewProposal(prev => ({
                      ...prev,
                      fields: uniqueValues
                    }));
                  }}
                  options={MEDICAL_FIELDS.filter(field => field !== 'Other')}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        key={`${option}-${index}`}
                        sx={{
                          bgcolor: alpha('#8b6cbc', 0.12),
                          color: '#6b4fa8',
                          fontWeight: 500,
                          '& .MuiChip-deleteIcon': { color: '#8b6cbc' }
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Research Fields"
                      placeholder="Select or type a field, then press Enter"
                      helperText="Choose from the list or add custom fields"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': { borderColor: '#8b6cbc' },
                          '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                        },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
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
                    '& .MuiAutocomplete-tag': { margin: '2px' }
                  }}
                />

                {/* Information about custom fields */}
                {newProposal.fields.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem' }}>
                      <CategoryIcon sx={{ fontSize: 13 }} />
                      {newProposal.fields.length} field{newProposal.fields.length !== 1 ? 's' : ''} selected
                      {newProposal.fields.some(field => !MEDICAL_FIELDS.includes(field)) && (
                        <Chip 
                          label="Custom" 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            ml: 0.5, 
                            height: 16, 
                            fontSize: '0.625rem',
                            borderColor: '#8b6cbc',
                            color: '#8b6cbc'
                          }} 
                        />
                      )}
                    </Typography>
                  </Box>
                )}
              </Box>

              <TextField
                fullWidth
                label="Description"
                value={newProposal.description}
                onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Objectives, methodology, or key themes (optional)"
                multiline
                minRows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': { borderColor: '#8b6cbc' },
                    '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
                }}
              />
            </Stack>
          </Box>
          )}

          {/* Step 2: Select Template */}
          {proposalActiveStep === 1 && (
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.8125rem', lineHeight: 1.6 }}>
                Choose the starting structure for &quot;{newProposal.title}&quot;. You can rename, reorder, or remove sections once the proposal is open in the editor.
              </Typography>

              <Grid container spacing={2}>
                {/* Blank Template */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    onClick={() => setSelectedTemplate('blank')}
                    sx={{
                      p: 2.5,
                      height: '100%',
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: selectedTemplate === 'blank' ? '2px solid #8b6cbc' : '1px solid rgba(0,0,0,0.08)',
                      bgcolor: selectedTemplate === 'blank' ? alpha('#8b6cbc', 0.04) : '#fff',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#8b6cbc',
                        boxShadow: '0 6px 20px rgba(139, 108, 188, 0.15)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha('#8b6cbc', 0.12),
                        flexShrink: 0
                      }}>
                        <DescriptionIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        Blank Template
                      </Typography>
                      {selectedTemplate === 'blank' && (
                        <CheckCircleIcon sx={{ ml: 'auto', color: '#8b6cbc', fontSize: 20 }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                      Standard proposal structure with {PROPOSAL_SECTIONS.length} pre-built sections, from Executive Summary through References.
                    </Typography>
                    <Chip
                      label="Recommended"
                      size="small"
                      sx={{ mt: 2, bgcolor: alpha('#8b6cbc', 0.12), color: '#6b4fa8', fontWeight: 500 }}
                    />
                  </Paper>
                </Grid>

                {/* Upload Template (Disabled) */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      height: '100%',
                      borderRadius: 2,
                      bgcolor: '#f8f9fb',
                      border: '1px dashed rgba(0,0,0,0.12)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.05)',
                        flexShrink: 0
                      }}>
                        <CloudUploadIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9375rem', color: '#94a3b8' }}>
                        Upload Template
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', lineHeight: 1.6 }}>
                      Bring your own funder or institutional template (Word, PDF, or Google Docs).
                    </Typography>
                    <Chip
                      label="Coming Soon"
                      size="small"
                      sx={{ mt: 2, bgcolor: '#fff3e0', color: '#f57c00', fontWeight: 500 }}
                    />
                  </Paper>
                </Grid>
              </Grid>

              {selectedTemplate === 'blank' && (
                <Box sx={{
                  mt: 2.5,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8f9fb',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', display: 'block', mb: 1 }}>
                    Sections included
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {PROPOSAL_SECTIONS.map((section) => (
                      <Chip
                        key={section.id}
                        label={section.title}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          borderColor: alpha('#8b6cbc', 0.3),
                          color: '#6b4fa8',
                          bgcolor: '#fff'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Step 3: Invite Collaborators */}
          {proposalActiveStep === 2 && (
            <Box sx={{ px: 3, py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8125rem', lineHeight: 1.6 }}>
                Search by ORCID, then enter each co-investigator&apos;s institution email. Invitations are sent by email and in-app when they already have an account.
              </Typography>
              <OrcidCollaboratorInvite
                embedded
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

        <DialogActions sx={{
          px: 3,
          py: 2,
          gap: 1,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          bgcolor: '#fff'
        }}>
          <Button
            onClick={closeProposalDialog}
            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>

          <Box sx={{ flex: 1 }} />

          {proposalActiveStep > 0 && (
            <Button
              onClick={() => setProposalActiveStep(prev => prev - 1)}
              variant="outlined"
              startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: alpha('#8b6cbc', 0.4),
                color: '#8b6cbc',
                borderRadius: 2,
                '&:hover': { borderColor: '#8b6cbc', bgcolor: alpha('#8b6cbc', 0.06) }
              }}
            >
              Back
            </Button>
          )}

          {proposalActiveStep < 2 ? (
            <Button
              variant="contained"
              disabled={proposalActiveStep === 0 && (!newProposal.title || newProposal.fields.length === 0)}
              onClick={handleProposalNextStep}
              endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                bgcolor: '#8b6cbc',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#7b5ca7', boxShadow: '0 4px 14px rgba(139, 108, 188, 0.35)' },
                '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              disabled={isSubmittingProposal}
              onClick={handleFinishProposal}
              startIcon={isSubmittingProposal ? <CircularProgress size={16} color="inherit" /> : <CheckIcon sx={{ fontSize: 18 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                bgcolor: '#8b6cbc',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#7b5ca7', boxShadow: '0 4px 14px rgba(139, 108, 188, 0.35)' },
                '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
              }}
            >
              {isSubmittingProposal ? 'Creating...' : 'Create Proposal'}
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
                    label={t(getStageTranslationKey(viewingManuscript.status))}
                    size="small"
                    sx={{
                      backgroundColor: MANUSCRIPT_STAGES[viewingManuscript.status]?.color || '#9e9e9e',
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
                      {t('manuscript_workflow.workflow_stage')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                      {t(getStageTranslationKey(viewingManuscript.status))}
                    </Typography>
                    <StagePipeline currentStatus={viewingManuscript.status} />
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

                  {/* Keywords */}
                  {viewingManuscript.keywords?.length > 0 && (
                    <Grid size={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Keywords
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {viewingManuscript.keywords.map((keyword, idx) => (
                          <Chip
                            key={idx}
                            label={keyword}
                            size="small"
                            sx={{
                              bgcolor: alpha('#8b6cbc', 0.12),
                              color: '#6b4fa8',
                              fontWeight: 500
                            }}
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}

                  {/* Description */}
                  {viewingManuscript.description && (
                    <Grid size={12}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Description
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Box
                          sx={{
                            lineHeight: 1.6,
                            fontSize: '0.875rem',
                            color: 'text.primary',
                            '& p': { m: 0, mb: 1 },
                            '& ul, & ol': { pl: 2.5, my: 1 },
                            '& li': { mb: 0.5 }
                          }}
                          dangerouslySetInnerHTML={{ __html: viewingManuscript.description }}
                        />
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
          {viewingManuscript?.permissions?.canManageTeam && (
            <Button
              variant="outlined"
              startIcon={<RateReviewIcon />}
              onClick={() => handleOpenWorkflow(viewingManuscript)}
              sx={{ borderColor: '#8b6cbc', color: '#8b6cbc' }}
            >
              {t('manuscript_workflow.title')}
            </Button>
          )}
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

      {/* Description & Keywords popover editor */}
      <Popover
        open={Boolean(detailsAnchorEl)}
        anchorEl={detailsAnchorEl}
        onClose={handleCloseDetailsPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              minWidth: 420,
              maxWidth: 560
            }
          }
        }}
      >
        {detailsManuscript && (
          <Box sx={{ p: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 1.5, color: 'rgba(255,255,255,0.95)' }}
              noWrap
              title={detailsManuscript.title}
            >
              {detailsManuscript.title}
            </Typography>

            {detailsEditMode && canEditManuscriptDetails(detailsManuscript) ? (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: 'rgba(255,255,255,0.9)' }}>
                    Description
                  </Typography>
                  <TipTapEditor
                    key={`details-desc-${detailsManuscript.id}-${detailsEditMode}`}
                    value={detailsForm.description}
                    onChange={(value) => setDetailsForm(prev => ({ ...prev, description: value }))}
                    placeholder="Describe the scope, objectives, and key themes..."
                    minHeight="120px"
                  />
                </Box>

                <Box>
                  <Autocomplete
                    multiple
                    freeSolo
                    value={detailsForm.keywords}
                    onChange={(event, newValue) => {
                      const processedValues = newValue.flatMap(value => {
                        if (typeof value === 'string') {
                          return value.split(',').map(v => v.trim()).filter(v => v !== '');
                        }
                        return value;
                      });
                      setDetailsForm(prev => ({
                        ...prev,
                        keywords: [...new Set(processedValues)]
                      }));
                    }}
                    options={[]}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                          key={`${option}-${index}`}
                          sx={{
                            bgcolor: alpha('#8b6cbc', 0.12),
                            color: '#6b4fa8',
                            fontWeight: 500
                          }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Keywords"
                        placeholder="Type a keyword and press Enter"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.95)',
                            borderRadius: 2,
                            '&:hover fieldset': { borderColor: '#8b6cbc' },
                            '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
                        }}
                      />
                    )}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', pt: 0.5 }}>
                  <Button
                    size="small"
                    onClick={handleCloseDetailsPopover}
                    sx={{ color: 'rgba(255,255,255,0.75)', textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveDetails}
                    disabled={savingDetails}
                    startIcon={savingDetails ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                    sx={{
                      bgcolor: '#8b6cbc',
                      textTransform: 'none',
                      '&:hover': { bgcolor: '#7559a3' }
                    }}
                  >
                    {savingDetails ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              </Stack>
            ) : (
              <>
                <ManuscriptDetailsPreview
                  manuscript={detailsManuscript}
                  canEdit={canEditManuscriptDetails(detailsManuscript)}
                  onAddField={() => setDetailsEditMode(true)}
                />
                {canEditManuscriptDetails(detailsManuscript) && (
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setDetailsEditMode(true)}
                    sx={{
                      mt: 1.5,
                      color: '#c4b5fd',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                    }}
                  >
                    Edit details
                  </Button>
                )}
              </>
            )}
          </Box>
        )}
      </Popover>

      {/* Peer Review & Publication workflow */}
      <ManuscriptWorkflowDialog
        open={workflowDialogOpen}
        manuscript={workflowManuscript}
        onClose={() => {
          setWorkflowDialogOpen(false);
          setWorkflowManuscript(null);
        }}
        onUpdated={handleWorkflowUpdated}
      />

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
