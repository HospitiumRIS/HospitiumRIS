export const PURPLE = '#8b6cbc';
export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg'];

export function statusConfigFor(t, status) {
  const configs = {
    UPLOADING: {
      label: t('researcher.integrity_status_uploading', 'Uploading'),
      color: '#2196f3',
      bgColor: '#e3f2fd',
    },
    PROCESSING: {
      label: t('researcher.integrity_analyzing', 'Analyzing'),
      color: '#ff9800',
      bgColor: '#fff3e0',
    },
    COMPLETED: {
      label: t('researcher.integrity_status_completed', 'Completed'),
      color: '#4caf50',
      bgColor: '#e8f5e9',
    },
    FAILED: {
      label: t('researcher.integrity_status_failed', 'Failed'),
      color: '#f44336',
      bgColor: '#ffebee',
    },
  };
  return configs[status] || configs.UPLOADING;
}

export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function verdictFor(record, t) {
  const manip = record.manipulationCount ?? 0;
  const sim = record.similarityCount ?? 0;
  const high = record.similarityLevel?.high ?? 0;
  if (manip > 0 || high > 0) {
    return {
      label: t('researcher.integrity_verdict_review', 'Needs review'),
      text: t(
        'researcher.integrity_review_needed',
        'Open the full report and inspect each flagged region before you submit this work.'
      ),
      color: '#b45309',
      bg: '#fff7ed',
      border: '#fdba74',
    };
  }
  if (sim > 0) {
    return {
      label: t('researcher.integrity_verdict_matches', 'Possible matches'),
      text: t(
        'researcher.integrity_possible_matches_help',
        'ImaChek found similar images at lower confidence. These are often false positives - check the visual report if you want to be sure.'
      ),
      color: PURPLE,
      bg: 'rgba(139, 108, 188, 0.08)',
      border: 'rgba(139, 108, 188, 0.28)',
    };
  }
  return {
    label: t('researcher.integrity_verdict_clear', 'No issues found'),
    text: t('researcher.integrity_no_issues', 'No high-confidence issues were detected.'),
    color: '#15803d',
    bg: '#f0fdf4',
    border: '#86efac',
  };
}

export function reportIsValid(record) {
  return Boolean(record?.reportUrl && record?.reportExpiresAt && new Date(record.reportExpiresAt) > new Date());
}

export function authorList(record) {
  return Array.isArray(record?.authors) ? record.authors.filter(Boolean) : [];
}

export function tagList(record) {
  if (Array.isArray(record?.tags)) return record.tags.map((tag) => String(tag).trim()).filter(Boolean);
  return [];
}
