import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from cli/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Mock mode flag - when true, skips real API calls and uses mock data
 */
export const IS_MOCK = process.env.MOCK_MODE === 'true';

function requireEnv(name: string): string {
  // In mock mode, return placeholder values for required env vars
  if (IS_MOCK) {
    return process.env[name] ?? `mock-${name.toLowerCase()}`;
  }
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

export const config = {
  jira: {
    baseUrl: requireEnv('JIRA_BASE_URL'),
    email: requireEnv('JIRA_EMAIL'),
    apiToken: requireEnv('JIRA_API_TOKEN'),
    boardId: optionalEnv('JIRA_BOARD_ID', ''),
    artifactFieldId: optionalEnv('JIRA_ARTIFACT_FIELD_ID', 'customfield_10001'),
  },
  notion: {
    apiKey: requireEnv('NOTION_API_KEY'),
    parentPageId: requireEnv('NOTION_PARENT_PAGE_ID'),
  },
  openai: {
    apiKey: requireEnv('OPENAI_API_KEY'),
    model: optionalEnv('OPENAI_MODEL', 'gpt-4o'),
  },
} as const;

export type Config = typeof config;
