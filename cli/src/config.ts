import dotenv from 'dotenv';
import path from 'path';

// =============================================================================
// Environment Loading
// =============================================================================

// Load .env first (non-sensitive config)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load .env.local second - this OVERRIDES values from .env
// All secrets (API tokens, keys) should be placed in .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// =============================================================================
// Mock Mode Flag
// =============================================================================

/**
 * When true, the CLI uses mock data and skips real API calls.
 * Set MOCK_MODE=true in your .env to enable.
 */
export const IS_MOCK = process.env.MOCK_MODE === 'true';

// =============================================================================
// Configuration Objects
// =============================================================================

/**
 * Jira API configuration.
 * Used for fetching sprint and issue data.
 */
export const JIRA_CONFIG = {
  baseUrl: process.env.JIRA_BASE_URL ?? '',
  email: process.env.JIRA_EMAIL ?? '',
  apiToken: process.env.JIRA_API_TOKEN ?? '',
  boardId: process.env.JIRA_BOARD_ID ?? '',
  artifactFieldId: process.env.JIRA_ARTIFACT_FIELD_ID ?? 'customfield_10001',
} as const;

/**
 * Notion API configuration.
 * Used for creating sprint report pages.
 */
export const NOTION_CONFIG = {
  apiKey: process.env.NOTION_API_KEY ?? '',
  parentPageId: process.env.NOTION_PARENT_PAGE_ID ?? '',
} as const;

/**
 * OpenAI API configuration.
 * Used for generating AI-powered report text.
 */
export const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY ?? '',
  model: process.env.OPENAI_MODEL ?? 'gpt-4o',
} as const;

// =============================================================================
// Validation
// =============================================================================

/**
 * List of required environment variables for real mode (non-mock).
 */
const REQUIRED_ENV_VARS = [
  { key: 'JIRA_BASE_URL', value: JIRA_CONFIG.baseUrl, service: 'Jira' },
  { key: 'JIRA_EMAIL', value: JIRA_CONFIG.email, service: 'Jira' },
  { key: 'JIRA_API_TOKEN', value: JIRA_CONFIG.apiToken, service: 'Jira' },
  { key: 'NOTION_API_KEY', value: NOTION_CONFIG.apiKey, service: 'Notion' },
  { key: 'NOTION_PARENT_PAGE_ID', value: NOTION_CONFIG.parentPageId, service: 'Notion' },
  { key: 'OPENAI_API_KEY', value: OPENAI_CONFIG.apiKey, service: 'OpenAI' },
] as const;

/**
 * Validates that all required environment variables are set.
 *
 * - In MOCK_MODE=true: Allows running without credentials, logs a notice.
 * - In MOCK_MODE=false: Throws an error if any required variable is missing.
 *
 * Call this function early in the CLI pipeline (after arg parsing,
 * before any API calls).
 */
export function validateConfig(): void {
  if (IS_MOCK) {
    console.log('[CONFIG] Running in MOCK_MODE, external credentials are optional.');
    return;
  }

  const missing: string[] = [];

  for (const { key, value } of REQUIRED_ENV_VARS) {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMessages = missing.map((key) => {
      const isSecret = ['JIRA_API_TOKEN', 'NOTION_API_KEY', 'OPENAI_API_KEY'].includes(key);
      const location = isSecret ? '.env.local' : '.env';
      return `  - Missing ${key} — set it in your ${location} file.`;
    });
    throw new Error(
      `Configuration error: The following required environment variables are not set:\n${errorMessages.join('\n')}\n\nTip: Non-sensitive config goes in .env, secrets go in .env.local.\nOr set MOCK_MODE=true to test without real APIs.`,
    );
  }
}

// =============================================================================
// Per-Integration Configuration Checks (for test mode)
// =============================================================================

/**
 * Check if Jira integration is properly configured.
 * Returns true if all required Jira environment variables are set.
 */
export function isJiraConfigured(): boolean {
  return !!(
    JIRA_CONFIG.baseUrl?.trim() &&
    JIRA_CONFIG.email?.trim() &&
    JIRA_CONFIG.apiToken?.trim()
  );
}

/**
 * Check if OpenAI integration is properly configured.
 * Returns true if the OpenAI API key is set.
 */
export function isOpenAIConfigured(): boolean {
  return !!OPENAI_CONFIG.apiKey?.trim();
}

/**
 * Check if Notion integration is properly configured.
 * Returns true if all required Notion environment variables are set.
 */
export function isNotionConfigured(): boolean {
  return !!(
    NOTION_CONFIG.apiKey?.trim() &&
    NOTION_CONFIG.parentPageId?.trim()
  );
}

// =============================================================================
// Legacy Exports (for backward compatibility)
// =============================================================================

/**
 * @deprecated Use JIRA_CONFIG, NOTION_CONFIG, OPENAI_CONFIG instead.
 * This export is kept for backward compatibility.
 */
export const config = {
  jira: JIRA_CONFIG,
  notion: NOTION_CONFIG,
  openai: OPENAI_CONFIG,
} as const;

export type Config = typeof config;
