'use client';

import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon, Psychology as ExpertiseIcon } from '@mui/icons-material';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';
const MAX_KEYWORDS = 25;
const COLLAPSED_COUNT = 12;

/**
 * Research Expertise card with inline editing.
 * Saves through PUT /api/researcher/profile/expertise (keywords only).
 */
export default function ResearchExpertiseCard({ keywords = [], editable = true, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const startEdit = () => {
    setDraft(keywords);
    setInput('');
    setError('');
    setEditing(true);
  };

  // Accept comma/semicolon separated input so people can paste a list
  const addFromInput = () => {
    const parts = input
      .split(/[,;\n]/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (!parts.length) return;
    setDraft((prev) => {
      const seen = new Set(prev.map((k) => k.toLowerCase()));
      const next = [...prev];
      for (const p of parts) {
        if (p.length > 60) {
          setError(`"${p.slice(0, 20)}…" is too long (max 60 characters)`);
          continue;
        }
        if (!seen.has(p.toLowerCase()) && next.length < MAX_KEYWORDS) {
          seen.add(p.toLowerCase());
          next.push(p);
        }
      }
      return next;
    });
    setInput('');
  };

  const save = async () => {
    // include anything still typed in the box
    const pending = input.trim() ? [...draft, ...input.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean)] : draft;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/researcher/profile/expertise', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keywords: pending }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to save');
        return;
      }
      onSaved?.(data.keywords || []);
      setEditing(false);
    } catch (e) {
      console.error(e);
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const shown = expanded ? keywords : keywords.slice(0, COLLAPSED_COUNT);

  return (
    <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', bgcolor: 'white' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Research Expertise
          </Typography>
          {editable && !editing && (
            <Tooltip title={keywords.length ? 'Edit expertise' : 'Add expertise'}>
              <IconButton size="small" onClick={startEdit} sx={{ color: PURPLE }}>
                {keywords.length ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {!editing ? (
          keywords.length ? (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {shown.map((keyword) => (
                  <Chip
                    key={keyword}
                    label={keyword}
                    size="small"
                    sx={{ bgcolor: 'rgba(139,108,188,0.08)', color: PURPLE_DARK, fontSize: '0.75rem', fontWeight: 500 }}
                  />
                ))}
              </Box>
              {keywords.length > COLLAPSED_COUNT && (
                <Button
                  size="small"
                  onClick={() => setExpanded((v) => !v)}
                  sx={{ mt: 1, px: 0, color: PURPLE, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                >
                  {expanded ? 'Show less' : `Show all ${keywords.length}`}
                </Button>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 1.5 }}>
              <ExpertiseIcon sx={{ fontSize: 32, color: '#cbd5e0' }} />
              <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem', mb: editable ? 1 : 0 }}>
                No areas of expertise yet
              </Typography>
              {editable && (
                <Button size="small" startIcon={<AddIcon />} onClick={startEdit} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 600 }}>
                  Add expertise
                </Button>
              )}
            </Box>
          )
        ) : (
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 1.5, py: 0, borderRadius: 2, fontSize: '0.75rem' }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <TextField
              size="small"
              fullWidth
              autoFocus
              placeholder="e.g. Aquaculture economics"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addFromInput();
                }
              }}
              disabled={saving || draft.length >= MAX_KEYWORDS}
              helperText={`Press Enter or comma to add · ${draft.length}/${MAX_KEYWORDS}`}
              InputProps={{
                endAdornment: (
                  <IconButton size="small" onClick={addFromInput} disabled={!input.trim() || saving} edge="end">
                    <AddIcon fontSize="small" />
                  </IconButton>
                ),
              }}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5, minHeight: 28 }}>
              {draft.map((keyword, index) => (
                <Chip
                  key={keyword}
                  label={keyword}
                  size="small"
                  onDelete={saving ? undefined : () => setDraft((prev) => prev.filter((_, i) => i !== index))}
                  sx={{ bgcolor: 'rgba(139,108,188,0.1)', color: PURPLE_DARK, fontSize: '0.75rem' }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button size="small" onClick={() => setEditing(false)} disabled={saving} color="inherit" sx={{ textTransform: 'none' }}>
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={save}
                disabled={saving}
                sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK }, textTransform: 'none', fontWeight: 600 }}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
