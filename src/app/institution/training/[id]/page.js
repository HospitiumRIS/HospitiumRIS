'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Assignment as AssessmentsIcon,
  CalendarMonth as ScheduleIcon,
  CloudUpload as UploadIcon,
  Dashboard as OverviewIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  EventAvailable as AttendanceIcon,
  ExpandMore as MoreIcon,
  Feedback as FeedbackIcon,
  History as ActivityIcon,
  Home as HomeIcon,
  MenuBook as CurriculumIcon,
  People as PeopleIcon,
  PersonAdd as AssignIcon,
  Publish as PublishIcon,
  School as TrainingIcon,
  TaskAlt as CompletionIcon,
  Visibility as PreviewIcon,
  WorkspacePremium as CertificateIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalVariant,
} from '@/components/GlobalAdmin/InstitutionModalShell';
import TrainingFormDialog from '@/components/Training/TrainingFormDialog';
import AssignTrainingDialog from '@/components/Training/admin/AssignTrainingDialog';
import TrainingScheduleTab from '@/components/Training/admin/TrainingScheduleTab';
import TrainingAttendanceTab from '@/components/Training/admin/TrainingAttendanceTab';
import TrainingCompletionTab from '@/components/Training/admin/TrainingCompletionTab';
import TrainingCertificatesTab from '@/components/Training/admin/TrainingCertificatesTab';
import TrainingRegistrationsTab from '@/components/Training/admin/TrainingRegistrationsTab';
import TrainingAssessmentsTab from '@/components/Training/admin/TrainingAssessmentsTab';
import TrainingFeedbackTab from '@/components/Training/admin/TrainingFeedbackTab';
import TrainingActivityTab from '@/components/Training/admin/TrainingActivityTab';
import ParticipantPanel from '@/components/Training/admin/workspace/ParticipantPanel';
import TrainingCurriculumTab from '@/components/Training/admin/workspace/TrainingCurriculumTab';
import TrainingOverview from '@/components/Training/admin/workspace/TrainingOverview';
import WorkspaceNav from '@/components/Training/admin/workspace/WorkspaceNav';
import { DELIVERY_MODE_LABELS } from '@/lib/training-sessions';

const PURPLE = '#8b6cbc';
const btn = { textTransform: 'none', fontWeight: 700 };
const whiteBtn = { ...btn, bgcolor: 'white', color: PURPLE, '&:hover': { bgcolor: '#f5f5f5' } };
const TABS = ['overview', 'schedule', 'curriculum', 'assessments', 'registrations', 'attendance', 'completion', 'certificates', 'feedback', 'activity'];
const STATUS_LABEL = { PUBLISHED: 'Published', DRAFT: 'Draft', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };
const shortDate = (v, year = false) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) }) : '');

function dateRange(start, end) {
  if (!start) return 'Dates not set';
  const a = new Date(start);
  const b = new Date(end || start);
  if (a.toDateString() === b.toDateString()) return shortDate(a, true);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return `${a.getDate()}–${shortDate(b, true)}`;
  return `${shortDate(a, a.getFullYear() !== b.getFullYear())} – ${shortDate(b, true)}`;
}

/**
 * Training workspace for admins: compact header with the key facts and actions, a section
 * nav on the left, and the section on the right. Forms and person details open as
 * right-side panels; small confirmations stay centred.
 */
export default function TrainingDetailPage() {
  const router = useRouter();
  const { id: trainingId } = useParams();

  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(null);
  const [modules, setModules] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('overview');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [person, setPerson] = useState(null);
  const [certificateFor, setCertificateFor] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [busy, setBusy] = useState(false);

  // ?tab=<name> opens a section directly (links from analytics and compliance); ?person=<regId> opens a person.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (TABS.includes(p.get('tab'))) setTab(p.get('tab'));
    if (p.get('person')) setPerson(p.get('person'));
  }, []);

  const changeTab = (next) => {
    setTab(next);
    window.history.replaceState(null, '', next === 'overview' ? window.location.pathname : `?tab=${next}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/${trainingId}/overview`, { credentials: 'include', cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not load the overview');
      setOverview(json);
      setOverviewError('');
    } catch (err) {
      setOverviewError(err.message);
    }
  }, [trainingId]);

  const load = useCallback(async () => {
    try {
      const [trainingRes, modulesRes, registrationsRes, materialsRes] = await Promise.all([
        fetch(`/api/training/${trainingId}`, { credentials: 'include' }),
        fetch(`/api/training/${trainingId}/modules`, { credentials: 'include' }),
        fetch(`/api/training/${trainingId}/registrations`, { credentials: 'include' }),
        fetch(`/api/training/${trainingId}/materials`, { credentials: 'include' }),
      ]);
      const [trainingData, modulesData, registrationsData, materialsData] = await Promise.all([
        trainingRes.json(), modulesRes.json(), registrationsRes.json(), materialsRes.json(),
      ]);
      if (!trainingRes.ok || !trainingData.success) throw new Error(trainingData.error || 'Training not found');
      setTraining(trainingData.training);
      setModules(modulesData.modules || []);
      setRegistrations(registrationsData.registrations || []);
      setMaterials(materialsData.materials || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load training details');
    } finally {
      setLoading(false);
    }
    loadOverview();
  }, [trainingId, loadOverview]);

  useEffect(() => { if (trainingId) load(); }, [trainingId, load]);

  const publish = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/training/${trainingId}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PUBLISHED' }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not publish');
      fetch('/api/notifications/training-created', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trainingId }) }).catch(() => {});
      setPublishOpen(false);
      setNotice('Published. Eligible staff have been notified.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveDetails = async (apiData) => {
    try {
      const res = await fetch(`/api/training/${trainingId}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(apiData) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) return { success: false, error: data.error || 'Failed to save training details' };
      return { success: true, training: data.training };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const detailsFinished = async (_saved, { publish: wantsPublish } = {}) => {
    setEditOpen(false);
    if (wantsPublish && training?.status === 'DRAFT') await publish();
    else {
      setNotice('Details saved.');
      await load();
    }
  };

  const uploadCertificate = async () => {
    if (!certificateFile || !certificateFor) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', certificateFile);
      const res = await fetch(`/api/training/${trainingId}/certificates/${certificateFor.id}`, { method: 'POST', credentials: 'include', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to upload certificate');
      setCertificateFor(null);
      setCertificateFile(null);
      setNotice('Certificate uploaded.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>;
  }
  if (!training) {
    return <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px' }}><Alert severity="error">{error || 'Training not found'}</Alert></Container>;
  }

  const scheduled = (training.sessions || []).filter((s) => s.status === 'SCHEDULED').length;
  const seated = training.seatsTaken ?? training.registrationCount ?? 0;
  const alerts = overview?.alerts || {};
  const sections = [
    {
      group: 'Plan',
      items: [
        { key: 'overview', label: 'Overview', icon: OverviewIcon },
        { key: 'schedule', label: 'Schedule', icon: ScheduleIcon, count: scheduled },
        { key: 'curriculum', label: 'Curriculum', icon: CurriculumIcon, count: modules.length },
        { key: 'assessments', label: 'Assessments', icon: AssessmentsIcon, alert: alerts.assessments },
      ],
    },
    {
      group: 'People',
      items: [
        { key: 'registrations', label: 'Participants', icon: PeopleIcon, count: registrations.length, alert: alerts.registrations },
        { key: 'attendance', label: 'Attendance', icon: AttendanceIcon, alert: alerts.attendance },
        { key: 'completion', label: 'Completion', icon: CompletionIcon, alert: alerts.completion },
        { key: 'certificates', label: 'Certificates', icon: CertificateIcon, alert: alerts.certificates },
      ],
    },
    {
      group: 'Review',
      items: [
        { key: 'feedback', label: 'Feedback', icon: FeedbackIcon },
        { key: 'activity', label: 'Activity log', icon: ActivityIcon },
      ],
    },
  ];
  const facts = [
    dateRange(training.startDate, training.endDate),
    DELIVERY_MODE_LABELS[training.deliveryMode] || 'In person',
    `${seated}/${training.maxParticipants} places`,
    `${scheduled} session${scheduled === 1 ? '' : 's'}`,
    `${modules.length} module${modules.length === 1 ? '' : 's'}`,
    training.department,
  ].filter(Boolean).join('  ·  ');
  const menuItem = (icon, label, onClick, disabled = false) => {
    const Icon = icon;
    return (
      <MenuItem disabled={disabled} onClick={() => { setMenuAnchor(null); onClick(); }}>
        <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
        <ListItemText>{label}</ListItemText>
      </MenuItem>
    );
  };

  return (
    <InstitutionModalVariant.Provider value="panel">
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader
          title={training.title}
          description={facts}
          icon={<TrainingIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
            { label: 'Training', path: '/institution/training' },
          ]}
          actionButton={(
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip size="small" label={STATUS_LABEL[training.status] || training.status} sx={{ bgcolor: 'white', color: PURPLE, fontWeight: 800 }} />
              {training.status === 'DRAFT' ? (
                <Button variant="contained" startIcon={<PublishIcon />} onClick={() => setPublishOpen(true)} sx={whiteBtn}>Publish</Button>
              ) : null}
              <Button variant="contained" endIcon={<MoreIcon />} onClick={(e) => setMenuAnchor(e.currentTarget)} sx={whiteBtn}>Actions</Button>
              <Button variant="contained" startIcon={<BackIcon />} onClick={() => router.push('/institution/training')} sx={whiteBtn}>All trainings</Button>
            </Stack>
          )}
        />
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
          {menuItem(EditIcon, 'Edit details', () => setEditOpen(true))}
          {menuItem(AssignIcon, 'Assign people', () => setAssignOpen(true), training.status === 'CANCELLED' || training.status === 'COMPLETED')}
          {menuItem(PreviewIcon, 'View as participant', () => window.open(`/researcher/training/${trainingId}`, '_blank', 'noopener'))}
          <Divider />
          {menuItem(DownloadIcon, 'Download attendance (Excel)', () => window.location.assign(`/api/training/${trainingId}/attendance/export?format=xlsx`))}
          {menuItem(ActivityIcon, 'Activity log', () => changeTab('activity'))}
        </Menu>

        <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
          {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}
          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' }, alignItems: 'start' }}>
            <WorkspaceNav sections={sections} value={tab} onChange={changeTab} />

            <Box sx={{ minWidth: 0 }}>
              {tab === 'overview' ? (
                <TrainingOverview
                  training={training}
                  data={overview}
                  error={overviewError}
                  onRetry={loadOverview}
                  onOpenTab={changeTab}
                  onEditDetails={() => setEditOpen(true)}
                  onPublish={() => setPublishOpen(true)}
                  onChanged={load}
                />
              ) : null}
              {tab === 'schedule' ? <TrainingScheduleTab trainingId={trainingId} training={training} modules={modules} onChanged={load} /> : null}
              {tab === 'curriculum' ? (
                <TrainingCurriculumTab trainingId={trainingId} modules={modules} materials={materials} onChanged={load} onNotice={setNotice} onError={setError} />
              ) : null}
              {tab === 'assessments' ? <TrainingAssessmentsTab trainingId={trainingId} training={training} modules={modules} onChanged={load} /> : null}
              {tab === 'registrations' ? (
                <TrainingRegistrationsTab
                  trainingId={trainingId}
                  training={training}
                  registrations={registrations}
                  onChanged={load}
                  onUploadCertificate={(reg) => setCertificateFor(reg)}
                  onOpenPerson={setPerson}
                />
              ) : null}
              {tab === 'attendance' ? <TrainingAttendanceTab trainingId={trainingId} training={training} onTrainingChanged={load} /> : null}
              {tab === 'completion' ? <TrainingCompletionTab trainingId={trainingId} training={training} onChanged={load} onOpenPerson={setPerson} /> : null}
              {tab === 'certificates' ? <TrainingCertificatesTab trainingId={trainingId} onChanged={load} /> : null}
              {tab === 'feedback' ? <TrainingFeedbackTab trainingId={trainingId} training={training} onChanged={load} /> : null}
              {tab === 'activity' ? <TrainingActivityTab trainingId={trainingId} /> : null}
            </Box>
          </Box>
        </Container>

        <TrainingFormDialog
          open={editOpen}
          mode="edit"
          initialTraining={training}
          submitting={busy}
          onClose={() => setEditOpen(false)}
          onSaveDetails={saveDetails}
          onFinished={detailsFinished}
        />
        <AssignTrainingDialog open={assignOpen} onClose={() => setAssignOpen(false)} training={training} onAssigned={load} />
        <ParticipantPanel trainingId={trainingId} registrationId={person} onClose={() => setPerson(null)} onOpenTab={changeTab} />

        <InstitutionModal open={publishOpen} onClose={() => setPublishOpen(false)} disableClose={busy} maxWidth="xs">
          <InstitutionModalHeader icon={PublishIcon} title="Publish this training?" subtitle={training.title} onClose={() => setPublishOpen(false)} disableClose={busy} />
          <InstitutionModalBody>
            <Typography variant="body2">Staff who can take it will see it in their learning hub and get a notification. You can still edit it afterwards.</Typography>
            {overview?.checklist?.items?.some((i) => !i.done && !i.optional && i.key !== 'publish') ? (
              <Alert severity="warning">Not everything is set up yet: {overview.checklist.items.filter((i) => !i.done && !i.optional && i.key !== 'publish').map((i) => i.label.toLowerCase()).join(', ')}.</Alert>
            ) : null}
          </InstitutionModalBody>
          <InstitutionModalFooter>
            <Button onClick={() => setPublishOpen(false)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" onClick={publish} disabled={busy} sx={{ ...btn, bgcolor: PURPLE }}>{busy ? 'Publishing…' : 'Publish'}</Button>
          </InstitutionModalFooter>
        </InstitutionModal>

        <InstitutionModal open={Boolean(certificateFor)} onClose={() => setCertificateFor(null)} disableClose={busy} maxWidth="sm">
          <InstitutionModalHeader icon={UploadIcon} title="Upload certificate" subtitle={certificateFor ? `${certificateFor.user?.givenName || ''} ${certificateFor.user?.familyName || ''} · ${certificateFor.user?.email || ''}` : ''} onClose={() => setCertificateFor(null)} disableClose={busy} />
          <InstitutionModalBody>
            <Button component="label" variant="outlined" fullWidth sx={{ ...btn, py: 2, borderStyle: 'dashed', borderColor: PURPLE, color: PURPLE }}>
              {certificateFile ? certificateFile.name : 'Choose the certificate file (PDF or image)'}
              <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setCertificateFile(e.target.files?.[0] || null)} />
            </Button>
          </InstitutionModalBody>
          <InstitutionModalFooter>
            <Button onClick={() => setCertificateFor(null)} disabled={busy} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" disabled={busy || !certificateFile} onClick={uploadCertificate} sx={{ ...btn, bgcolor: PURPLE }}>{busy ? 'Uploading…' : 'Upload'}</Button>
          </InstitutionModalFooter>
        </InstitutionModal>

        <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={() => setNotice('')} severity="success" sx={{ width: '100%' }}>{notice}</Alert>
        </Snackbar>
      </Box>
    </InstitutionModalVariant.Provider>
  );
}
