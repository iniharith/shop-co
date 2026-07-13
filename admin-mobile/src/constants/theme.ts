// Dynamic Theme Constants
export const THEMES = {
  dark: {
    // Backgrounds
    background:      '#000000',
    gradientStart:   '#0a0a14',
    gradientEnd:     '#100a1e',
  
    // Glass cards  (rgba over gradient = frosted glass effect)
    glass:           'rgba(255,255,255,0.06)',
    glassBorder:     'rgba(255,255,255,0.10)',
    glassHover:      'rgba(255,255,255,0.10)',
    glassShadow:     'rgba(0,0,0,0.40)',
  
    // Navbar frosted
    navBg:           'rgba(10,10,10,0.88)',
    navBorder:       'rgba(255,255,255,0.08)',
  
    // Text
    foreground:      '#fafafa',
    mutedForeground: '#a1a1a1',
  
    // Brand / accent
    primary:         '#f0a500',   // hsl(45,93%,47%) — gold
    primaryDark:     '#171717',
  
    // Semantic
    card:            'rgba(255,255,255,0.06)',
    border:          'rgba(255,255,255,0.10)',
    secondary:       'rgba(255,255,255,0.08)',
    destructive:     '#ef4444',
    success:         '#22c55e',
    warning:         '#eab308',
    info:            '#3b82f6',
  },
  light: {
    // Backgrounds
    background:      '#ffffff',
    gradientStart:   '#f8f9fa',
    gradientEnd:     '#e9ecef',
  
    // Glass cards
    glass:           'rgba(255,255,255,0.60)',
    glassBorder:     'rgba(0,0,0,0.08)',
    glassHover:      'rgba(255,255,255,0.80)',
    glassShadow:     'rgba(0,0,0,0.05)',
  
    // Navbar frosted
    navBg:           'rgba(255,255,255,0.88)',
    navBorder:       'rgba(0,0,0,0.08)',
  
    // Text
    foreground:      '#0a0a0a',
    mutedForeground: '#6b7280',
  
    // Brand / accent
    primary:         '#f0a500',   // same gold
    primaryDark:     '#e59a00',
  
    // Semantic
    card:            'rgba(255,255,255,0.80)',
    border:          'rgba(0,0,0,0.08)',
    secondary:       'rgba(0,0,0,0.05)',
    destructive:     '#ef4444',
    success:         '#22c55e',
    warning:         '#eab308',
    info:            '#3b82f6',
  }
} as const;

// Keep THEME as fallback for files not yet refactored to context
export const THEME = THEMES.dark;
