import { useState, useEffect } from 'react';

export type ColorScheme = 'traditional' | 'inverted';

interface ColorPreferences {
  scheme: ColorScheme;
}

export const useColorPreferences = () => {
  const [colorPreferences, setColorPreferences] = useState<ColorPreferences>({
    scheme: 'traditional' // Default: green = up, red = down
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('color-preferences');
    if (savedPreferences) {
      try {
        setColorPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading color preferences:', error);
      }
    }
  }, []);

  const updateColorScheme = (scheme: ColorScheme) => {
    const newPreferences = { ...colorPreferences, scheme };
    setColorPreferences(newPreferences);
    localStorage.setItem('color-preferences', JSON.stringify(newPreferences));
  };

  // Helper functions to get the appropriate colors
  const getUpColor = () => {
    return colorPreferences.scheme === 'traditional' ? 'text-green-600' : 'text-red-600';
  };

  const getDownColor = () => {
    return colorPreferences.scheme === 'traditional' ? 'text-red-600' : 'text-green-600';
  };

  const getUpColorHex = () => {
    return colorPreferences.scheme === 'traditional' ? '#059669' : '#dc2626';
  };

  const getDownColorHex = () => {
    return colorPreferences.scheme === 'traditional' ? '#dc2626' : '#059669';
  };

  const isTraditional = () => colorPreferences.scheme === 'traditional';

  return {
    colorPreferences,
    updateColorScheme,
    getUpColor,
    getDownColor,
    getUpColorHex,
    getDownColorHex,
    isTraditional,
  };
}; 