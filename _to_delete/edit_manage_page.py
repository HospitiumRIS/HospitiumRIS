import sys, os, re
p = os.path.join(sys.argv[1], 'src/app/researcher/publications/manage/page.js')
raw = open(p, encoding='utf-8', newline='').read()
crlf = '\r\n' in raw
s = re.sub(r'[ \t]+\n', '\n', raw.replace('\r\n', '\n'))

def rep(old, new, count=1):
    global s
    assert s.count(old) == count, f'({s.count(old)}) NOT FOUND/UNIQUE: {old[:110]}'
    s = s.replace(old, new)

# imports
rep("import PageHeader from '../../../../components/common/PageHeader';\n",
    "import PageHeader from '../../../../components/common/PageHeader';\n"
    "import {\n  useLibrarySharing,\n  ShareLibraryDialog,\n  SharedWithMeList,\n  SharedLibraryPanel,\n  FolderContributionsPanel,\n} from '../../../../components/Library/LibrarySharing';\n"
    "import { GroupAdd as ShareFolderIcon, People as SharedPeopleIcon } from '@mui/icons-material';\n")

# state + handlers
rep("""  // Track publications in folders: { folderId: [publicationId1, publicationId2, ...] }
  const [folderPublications, setFolderPublications] = useState({});
""", """  // Track publications in folders: { folderId: [publicationId1, publicationId2, ...] }
  const [folderPublications, setFolderPublications] = useState({});

  // Library sharing: folders shared with others, and libraries shared with me
  const sharing = useLibrarySharing();
  const [shareFolder, setShareFolder] = useState(null);
  const [sharedView, setSharedView] = useState(null); // folderId of a library shared with me
""")

rep("""  // Load library on mount
  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);
""", """  // Load library on mount
  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleSharingChanged = async (message, severity = 'success') => {
    await Promise.all([sharing.reload(), fetchLibrary()]);
    if (message) showSnackbar(message, severity);
  };
""")

# folder tree: shared badge + share action
rep("""                    {getPublicationCount(folder.id) > 0 && (
                      <Tooltip title={`${getPublicationCount(folder.id)} publication(s)`}>""", """                    {(sharing.mySharesByFolder[folder.id] || []).length > 0 && (
                      <Tooltip title={`Shared with ${(sharing.mySharesByFolder[folder.id] || []).map((m) => m.name).join(', ')}`}>
                        <Chip
                          size="small"
                          label={(sharing.mySharesByFolder[folder.id] || []).length}
                          icon={<SharedPeopleIcon sx={{ fontSize: '14px !important' }} />}
                          onClick={(e) => { e.stopPropagation(); setShareFolder(folder); }}
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: '#e0f2fe',
                            color: '#0369a1',
                            '& .MuiChip-icon': { color: '#0369a1', ml: 0.5 },
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      </Tooltip>
                    )}
                    {getPublicationCount(folder.id) > 0 && (
                      <Tooltip title={`${getPublicationCount(folder.id)} publication(s)`}>""")
rep("""                  <Tooltip title="Add subfolder">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewFolderParent(folder.id);""", """                  <Tooltip title="Share with your team">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareFolder(folder);
                      }}
                      sx={{ p: 0.5, color: '#0284c7' }}
                    >
                      <ShareFolderIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add subfolder">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewFolderParent(folder.id);""")

# contributions for the folder being viewed (folder + descendants)
rep("""  const viewingFolder = libraryFilter !== 'all' && libraryFilter !== 'unfiled';
""", """  const viewingFolder = libraryFilter !== 'all' && libraryFilter !== 'unfiled';
  const viewedFolderIds = (() => {
    if (!viewingFolder) return [];
    const ids = [libraryFilter];
    const walk = (parentId) => folders.forEach((f) => { if (f.parent === parentId) { ids.push(f.id); walk(f.id); } });
    walk(libraryFilter);
    return ids;
  })();
  const folderContributions = viewedFolderIds.flatMap((id) => sharing.contributionsByFolder[id] || []);
  const folderNameById = Object.fromEntries(folders.map((f) => [f.id, f.name]));
  const activeSharedLibrary = sharedView ? sharing.sharedWithMe.find((lib) => lib.folder.id === sharedView) || null : null;
""")

# header rename
rep("""        title={t('researcher.manage_publications')}
        description={t('researcher.manage_publications_desc')}""", """        title={t('researcher.manage_library', { defaultValue: 'Manage Library' })}
        description={t('researcher.manage_library_desc', { defaultValue: 'Organise your publications into libraries and share them with your team' })}""")
rep("""          { label: t('researcher.manage_publications') }
        ]}""", """          { label: t('researcher.manage_library', { defaultValue: 'Manage Library' }) }
        ]}""")

# sidebar: clear shared view when picking own items; add Shared with me
rep("""                  onClick={() => { setLibraryFilter(item.id); setPage(0); setSelectedPublications([]); }}""",
    """                  onClick={() => { setSharedView(null); setLibraryFilter(item.id); setPage(0); setSelectedPublications([]); }}""")
rep("""                renderFolderTree(null, 0, {
                  selectedId: libraryFilter,
                  onSelect: (id) => { setLibraryFilter(id); setPage(0); setSelectedPublications([]); },
                })
              )}
            </Box>
          </Paper>""", """                renderFolderTree(null, 0, {
                  selectedId: sharedView ? null : libraryFilter,
                  onSelect: (id) => { setSharedView(null); setLibraryFilter(id); setPage(0); setSelectedPublications([]); },
                })
              )}
              <Divider sx={{ my: 1 }} />
              <SharedWithMeList
                libraries={sharing.sharedWithMe}
                loading={sharing.loading}
                activeId={sharedView}
                onSelect={(id) => { setSharedView(id); setSelectedPublications([]); }}
              />
            </Box>
          </Paper>

        {activeSharedLibrary ? (
          <SharedLibraryPanel
            library={activeSharedLibrary}
            myPublications={publications}
            onChanged={(msg) => handleSharingChanged(msg)}
            onLeft={async (msg) => { setSharedView(null); await handleSharingChanged(msg); }}
            notify={showSnackbar}
          />
        ) : null}""")

# hide own list while a shared library is open, and show member contributions in own folders
rep("""        <Paper sx={{ flex: 1, minWidth: 0, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, bgcolor: 'white' }}>""", """        <Paper sx={{ flex: 1, minWidth: 0, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', display: activeSharedLibrary ? 'none' : 'block' }}>
          <Box sx={{ p: 2.5, bgcolor: 'white' }}>
            {viewingFolder ? (
              <FolderContributionsPanel
                items={folderContributions}
                folderNames={folderNameById}
                onChanged={(msg) => handleSharingChanged(msg)}
                notify={showSnackbar}
              />
            ) : null}""")

# share dialog, mounted once
rep("""  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa'}} >""", """  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa'}} >
      <ShareLibraryDialog
        open={Boolean(shareFolder)}
        folder={shareFolder}
        members={shareFolder ? sharing.mySharesByFolder[shareFolder.id] || [] : []}
        onClose={() => setShareFolder(null)}
        onChanged={(msg) => handleSharingChanged(msg)}
      />""")

if crlf:
    s = s.replace('\n', '\r\n')
open(p, 'w', encoding='utf-8', newline='').write(s)
print('manage page edited')
