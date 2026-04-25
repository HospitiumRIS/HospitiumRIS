'use client';

import React from 'react';
import { Box, Paper, Typography, Button, Alert, AlertTitle } from '@mui/material';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // If a custom reset handler is provided, call it
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            m: 2,
            border: '1px solid #ffebee',
            borderRadius: 2,
            bgcolor: '#fff5f5'
          }}
        >
          <Alert 
            severity="error" 
            icon={<ErrorIcon />}
            sx={{ mb: 2 }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>
              {this.props.title || 'Something went wrong'}
            </AlertTitle>
            {this.props.message || 'This component encountered an error and has been temporarily disabled.'}
          </Alert>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, fontSize: '0.875rem' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#d32f2f' }}>
                Error Details (Development Only):
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1, color: '#666' }}>
                {this.state.error.toString()}
              </Typography>
              {this.state.errorInfo && (
                <Typography 
                  variant="body2" 
                  component="pre" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    color: '#666',
                    overflow: 'auto',
                    maxHeight: 200
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
              sx={{
                bgcolor: '#8b6cbc',
                '&:hover': {
                  bgcolor: '#7a5cac'
                }
              }}
            >
              Try Again
            </Button>
            
            {this.props.showReload && (
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  '&:hover': {
                    borderColor: '#7a5cac',
                    bgcolor: '#8b6cbc10'
                  }
                }}
              >
                Reload Page
              </Button>
            )}
          </Box>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
