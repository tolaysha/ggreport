"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.OPENAI_CONFIG = exports.NOTION_CONFIG = exports.JIRA_CONFIG = exports.IS_MOCK = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from cli/.env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// =============================================================================
// Mock Mode Flag
// =============================================================================
/**
 * When true, the CLI uses mock data and skips real API calls.
 * Set MOCK_MODE=true in your .env to enable.
 */
exports.IS_MOCK = process.env.MOCK_MODE === 'true';
// =============================================================================
// Configuration Objects
// =============================================================================
/**
 * Jira API configuration.
 * Used for fetching sprint and issue data.
 */
exports.JIRA_CONFIG = {
    baseUrl: process.env.JIRA_BASE_URL ?? '',
    email: process.env.JIRA_EMAIL ?? '',
    apiToken: process.env.JIRA_API_TOKEN ?? '',
    boardId: process.env.JIRA_BOARD_ID ?? '',
    artifactFieldId: process.env.JIRA_ARTIFACT_FIELD_ID ?? 'customfield_10001',
};
/**
 * Notion API configuration.
 * Used for creating sprint report pages.
 */
exports.NOTION_CONFIG = {
    apiKey: process.env.NOTION_API_KEY ?? '',
    parentPageId: process.env.NOTION_PARENT_PAGE_ID ?? '',
};
/**
 * OpenAI API configuration.
 * Used for generating AI-powered report text.
 */
exports.OPENAI_CONFIG = {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
};
// =============================================================================
// Validation
// =============================================================================
/**
 * List of required environment variables for real mode (non-mock).
 */
const REQUIRED_ENV_VARS = [
    { key: 'JIRA_BASE_URL', value: exports.JIRA_CONFIG.baseUrl, service: 'Jira' },
    { key: 'JIRA_EMAIL', value: exports.JIRA_CONFIG.email, service: 'Jira' },
    { key: 'JIRA_API_TOKEN', value: exports.JIRA_CONFIG.apiToken, service: 'Jira' },
    { key: 'NOTION_API_KEY', value: exports.NOTION_CONFIG.apiKey, service: 'Notion' },
    { key: 'NOTION_PARENT_PAGE_ID', value: exports.NOTION_CONFIG.parentPageId, service: 'Notion' },
    { key: 'OPENAI_API_KEY', value: exports.OPENAI_CONFIG.apiKey, service: 'OpenAI' },
];
/**
 * Validates that all required environment variables are set.
 *
 * - In MOCK_MODE=true: Allows running without credentials, logs a notice.
 * - In MOCK_MODE=false: Throws an error if any required variable is missing.
 *
 * Call this function early in the CLI pipeline (after arg parsing,
 * before any API calls).
 */
function validateConfig() {
    if (exports.IS_MOCK) {
        console.log('[CONFIG] Running in MOCK_MODE, external credentials may be omitted.');
        return;
    }
    const missing = [];
    for (const { key, value } of REQUIRED_ENV_VARS) {
        if (!value || value.trim() === '') {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        const errorMessages = missing.map(key => `  - Missing ${key} in environment. Set it in your .env file.`);
        throw new Error(`Configuration error: The following required environment variables are not set:\n${errorMessages.join('\n')}\n\nTip: Copy env.example.txt to .env and fill in your credentials, or set MOCK_MODE=true to test without real APIs.`);
    }
}
// =============================================================================
// Legacy Exports (for backward compatibility)
// =============================================================================
/**
 * @deprecated Use JIRA_CONFIG, NOTION_CONFIG, OPENAI_CONFIG instead.
 * This export is kept for backward compatibility.
 */
exports.config = {
    jira: exports.JIRA_CONFIG,
    notion: exports.NOTION_CONFIG,
    openai: exports.OPENAI_CONFIG,
};
//# sourceMappingURL=config.js.map