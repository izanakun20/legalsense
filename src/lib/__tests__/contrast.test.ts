import { describe, test, expect } from 'vitest';

// Function to calculate relative luminance
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;

  const [rr, gg, bb] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
}

// Function to calculate contrast ratio
function getContrast(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (lightest + 0.05) / (darkest + 0.05);
}

const lightTheme = {
  background: "#f9f9ff",
  foreground: "#131c2a",
  card: "#ffffff",
  card_foreground: "#131c2a",
  popover: "#ffffff",
  popover_foreground: "#131c2a",
  primary: "#032448",
  primary_foreground: "#ffffff",
  secondary: "#016a62",
  secondary_foreground: "#ffffff",
  tertiary: "#510001",
  tertiary_foreground: "#ffffff",
  muted: "#f0f3ff",
  muted_foreground: "#43474e",
  accent: "#e7eeff",
  accent_foreground: "#131c2a",
  destructive: "#ba1a1a",
  destructive_foreground: "#ffffff"
};

const darkTheme = {
  background: "#131c2a",
  foreground: "#ecf1ff",
  card: "#283140",
  card_foreground: "#ecf1ff",
  popover: "#283140",
  popover_foreground: "#ecf1ff",
  primary: "#aec8f4",
  primary_foreground: "#032448",
  secondary: "#84d5cb",
  secondary_foreground: "#00201d",
  tertiary: "#ffb4a9",
  tertiary_foreground: "#410001",
  muted: "#43474e",
  muted_foreground: "#c4c6cf",
  accent: "#283140",
  accent_foreground: "#ecf1ff",
  destructive: "#ffb4a9",
  destructive_foreground: "#410001"
};

const pairs = [
  ['background', 'foreground'],
  ['card', 'card_foreground'],
  ['popover', 'popover_foreground'],
  ['primary', 'primary_foreground'],
  ['secondary', 'secondary_foreground'],
  ['tertiary', 'tertiary_foreground'],
  ['muted', 'muted_foreground'],
  ['accent', 'accent_foreground'],
  ['destructive', 'destructive_foreground'],
];

describe('WCAG Contrast Ratios', () => {
  describe('Light Theme', () => {
    pairs.forEach(([bgKey, fgKey]) => {
      test(`Contrast between ${bgKey} and ${fgKey} must be >= 4.5:1`, () => {
        const bg = lightTheme[bgKey as keyof typeof lightTheme];
        const fg = lightTheme[fgKey as keyof typeof lightTheme];
        const ratio = getContrast(bg, fg);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('Dark Theme', () => {
    pairs.forEach(([bgKey, fgKey]) => {
      test(`Contrast between ${bgKey} and ${fgKey} must be >= 4.5:1`, () => {
        const bg = darkTheme[bgKey as keyof typeof darkTheme];
        const fg = darkTheme[fgKey as keyof typeof darkTheme];
        const ratio = getContrast(bg, fg);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});
