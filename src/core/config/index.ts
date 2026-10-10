/**
 * Core Application Configuration
 * Environments: Development, Staging, Production
 */

export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  appNamePlaceholder: string;
  appVersion: string;
  schemaVersion: number;
  environment: Environment;
  apiBaseUrl: string;
  syncIntervalMs: number;
  offlineFirst: boolean;
  features: {
    syncEnabled: boolean;
    pushNotificationsEnabled: boolean;
    analyticsEnabled: boolean;
    localNotificationsEnabled: boolean;
  };
}

const ENV: Environment = (process.env.NODE_ENV as Environment) || 'development';

export const Config: AppConfig = {
  appNamePlaceholder: 'APP_NAME_PLACEHOLDER',
  appVersion: '1.0.0',
  schemaVersion: 1,
  environment: ENV,
  apiBaseUrl: process.env.VITE_API_BASE_URL || '/api/v1',
  syncIntervalMs: 60000,
  offlineFirst: true,
  features: {
    syncEnabled: false, // Disabled for MVP, activated with server
    pushNotificationsEnabled: false,
    analyticsEnabled: false,
    localNotificationsEnabled: true,
  },
};
