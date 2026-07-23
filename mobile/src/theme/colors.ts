/**
 * Kahve/kiremit temalı renk paleti.
 * tailwind.config.js içindeki theme.extend.colors ile senkron tutulmalı.
 */
export const colors = {
  primary: '#6B3E26',
  background: '#F8F3ED',
  cream: '#EFE6DA',
  cardBackground: '#FFFFFF',
  textPrimary: '#3A2418',
  textSecondary: '#8A7563',
  accent: '#C98A4B',
} as const;

export type ThemeColor = keyof typeof colors;
