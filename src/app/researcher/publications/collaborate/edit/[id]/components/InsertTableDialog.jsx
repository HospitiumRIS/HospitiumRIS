'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Stack,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  TableChart as TableIcon,
  Tune as TuneIcon
} from '@mui/icons-material';

export default function InsertTableDialog({ open, onClose, onInsert }) {
  const [selectedRows, setSelectedRows] = useState(3);
  const [selectedCols, setSelectedCols] = useState(3);
  const [headerRow, setHeaderRow] = useState(true);
  const [customSize, setCustomSize] = useState(false);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [hoveredRows, setHoveredRows] = useState(0);
  const [hoveredCols, setHoveredCols] = useState(0);

  const maxGridRows = 8;
  const maxGridCols = 8;

  const handleGridHover = (row, col) => {
    if (!customSize) {
      setHoveredRows(row);
      setHoveredCols(col);
      setSelectedRows(row);
      setSelectedCols(col);
    }
  };

  const handleGridClick = (row, col) => {
    if (!customSize) {
      setSelectedRows(row);
      setSelectedCols(col);
    }
  };

  const handleInsertTable = () => {
    const rows = customSize ? customRows : selectedRows;
    const cols = customSize ? customCols : selectedCols;
    
    onInsert({
      rows: parseInt(rows),
      cols: parseInt(cols),
      withHeaderRow: headerRow
    });
    onClose();
  };

  const handleCancel = () => {
    // Reset to defaults
    setSelectedRows(3);
    setSelectedCols(3);
    setHeaderRow(true);
    setCustomSize(false);
    setCustomRows(3);
    setCustomCols(3);
    onClose();
  };

  const displayRows = customSize ? customRows : selectedRows;
  const displayCols = customSize ? customCols : selectedCols;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: 500
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: '#8b6cbc',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TableIcon />
          <Typography variant="h6" component="span">
            Insert Table
          </Typography>
        </Box>
        <IconButton
          onClick={handleCancel}
          sx={{ color: 'white' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {/* Grid Selector */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              display: 'inline-block',
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              bgcolor: '#fafafa'
            }}
          >
            <Grid container spacing={0.5} sx={{ width: 'fit-content' }}>
              {Array.from({ length: maxGridRows }, (_, rowIndex) => (
                <Grid item xs={12} key={rowIndex}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {Array.from({ length: maxGridCols }, (_, colIndex) => {
                      const row = rowIndex + 1;
                      const col = colIndex + 1;
                      const isSelected = !customSize && row <= selectedRows && col <= selectedCols;
                      const isHovered = !customSize && row <= hoveredRows && col <= hoveredCols;
                      
                      return (
                        <Box
                          key={colIndex}
                          sx={{
                            width: 20,
                            height: 20,
                            border: '1px solid #ccc',
                            cursor: customSize ? 'not-allowed' : 'pointer',
                            bgcolor: isSelected || isHovered ? '#8b6cbc' : 'white',
                            opacity: customSize ? 0.5 : 1,
                            '&:hover': {
                              bgcolor: !customSize ? '#8b6cbc' : undefined
                            }
                          }}
                          onMouseEnter={() => handleGridHover(row, col)}
                          onClick={() => handleGridClick(row, col)}
                        />
                      );
                    })}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Size Display */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#8b6cbc', fontWeight: 600 }}>
            {displayRows} × {displayCols} Table
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Hover to preview • Click to insert
          </Typography>
        </Box>

        {/* Insert Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleInsertTable}
            sx={{
              bgcolor: '#8b6cbc',
              color: 'white',
              px: 4,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#7a5ba8'
              }
            }}
          >
            Insert Table
          </Button>
        </Box>

        {/* Options */}
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={customSize}
                onChange={(e) => setCustomSize(e.target.checked)}
                sx={{
                  color: '#8b6cbc',
                  '&.Mui-checked': {
                    color: '#8b6cbc'
                  }
                }}
              />
            }
            label="Custom size"
          />

          {customSize && (
            <Box sx={{ ml: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Rows"
                type="number"
                size="small"
                value={customRows}
                onChange={(e) => setCustomRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                inputProps={{ min: 1, max: 20 }}
                sx={{ width: 80 }}
              />
              <Typography variant="body2">×</Typography>
              <TextField
                label="Columns"
                type="number"
                size="small"
                value={customCols}
                onChange={(e) => setCustomCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                inputProps={{ min: 1, max: 20 }}
                sx={{ width: 80 }}
              />
            </Box>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={headerRow}
                onChange={(e) => setHeaderRow(e.target.checked)}
                sx={{
                  color: '#8b6cbc',
                  '&.Mui-checked': {
                    color: '#8b6cbc'
                  }
                }}
              />
            }
            label="Header row"
          />
        </Stack>

        {/* Style & Options Accordion */}
        <Box sx={{ mt: 3 }}>
          <Accordion
            sx={{
              boxShadow: 'none',
              border: '1px solid #e0e0e0',
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: '#f8f9fa',
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center'
                }
              }}
            >
              <TuneIcon sx={{ mr: 1, color: '#8b6cbc' }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Style & Options
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                💡 Drag header to move
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Additional table styling options will be available after insertion.
                You can modify borders, colors, and cell formatting using the table tools.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleCancel}
          sx={{ color: '#666' }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
