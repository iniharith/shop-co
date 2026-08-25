// Dynamic Theme Constants
export const THEMES = {
  dark: {
    // Backgrounds
    background:      '#000000',
    gradientStart:   '#000000',
    gradientEnd:     '#0a0a0a',
  
    // Glass cards
    glass:           'rgba(8,8,8,0.46)',
    glassBorder:     'rgba(255,255,255,0.12)',
    glassHover:      'rgba(24,24,24,0.62)',
    glassShadow:     'rgba(0,0,0,0.24)',
  
    // Navbar frosted
    navBg:           'rgba(8,8,8,0.40)',
    navBorder:       'rgba(255,255,255,0.12)',
  
    // Text
    foreground:      '#fafafa',
    mutedForeground: '#a1a1a1',
  
    // Brand / accent
    primary:         '#e7b008',
    primaryDark:     '#b88906',
  
    // Semantic
    card:            'rgba(8,8,8,0.46)',
    border:          'rgba(255,255,255,0.10)',
    secondary:       'rgba(24,24,24,0.50)',
    destructive:     '#ef4444',
    success:         '#10b981',
    warning:         '#f59e0b',
    info:            '#e7b008',
  },
  light: {
    // Backgrounds
    background:      '#f8fafc',
    gradientStart:   '#f8fafc',
    gradientEnd:     '#f8fafc',
  
    // Glass cards
    glass:           'rgba(255,255,255,0.46)',
    glassBorder:     'rgba(0,0,0,0.08)',
    glassHover:      'rgba(255,255,255,0.66)',
    glassShadow:     'rgba(0,0,0,0.03)',
  
    // Navbar frosted
    navBg:           'rgba(255,255,255,0.46)',
    navBorder:       'rgba(0,0,0,0.08)',
  
    // Text
    foreground:      '#0f172a',
    mutedForeground: '#64748b',
  
    // Brand / accent
    primary:         '#3b82f6',
    primaryDark:     '#2563eb',
  
    // Semantic
    card:            'rgba(255,255,255,0.46)',
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
    text: '#fafafa',
    background: '#000000',
    tint: '#e7b008',
    icon: '#a1a1a1',
    tabIconDefault: '#a1a1a1',
    tabIconSelected: '#e7b008',
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
