import React, { createContext, useContext, ReactNode } from 'react';

// Cosmic Color Palette - Romantic & Universe-themed
export const CosmicTheme = {
  colors: {
    // Primary cosmic colors
    deepSpace: '#0B0B1F',
    nebulaPurple: '#2D1B69',
    stardustPink: '#E91E63',
    galaxyBlue: '#3F51B5',
    moonlightSilver: '#E8EAF6',

    // Romantic accent colors
    roseGold: '#F8BBD9',
    blushPink: '#FCE4EC',
    lavenderMist: '#E1BEE7',
    cosmicGold: '#FFD700',
    etherealWhite: '#FAFAFA',

    // Gradient combinations
    gradients: {
      cosmic: ['#0B0B1F', '#2D1B69', '#3F51B5'] as const,
      romantic: ['#E91E63', '#F8BBD9', '#FCE4EC'] as const,
      starlight: ['#2D1B69', '#E1BEE7', '#E8EAF6'] as const,
      sunset: ['#E91E63', '#FFD700', '#F8BBD9'] as const,
    },

    // Functional colors
    background: '#0B0B1F',
    surface: '#1A1A2E',
    primary: '#E91E63',
    secondary: '#3F51B5',
    accent: '#FFD700',
    text: '#FAFAFA',
    textSecondary: '#E8EAF6',
    border: '#2D1B69',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  },

  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      light: 'System',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      display: 48,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },

  shadows: {
    soft: {
      shadowColor: '#E91E63',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    medium: {
      shadowColor: '#2D1B69',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    strong: {
      shadowColor: '#0B0B1F',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 12,
    },
  },

  animations: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
      verySlow: 1000,
    },
    easing: {
      easeInOut: 'ease-in-out',
      easeOut: 'ease-out',
      easeIn: 'ease-in',
      spring: 'spring',
    },
  },
};

interface ThemeContextType {
  theme: typeof CosmicTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme: CosmicTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default CosmicTheme;
