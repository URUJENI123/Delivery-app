import { TextStyle } from 'react-native'

// ─── Color Tokens ────────────────────────────────────────────────────────────
export const colors = {
  // Brand
  primary: '#E53935',
  onPrimary: '#FFFFFF',
  primaryContainer: 'rgba(229,57,53,0.15)',
  onPrimaryContainer: '#FFBAB7',

  // Secondary
  secondary: '#B71C1C',
  secondaryContainer: 'rgba(183,28,28,0.2)',
  onSecondary: '#FFFFFF',

  // Surface
  background: '#120A09',
  onSurface: '#F0E0DF',
  onSurfaceVariant: '#9E8583',
  surface: '#1E1210',
  surfaceContainer: '#1E1210',
  surfaceContainerHigh: '#2A1A18',
  surfaceContainerHighest: '#3A2220',

  // Outline
  outline: '#5C4240',
  outlineVariant: '#3D2A28',

  // Error
  error: '#CF6679',
  onError: '#FFFFFF',

  // Misc
  white: '#FFFFFF',
  darkCharcoal: '#241918',
} as const

export type ColorKey = keyof typeof colors

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

// ─── Typography ──────────────────────────────────────────────────────────────
export const typography = {
  headlineLg: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.5,
  } as TextStyle,

  headlineMd: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.25,
  } as TextStyle,

  headlineSm: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  } as TextStyle,

  bodyLg: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } as TextStyle,

  bodyMd: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,

  bodySm: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  } as TextStyle,

  labelLg: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  } as TextStyle,

  labelMd: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.1,
  } as TextStyle,

  labelSm: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.2,
  } as TextStyle,
} as const
