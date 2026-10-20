import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()

def rep(old, new):
    global s
    assert s.count(old) == 1, 'NOT UNIQUE/FOUND: ' + old[:100]
    s = s.replace(old, new)

# ---- imports
rep("""  CircularProgress,
  Container,
  Paper,""", """  CircularProgress,
  Container,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Link,
  Paper,""")
rep("""  ArrowBack as ArrowBackIcon,
  Assignment as ProposalIcon,""", """  AccountCircle as ProfileIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Assignment as ProposalIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  Close as CloseIcon,
  HourglassTop as PendingIcon,
  OpenInNew as OpenInNewIcon,
  WarningAmber as WarningIcon,""")
rep("""import ProposalReviewStatus from '@/components/Proposals/ProposalReviewStatus';""", """import ProposalReviewStatus from '@/components/Proposals/ProposalReviewStatus';
import ProposalDocumentPreviewModal from '@/components/Proposals/ProposalDocumentPreviewModal';""")

# ---- helpers
rep("""export default function ProposalViewPage() {""", r"""const normalizeOrcid = (value) => {
  const match = String(value || '').match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i);
  return match ? match[0].toUpperCase() : null;
};

function OrcidLink({ value }) {
  const orcid = normalizeOrcid(value);
  if (!orcid) {
    return <span>{value || 'Not set'}</span>;
  }
  return (
    <Link
      href={`https://orcid.org/${orcid}`}
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#2e7d32', fontWeight: 600 }}
    >
      <Box
        component="span"
        sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#a6ce39', color: 'white', fontSize: '0.55rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        iD
      </Box>
      {orcid}
      <OpenInNewIcon sx={{ fontSize: 13 }} />
    </Link>
  );
}

function ProfileButton({ userId, orcid, onOpenInternal }) {
  const bare = normalizeOrcid(orcid);
  if (!userId && !bare) {
    return (
      <Tooltip title="No Hospitium account or ORCID iD on record">
        <span>
          <Button size="small" variant="outlined" disabled startIcon={<ProfileIcon />} sx={{ textTransform: 'none', fontWeight: 700 }}>
            View profile
          </Button>
        </span>
      </Tooltip>
    );
  }
  const internal = Boolean(userId);
  return (
    <Tooltip title={internal ? 'Open Hospitium profile' : 'Not registered on Hospitium, opens public ORCID record'}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<ProfileIcon />}
        endIcon={internal ? null : <OpenInNewIcon sx={{ fontSize: 14 }} />}
        onClick={() => {
          if (internal) onOpenInternal(userId);
          else window.open(`https://orcid.org/${bare}`, '_blank', 'noopener,noreferrer');
        }}
        sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE, borderColor: alpha(PURPLE, 0.5), whiteSpace: 'nowrap', '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}
      >
        View profile
      </Button>
    </Tooltip>
  );
}

const COMPLETE_STATUSES = new Set(['completed', 'complete', 'delivered', 'done', 'achieved', 'accepted']);
const IN_PROGRESS_STATUSES = new Set(['in_progress', 'inprogress', 'ongoing', 'started', 'active', 'submitted', 'under_review']);

const taskState = (item) => {
  if (!item || item.kind === 'start' || item.kind === 'end') return null;
  const status = String(item.status || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (COMPLETE_STATUSES.has(status)) {
    return { key: 'completed', label: status === 'delivered' ? 'Delivered' : 'Completed', color: '#15803d', bg: '#dcfce7' };
  }
  if (status === 'cancelled' || status === 'canceled') {
    return { key: 'cancelled', label: 'Cancelled', color: '#b91c1c', bg: '#fee2e2' };
  }
  const due = item.date ? new Date(item.date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due && !Number.isNaN(due.getTime()) && due < today) {
    return { key: 'overdue', label: 'Overdue', color: '#b45309', bg: '#fef3c7' };
  }
  if (status === 'blocked') {
    return { key: 'blocked', label: 'Blocked', color: '#b91c1c', bg: '#fee2e2' };
  }
  if (IN_PROGRESS_STATUSES.has(status)) {
    return { key: 'in_progress', label: 'In progress', color: '#0369a1', bg: '#e0f2fe' };
  }
  return { key: 'pending', label: 'Pending', color: '#475569', bg: '#f1f5f9' };
};

const ethicsTone = (status) => {
  const value = String(status || '').toLowerCase();
  const pretty = String(status || '').replaceAll('_', ' ');
  if (!value) return { label: 'Not set', color: '#475569', bg: '#f8fafc', border: '#cbd5e1', icon: <PendingIcon />, message: 'No ethics approval has been recorded for this proposal yet.' };
  if (value.includes('not required') || value.includes('not_required') || value.includes('exempt')) return { label: pretty, color: '#0369a1', bg: '#f0f9ff', border: '#7dd3fc', icon: <CheckCircleIcon />, message: 'Ethics review is not required for this study.' };
  if (value.includes('reject') || value.includes('declin') || value.includes('denied')) return { label: 'Rejected', color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5', icon: <CancelIcon />, message: 'The ethics committee did not approve this study.' };
  if (value.includes('expir') || value.includes('suspend') || value.includes('revision') || value.includes('condition')) return { label: pretty, color: '#b45309', bg: '#fffbeb', border: '#fcd34d', icon: <WarningIcon />, message: 'Ethics approval needs attention before work can continue.' };
  if (value.includes('approv') && !value.includes('not') && !value.includes('pending')) return { label: 'Approved', color: '#15803d', bg: '#f0fdf4', border: '#86efac', icon: <CheckCircleIcon />, message: 'Ethics clearance is in place for this study.' };
  return { label: pretty, color: '#b45309', bg: '#fffbeb', border: '#fcd34d', icon: <PendingIcon />, message: 'Ethics approval is still pending.' };
};

export default function ProposalViewPage() {""")

# ---- state
rep("""  const [activeTab, setActiveTab] = useState(0);
""", """  const [activeTab, setActiveTab] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
""")

# ---- timeline items carry more detail
rep("""        title: milestone.title || `Milestone ${index + 1}`,
        date: milestone.targetDate,
        description: milestone.description,
      });""", """        title: milestone.title || `Milestone ${index + 1}`,
        date: milestone.targetDate || milestone.dueDate,
        description: milestone.description,
        status: milestone.status,
        progress: milestone.progress,
        notes: milestone.notes,
        completionCriteria: milestone.completionCriteria,
        blockers: milestone.blockers,
        documents: milestone.documents || [],
        linkedIds: milestone.linkedDeliverableIds || [],
        completedAt: milestone.completedAt || milestone.completedDate,
      });""")
rep("""      const linked = (proposal.milestones || []).find((item) => item.id && item.id === deliverable.milestoneId);
      items.push({
        kind: 'deliverable',
        id: deliverable.id || `dl-${index}`,
        title: deliverable.title || `Deliverable ${index + 1}`,
        date: deliverable.dueDate,
        description: deliverable.description,
        type: deliverable.type,
        milestoneTitle: linked?.title || null,
      });""", """      const linkedIds = [deliverable.milestoneId, ...(deliverable.linkedMilestoneIds || [])].filter(Boolean);
      const linked = (proposal.milestones || []).find((item) => item.id && linkedIds.includes(item.id));
      items.push({
        kind: 'deliverable',
        id: deliverable.id || `dl-${index}`,
        title: deliverable.title || `Deliverable ${index + 1}`,
        date: deliverable.dueDate || deliverable.deadline,
        description: deliverable.description,
        type: deliverable.type,
        milestoneTitle: linked?.title || null,
        status: deliverable.status,
        notes: deliverable.notes,
        completionCriteria: deliverable.completionCriteria,
        documents: deliverable.documents || [],
        linkedIds,
        completedAt: deliverable.completedAt || deliverable.deliveredAt,
      });""")

rep("""  const canEdit = isProposalEditable(proposal?.status);
""", """  const canEdit = isProposalEditable(proposal?.status);

  const taskItems = projectTimeline.filter((item) => item.kind === 'milestone' || item.kind === 'deliverable');
  const completedCount = taskItems.filter((item) => taskState(item)?.key === 'completed').length;
  const overdueCount = taskItems.filter((item) => taskState(item)?.key === 'overdue').length;
  const selectedIndex = projectTimeline.findIndex((item) => item.id === selectedTaskId);
  const selectedTask = selectedIndex >= 0 ? projectTimeline[selectedIndex] : null;
  const previousTask = selectedIndex > 0
    ? projectTimeline.slice(0, selectedIndex).reverse().find((item) => item.kind === 'milestone' || item.kind === 'deliverable') || null
    : null;
  const nextTask = selectedIndex >= 0 ? projectTimeline[selectedIndex + 1] || null : null;
  const linkedTasks = selectedTask
    ? projectTimeline.filter((item) => (
      item.id !== selectedTask.id
      && (item.kind === 'milestone' || item.kind === 'deliverable')
      && (selectedTask.linkedIds?.includes(item.id) || item.linkedIds?.includes(selectedTask.id))
    ))
    : [];

  const budgetDocuments = documents.filter((file) => String(file.category || '').toLowerCase().includes('budget'));

  const ethicsStatusValue = proposal?.ethicsApprovalStatus || linkedEthics?.status || '';
  const ethicsState = ethicsTone(ethicsStatusValue);
  const ethicsApprovalDate = proposal?.approvalDate || linkedEthics?.approvalDate;

  const openProfile = (userId) => router.push(`/researcher/profile/${userId}`);
  const previewDocument = (file) => setPreviewFile({ ...file, url: fileHref(file, linkedEthics?.id) || file.url });
""")

# ---- Overview: PI
rep("""                  {proposal.principalInvestigatorOrcid ? (
                    <Typography variant="caption" color="text.secondary">
                      ORCID {proposal.principalInvestigatorOrcid}
                          </Typography>
                  ) : null}
                        </Box>""", """                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                    {proposal.principalInvestigatorOrcid ? (
                      <Typography variant="caption" component="div">
                        <OrcidLink value={proposal.principalInvestigatorOrcid} />
                      </Typography>
                    ) : null}
                    <ProfileButton
                      userId={proposal.principalInvestigatorUserId}
                      orcid={proposal.principalInvestigatorOrcid}
                      onOpenInternal={openProfile}
                    />
                  </Stack>
                        </Box>""")
rep("""                          <TableCell sx={{ fontWeight: 700 }}>ORCID</TableCell>
                        </TableRow>""", """                          <TableCell sx={{ fontWeight: 700 }}>ORCID</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Profile</TableCell>
                        </TableRow>""")
rep("""                            <TableCell>{person.orcidId || 'Not set'}</TableCell>
                          </TableRow>""", """                            <TableCell><OrcidLink value={person.orcidId} /></TableCell>
                            <TableCell align="right">
                              <ProfileButton userId={person.userId} orcid={person.orcidId} onOpenInternal={openProfile} />
                            </TableCell>
                          </TableRow>""")

# ---- Timeline header progress
rep("""                  .join(' · ') || 'No items'}
                          </Typography>
            </Stack>""", """                  .join(' · ') || 'No items'}
                          </Typography>
            </Stack>
            {taskItems.length ? (
              <Box sx={{ mb: 2.5, p: 1.75, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {completedCount} of {taskItems.length} tasks complete
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: 15 }} />} label={`${completedCount} completed`} sx={{ fontWeight: 700, bgcolor: '#dcfce7', color: '#15803d', '& .MuiChip-icon': { color: '#15803d' } }} />
                    {overdueCount ? (
                      <Chip size="small" icon={<WarningIcon sx={{ fontSize: 15 }} />} label={`${overdueCount} overdue`} sx={{ fontWeight: 700, bgcolor: '#fef3c7', color: '#b45309', '& .MuiChip-icon': { color: '#b45309' } }} />
                    ) : null}
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.round((completedCount / taskItems.length) * 100)}
                  sx={{ height: 8, borderRadius: 4, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: '#16a34a', borderRadius: 4 } }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Click any milestone or deliverable to see its details and what comes next.
                </Typography>
              </Box>
            ) : null}""")

# ---- Timeline item
rep("""                  }[item.kind] || { color: PURPLE, bg: alpha(PURPLE, 0.1), icon: <TimelineIcon sx={{ fontSize: 15 }} /> };
                  return (""", """                  }[item.kind] || { color: PURPLE, bg: alpha(PURPLE, 0.1), icon: <TimelineIcon sx={{ fontSize: 15 }} /> };
                  const state = taskState(item);
                  const isDone = state?.key === 'completed';
                  const isTask = Boolean(state);
                  const markerColor = isDone ? '#16a34a' : tone.color;
                  return (""")
rep("""                            bgcolor: tone.bg,
                            color: tone.color,
                            border: `2px solid ${tone.color}`,""", """                            bgcolor: isDone ? '#16a34a' : tone.bg,
                            color: isDone ? 'white' : tone.color,
                            border: `2px solid ${markerColor}`,""")
rep("""                          {tone.icon}
                          </Box>
                        {!isLast ? (
                          <Box sx={{ width: 2, flex: 1, minHeight: 28, bgcolor: alpha(PURPLE, 0.18), my: 0.5 }} />""", """                          {isDone ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : tone.icon}
                          </Box>
                        {!isLast ? (
                          <Box sx={{ width: 2, flex: 1, minHeight: 28, bgcolor: isDone ? alpha('#16a34a', 0.45) : alpha(PURPLE, 0.18), my: 0.5 }} />""")
rep("""                      <Box
                        sx={{
                          flex: 1,
                          mb: isLast ? 0 : 2,
                          p: 1.75,
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: item.kind === 'start' || item.kind === 'end' ? '#f8fafc' : 'white',
                        }}
                      >""", """                      <Box
                        role={isTask ? 'button' : undefined}
                        tabIndex={isTask ? 0 : undefined}
                        onClick={isTask ? () => setSelectedTaskId(item.id) : undefined}
                        onKeyDown={isTask ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedTaskId(item.id); } } : undefined}
                        sx={{
                          flex: 1,
                          mb: isLast ? 0 : 2,
                          p: 1.75,
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: selectedTaskId === item.id ? PURPLE : isDone ? alpha('#16a34a', 0.35) : 'divider',
                          bgcolor: item.kind === 'start' || item.kind === 'end' ? '#f8fafc' : isDone ? '#f7fdf9' : 'white',
                          cursor: isTask ? 'pointer' : 'default',
                          transition: 'border-color 120ms, box-shadow 120ms',
                          ...(isTask ? {
                            '&:hover': { borderColor: PURPLE, boxShadow: `0 2px 10px ${alpha(PURPLE, 0.12)}` },
                            '&:focus-visible': { outline: `2px solid ${PURPLE}`, outlineOffset: 2 },
                          } : {}),
                        }}
                      >""")
rep("""                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {item.title}
                          </Typography>""", """                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDone ? '#475569' : '#1e293b' }}>
                                {item.title}
                          </Typography>""")
rep("""                                sx={{ height: 20, fontWeight: 700, fontSize: '0.68rem', bgcolor: tone.bg, color: tone.color }}
                              />
                            </Stack>""", """                                sx={{ height: 20, fontWeight: 700, fontSize: '0.68rem', bgcolor: tone.bg, color: tone.color }}
                              />
                              {state ? (
                                <Chip
                                  label={state.label}
                                  size="small"
                                  icon={state.key === 'completed' ? <CheckCircleIcon /> : state.key === 'overdue' ? <WarningIcon /> : undefined}
                                  sx={{ height: 20, fontWeight: 700, fontSize: '0.68rem', bgcolor: state.bg, color: state.color, '& .MuiChip-icon': { fontSize: 13, color: state.color, ml: 0.5 } }}
                                />
                              ) : null}
                            </Stack>""")
rep("""                          <Typography variant="caption" sx={{ fontWeight: 700, color: tone.color, whiteSpace: 'nowrap' }}>
                            {formatDate(item.date)}
                            </Typography>
                        </Stack>
                        {item.description ? (
                          <Box sx={{ mt: 1 }}>
                            <HtmlContent value={item.description} empty="" />
                      </Box>
                        ) : null}""", """                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="caption" sx={{ fontWeight: 700, color: state?.key === 'overdue' ? '#b45309' : tone.color, whiteSpace: 'nowrap' }}>
                              {formatDate(item.date)}
                            </Typography>
                            {isTask ? <ArrowForwardIcon sx={{ fontSize: 14, color: '#94a3b8' }} /> : null}
                          </Stack>
                        </Stack>""")

# ---- Funding tab
rep("""                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {proposal.budgetCurrency || 'USD'}
                        </Typography>
                      </Box>
            </Stack>
          </Paper>""", """                <Typography variant="body2" sx={{ color: '#1e293b' }}>
                  {proposal.budgetCurrency || 'USD'}
                        </Typography>
                      </Box>
              {proposal.fundingInstitution ? (
                <Box>
                  <FieldLabel>Funding institution</FieldLabel>
                  <Typography variant="body2" sx={{ color: '#1e293b' }}>{proposal.fundingInstitution}</Typography>
                </Box>
              ) : null}
              <Box>
                <FieldLabel>Budget documents</FieldLabel>
                {budgetDocuments.length ? (
                  <Stack spacing={1}>
                    {budgetDocuments.map((file, index) => (
                      <DocumentRow key={`${file.fileName || file.fileId || file.originalName || index}`} file={file} fallbackCategory="Budget document" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No budget documents uploaded.</Typography>
                )}
              </Box>
            </Stack>
          </Paper>""")

# ---- Ethics status banner
rep("""            <SectionTitle>Ethics approval</SectionTitle>
                    <Stack spacing={2}>
              <Box>
                <FieldLabel>Status</FieldLabel>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {proposal.ethicsApprovalStatus || 'Not set'}
                                </Typography>
                              </Box>""", """            <SectionTitle>Ethics approval</SectionTitle>
                    <Stack spacing={2}>
              <Box
                role="status"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: ethicsState.bg,
                  border: `1px solid ${ethicsState.border}`,
                  borderLeft: `6px solid ${ethicsState.color}`,
                }}
              >
                <Avatar sx={{ bgcolor: ethicsState.color, color: 'white', width: 44, height: 44 }}>
                  {ethicsState.icon}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <FieldLabel>Ethics status</FieldLabel>
                  <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip
                      label={ethicsState.label}
                      sx={{ bgcolor: ethicsState.color, color: 'white', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                    />
                    {proposal.ethicsApprovalReference ? (
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Ref. {proposal.ethicsApprovalReference}
                      </Typography>
                    ) : null}
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 0.75, color: ethicsState.color, fontWeight: 600 }}>
                    {ethicsState.message}
                    {ethicsState.label === 'Approved' && ethicsApprovalDate ? ` Approved on ${formatDate(ethicsApprovalDate)}.` : ''}
                  </Typography>
                </Box>
              </Box>
              {linkedEthics?.status && proposal.ethicsApprovalStatus && ethicsTone(linkedEthics.status).label !== ethicsState.label ? (
                <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                  The linked ethics application currently shows status <strong>{String(linkedEthics.status).replaceAll('_', ' ')}</strong>.
                </Alert>
              ) : null}""")

# ---- Ethics & Files document rows -> DocumentRow
rep("""                    {ethicsDocuments.map((file, index) => (
                      <Stack
                        key={`${file.fileName || file.fileId || file.originalName || index}`}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                        sx={{ px: 1.5, py: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }} noWrap>
                            {fileName(file)}
                                </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[file.category || file.type || 'Ethics document', formatBytes(file.size)].filter(Boolean).join(' · ')}
                              </Typography>
                            </Box>
                            <Button
                          size="small"
                              startIcon={<ViewIcon />}
                          onClick={() => openFile(file)}
                          disabled={!fileHref(file, linkedEthics?.id)}
                          sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                        >
                          Open
                            </Button>
                      </Stack>
                    ))}""", """                    {ethicsDocuments.map((file, index) => (
                      <DocumentRow key={`${file.fileName || file.fileId || file.originalName || index}`} file={file} fallbackCategory="Ethics document" />
                    ))}""")
rep("""                {documents.map((file, index) => (
                  <Stack
                    key={`${file.fileName || file.fileId || file.originalName || index}`}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    sx={{ px: 1.5, py: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                      <Avatar sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE, width: 36, height: 36 }}>
                        <FilesIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }} noWrap>
                          {fileName(file)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[file.category, formatBytes(file.size)].filter(Boolean).join(' · ')}
                                </Typography>
                              </Box>
                            </Stack>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => openFile(file)}
                      disabled={!fileHref(file, linkedEthics?.id)}
                      sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                    >
                      Open
                    </Button>
                  </Stack>
                        ))}""", """                {documents.map((file, index) => (
                  <DocumentRow key={`${file.fileName || file.fileId || file.originalName || index}`} file={file} />
                        ))}""")

# ---- render helpers inside component (plain functions called directly, not components, to avoid remounts)
rep("""  if (loading) {
    return (""", """  const DocumentRow = ({ file, fallbackCategory = '' }) => {
    const href = fileHref(file, linkedEthics?.id);
    return (
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{ px: 1.5, py: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'white' }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE, width: 36, height: 36 }}>
            <FilesIcon fontSize="small" />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }} noWrap>
              {fileName(file)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {[file.category || fallbackCategory, formatBytes(file.size)].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={() => previewDocument(file)}
            disabled={!href}
            sx={{ color: PURPLE, borderColor: alpha(PURPLE, 0.5), textTransform: 'none', fontWeight: 700 }}
          >
            Preview
          </Button>
          <Tooltip title="Open in new tab">
            <span>
              <IconButton size="small" onClick={() => openFile(file)} disabled={!href} sx={{ color: PURPLE }}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    );
  };

  const TaskSummaryCard = ({ item, label, icon }) => {
    const state = taskState(item);
    const clickable = item.kind === 'milestone' || item.kind === 'deliverable';
    return (
      <Box
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? () => setSelectedTaskId(item.id) : undefined}
        onKeyDown={clickable ? (event) => { if (event.key === 'Enter') setSelectedTaskId(item.id); } : undefined}
        sx={{
          p: 1.5,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'white',
          cursor: clickable ? 'pointer' : 'default',
          ...(clickable ? { '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.03) } } : {}),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          {icon}
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: PURPLE }}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{item.title}</Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
          <Chip
            size="small"
            label={item.kind === 'milestone' ? 'Milestone' : item.kind === 'deliverable' ? 'Deliverable' : 'Project'}
            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: item.kind === 'deliverable' ? '#ccfbf1' : alpha(PURPLE, 0.1), color: item.kind === 'deliverable' ? '#0f766e' : PURPLE }}
          />
          {state ? (
            <Chip size="small" label={state.label} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: state.bg, color: state.color }} />
          ) : null}
          <Typography variant="caption" color="text.secondary">{formatDate(item.date)}</Typography>
        </Stack>
      </Box>
    );
  };

  const renderTaskDrawer = () => {
    if (!selectedTask) return null;
    const state = taskState(selectedTask);
    const isMilestone = selectedTask.kind === 'milestone';
    const progress = Math.min(100, Number(selectedTask.progress) || 0);
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ p: 2.5, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                icon={isMilestone ? <MilestoneIcon /> : <DeliverableIcon />}
                label={isMilestone ? 'Milestone' : 'Deliverable'}
                sx={{ fontWeight: 700, bgcolor: isMilestone ? alpha(PURPLE, 0.1) : '#ccfbf1', color: isMilestone ? PURPLE : '#0f766e', '& .MuiChip-icon': { color: 'inherit', fontSize: 15 } }}
              />
              {state ? (
                <Chip
                  size="small"
                  icon={state.key === 'completed' ? <CheckCircleIcon /> : state.key === 'overdue' ? <WarningIcon /> : undefined}
                  label={state.label}
                  sx={{ fontWeight: 700, bgcolor: state.bg, color: state.color, '& .MuiChip-icon': { color: state.color, fontSize: 15 } }}
                />
              ) : null}
            </Stack>
            <IconButton size="small" onClick={() => setSelectedTaskId(null)} aria-label="Close details">
              <CloseIcon />
            </IconButton>
          </Stack>
          <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', lineHeight: 1.35 }}>
            {selectedTask.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Item {taskItems.findIndex((item) => item.id === selectedTask.id) + 1} of {taskItems.length} on the project timeline
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          <Stack spacing={2.25}>
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
              <Box>
                <FieldLabel>{isMilestone ? 'Target date' : 'Due date'}</FieldLabel>
                <Typography variant="body2" sx={{ fontWeight: 700, color: state?.key === 'overdue' ? '#b45309' : '#1e293b' }}>
                  {formatDate(selectedTask.date)}
                </Typography>
              </Box>
              {selectedTask.completedAt ? (
                <Box>
                  <FieldLabel>Completed on</FieldLabel>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#15803d' }}>{formatDate(selectedTask.completedAt)}</Typography>
                </Box>
              ) : null}
              {!isMilestone && selectedTask.type ? (
                <Box>
                  <FieldLabel>Type</FieldLabel>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{selectedTask.type}</Typography>
                </Box>
              ) : null}
            </Stack>

            {isMilestone && progress > 0 ? (
              <Box>
                <FieldLabel>Progress</FieldLabel>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(PURPLE, 0.12), '& .MuiLinearProgress-bar': { bgcolor: PURPLE } }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{progress}%</Typography>
                </Stack>
              </Box>
            ) : null}

            <Box>
              <FieldLabel>Description</FieldLabel>
              <HtmlContent value={selectedTask.description} empty="No description provided" />
            </Box>

            {!isEmptyHtml(selectedTask.completionCriteria) ? (
              <Box>
                <FieldLabel>Completion criteria</FieldLabel>
                <HtmlContent value={selectedTask.completionCriteria} />
              </Box>
            ) : null}

            {!isEmptyHtml(selectedTask.notes) ? (
              <Box>
                <FieldLabel>Notes</FieldLabel>
                <HtmlContent value={selectedTask.notes} />
              </Box>
            ) : null}

            {!isEmptyHtml(selectedTask.blockers) ? (
              <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
                <strong>Blockers:</strong> {String(selectedTask.blockers).replace(/<[^>]+>/g, ' ')}
              </Alert>
            ) : null}

            {linkedTasks.length ? (
              <Box>
                <FieldLabel>{isMilestone ? 'Linked deliverables' : 'Output of milestone'}</FieldLabel>
                <Stack spacing={1}>
                  {linkedTasks.map((item) => (
                    <TaskSummaryCard
                      key={item.id}
                      item={item}
                      label={item.kind === 'milestone' ? 'Milestone' : 'Deliverable'}
                      icon={item.kind === 'milestone' ? <MilestoneIcon sx={{ fontSize: 15, color: PURPLE }} /> : <DeliverableIcon sx={{ fontSize: 15, color: '#0f766e' }} />}
                    />
                  ))}
                </Stack>
              </Box>
            ) : null}

            {(selectedTask.documents || []).length ? (
              <Box>
                <FieldLabel>Documents</FieldLabel>
                <Stack spacing={1}>
                  {selectedTask.documents.map((file, index) => (
                    <DocumentRow key={file.id || file.fileName || index} file={file} fallbackCategory={isMilestone ? 'Milestone document' : 'Deliverable document'} />
                  ))}
                </Stack>
              </Box>
            ) : null}

            <Divider />

            <Box>
              <FieldLabel>Up next</FieldLabel>
              {nextTask ? (
                <TaskSummaryCard item={nextTask} label="Next task" icon={<ArrowForwardIcon sx={{ fontSize: 15, color: PURPLE }} />} />
              ) : (
                <Typography variant="body2" color="text.secondary">This is the last item on the timeline.</Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="space-between" sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            startIcon={<ChevronLeftIcon />}
            disabled={!previousTask}
            onClick={() => previousTask && setSelectedTaskId(previousTask.id)}
            sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            disabled={!nextTask || !taskState(nextTask)}
            onClick={() => nextTask && setSelectedTaskId(nextTask.id)}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE, boxShadow: 'none', '&:hover': { bgcolor: '#7a5cb0', boxShadow: 'none' } }}
          >
            Next task
          </Button>
        </Stack>
      </Box>
    );
  };

  if (loading) {
    return (""")

# ---- Drawer + preview modal
rep("""      </Container>
    </>
  );
}""", """      </Container>

      <Drawer
        anchor="right"
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTaskId(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, bgcolor: '#f8fafc' } }}
      >
        {renderTaskDrawer()}
      </Drawer>

      <ProposalDocumentPreviewModal
        open={Boolean(previewFile)}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile ? fileName(previewFile) : 'Document preview'}
      />
    </>
  );
}""")

open(p, 'w', encoding='utf-8', newline='').write(s)
print('done')
