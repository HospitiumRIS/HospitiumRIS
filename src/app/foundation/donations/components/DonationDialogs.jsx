'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  InputAdornment,
  Chip,
  Stack,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  CardGiftcard as DonationIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccountBalance as BankIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const DonationDialogs = ({
  donationDialog,
  setDonationDialog,
  donorDialog,
  setDonorDialog,
  reportDialog,
  setReportDialog,
  selectedDonation,
  selectedDonor,
  selectedReportItem,
  reportType,
  setReportType,
  donationForm,
  setDonationForm,
  loading,
  DASHBOARD_COLORS,
  campaigns,
  DONOR_TYPES,
  DONATION_TYPES,
  PAYMENT_METHODS,
  DONATION_STATUS,
  formatCurrency,
  getDonorTypeIcon,
  handleSaveDonation,
  generateReportData
}) => {
  return (
    <>
      {/* Donation Form Dialog */}
      <Dialog
        open={donationDialog}
        onClose={() => setDonationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a389cc 100%)',
          color: 'white',
          m: 0,
          p: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DonationIcon sx={{ fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {selectedDonation ? 'Edit Donation' : 'Record New Donation'}
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setDonationDialog(false)}
              sx={{ 
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Row 1: Donor Name and Amount */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Donor Name *"
                    placeholder="Donor Name *"
                    value={donationForm.donorName || ''}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, donorName: e.target.value }))}
                    required
                    disabled={donationForm.isAnonymous}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        '&:hover': {
                          borderColor: '#8b6cbc'
                        },
                        '&.Mui-focused': {
                          borderColor: '#8b6cbc',
                          backgroundColor: 'white'
                        }
                      },
                      '& .MuiInputLabel-root': { 
                        color: '#6c757d',
                        '&.Mui-focused': {
                          color: '#8b6cbc'
                        }
                      }
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Amount"
                    placeholder="Amount"
                    type="number"
                    value={donationForm.amount || ''}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        '&:hover': {
                          borderColor: '#8b6cbc'
                        },
                        '&.Mui-focused': {
                          borderColor: '#8b6cbc',
                          backgroundColor: 'white'
                        }
                      },
                      '& .MuiInputLabel-root': { 
                        color: '#6c757d',
                        '&.Mui-focused': {
                          color: '#8b6cbc'
                        }
                      }
                    }}
                  />
                </Box>

                {/* Row 2: Email and Donor Type */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    placeholder="Email"
                    value={donationForm.donorEmail || ''}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, donorEmail: e.target.value }))}
                    disabled={donationForm.isAnonymous}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        '&:hover': {
                          borderColor: '#8b6cbc'
                        },
                        '&.Mui-focused': {
                          borderColor: '#8b6cbc',
                          backgroundColor: 'white'
                        }
                      },
                      '& .MuiInputLabel-root': { 
                        color: '#6c757d',
                        '&.Mui-focused': {
                          color: '#8b6cbc'
                        }
                      }
                    }}
                  />
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: '#6c757d',
                      '&.Mui-focused': {
                        color: '#8b6cbc'
                      }
                    }}>
                      Donor Type *
                    </InputLabel>
                    <Select
                      value={donationForm.donorType || 'INDIVIDUAL'}
                      label="Donor Type *"
                      onChange={(e) => setDonationForm(prev => ({ ...prev, donorType: e.target.value }))}
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    >
                      <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                      <MenuItem value="ORGANIZATION">Organization</MenuItem>
                      <MenuItem value="FOUNDATION">Foundation</MenuItem>
                      <MenuItem value="GOVERNMENT">Government</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Row 3: Donation Type and Payment Method */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: '#6c757d',
                      '&.Mui-focused': {
                        color: '#8b6cbc'
                      }
                    }}>
                      Donation Type
                    </InputLabel>
                    <Select
                      value={donationForm.donationType || 'ONE_TIME'}
                      label="Donation Type"
                      onChange={(e) => setDonationForm(prev => ({ ...prev, donationType: e.target.value }))}
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    >
                      <MenuItem value="ONE_TIME">One Time</MenuItem>
                      <MenuItem value="RECURRING">Recurring</MenuItem>
                      <MenuItem value="PLEDGE">Pledge</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: '#6c757d',
                      '&.Mui-focused': {
                        color: '#8b6cbc'
                      }
                    }}>
                      Payment Method
                    </InputLabel>
                    <Select
                      value={donationForm.paymentMethod || 'CREDIT_CARD'}
                      label="Payment Method"
                      onChange={(e) => setDonationForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    >
                      <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                      <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                      <MenuItem value="CHECK">Check</MenuItem>
                      <MenuItem value="CASH">Cash</MenuItem>
                      <MenuItem value="PAYPAL">PayPal</MenuItem>
                      <MenuItem value="MOBILE_MONEY">Mobile Money</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Row 4: Transaction Code and Initiative */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Transaction Code"
                    placeholder="Transaction Code"
                    value={donationForm.transactionId || ''}
                    onChange={(e) => setDonationForm(prev => ({ ...prev, transactionId: e.target.value }))}
                    helperText="Required for electronic payments and checks"
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        '&:hover': {
                          borderColor: '#8b6cbc'
                        },
                        '&.Mui-focused': {
                          borderColor: '#8b6cbc',
                          backgroundColor: 'white'
                        }
                      },
                      '& .MuiInputLabel-root': { 
                        color: '#6c757d',
                        '&.Mui-focused': {
                          color: '#8b6cbc'
                        }
                      },
                      '& .MuiFormHelperText-root': {
                        fontSize: '0.75rem',
                        color: '#6c757d'
                      }
                    }}
                  />
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: '#6c757d',
                      '&.Mui-focused': {
                        color: '#8b6cbc'
                      }
                    }}>
                      Initiative
                    </InputLabel>
                    <Select
                      value={donationForm.campaignId || ''}
                      label="Initiative"
                      onChange={(e) => setDonationForm(prev => ({ ...prev, campaignId: e.target.value }))}
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>Initiative</em>
                      </MenuItem>
                      {campaigns.filter(c => c && c.id).map((campaign) => (
                        <MenuItem key={campaign.id} value={campaign.id}>
                          {campaign.name || 'Unnamed Campaign'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Row 5: Status and Donation Date */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: '#6c757d',
                      '&.Mui-focused': {
                        color: '#8b6cbc'
                      }
                    }}>
                      Status
                    </InputLabel>
                    <Select
                      value={donationForm.status || 'PENDING'}
                      label="Status"
                      onChange={(e) => setDonationForm(prev => ({ ...prev, status: e.target.value }))}
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b6cbc'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    >
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                      <MenuItem value="FAILED">Failed</MenuItem>
                      <MenuItem value="REFUNDED">Refunded</MenuItem>
                    </Select>
                  </FormControl>
                  <DatePicker
                    label="Donation Date"
                    value={donationForm.donationDate ? dayjs(donationForm.donationDate) : dayjs()}
                    onChange={(newValue) => setDonationForm(prev => ({ 
                      ...prev, 
                      donationDate: newValue ? newValue.format('YYYY-MM-DD') : new Date().toISOString().split('T')[0]
                    }))}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true,
                        sx: { 
                          '& .MuiOutlinedInput-root': { 
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef',
                            '&:hover': {
                              borderColor: '#8b6cbc'
                            },
                            '&.Mui-focused': {
                              borderColor: '#8b6cbc',
                              backgroundColor: 'white'
                            }
                          },
                          '& .MuiInputLabel-root': { 
                            color: '#6c757d',
                            '&.Mui-focused': {
                              color: '#8b6cbc'
                            }
                          }
                        }
                      } 
                    }}
                  />
                </Box>

                {/* Row 6: Notes */}
                <TextField
                  fullWidth
                  label="Notes"
                  placeholder="Notes"
                  multiline
                  rows={3}
                  value={donationForm.notes || ''}
                  onChange={(e) => setDonationForm(prev => ({ ...prev, notes: e.target.value }))}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      '&:hover': {
                        borderColor: '#8b6cbc'
                      },
                      '&.Mui-focused': {
                        borderColor: '#8b6cbc',
                        backgroundColor: 'white'
                      }
                    },
                    '& .MuiInputLabel-root': { 
                      color: '#6c757d',
                      '&.Mui-focused': {
                        color: '#8b6cbc'
                      }
                    }
                  }}
                />

                {/* Anonymous Donation Switch */}
                <Box sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={donationForm.isAnonymous || false}
                        onChange={(e) => setDonationForm(prev => ({ 
                          ...prev, 
                          isAnonymous: e.target.checked,
                          donorName: e.target.checked ? 'Anonymous Donor' : '',
                          donorEmail: e.target.checked ? '' : prev.donorEmail
                        }))}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#8b6cbc',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#8b6cbc',
                          },
                        }}
                      />
                    }
                    label="Anonymous Donation"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        color: '#495057',
                        fontWeight: 500
                      }
                    }}
                  />
                </Box>
              </Box>
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          gap: 2,
          justifyContent: 'flex-end',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Button 
            onClick={() => setDonationDialog(false)}
            variant="outlined"
            size="large"
            sx={{ 
              borderColor: '#d1d5db',
              color: '#6b7280',
              borderRadius: '8px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveDonation}
            disabled={loading}
            size="large"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <DonationIcon />}
            sx={{
              background: 'linear-gradient(135deg, #8b6cbc 0%, #a389cc 100%)',
              borderRadius: '8px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c5fad 0%, #9478bd 100%)',
                boxShadow: '0 6px 20px rgba(139, 108, 188, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: '#e5e7eb',
                color: '#9ca3af'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {selectedDonation ? 'Update' : 'Record Donation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Donor Details Dialog */}
      <Dialog
        open={donorDialog}
        onClose={() => setDonorDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Donor Details
        </DialogTitle>
        <DialogContent>
          {selectedDonation && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedDonation.isAnonymous ? 'Anonymous Donor' : selectedDonation.donorName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Amount: {formatCurrency(selectedDonation.amount, selectedDonation.currency)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date: {new Date(selectedDonation.donationDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDonorDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            Generate Report
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Report generation functionality will be implemented here
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>
            Close
          </Button>
          <Button variant="contained">
            Generate PDF
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DonationDialogs;
