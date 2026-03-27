export const THEME_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  
  lead: '#fbbf24',
  directCollab: '#8b5cf6',
  pending: '#94a3b8',
  
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textDisabled: '#94a3b8',
  
  border: '#e2e8f0',
  borderHover: '#cbd5e1',
  
  linkDefault: '#94a3b8',
  linkHighlight: '#6366f1',
  linkHover: '#8b5cf6'
};

export const NODE_SIZES = {
  lead: 25,
  direct: 15,
  pending: 12,
  min: 10,
  max: 30
};

export const FORCE_CONFIG = {
  charge: {
    strength: -800,
    distanceMin: 30,
    distanceMax: 800
  },
  collision: {
    padding: 40,
    strength: 1,
    iterations: 5
  },
  link: {
    distance: 150,
    strength: 0.2
  },
  center: {
    strength: 0.05
  }
};

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500
};
