'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import {
  Category as CategoryIcon,
  Campaign as CampaignIcon,
  Event as ActivityIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  MeetingRoom,
  Event,
  Email,
  Phone,
  Slideshow as Presentation,
  LocationOn,
  FollowTheSigns
} from '@mui/icons-material';

// Icon mapping for activity types
const iconMapping = {
  MeetingRoom,
  Event,
  Email,
  Phone,
  Presentation,
  LocationOn,
  FollowTheSigns
};

// Shared status color map
const statusColorMap = {
  Planning: '#757575',
  Active: '#4caf50',
  Paused: '#ff9800',
  Completed: '#2196f3',
  Cancelled: '#ef5350'
};

// Shared field styling
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 1.5,
    backgroundColor: 'white',
    '& fieldset': { borderColor: '#e0e0e0' },
    '&:hover fieldset': { borderColor: '#bdbdbd' },
    '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
};

const selectSx = {
  borderRadius: 1.5,
  backgroundColor: 'white',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#bdbdbd' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#8b6cbc' }
};

const formControlSx = {
  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
};

// Reusable dialog header with icon, dynamic title and close button
const DialogHeader = ({ icon: Icon, title, onClose }) => (
  <Box sx={{
    background: 'linear-gradient(135deg, #8b6cbc 0%, #a389cc 100%)',
    px: 3,
    py: 2.5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {Icon && <Icon sx={{ color: 'white', fontSize: 22, opacity: 0.92 }} />}
      <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', letterSpacing: '-0.2px' }}>
        {title}
      </Typography>
    </Box>
    <IconButton
      onClick={onClose}
      size="small"
      sx={{
        color: 'rgba(255,255,255,0.75)',
        p: 0.75,
        '&:hover': { color: 'white', backgroundColor: 'rgba(255,255,255,0.15)' }
      }}
    >
      <CloseIcon sx={{ fontSize: 18 }} />
    </IconButton>
  </Box>
);

const paperSx = {
  borderRadius: '12px',
  boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
  overflow: 'hidden'
};

const CampaignDialogs = ({
  // Dialog states
  categoryDialog,
  setCategoryDialog,
  campaignDialog,
  setCampaignDialog,
  activityDialog,
  setActivityDialog,
  
  // Selected items
  selectedCategory,
  selectedCampaign,
  selectedActivity,
  
  // Form data
  categoryForm,
  setCategoryForm,
  campaignForm,
  setCampaignForm,
  activityForm,
  setActivityForm,
  
  // Data
  categories = [],
  campaigns = [],
  
  // Constants
  activityTypes,
  
  // Loading states
  loading,
  
  // Colors
  DASHBOARD_COLORS,
  
  // Handlers
  handleCategorySubmit,
  handleCampaignSubmit,
  handleActivitySubmit
}) => {
  
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setColorPickerOpen(false);
      }
    };

    if (colorPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [colorPickerOpen]);
  
  const predefinedColors = [
    '#8b6cbc', '#4fc3f7', '#66bb6a', '#ff9800',
    '#ef5350', '#ab47bc', '#26a69a', '#ffa726'
  ];

  const statusOptions = [
    { value: 'Planning', label: 'Planning' },
    { value: 'Active', label: 'Active' },
    { value: 'Paused', label: 'Paused' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  return (
    <>
      {/* ── Category Dialog ─────────────────────────────────── */}
      <Dialog
        open={categoryDialog}
        onClose={() => setCategoryDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: paperSx }}
      >
        <DialogHeader
          icon={CategoryIcon}
          title={selectedCategory ? 'Edit Category' : 'New Category'}
          onClose={() => setCategoryDialog(false)}
        />
        
        <DialogContent sx={{ p: 3, pt: 2.5, backgroundColor: '#fafafa' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
            <TextField
              fullWidth
              label="Category Name"
              required
              value={categoryForm.name}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              variant="outlined"
              sx={fieldSx}
            />

            <TextField
              fullWidth
              label="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              variant="outlined"
              sx={fieldSx}
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
                Category Color
              </Typography>
              <Box
                ref={colorPickerRef}
                sx={{
                  height: 52,
                  borderRadius: 1.5,
                  backgroundColor: categoryForm.color,
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: `0 2px 10px ${categoryForm.color}55`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  position: 'relative',
                  overflow: 'visible',
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': { boxShadow: `0 4px 16px ${categoryForm.color}88` }
                }}
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
              >
                <Typography variant="body2" sx={{
                  color: 'white',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  textShadow: '0 1px 3px rgba(0,0,0,0.4)'
                }}>
                  {categoryForm.color}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {predefinedColors.slice(0, 4).map(c => (
                    <Box key={c} sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: c, border: '1.5px solid rgba(255,255,255,0.7)', opacity: 0.9 }} />
                  ))}
                </Box>
                
                {/* Color Picker Dropdown */}
                {colorPickerOpen && (
                  <Box sx={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 1300
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', mb: 1.5, display: 'block' }}>
                      Select Color
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                      {predefinedColors.map(color => (
                        <Box
                          key={color}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryForm(prev => ({ ...prev, color }));
                            setColorPickerOpen(false);
                          }}
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: color,
                            cursor: 'pointer',
                            border: categoryForm.color === color ? '3px solid #1e293b' : '2px solid white',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                            transition: 'transform 0.15s ease',
                            '&:hover': { transform: 'scale(1.15)' }
                          }}
                        />
                      ))}
                    </Box>
                    <TextField
                      size="small"
                      fullWidth
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      label="Custom hex color"
                      sx={fieldSx}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#fafafa', gap: 1 }}>
          <Button
            onClick={() => setCategoryDialog(false)}
            disabled={loading}
            variant="text"
            sx={{ color: '#8b6cbc', fontWeight: 500, textTransform: 'none', px: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCategorySubmit}
            disabled={loading || !categoryForm.name}
            startIcon={loading && <CircularProgress size={16} color="inherit" />}
            sx={{
              backgroundColor: '#8b6cbc',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              px: 3.5,
              borderRadius: 1.5,
              boxShadow: '0 2px 8px rgba(139,108,188,0.3)',
              '&:hover': { backgroundColor: '#7b5ca7', boxShadow: '0 4px 12px rgba(139,108,188,0.4)' },
              '&:disabled': { backgroundColor: '#c5b4e3', color: 'white', boxShadow: 'none' }
            }}
          >
            {selectedCategory ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Campaign Dialog ──────────────────────────────────── */}
      <Dialog
        open={campaignDialog}
        onClose={() => setCampaignDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: paperSx }}
      >
        <DialogHeader
          icon={CampaignIcon}
          title={selectedCampaign ? 'Edit Initiative' : 'New Initiative'}
          onClose={() => setCampaignDialog(false)}
        />
        
        <DialogContent sx={{ p: 3, pt: 2.5, backgroundColor: '#fafafa' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
            <TextField
              fullWidth
              label="Initiative Name"
              required
              value={campaignForm.name}
              onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
              variant="outlined"
              sx={fieldSx}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth sx={formControlSx}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={campaignForm.categoryId}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  label="Category"
                  sx={selectSx}
                >
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: category.color, flexShrink: 0 }} />
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={formControlSx}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={campaignForm.status}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                  sx={selectSx}
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: statusColorMap[option.value] || '#757575', flexShrink: 0 }} />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="Description"
              value={campaignForm.description}
              onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              variant="outlined"
              sx={fieldSx}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={campaignForm.startDate}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={campaignForm.endDate}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                sx={fieldSx}
              />
            </Box>

            <TextField
              fullWidth
              label="Target Amount"
              value={campaignForm.targetAmount}
              onChange={(e) => setCampaignForm(prev => ({ ...prev, targetAmount: e.target.value }))}
              type="number"
              variant="outlined"
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              sx={fieldSx}
            />
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#fafafa', gap: 1 }}>
          <Button
            onClick={() => setCampaignDialog(false)}
            disabled={loading}
            variant="text"
            sx={{ color: '#8b6cbc', fontWeight: 500, textTransform: 'none', px: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCampaignSubmit}
            disabled={loading || !campaignForm.name || !campaignForm.categoryId}
            startIcon={loading && <CircularProgress size={16} color="inherit" />}
            sx={{
              backgroundColor: '#8b6cbc',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              px: 3.5,
              borderRadius: 1.5,
              boxShadow: '0 2px 8px rgba(139,108,188,0.3)',
              '&:hover': { backgroundColor: '#7b5ca7', boxShadow: '0 4px 12px rgba(139,108,188,0.4)' },
              '&:disabled': { backgroundColor: '#c5b4e3', color: 'white', boxShadow: 'none' }
            }}
          >
            {selectedCampaign ? 'Save Changes' : 'Create Initiative'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Activity Dialog ───────────────────────────────────── */}
      <Dialog
        open={activityDialog}
        onClose={() => setActivityDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: paperSx }}
      >
        <DialogHeader
          icon={ActivityIcon}
          title={selectedActivity ? 'Edit Activity' : 'New Activity'}
          onClose={() => setActivityDialog(false)}
        />

        <DialogContent sx={{ p: 3, pt: 2.5, backgroundColor: '#fafafa' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth sx={formControlSx}>
                <InputLabel>Activity Type</InputLabel>
                <Select
                  value={activityForm.type}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, type: e.target.value }))}
                  label="Activity Type"
                  sx={selectSx}
                >
                  {activityTypes.map(type => {
                    const IconComponent = iconMapping[type.icon];
                    return (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {IconComponent && <IconComponent sx={{ fontSize: 18, color: type.color }} />}
                          {type.label}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={formControlSx}>
                <InputLabel>Phase</InputLabel>
                <Select
                  value={activityForm.phase}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, phase: e.target.value }))}
                  label="Phase"
                  sx={selectSx}
                >
                  <MenuItem value="Pre-Campaign">Pre-Campaign</MenuItem>
                  <MenuItem value="Post-Campaign">Post-Campaign</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="Activity Title"
              required
              value={activityForm.title}
              onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
              variant="outlined"
              sx={fieldSx}
            />

            <TextField
              fullWidth
              label="Description"
              value={activityForm.description}
              onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              variant="outlined"
              sx={fieldSx}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                required
                value={activityForm.date}
                onChange={(e) => setActivityForm(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="Time"
                type="time"
                value={activityForm.time}
                onChange={(e) => setActivityForm(prev => ({ ...prev, time: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                sx={fieldSx}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Location"
                value={activityForm.location}
                onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                variant="outlined"
                sx={fieldSx}
              />
              <FormControl fullWidth sx={formControlSx}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={activityForm.status}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                  sx={selectSx}
                >
                  {['Planned', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="Attendees / Participants"
              value={activityForm.attendees}
              onChange={(e) => setActivityForm(prev => ({ ...prev, attendees: e.target.value }))}
              variant="outlined"
              sx={fieldSx}
            />

            <TextField
              fullWidth
              label="Notes"
              value={activityForm.notes}
              onChange={(e) => setActivityForm(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
              variant="outlined"
              sx={fieldSx}
            />
          </Box>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#fafafa', gap: 1 }}>
          <Button
            onClick={() => setActivityDialog(false)}
            disabled={loading}
            variant="text"
            sx={{ color: '#8b6cbc', fontWeight: 500, textTransform: 'none', px: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleActivitySubmit}
            disabled={loading || !activityForm.title || !activityForm.type || !activityForm.date}
            startIcon={loading && <CircularProgress size={16} color="inherit" />}
            sx={{
              backgroundColor: '#8b6cbc',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              px: 3.5,
              borderRadius: 1.5,
              boxShadow: '0 2px 8px rgba(139,108,188,0.3)',
              '&:hover': { backgroundColor: '#7b5ca7', boxShadow: '0 4px 12px rgba(139,108,188,0.4)' },
              '&:disabled': { backgroundColor: '#c5b4e3', color: 'white', boxShadow: 'none' }
            }}
          >
            {selectedActivity ? 'Save Changes' : 'Create Activity'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CampaignDialogs;
