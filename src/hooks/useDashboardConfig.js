'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../components/AuthProvider';
import {
  Article as ArticleIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  MonetizationOn as FundingIcon,
  ManageAccounts as UserManagerIcon,
  ManageSearch as OpportunityIcon,
  Assessment as ReportsIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Savings as FundraisingIcon,
  AccountBalanceWallet as FinancialPoolIcon,
  AttachMoney as DisbursementIcon,
  Foundation as FoundationIcon,
  Groups as GroupsIcon,
  CloudUpload as SubmitIcon,
  Search as SearchIcon,
  CloudDownload as ImportIcon,
  Edit as ManageIcon,
  Add as CreateIcon,
  TrendingUp as ImpactIcon,
  Timeline as ProgressIcon,
  Description as ProposalIcon,
  Update as FollowUpIcon,
  Timeline as StatusIcon,
  AccountBalance as BudgetIcon,
  Assignment as AwardIcon,
  People as DonorManagementIcon,
  ContactPage as FundersCRMIcon,
  RateReview as ReviewIcon,
  Assessment as AssessmentIcon,
  NoteAdd as InternalGrantIcon,
  Shield as EthicsIcon,
  Gavel as EthicsReviewIcon,
  Science as TrialIcon,
  AppRegistration as RegistrationIcon,
  VerifiedUser as ComplianceIcon,
  SupervisedUserCircle as TeamIcon,
  FolderShared as DocumentIcon,
  PeopleAlt as RecruitmentIcon,
  HealthAndSafety as SafetyIcon,
  CloudSync as RegistryIcon,
  Insights as ResultsIcon,
  Settings as SettingsIcon,
  ImageSearch as ImageIntegrityIcon,
  FactCheck as IntegrityReportIcon,
} from '@mui/icons-material';

const ICON = '#8b6cbc';
const ICON_SM = { color: ICON, fontSize: 20 };
const ICON_FOUND = { color: ICON, fontSize: '1.1rem' };
const ICON_DISABLED = { color: '#bdbdbd', fontSize: '1.1rem' };

function item(t, labelKey, descKey, path, icon, extra = {}) {
  return {
    label: t(labelKey),
    description: descKey ? t(descKey) : undefined,
    path,
    icon,
    ...extra,
  };
}

function category(t, titleKey, items) {
  return { title: t(titleKey), items };
}

function buildInstitutionConfig(t) {
  return {
    type: 'institution',
    title: t('institution.portal_title'),
    menuItems: [
      {
        key: 'publications',
        label: t('institution.publications'),
        categories: [
          category(t, 'nav_categories.writing_tracker', [
            item(t, 'institution.manuscripts', 'institution.manuscripts_desc', '/institution/publications/manuscripts', <ArticleIcon sx={ICON_SM} />),
            item(t, 'institution.proposals', 'institution.proposals_desc', '/institution/publications/proposals', <SubmitIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'projects',
        label: t('institution.projects'),
        categories: [
          category(t, 'nav_categories.proposal_review', [
            item(t, 'institution.review_proposals', 'institution.review_proposals_desc', '/institution/proposals/review', <ReviewIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.ethics_review', [
            item(t, 'institution.review_ethics', 'institution.review_ethics_desc', '/institution/ethics/review', <EthicsReviewIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.project_tracking', [
            item(t, 'institution.track_projects', 'institution.track_projects_desc', '/institution/projects', <AssessmentIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'clinical_trials',
        label: t('institution.clinical_trials'),
        categories: [
          category(t, 'nav_categories.portfolio_oversight', [
            item(t, 'institution.trial_portfolio', 'institution.trial_portfolio_desc', '/institution/clinical-trials', <TrialIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.governance_compliance', [
            item(t, 'institution.ethics_approvals', 'institution.ethics_approvals_desc', '/institution/clinical-trials/approvals', <EthicsReviewIcon sx={ICON_SM} />),
            item(t, 'institution.compliance_dashboard', 'institution.compliance_dashboard_desc', '/institution/clinical-trials/compliance', <ComplianceIcon sx={ICON_SM} />),
            item(t, 'institution.registry_oversight', 'institution.registry_oversight_desc', '/institution/clinical-trials/registry', <RegistryIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.operations_oversight', [
            item(t, 'institution.recruitment_performance', 'institution.recruitment_performance_desc', '/institution/clinical-trials/recruitment', <RecruitmentIcon sx={ICON_SM} />),
            item(t, 'institution_nav.safety_deviations', 'institution_nav.safety_deviations_desc', '/institution/clinical-trials/safety', <SafetyIcon sx={ICON_SM} />),
            item(t, 'institution_nav.document_repository', 'institution_nav.document_repository_desc', '/institution/clinical-trials/documents', <DocumentIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.reporting_outputs', [
            item(t, 'institution_nav.results_reporting', 'institution_nav.results_reporting_desc', '/institution/clinical-trials/results', <ResultsIcon sx={ICON_SM} />),
            item(t, 'institution_nav.team_gcp', 'institution_nav.team_gcp_desc', '/institution/clinical-trials/team', <TeamIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'image_integrity',
        label: t('institution.image_integrity'),
        categories: [
          category(t, 'nav_categories.integrity_oversight', [
            item(t, 'institution_nav.integrity_reports', 'institution_nav.integrity_reports_desc', '/institution/image-integrity', <IntegrityReportIcon sx={ICON_SM} />),
            item(t, 'institution_nav.integrity_usage_report', 'institution_nav.integrity_usage_desc', '/institution/image-integrity/usage', <ReportsIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'training',
        label: t('institution.training'),
        categories: [
          category(t, 'nav_categories.training_management', [
            item(t, 'institution_nav.manage_trainings', 'institution_nav.manage_trainings_desc', '/institution/training', <SchoolIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'administration',
        label: t('institution.administration'),
        categories: [
          category(t, 'nav_categories.researcher_management', [
            item(t, 'institution_nav.manage_researchers', 'institution_nav.manage_researchers_desc', '/institution/researchers', <GroupIcon sx={ICON_SM} />),
            item(t, 'institution_nav.performance_review', 'institution_nav.performance_review_desc', '/institution/researchers/review', <AssessmentIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.review_automation', [
            item(t, 'institution_nav.auto_review', 'institution_nav.auto_review_desc', '/institution/administration/auto-review', <SettingsIcon sx={ICON_SM} />),
            item(t, 'institution_nav.review_pipeline', 'institution_nav.review_pipeline_desc', '/institution/administration/proposal-review-pipeline', <StatusIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.user_management', [
            item(t, 'institution_nav.user_accounts', 'institution_nav.user_accounts_desc', '/institution/users', <UserManagerIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'analytics',
        label: t('institution.analytics'),
        categories: [
          category(t, 'nav_categories.institutional_analytics', [
            item(t, 'institution_nav.institution_metrics', 'institution_nav.institution_metrics_desc', '/institution/analytics', <ReportsIcon sx={ICON_SM} />),
            item(t, 'institution_nav.funding_reports', 'institution_nav.funding_reports_desc', '/institution/analytics/funding', <FundingIcon sx={ICON_SM} />),
            item(t, 'institution_nav.compliance_reports', 'institution_nav.compliance_reports_desc', '/institution/analytics/compliance', <AssignmentIcon sx={ICON_SM} />),
          ]),
        ],
      },
    ],
  };
}

function buildResearcherConfig(t) {
  return {
    type: 'researcher',
    title: t('researcher.portal_title'),
    menuItems: [
      {
        key: 'publications',
        label: t('researcher.publications'),
        categories: [
          category(t, 'nav_categories.writing_phase', [
            item(t, 'researcher.pub_collaborate', 'researcher.pub_collaborate_desc', '/researcher/publications/collaborate', <GroupsIcon sx={ICON_SM} />),
            item(t, 'researcher.pub_submit', 'researcher.pub_submit_desc', '/researcher/publications/submit', <SubmitIcon sx={ICON_SM} />),
            item(t, 'researcher.pub_preprints', 'researcher.pub_preprints_desc', '/researcher/publications/preprints', <ArticleIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.research_discovery', [
            item(t, 'researcher.pub_import', 'researcher.pub_import_desc', '/researcher/publications/import', <ImportIcon sx={ICON_SM} />),
            item(t, 'researcher.pub_manage', 'researcher.pub_manage_desc', '/researcher/publications/manage', <ManageIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'projects',
        label: t('researcher.projects'),
        categories: [
          category(t, 'nav_categories.proposals', [
            item(t, 'researcher.proj_proposals', 'researcher.proj_proposals_desc', '/researcher/projects/proposals/list', <ProposalIcon sx={ICON_SM} />),
            item(t, 'researcher.proj_grant_lifecycle', 'researcher.proj_grant_lifecycle_desc', '/researcher/projects/proposals/grant-tracker', <FollowUpIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.tracking', [
            item(t, 'researcher.proj_status', 'researcher.proj_status_desc', '/researcher/projects/tracking/status', <StatusIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.budget', [
            item(t, 'researcher.proj_budget', 'researcher.proj_budget_desc', '/researcher/projects/budget/view', <BudgetIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'projects',
        label: t('researcher.ethics'),
        categories: [
          category(t, 'nav_categories.ethics_applications', [
            item(t, 'researcher.ethics_applications', 'researcher.ethics_applications_desc', '/researcher/ethics/applications', <EthicsIcon sx={ICON_SM} />),
            item(t, 'researcher.ethics_create', 'researcher.ethics_create_desc', '/researcher/ethics/applications/create', <CreateIcon sx={ICON_SM} />),
            item(t, 'researcher.ethics_upload_certificate', 'researcher.ethics_upload_certificate_desc', '/researcher/ethics/applications?upload=1', <SubmitIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'clinical_trials',
        label: t('researcher.clinical_trials'),
        categories: [
          category(t, 'nav_categories.trial_setup', [
            item(t, 'researcher.trial_intake', 'researcher.trial_intake_desc', '/researcher/clinical-trials/intake', <RegistrationIcon sx={ICON_SM} />),
            item(t, 'researcher.trial_approvals', 'researcher.trial_approvals_desc', '/researcher/clinical-trials/approvals', <EthicsReviewIcon sx={ICON_SM} />),
            item(t, 'researcher.trial_team', 'researcher.trial_team_desc', '/researcher/clinical-trials/team', <TeamIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.trial_execution', [
            item(t, 'researcher.trial_recruitment', 'researcher.trial_recruitment_desc', '/researcher/clinical-trials/recruitment', <RecruitmentIcon sx={ICON_SM} />),
            item(t, 'researcher.trial_safety', 'researcher.trial_safety_desc', '/researcher/clinical-trials/safety', <SafetyIcon sx={ICON_SM} />),
            item(t, 'researcher.trial_registry', 'researcher.trial_registry_desc', '/researcher/clinical-trials/registry', <RegistryIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.impact_memory', [
            item(t, 'researcher.trial_results', 'researcher.trial_results_desc', '/researcher/clinical-trials/results', <ResultsIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'image_integrity',
        label: t('researcher.image_integrity'),
        categories: [
          category(t, 'nav_categories.integrity_checks', [
            item(t, 'researcher.integrity_submissions', 'researcher.integrity_submissions_desc', '/researcher/image-integrity', <ImageIntegrityIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'training',
        label: t('researcher.training'),
        categories: [
          category(t, 'nav_categories.available_trainings', [
            item(t, 'researcher.training_browse', 'researcher.training_browse_desc', '/researcher/training#available', <SearchIcon sx={ICON_SM} />),
          ]),
          category(t, 'nav_categories.my_training', [
            item(t, 'researcher.training_mine', 'researcher.training_mine_desc', '/researcher/training', <SchoolIcon sx={ICON_SM} />),
            item(t, 'researcher.training_certificates', 'researcher.training_certificates_desc', '/researcher/training/certificates', <AwardIcon sx={ICON_SM} />),
          ]),
        ],
      },
      {
        key: 'analytics',
        label: t('researcher.analytics'),
        categories: [
          category(t, 'nav_categories.research_metrics', [
            item(t, 'researcher.analytics_impact', 'researcher.analytics_impact_desc', '/researcher/analytics/impact', <ImpactIcon sx={ICON_SM} />),
            item(t, 'researcher.analytics_progress', 'researcher.analytics_progress_desc', '/researcher/analytics/progress', <ProgressIcon sx={ICON_SM} />),
            item(t, 'researcher.analytics_compliance', 'researcher.analytics_compliance_desc', '/researcher/analytics/compliance', <ComplianceIcon sx={ICON_SM} />),
          ]),
        ],
      },
    ],
  };
}

function buildFoundationConfig(t) {
  return {
    type: 'foundation',
    title: t('foundation.portal_title'),
    menuItems: [
      {
        label: t('foundation.fundraising'),
        categories: [
          category(t, 'nav_categories.campaign_management', [
            item(t, 'foundation_nav.campaign_management', 'foundation_nav.campaign_management_desc', '/foundation/campaigns', <FundraisingIcon sx={ICON_FOUND} />),
          ]),
          category(t, 'nav_categories.donors_donations', [
            item(t, 'foundation_nav.funders_crm', 'foundation_nav.funders_crm_desc', '/foundation/funders', <FundersCRMIcon sx={ICON_FOUND} />),
            item(t, 'foundation.donations', 'foundation_nav.donations_desc', '/foundation/donations', <DonorManagementIcon sx={ICON_FOUND} />),
          ]),
        ],
      },
      {
        label: t('foundation.grants'),
        categories: [
          category(t, 'nav_categories.pre_award', [
            item(t, 'foundation.opportunities', 'foundation_nav.grant_opportunities_desc', '/foundation/grants/opportunities', <OpportunityIcon sx={ICON_FOUND} />),
            item(t, 'foundation.writing_portal', 'foundation_nav.grant_writing_desc', '/foundation/grants/writing-portal', <DescriptionIcon sx={ICON_FOUND} />),
            item(t, 'foundation_nav.liaison_activities', 'foundation_nav.liaison_activities_desc', '/foundation/grants/tracking', <EmailIcon sx={ICON_FOUND} />),
          ]),
          category(t, 'nav_categories.post_award', [
            item(t, 'foundation.won_grants', 'foundation_nav.grant_award_tracker_desc', '/foundation/grants/won', <AwardIcon sx={ICON_FOUND} />),
          ]),
          category(t, 'nav_categories.internal_grants', [
            item(t, 'foundation.internal_requests', 'foundation_nav.internal_grant_requests_desc', '/foundation/grants/internal-requests', <InternalGrantIcon sx={ICON_FOUND} />),
          ]),
        ],
      },
      {
        label: t('foundation_nav.finance_budgeting'),
        categories: [
          category(t, 'nav_categories.fund_management', [
            item(t, 'foundation.central_fund_pool', 'foundation_nav.fund_pools_desc', '/foundation/financial/central-fund-pool', <FoundationIcon sx={ICON_FOUND} />),
            item(t, 'foundation_nav.fund_allocations', 'foundation_nav.fund_allocations_desc', '#', <FinancialPoolIcon sx={ICON_DISABLED} />, { disabled: true }),
          ]),
          category(t, 'nav_categories.transaction_processing', [
            item(t, 'foundation_nav.disbursement_processing', 'foundation_nav.disbursement_processing_desc', '#', <DisbursementIcon sx={ICON_DISABLED} />, { disabled: true }),
          ]),
        ],
      },
      {
        label: t('foundation.reports'),
        items: [
          item(t, 'foundation.reports', 'foundation_nav.reports_analytics_desc', '/foundation/reports', <AssessmentIcon sx={ICON_FOUND} />),
        ],
      },
    ],
  };
}

export function useDashboardConfig() {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  return useMemo(() => {
    const currentPath = pathname || '';
    if (currentPath.startsWith('/global-admin') || currentPath.startsWith('/institution-admin')) {
      return null;
    }

    let config = null;
    if (currentPath === '/institution' || currentPath.startsWith('/institution/')) {
      config = buildInstitutionConfig(t);
    } else if (currentPath === '/researcher' || currentPath.startsWith('/researcher/')) {
      config = buildResearcherConfig(t);
    } else if (currentPath === '/foundation' || currentPath.startsWith('/foundation/')) {
      config = buildFoundationConfig(t);
    }

    if (config?.menuItems && Array.isArray(user?.enabledModules)) {
      config = {
        ...config,
        menuItems: config.menuItems.filter(
          (item) => !item.key || user.enabledModules.includes(item.key)
        ),
      };
    }

    return config;
  }, [pathname, t, i18n.language, user?.enabledModules]);
}
