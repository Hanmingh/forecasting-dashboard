// Mapping of full country names to ISO 2-letter country codes
export const countryNameToCode: Record<string, string> = {
  // Major shipping countries and ports
  'Afghanistan': 'af',
  'Andorra': 'ad',
  'China': 'cn',
  'France': 'fr',
  'Germany': 'de',
  'Italy': 'it',
  'Netherlands': 'nl',
  'Portugal': 'pt',
  'Singapore': 'sg',
  'Spain': 'es',
  'United Arab Emirates': 'ae',
  'United Kingdom': 'gb',
  'United States': 'us',
};

/**
 * Converts a full country name to its ISO 2-letter country code
 * @param countryName - Full country name
 * @returns ISO 2-letter country code, defaults to 'US' if not found
 */
export const getCountryCode = (countryName: string): string => {
  // Try exact match first
  const exactMatch = countryNameToCode[countryName];
  if (exactMatch) return exactMatch;
  
  // Try case-insensitive match
  const normalizedInput = countryName.toLowerCase();
  const foundEntry = Object.entries(countryNameToCode).find(([key]) => 
    key.toLowerCase() === normalizedInput
  );
  
  if (foundEntry) return foundEntry[1];
  
  // Try partial match (for cases like "United States of America")
  const partialMatch = Object.entries(countryNameToCode).find(([key]) => 
    normalizedInput.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedInput)
  );
  
  if (partialMatch) return partialMatch[1];
  
  // Default fallback
  return 'N/A';
}; 