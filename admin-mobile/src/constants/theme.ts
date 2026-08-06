// Dynamic Theme Constants
export const THEMES = {
  dark: {
    // Backgrounds
    background:      '#0f172a',
    gradientStart:   '#0f172a',
    gradientEnd:     '#0f172a',
  
    // Glass cards
    glass:           'rgba(30,41,59,0.7)',
    glassBorder:     'rgba(255,255,255,0.08)',
    glassHover:      'rgba(30,41,59,0.9)',
    glassShadow:     'rgba(0,0,0,0.3)',
  
    // Navbar frosted
    navBg:           'rgba(15,23,42,0.9)',
    navBorder:       'rgba(255,255,255,0.08)',
  
    // Text
    foreground:      '#f8fafc',
    mutedForeground: '#94a3b8',
  
    // Brand / accent
    primary:         '#3b82f6',   // Matches website blue theme
    primaryDark:     '#1d4ed8',
  
    // Semantic
    card:            'rgba(30,41,59,0.7)',
    border:          'rgba(255,255,255,0.08)',
    secondary:       'rgba(255,255,255,0.05)',
    destructive:     '#ef4444',
    success:         '#10b981',
    warning:         '#f59e0b',
    info:            '#3b82f6',
  },
  light: {
    // Backgrounds
    background:      '#f8fafc',
    gradientStart:   '#f8fafc',
    gradientEnd:     '#f8fafc',
  
    // Glass cards
    glass:           'rgba(255,255,255,0.8)',
    glassBorder:     'rgba(0,0,0,0.06)',
    glassHover:      'rgba(255,255,255,0.95)',
    glassShadow:     'rgba(0,0,0,0.03)',
  
    // Navbar frosted
    navBg:           'rgba(255,255,255,0.9)',
    navBorder:       'rgba(0,0,0,0.06)',
  
    // Text
    foreground:      '#0f172a',
    mutedForeground: '#64748b',
  
    // Brand / accent
    primary:         '#3b82f6',
    primaryDark:     '#2563eb',
  
    // Semantic
    card:            'rgba(255,255,255,0.8)',
    border:          'rgba(0,0,0,0.06)',
    secondary:       'rgba(0,0,0,0.03)',
    destructive:     '#ef4444',
    success:         '#10b981',
    warning:         '#f59e0b',
    info:            '#3b82f6',
  },
} as const;

// Keep THEME as fallback for files not yet refactored to context
export const THEME = THEMES.dark;

// Missing type definitions for expo packages compatibility
export const Colors = {
  light: {
    text: '#0f172a',
    background: '#f8fafc',
    tint: '#3b82f6',
    icon: '#64748b',
    tabIconDefault: '#64748b',
    tabIconSelected: '#3b82f6',
  },
  dark: {
    text: '#f8fafc',
    background: '#0f172a',
    tint: '#3b82f6',
    icon: '#94a3b8',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#3b82f6',
  },
};

export const Fonts = {
  mono: 'SpaceMono',
};

export type ThemeColor = 'text' | 'background' | 'tint' | 'icon' | 'tabIconDefault' | 'tabIconSelected';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const MaxContentWidth = 1200;

