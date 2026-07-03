// Exact dark theme + glassmorphism constants
export const THEME = {
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
} as const;
