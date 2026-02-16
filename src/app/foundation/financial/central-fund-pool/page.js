'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Stack,
  TextField,
  InputAdornment,
  LinearProgress,
  Tabs,
  Tab,
  alpha,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
  Assessment as FundOverviewIcon,
  SwapHoriz as FundManagementIcon,
  Receipt as TransactionsIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const CentralFundPool = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Fund data based on user requirements
  const fundData = {
    totalPool: 6000,
    available: 6000,
    monthlyInflow: 0,
    monthlyOutflow: 0,
    fundraisingFunds: {
      total: 6000,
      available: 6000,
      reserved: 0
    },
    grantFunds: {
      total: 0,
      available: 0,
      reserved: 0
    }
  };

  // Fund distribution data
  const fundSources = [
    {
      id: 1,
      name: 'Annual Golfing',
      type: 'Golfing',
      amount: 5000,
      available: 5000,
      reserved: 0,
      status: 'unrestricted',
      category: 'Fundraising'
    },
    {
      id: 2,
      name: 'Test Grant 1',
      type: 'Research Grants',
      amount: 3000,
      available: 3000,
      reserved: 0,
      status: 'restricted',
      category: 'Grants'
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      {/* Full-width Page Header */}
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Central Fund Pool"
          description="Consolidated fund management & allocation"
          icon={<AccountBalanceIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Foundation', path: '/foundation' },
            { label: 'Financial', path: '/foundation/financial' },
            { label: 'Central Fund Pool' }
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
        />
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Tabs */}
        <Paper sx={{ borderRadius: 3, mb: 4, overflow: 'hidden' }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            sx={{
              backgroundColor: alpha('#8b6cbc', 0.05),
              '& .MuiTab-root': {
                fontWeight: 600,
                '&.Mui-selected': {
                  color: '#8b6cbc'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#8b6cbc',
                height: 3
              }
            }}
          >
            <Tab label="Fund Overview" icon={<FundOverviewIcon />} />
            <Tab label="Fund Management" icon={<FundManagementIcon />} />
            <Tab label="Transactions" icon={<TransactionsIcon />} />
          </Tabs>
        </Paper>

        {/* Search and Export */}
        <Paper sx={{ borderRadius: 3, p: 3, mb: 4 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <TextField
              fullWidth
              placeholder="Search funds, transactions, or allocations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              sx={{
                backgroundColor: '#8b6cbc',
                borderRadius: 2,
                px: 3,
                '&:hover': {
                  backgroundColor: '#7a5ba8',
                },
              }}
            >
              Export Report
            </Button>
          </Stack>
        </Paper>

        {/* Overview Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
          flexWrap: 'wrap',
          mb: 4,
          '& > *': { 
            flex: '1 1 calc(25% - 19px)',
            minWidth: '200px'
          }
        }}>
          {/* Total Pool */}
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
                Total Pool
              </Typography>
              <AccountBalanceIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {formatCurrency(fundData.totalPool)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Consolidated funds
            </Typography>
          </Paper>

          {/* Available */}
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
                Available
              </Typography>
              <MoneyIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {formatCurrency(fundData.available)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Ready for allocation
            </Typography>
          </Paper>

          {/* Monthly Inflow */}
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
                Monthly Inflow
              </Typography>
              <TrendingUpIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {formatCurrency(fundData.monthlyInflow)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              New funds received
            </Typography>
          </Paper>

          {/* Monthly Outflow */}
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
                Monthly Outflow
              </Typography>
              <TrendingDownIcon sx={{ fontSize: 18, color: 'white', opacity: 0.9 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', fontSize: '1.75rem' }}>
              {formatCurrency(fundData.monthlyOutflow)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
              Funds disbursed
            </Typography>
          </Paper>
        </Box>

        {/* Fund Categories */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          mb: 4, 
          flexWrap: 'wrap',
          '& > *': {
            flex: {
              xs: '1 1 100%',
              md: '1 1 calc(50% - 12px)'
            }
          }
        }}>
          {/* Fundraising Funds */}
          <Box>
            <Card sx={{ borderRadius: 3, boxShadow: 2, p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <MoneyIcon sx={{ fontSize: 24, color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Fundraising Funds
                </Typography>
              </Stack>
              
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 1 }}>
                {formatCurrency(fundData.fundraisingFunds.total)}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Available
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(fundData.fundraisingFunds.available)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Reserved
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(fundData.fundraisingFunds.reserved)}
                  </Typography>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha('#8b6cbc', 0.1),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#8b6cbc',
                    borderRadius: 4
                  }
                }}
              />
            </Card>
          </Box>

          {/* Grant Funds */}
          <Box>
            <Card sx={{ borderRadius: 3, boxShadow: 2, p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <AccountBalanceIcon sx={{ fontSize: 24, color: '#8b6cbc' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Grant Funds
                </Typography>
              </Stack>
              
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#8b6cbc', mb: 1 }}>
                {formatCurrency(fundData.grantFunds.total)}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Available
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(fundData.grantFunds.available)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Reserved
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(fundData.grantFunds.reserved)}
                  </Typography>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha('#8b6cbc', 0.1),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#8b6cbc',
                    borderRadius: 4
                  }
                }}
              />
            </Card>
          </Box>
        </Box>

        {/* Fund Distribution by Source */}
        <Paper sx={{ borderRadius: 3, p: 4 }}>
          <Typography variant="h6" sx={{ mb: 4, fontSize: '1.25rem' }}>
            Fund Distribution by Source
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            flexWrap: 'wrap',
            '& > *': {
              flex: {
                xs: '1 1 100%',
                md: '1 1 calc(50% - 12px)'
              }
            }
          }}>
            {fundSources.map((source) => (
              <Box key={source.id}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: 1,
                  border: `2px solid ${alpha('#8b6cbc', 0.2)}`,
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {source.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {source.type}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip 
                            label={source.status} 
                            size="small"
                            color={source.status === 'unrestricted' ? 'success' : 'info'}
                          />
                          <Chip 
                            label={source.category} 
                            size="small"
                            sx={{
                              backgroundColor: alpha('#8b6cbc', 0.1),
                              color: '#8b6cbc'
                            }}
                          />
                        </Stack>
                      </Box>
                    </Stack>

                    <Typography variant="h5" sx={{ 
                      fontWeight: 600, 
                      color: '#8b6cbc',
                      mb: 2 
                    }}>
                      {formatCurrency(source.amount)}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Available
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(source.available)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Reserved
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(source.reserved)}
                        </Typography>
                      </Box>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha('#8b6cbc', 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#8b6cbc',
                          borderRadius: 4
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default CentralFundPool;