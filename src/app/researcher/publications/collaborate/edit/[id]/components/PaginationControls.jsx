import { useTranslation } from 'react-i18next';
import { useState, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Typography,
  Stack,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  InsertPageBreak as PageBreakIcon,
  Settings as SettingsIcon,
  AutoMode as AutoIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Description as PageIcon,
} from '@mui/icons-material';
import { PAGE_SIZES, DEFAULT_MARGINS, PAGE_NUMBER_POSITIONS } from '../utils/paginationHelper';

const DEFAULT_PAGE_SETTINGS = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: DEFAULT_MARGINS,
  showPageNumbers: true,
  pageNumberPosition: 'bottom-center',
  wordsPerPage: 800,
  autoCalculate: true,
};

const MARGIN_PRESETS = [
  { label: 'Normal (1")', value: 72 },
  { label: 'Narrow (0.5")', value: 48 },
  { label: 'Wide (1.5")', value: 108 },
];

const PaginationControls = forwardRef(({
  editor,
  enabled,
  onToggle,
  pageSettings,
  onSettingsChange,
}, ref) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    ...DEFAULT_PAGE_SETTINGS,
    ...(pageSettings || {}),
  });

  const openSettingsDialog = () => {
    // Always edit a copy of what the document is currently using
    setSettings({ ...DEFAULT_PAGE_SETTINGS, ...(pageSettings || {}) });
    setSettingsOpen(true);
  };

  // Expose openSettings method to parent via ref
  useImperativeHandle(ref, () => ({
    openSettings: openSettingsDialog
  }));

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleInsertPageBreak = () => {
    if (editor) {
      editor.chain().focus().insertPageBreak().run();
    }
    handleMenuClose();
  };

  const handleAutoCalculate = () => {
    if (editor) {
      editor.chain().focus().autoCalculatePageBreaks().run();
    }
    handleMenuClose();
  };

  const handleRemoveAll = () => {
    if (editor) {
      editor.chain().focus().removeAllPageBreaks().run();
    }
    handleMenuClose();
  };

  const handleSettingsOpen = () => {
    handleMenuClose();
    openSettingsDialog();
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleSettingsSave = () => {
    // The parent owns page settings so the page canvas re-renders with them
    if (onSettingsChange) {
      onSettingsChange(settings);
    } else if (editor) {
      editor.commands.setPaginationOptions(settings);
    }
    setSettingsOpen(false);
  };

  const handleTogglePagination = () => {
    const newEnabled = !enabled;
    if (editor) {
      editor.chain().focus().setPaginationEnabled(newEnabled).run();
    }
    if (onToggle) {
      onToggle(newEnabled);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateMargin = (side, value) => {
    setSettings(prev => ({
      ...prev,
      margins: { ...prev.margins, [side]: parseInt(value) || 0 }
    }));
  };

  return (
    <>
      <Tooltip title="Pagination">
        <IconButton
          onClick={handleMenuOpen}
          size="small"
          sx={{
            color: enabled ? '#8b6cbc' : '#666',
            backgroundColor: enabled ? '#8b6cbc10' : 'transparent',
            '&:hover': {
              backgroundColor: enabled ? '#8b6cbc20' : '#f5f5f5',
            },
            borderRadius: 1,
            mx: 0.25
          }}
        >
          <PageIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={handleTogglePagination}
                size="small"
              />
            }
            label="Enable Pagination"
          />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleInsertPageBreak} disabled={!enabled}>
          <ListItemIcon>
            <PageBreakIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Insert Page Break</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleAutoCalculate} disabled={!enabled}>
          <ListItemIcon>
            <AutoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Auto-Calculate Breaks</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleRemoveAll} disabled={!enabled}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove All Breaks</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleSettingsOpen} disabled={!enabled}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Pagination Settings</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={settingsOpen} onClose={handleSettingsClose} maxWidth="sm" fullWidth>
        <DialogTitle>Page Setup</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Page Size</InputLabel>
              <Select
                value={settings.pageSize}
                onChange={(e) => updateSetting('pageSize', e.target.value)}
                label="Page Size"
              >
                {Object.keys(PAGE_SIZES).map(size => (
                  <MenuItem key={size} value={size}>{size}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Orientation</InputLabel>
              <Select
                value={settings.orientation}
                onChange={(e) => updateSetting('orientation', e.target.value)}
                label="Orientation"
              >
                <MenuItem value="portrait">Portrait</MenuItem>
                <MenuItem value="landscape">Landscape</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Margins (pixels — 72px = 1 inch)
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {MARGIN_PRESETS.map(preset => (
                  <Button
                    key={preset.value}
                    size="small"
                    variant={
                      Object.values(settings.margins).every(m => m === preset.value)
                        ? 'contained'
                        : 'outlined'
                    }
                    onClick={() => updateSetting('margins', {
                      top: preset.value,
                      right: preset.value,
                      bottom: preset.value,
                      left: preset.value,
                    })}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      ...(Object.values(settings.margins).every(m => m === preset.value)
                        ? { bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5cac' } }
                        : { color: '#666', borderColor: '#e0e0e0' })
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Top"
                  type="number"
                  size="small"
                  value={settings.margins.top}
                  onChange={(e) => updateMargin('top', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Right"
                  type="number"
                  size="small"
                  value={settings.margins.right}
                  onChange={(e) => updateMargin('right', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Bottom"
                  type="number"
                  size="small"
                  value={settings.margins.bottom}
                  onChange={(e) => updateMargin('bottom', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Left"
                  type="number"
                  size="small"
                  value={settings.margins.left}
                  onChange={(e) => updateMargin('left', e.target.value)}
                  fullWidth
                />
              </Stack>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.showPageNumbers}
                  onChange={(e) => updateSetting('showPageNumbers', e.target.checked)}
                />
              }
              label="Show Page Numbers"
            />

            {settings.showPageNumbers && (
              <FormControl fullWidth>
                <InputLabel>Page Number Position</InputLabel>
                <Select
                  value={settings.pageNumberPosition}
                  onChange={(e) => updateSetting('pageNumberPosition', e.target.value)}
                  label="Page Number Position"
                >
                  {Object.keys(PAGE_NUMBER_POSITIONS).map(pos => (
                    <MenuItem key={pos} value={pos}>
                      {pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Words Per Page"
              type="number"
              value={settings.wordsPerPage}
              onChange={(e) => updateSetting('wordsPerPage', parseInt(e.target.value) || 800)}
              helperText="Only used by Auto-Calculate Breaks; page view itself measures real content height"
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoCalculate}
                  onChange={(e) => updateSetting('autoCalculate', e.target.checked)}
                />
              }
              label="Auto-Calculate Page Breaks"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSettingsSave} variant="contained" sx={{ bgcolor: '#8b6cbc' }}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

PaginationControls.displayName = 'PaginationControls';

export default PaginationControls;
