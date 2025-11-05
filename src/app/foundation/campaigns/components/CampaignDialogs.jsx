'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
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
  Grid,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import {
  Category as CategoryIcon,
  Campaign as CampaignIcon,
  Event as ActivityIcon,
  ColorLens as ColorIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
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
    { value: 'Planning', label: 'Planning', color: 'default' },
    { value: 'Active', label: 'Active', color: 'success' },
    { value: 'Paused', label: 'Paused', color: 'warning' },
    { value: 'Completed', label: 'Completed', color: 'info' },
    { value: 'Cancelled', label: 'Cancelled', color: 'error' }
  ];

  return (
    <>
      {/* Category Dialog */}
      <Dialog
        open={categoryDialog}
        onClose={() => setCategoryDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a389cc 100%)',
          p: 3,
          color: 'white',
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Create New Category
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 4, backgroundColor: '#fafafa' }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Category Name *"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                Icon
              </Typography>
              <FormControl fullWidth>
                <Select
                  value="General"
                  displayEmpty
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="General">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 20, 
                        height: 20, 
                        borderRadius: 1,
                        backgroundColor: '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
                          G
                        </Typography>
                      </Box>
                      General
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                Color
              </Typography>
              <Box 
                ref={colorPickerRef}
                sx={{
                  height: 56,
                  borderRadius: 1,
                  backgroundColor: categoryForm.color,
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'visible'
                }}
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
              >
                <Typography variant="body2" sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {categoryForm.color}
                </Typography>
                
                {/* Color Picker Dropdown */}
                {colorPickerOpen && (
                  <Box sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000
                  }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {predefinedColors.map(color => (
                        <Box
                          key={color}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryForm(prev => ({ ...prev, color }));
                            setColorPickerOpen(false);
                          }}
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: color,
                            cursor: 'pointer',
                            border: categoryForm.color === color ? '3px solid #333' : '2px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.1)'
                            }
                          }}
                        />
                      ))}
                    </Box>
                    <TextField
                      size="small"
                      fullWidth
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#8b6cbc"
                      label="Custom Color"
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3,
          backgroundColor: '#fafafa',
          justifyContent: 'flex-end',
          gap: 2
        }}>
          <Button 
            onClick={() => setCategoryDialog(false)}
            disabled={loading}
            variant="text"
            sx={{ 
              color: '#8b6cbc',
              fontWeight: 500,
              textTransform: 'none',
              px: 3
            }}
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
              fontWeight: 500,
              textTransform: 'none',
              px: 4,
              borderRadius: 1,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#7b5ca7',
                boxShadow: 'none'
              },
              '&:disabled': {
                backgroundColor: '#bdbdbd',
                color: 'white'
              }
            }}
          >
            Create Category
          </Button>
        </DialogActions>
      </Dialog>

      {/* Campaign Dialog */}
      <Dialog
        open={campaignDialog}
        onClose={() => setCampaignDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a389cc 100%)',
          p: 3,
          color: 'white',
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Create New Initiative
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 4, backgroundColor: '#fafafa' }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Initiative Name *"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <Select
                  value={campaignForm.categoryId}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  displayEmpty
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="">
                    Select Category
                  </MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 1,
                          backgroundColor: category.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
                            {category.name ? category.name.charAt(0).toUpperCase() : 'C'}
                          </Typography>
                        </Box>
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <Select
                  value={campaignForm.status}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, status: e.target.value }))}
                  displayEmpty
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="">
                    Status
                  </MenuItem>
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: option.color
                        }} />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Description"
              value={campaignForm.description}
              onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                Start Date
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={campaignForm.startDate}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  }
                }}
              />
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                End Date
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={campaignForm.endDate}
                onChange={(e) => setCampaignForm(prev => ({ ...prev, endDate: e.target.value }))}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  }
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
              Target Amount
            </Typography>
            <TextField
              fullWidth
              placeholder="$"
              value={campaignForm.targetAmount}
              onChange={(e) => setCampaignForm(prev => ({ ...prev, targetAmount: e.target.value }))}
              variant="outlined"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3,
          backgroundColor: '#fafafa',
          justifyContent: 'flex-end',
          gap: 2
        }}>
          <Button 
            onClick={() => setCampaignDialog(false)}
            disabled={loading}
            variant="text"
            sx={{ 
              color: '#8b6cbc',
              fontWeight: 500,
              textTransform: 'none',
              px: 3
            }}
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
              fontWeight: 500,
              textTransform: 'none',
              px: 4,
              borderRadius: 1,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#7b5ca7',
                boxShadow: 'none'
              },
              '&:disabled': {
                backgroundColor: '#bdbdbd',
                color: 'white'
              }
            }}
          >
            Create Initiative
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog
        open={activityDialog}
        onClose={() => setActivityDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 0,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a389cc 100%)',
          p: 3,
          color: 'white',
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Create New Activity
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 4, backgroundColor: '#fafafa' }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <Select
                  value={activityForm.type}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, type: e.target.value }))}
                  displayEmpty
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="">
                    Activity Type
                  </MenuItem>
                  {activityTypes.map(type => {
                    const IconComponent = iconMapping[type.icon];
                    return (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {IconComponent && <IconComponent sx={{ fontSize: 20, color: type.color }} />}
                          {type.label}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <Select
                  value={activityForm.phase}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, phase: e.target.value }))}
                  displayEmpty
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="">
                    Campaign Phase
                  </MenuItem>
                  <MenuItem value="Pre-Campaign">Pre-Campaign</MenuItem>
                  <MenuItem value="Post-Campaign">Post-Campaign</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Activity Title *"
              value={activityForm.title}
              onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Description"
              value={activityForm.description}
              onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                Date
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={activityForm.date}
                onChange={(e) => setActivityForm(prev => ({ ...prev, date: e.target.value }))}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  }
                }}
              />
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                Time
              </Typography>
              <TextField
                fullWidth
                type="time"
                value={activityForm.time}
                onChange={(e) => setActivityForm(prev => ({ ...prev, time: e.target.value }))}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  }
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                placeholder="Location"
                value={activityForm.location}
                onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b6cbc',
                    },
                  }
                }}
              />
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <Select
                  value={activityForm.status}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, status: e.target.value }))}
                  displayEmpty
                  sx={{
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#bdbdbd',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b6cbc',
                    },
                  }}
                >
                  <MenuItem value="">
                    Status
                  </MenuItem>
                  <MenuItem value="Planned">Planned</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Attendees/Participants"
              value={activityForm.attendees}
              onChange={(e) => setActivityForm(prev => ({ ...prev, attendees: e.target.value }))}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Notes"
              value={activityForm.notes}
              onChange={(e) => setActivityForm(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#bdbdbd',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b6cbc',
                  },
                }
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3,
          backgroundColor: '#fafafa',
          justifyContent: 'flex-end',
          gap: 2
        }}>
          <Button 
            onClick={() => setActivityDialog(false)}
            disabled={loading}
            variant="text"
            sx={{ 
              color: '#8b6cbc',
              fontWeight: 500,
              textTransform: 'none',
              px: 3
            }}
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
              fontWeight: 500,
              textTransform: 'none',
              px: 4,
              borderRadius: 1,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#7b5ca7',
                boxShadow: 'none'
              },
              '&:disabled': {
                backgroundColor: '#bdbdbd',
                color: 'white'
              }
            }}
          >
            Create Activity
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CampaignDialogs;
