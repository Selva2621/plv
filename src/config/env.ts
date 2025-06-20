import Constants from 'expo-constants';

/**
 * Environment Configuration
 * 
 * This module provides a centralized way to access environment variables
 * and configuration values throughout the mobile app.
 */

interface EnvConfig {
  // API Configuration
  API_BASE_URL: string;
  WEBSOCKET_URL: string;

  // App Configuration
  APP_NAME: string;
  APP_VERSION: string;

  // Environment flags
  NODE_ENV: 'development' | 'production' | 'test';
  DEBUG_MODE: boolean;

  // Timeout configurations
  API_TIMEOUT: number;
  WEBSOCKET_TIMEOUT: number;
  WEBSOCKET_RECONNECT_ATTEMPTS: number;
  WEBSOCKET_RECONNECT_DELAY: number;

  // Security
  JWT_SECRET?: string;
  ENCRYPTION_KEY?: string;

  // Feature flags
  ENABLE_WEBSOCKET: boolean;
  ENABLE_PUSH_NOTIFICATIONS: boolean;
  ENABLE_ANALYTICS: boolean;
}

/**
 * Get environment variable with fallback
 */
const getEnvVar = (key: string, fallback?: string): string => {
  // Try to get from Expo Constants first (for EAS builds)
  const expoValue = Constants.expoConfig?.extra?.[key];
  if (expoValue !== undefined) {
    return String(expoValue);
  }

  // Try to get from process.env (for development)
  const processValue = process.env[key];
  if (processValue !== undefined) {
    return processValue;
  }

  // Use fallback if provided
  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Environment variable ${key} is not defined and no fallback provided`);
};

/**
 * Get boolean environment variable
 */
const getBooleanEnvVar = (key: string, fallback: boolean = false): boolean => {
  try {
    const value = getEnvVar(key, String(fallback));
    return value.toLowerCase() === 'true' || value === '1';
  } catch {
    return fallback;
  }
};

/**
 * Get number environment variable
 */
const getNumberEnvVar = (key: string, fallback: number): number => {
  try {
    const value = getEnvVar(key, String(fallback));
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
};

/**
 * Environment configuration object
 */
export const ENV: EnvConfig = {
  // API Configuration
  API_BASE_URL: getEnvVar('API_BASE_URL', 'https://prs-c7e1.onrender.com'),
  WEBSOCKET_URL: getEnvVar('WEBSOCKET_URL', 'https://prs-c7e1.onrender.com/chat'),

  // App Configuration
  APP_NAME: getEnvVar('APP_NAME', 'Cosmic Love'),
  APP_VERSION: getEnvVar('APP_VERSION', '1.0.0'),

  // Environment flags
  NODE_ENV: getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  DEBUG_MODE: getBooleanEnvVar('DEBUG_MODE', true),

  // Timeout configurations
  API_TIMEOUT: getNumberEnvVar('API_TIMEOUT', 10000),
  WEBSOCKET_TIMEOUT: getNumberEnvVar('WEBSOCKET_TIMEOUT', 10000),
  WEBSOCKET_RECONNECT_ATTEMPTS: getNumberEnvVar('WEBSOCKET_RECONNECT_ATTEMPTS', 5),
  WEBSOCKET_RECONNECT_DELAY: getNumberEnvVar('WEBSOCKET_RECONNECT_DELAY', 1000),

  // Security (optional)
  JWT_SECRET: getEnvVar('JWT_SECRET', 'default-jwt-secret-for-development'),
  ENCRYPTION_KEY: getEnvVar('ENCRYPTION_KEY', 'default-encryption-key-for-development'),

  // Feature flags
  ENABLE_WEBSOCKET: getBooleanEnvVar('ENABLE_WEBSOCKET', true),
  ENABLE_PUSH_NOTIFICATIONS: getBooleanEnvVar('ENABLE_PUSH_NOTIFICATIONS', false),
  ENABLE_ANALYTICS: getBooleanEnvVar('ENABLE_ANALYTICS', false),
};

/**
 * Validate required environment variables
 */
export const validateEnv = (): void => {
  const requiredVars = ['API_BASE_URL', 'WEBSOCKET_URL'];
  const missing: string[] = [];

  for (const varName of requiredVars) {
    try {
      getEnvVar(varName);
    } catch {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Log current environment configuration (for debugging)
 */
export const logEnvConfig = (): void => {
  if (ENV.DEBUG_MODE) {
    console.log('🌍 Environment Configuration:', {
      NODE_ENV: ENV.NODE_ENV,
      API_BASE_URL: ENV.API_BASE_URL,
      WEBSOCKET_URL: ENV.WEBSOCKET_URL,
      DEBUG_MODE: ENV.DEBUG_MODE,
      ENABLE_WEBSOCKET: ENV.ENABLE_WEBSOCKET,
    });
  }
};

export default ENV;
