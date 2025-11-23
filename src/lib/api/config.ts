/**
 * API Configuration and Environment Variables
 * Centralized configuration for all external API services
 */

interface ApiConfig {
  polygon: {
    apiKey: string;
    baseUrl: string;
    wsUrl: string;
  };
  marketaux: {
    apiKey: string;
    baseUrl: string;
  };
  fmp: {
    apiKey: string;
    baseUrl: string;
  };
}

// Validate required environment variables
function validateEnvVar(key: string, value: string | undefined): string {
  if (!value || value === `your_${key.toLowerCase()}_here`) {
    console.warn(`⚠️  ${key} is not configured. Using mock data.`);
    return '';
  }
  return value;
}

export const apiConfig: ApiConfig = {
  polygon: {
    apiKey: validateEnvVar('POLYGON_API_KEY', process.env.POLYGON_API_KEY),
    baseUrl: 'https://api.polygon.io',
    wsUrl: 'wss://socket.polygon.io',
  },
  marketaux: {
    apiKey: validateEnvVar('MARKETAUX_API_KEY', process.env.MARKETAUX_API_KEY),
    baseUrl: 'https://api.marketaux.com',
  },
  fmp: {
    apiKey: validateEnvVar('FMP_API_KEY', process.env.FMP_API_KEY),
    baseUrl: 'https://financialmodelingprep.com/api/v3',
  },
};

// API availability checks
export const isPolygonConfigured = (): boolean => !!apiConfig.polygon.apiKey;
export const isMarketauxConfigured = (): boolean => !!apiConfig.marketaux.apiKey;
export const isFMPConfigured = (): boolean => !!apiConfig.fmp.apiKey;

