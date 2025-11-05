'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogActions, Button, Box, Typography, 
  Tabs, Tab, Grid, TextField, FormControlLabel, Checkbox, IconButton,
  Slider, Select, MenuItem, FormControl, InputLabel, Chip, Switch,
  Divider, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, ButtonGroup, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Close as CloseIcon, TableChart as TableIcon, History as HistoryIcon,
  Palette as PaletteIcon, GridOn as GridIcon, Settings as SettingsIcon,
  Visibility as VisibilityIcon, ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

// Style presets
const stylePresets = {
  standard: {
    name: 'Standard',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    headerBg: '#f5f5f5',
    evenRowBg: '#ffffff',
    oddRowBg: '#ffffff',
    textColor: '#000000',
    fontSize: '14px',
    fontFamily: 'Arial'
  },
  modern: {
    name: 'Modern',
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#8b6cbc',
    headerBg: '#8b6cbc',
    evenRowBg: '#f8f6ff',
    oddRowBg: '#ffffff',
    textColor: '#333333',
    fontSize: '14px',
    fontFamily: 'Segoe UI'
  },
  minimal: {
    name: 'Minimal',
    borderStyle: 'none',
    borderWidth: 0,
    borderColor: '#e0e0e0',
    headerBg: '#ffffff',
    evenRowBg: '#ffffff',
    oddRowBg: '#ffffff',
    textColor: '#666666',
    fontSize: '13px',
    fontFamily: 'Arial'
  },
  corporate: {
    name: 'Corporate',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#4a5568',
    headerBg: '#2d3748',
    evenRowBg: '#f7fafc',
    oddRowBg: '#ffffff',
    textColor: '#2d3748',
    fontSize: '14px',
    fontFamily: 'Times New Roman'
  }
};

export default function TablePropertiesDialog({ open, onClose, onApply, initialSettings = {} }) {
  const [currentTab, setCurrentTab] = useState(0);
  const [modified, setModified] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  
  // Table settings state
  const [settings, setSettings] = useState({
    // Quick Style Presets
    preset: 'standard',
    
    // Borders & Colors
    showBorders: true,
    outerBorder: true,
    innerBorders: true,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    headerBackground: '#f5f5f5',
    evenRowBackground: '#ffffff',
    oddRowBackground: '#ffffff',
    alternating: false,
    firstRow: true,
    firstColumn: false,
    lastRow: false,
    
    // Layout & Spacing
    tableWidth: 100,
    tableWidthUnit: '%',
    tableAlignment: 'left',
    cellPadding: 10,
    cellSpacing: 0,
    
    // Advanced Styling
    fontFamily: 'Times New Roman',
    fontSize: 12,
    textColor: '#000000',
    borderRadius: 0,
    dropShadow: false,
    responsiveDesign: true,
    
    ...initialSettings
  });

  useEffect(() => {
    if (open) {
      setModified(false);
    }
  }, [open]);

  const handleSettingChange = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setModified(true);
  }, []);

  const applyPreset = useCallback((presetName) => {
    const preset = stylePresets[presetName];
    if (preset) {
      setSettings(prev => ({
        ...prev,
        preset: presetName,
        borderStyle: preset.borderStyle,
        borderWidth: preset.borderWidth,
        borderColor: preset.borderColor,
        headerBackground: preset.headerBg,
        evenRowBackground: preset.evenRowBg,
        oddRowBackground: preset.oddRowBg,
        textColor: preset.textColor,
        fontSize: parseInt(preset.fontSize),
        fontFamily: preset.fontFamily,
        showBorders: preset.borderWidth > 0
      }));
      setModified(true);
    }
  }, []);

  const handleApply = () => {
    onApply(settings);
    onClose();
  };

  const handleCancel = () => {
    setModified(false);
    onClose();
  };

  // Tab panels
  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ height: '100%' }}>
      {value === index && <Box sx={{ py: 2, height: '100%' }}>{children}</Box>}
    </div>
  );

  // Live preview component
  const LivePreview = () => (
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        height: 'fit-content',
        border: '1px solid #e0e0e0',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <VisibilityIcon fontSize="small" sx={{ color: '#8b6cbc' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Live Preview
        </Typography>
        <Chip label="3×3" size="small" sx={{ bgcolor: '#f0f0f0', fontSize: '0.75rem' }} />
      </Box>
      
      <TableContainer>
        <Table size="small" sx={{ 
          border: settings.showBorders ? `${settings.borderWidth}px ${settings.borderStyle} ${settings.borderColor}` : 'none',
          borderRadius: `${settings.borderRadius}px`,
          boxShadow: settings.dropShadow ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}px`,
          color: settings.textColor
        }}>
          <TableHead>
            <TableRow>
              {['Header 1', 'Header 2', 'Header 3'].map((header, idx) => (
                <TableCell 
                  key={idx}
                  sx={{ 
                    bgcolor: settings.firstRow ? settings.headerBackground : settings.evenRowBackground,
                    border: settings.showBorders && settings.innerBorders ? `1px ${settings.borderStyle} ${settings.borderColor}` : 'none',
                    padding: `${settings.cellPadding}px`,
                    fontWeight: settings.firstRow ? 600 : 400,
                    fontSize: `${settings.fontSize}px`,
                    fontFamily: settings.fontFamily,
                    color: settings.textColor
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[['Cell 2,1', 'Cell 2,2', 'Cell 2,3'], ['Cell 3,1', 'Cell 3,2', 'Cell 3,3']].map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <TableCell 
                    key={cellIdx}
                    sx={{ 
                      bgcolor: settings.alternating 
                        ? (rowIdx % 2 === 0 ? settings.evenRowBackground : settings.oddRowBackground)
                        : settings.evenRowBackground,
                      border: settings.showBorders && settings.innerBorders ? `1px ${settings.borderStyle} ${settings.borderColor}` : 'none',
                      padding: `${settings.cellPadding}px`,
                      fontSize: `${settings.fontSize}px`,
                      fontFamily: settings.fontFamily,
                      color: settings.textColor
                    }}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2, p: 1, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #bbdefb' }}>
        <Typography variant="caption" sx={{ color: '#1565c0', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          💡 <strong>Pro Tip:</strong> Use the live preview to see changes in real-time. Advanced styling options provide professional customization for your tables.
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh', maxHeight: '800px' }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        bgcolor: '#8b6cbc', 
        color: 'white', 
        py: 1.5, 
        px: 3 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TableIcon />
          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
            Table Properties
          </Typography>
          {modified && (
            <Chip 
              label="Modified" 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 500
              }} 
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton sx={{ color: 'white' }}>
            <HistoryIcon />
          </IconButton>
          <IconButton onClick={handleCancel} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Left Panel - Controls */}
          <Grid item xs={showLivePreview ? 8 : 12} sx={{ borderRight: showLivePreview ? '1px solid #e0e0e0' : 'none' }}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Tabs */}
              <Tabs 
                value={currentTab} 
                onChange={(e, newValue) => setCurrentTab(newValue)}
                sx={{ 
                  borderBottom: '1px solid #e0e0e0',
                  '& .MuiTab-root': { 
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#666',
                    '&.Mui-selected': { color: '#8b6cbc' }
                  }
                }}
              >
                <Tab icon={<PaletteIcon fontSize="small" />} label="Quick Style Presets" />
                <Tab icon={<GridIcon fontSize="small" />} label="Borders & Colors" />
                <Tab icon={<SettingsIcon fontSize="small" />} label="Layout & Spacing" />
                <Tab icon={<SettingsIcon fontSize="small" />} label="Advanced Styling" />
              </Tabs>

              {/* Tab Content */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
                {/* Quick Style Presets Tab */}
                <TabPanel value={currentTab} index={0}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    🎨 Quick Style Presets
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(stylePresets).map(([key, preset]) => (
                      <Grid item xs={6} sm={3} key={key}>
                        <Button
                          variant={settings.preset === key ? 'contained' : 'outlined'}
                          fullWidth
                          onClick={() => applyPreset(key)}
                          sx={{
                            py: 1.5,
                            textTransform: 'none',
                            bgcolor: settings.preset === key ? '#8b6cbc' : 'transparent',
                            borderColor: settings.preset === key ? '#8b6cbc' : '#e0e0e0',
                            color: settings.preset === key ? 'white' : '#666',
                            '&:hover': {
                              bgcolor: settings.preset === key ? '#7a5ca7' : '#f5f5f5'
                            }
                          }}
                        >
                          {preset.name}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </TabPanel>

                {/* Borders & Colors Tab */}
                <TabPanel value={currentTab} index={1}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    🎨 Border Settings
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.showBorders}
                        onChange={(e) => handleSettingChange('showBorders', e.target.checked)}
                        sx={{ 
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b6cbc' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8b6cbc' }
                        }}
                      />
                    }
                    label="Show Borders"
                    sx={{ mb: 2 }}
                  />

                  {settings.showBorders && (
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Style</InputLabel>
                          <Select
                            value={settings.borderStyle}
                            onChange={(e) => handleSettingChange('borderStyle', e.target.value)}
                            label="Style"
                          >
                            <MenuItem value="solid">Solid</MenuItem>
                            <MenuItem value="dashed">Dashed</MenuItem>
                            <MenuItem value="dotted">Dotted</MenuItem>
                            <MenuItem value="double">Double</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Width"
                          type="number"
                          size="small"
                          fullWidth
                          value={settings.borderWidth}
                          onChange={(e) => handleSettingChange('borderWidth', parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1, max: 10, step: 1 }}
                          InputProps={{ endAdornment: 'px' }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Color"
                          type="color"
                          size="small"
                          fullWidth
                          value={settings.borderColor}
                          onChange={(e) => handleSettingChange('borderColor', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  )}

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={settings.outerBorder}
                            onChange={(e) => handleSettingChange('outerBorder', e.target.checked)}
                            sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                          />
                        }
                        label="Outer border"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={settings.innerBorders}
                            onChange={(e) => handleSettingChange('innerBorders', e.target.checked)}
                            sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                          />
                        }
                        label="Inner borders"
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    🎨 Background Colors
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <TextField
                        label="Header Background"
                        type="color"
                        size="small"
                        fullWidth
                        value={settings.headerBackground}
                        onChange={(e) => handleSettingChange('headerBackground', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Even Row Background"
                        type="color"
                        size="small"
                        fullWidth
                        value={settings.evenRowBackground}
                        onChange={(e) => handleSettingChange('evenRowBackground', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Odd Row Background"
                        type="color"
                        size="small"
                        fullWidth
                        value={settings.oddRowBackground}
                        onChange={(e) => handleSettingChange('oddRowBackground', e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={settings.alternating}
                            onChange={(e) => handleSettingChange('alternating', e.target.checked)}
                            sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                          />
                        }
                        label="Alternating"
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={settings.firstRow}
                            onChange={(e) => handleSettingChange('firstRow', e.target.checked)}
                            sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                          />
                        }
                        label="First row"
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={settings.firstColumn}
                            onChange={(e) => handleSettingChange('firstColumn', e.target.checked)}
                            sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                          />
                        }
                        label="First column"
                      />
                    </Grid>
                    <Grid item xs={3}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={settings.lastRow}
                            onChange={(e) => handleSettingChange('lastRow', e.target.checked)}
                            sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                          />
                        }
                        label="Last row"
                      />
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Layout & Spacing Tab */}
                <TabPanel value={currentTab} index={2}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    📐 Table Dimensions
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={8}>
                      <TextField
                        label="Table Width"
                        type="number"
                        size="small"
                        fullWidth
                        value={settings.tableWidth}
                        onChange={(e) => handleSettingChange('tableWidth', parseFloat(e.target.value) || 100)}
                        inputProps={{ min: 10, max: 1000, step: 1 }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={settings.tableWidthUnit}
                          onChange={(e) => handleSettingChange('tableWidthUnit', e.target.value)}
                          label="Unit"
                        >
                          <MenuItem value="px">Pixels (px)</MenuItem>
                          <MenuItem value="%">Percent (%)</MenuItem>
                          <MenuItem value="em">Em (em)</MenuItem>
                          <MenuItem value="rem">Rem (rem)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Table Alignment</InputLabel>
                    <Select
                      value={settings.tableAlignment}
                      onChange={(e) => handleSettingChange('tableAlignment', e.target.value)}
                      label="Table Alignment"
                    >
                      <MenuItem value="left">Left</MenuItem>
                      <MenuItem value="center">Center</MenuItem>
                      <MenuItem value="right">Right</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    📐 Cell Spacing
                  </Typography>

                  <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
                    Cell Padding: {settings.cellPadding}px
                  </Typography>
                  <Slider
                    value={settings.cellPadding}
                    onChange={(e, value) => handleSettingChange('cellPadding', value)}
                    min={0}
                    max={20}
                    step={1}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 10, label: '10' },
                      { value: 20, label: '20' }
                    ]}
                    sx={{
                      color: '#8b6cbc',
                      '& .MuiSlider-thumb': { bgcolor: '#8b6cbc' },
                      '& .MuiSlider-track': { bgcolor: '#8b6cbc' },
                      '& .MuiSlider-rail': { bgcolor: '#e0e0e0' }
                    }}
                  />

                  <Typography variant="body2" gutterBottom sx={{ mb: 1, mt: 3 }}>
                    Cell Spacing: {settings.cellSpacing}px
                  </Typography>
                  <Slider
                    value={settings.cellSpacing}
                    onChange={(e, value) => handleSettingChange('cellSpacing', value)}
                    min={0}
                    max={10}
                    step={1}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 5, label: '5' },
                      { value: 10, label: '10' }
                    ]}
                    sx={{
                      color: '#8b6cbc',
                      '& .MuiSlider-thumb': { bgcolor: '#8b6cbc' },
                      '& .MuiSlider-track': { bgcolor: '#8b6cbc' },
                      '& .MuiSlider-rail': { bgcolor: '#e0e0e0' }
                    }}
                  />
                </TabPanel>

                {/* Advanced Styling Tab */}
                <TabPanel value={currentTab} index={3}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    ✨ Typography
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Font Family</InputLabel>
                        <Select
                          value={settings.fontFamily}
                          onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
                          label="Font Family"
                        >
                          <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                          <MenuItem value="Arial">Arial</MenuItem>
                          <MenuItem value="Helvetica">Helvetica</MenuItem>
                          <MenuItem value="Georgia">Georgia</MenuItem>
                          <MenuItem value="Verdana">Verdana</MenuItem>
                          <MenuItem value="Segoe UI">Segoe UI</MenuItem>
                          <MenuItem value="Roboto">Roboto</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Font Size"
                        type="number"
                        size="small"
                        fullWidth
                        value={settings.fontSize}
                        onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value) || 12)}
                        inputProps={{ min: 8, max: 24, step: 1 }}
                        InputProps={{ endAdornment: 'pt' }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="Text Color"
                    type="color"
                    size="small"
                    fullWidth
                    value={settings.textColor}
                    onChange={(e) => handleSettingChange('textColor', e.target.value)}
                    sx={{ mb: 3 }}
                  />

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    ✨ Visual Effects
                  </Typography>

                  <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
                    Border Radius: {settings.borderRadius}px
                  </Typography>
                  <Slider
                    value={settings.borderRadius}
                    onChange={(e, value) => handleSettingChange('borderRadius', value)}
                    min={0}
                    max={20}
                    step={1}
                    marks={[
                      { value: 0, label: '0px' },
                      { value: 10, label: '10px' },
                      { value: 20, label: '20px' }
                    ]}
                    sx={{
                      color: '#8b6cbc',
                      '& .MuiSlider-thumb': { bgcolor: '#8b6cbc' },
                      '& .MuiSlider-track': { bgcolor: '#8b6cbc' },
                      '& .MuiSlider-rail': { bgcolor: '#e0e0e0' },
                      mb: 3
                    }}
                  />

                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.dropShadow}
                        onChange={(e) => handleSettingChange('dropShadow', e.target.checked)}
                        sx={{ 
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b6cbc' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8b6cbc' }
                        }}
                      />
                    }
                    label="Drop Shadow"
                    sx={{ mb: 2 }}
                  />

                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.responsiveDesign}
                        onChange={(e) => handleSettingChange('responsiveDesign', e.target.checked)}
                        sx={{ 
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b6cbc' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8b6cbc' }
                        }}
                      />
                    }
                    label="Responsive Design"
                  />
                </TabPanel>
              </Box>
            </Box>
          </Grid>

          {/* Right Panel - Live Preview */}
          {showLivePreview && (
            <Grid item xs={4} sx={{ bgcolor: '#fafafa', p: 3 }}>
              <LivePreview />
              
              {/* Show Live Preview Toggle */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={showLivePreview}
                      onChange={(e) => setShowLivePreview(e.target.checked)}
                      sx={{ 
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b6cbc' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8b6cbc' }
                      }}
                    />
                  }
                  label="Show Live Preview"
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ 
        p: 2, 
        borderTop: '1px solid #e0e0e0', 
        bgcolor: '#f5f5f5',
        justifyContent: 'space-between'
      }}>
        <Typography variant="caption" sx={{ color: '#666', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          ⚠️ Changes are applied to the selected table
        </Typography>
        <Box>
          <Button onClick={handleCancel} sx={{ color: '#666', mr: 1 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            variant="contained" 
            disabled={!modified}
            sx={{ 
              bgcolor: '#8b6cbc', 
              '&:hover': { bgcolor: '#7a5ca7' },
              '&:disabled': { bgcolor: '#ccc' }
            }}
          >
            Apply Changes
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
