"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.IS_MOCK = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from cli/.env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
/**
 * Mock mode flag - when true, skips real API calls and uses mock data
 */
exports.IS_MOCK = process.env.MOCK_MODE === 'true';
function requireEnv(name) {
    // In mock mode, return placeholder values for required env vars
    if (exports.IS_MOCK) {
        return process.env[name] ?? `mock-${name.toLowerCase()}`;
    }
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function optionalEnv(name, defaultValue) {
    return process.env[name] ?? defaultValue;
}
exports.config = {
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
};
//# sourceMappingURL=config.js.map