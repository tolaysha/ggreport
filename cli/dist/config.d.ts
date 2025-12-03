/**
 * When true, the CLI uses mock data and skips real API calls.
 * Set MOCK_MODE=true in your .env to enable.
 */
export declare const IS_MOCK: boolean;
/**
 * Jira API configuration.
 * Used for fetching sprint and issue data.
 */
export declare const JIRA_CONFIG: {
    readonly baseUrl: string;
    readonly email: string;
    readonly apiToken: string;
    readonly boardId: string;
    readonly artifactFieldId: string;
};
/**
 * Notion API configuration.
 * Used for creating sprint report pages.
 */
export declare const NOTION_CONFIG: {
    readonly apiKey: string;
    readonly parentPageId: string;
};
/**
 * OpenAI API configuration.
 * Used for generating AI-powered report text.
 */
export declare const OPENAI_CONFIG: {
    readonly apiKey: string;
    readonly model: string;
};
/**
 * Validates that all required environment variables are set.
 *
 * - In MOCK_MODE=true: Allows running without credentials, logs a notice.
 * - In MOCK_MODE=false: Throws an error if any required variable is missing.
 *
 * Call this function early in the CLI pipeline (after arg parsing,
 * before any API calls).
 */
export declare function validateConfig(): void;
/**
 * @deprecated Use JIRA_CONFIG, NOTION_CONFIG, OPENAI_CONFIG instead.
 * This export is kept for backward compatibility.
 */
export declare const config: {
    readonly jira: {
        readonly baseUrl: string;
        readonly email: string;
        readonly apiToken: string;
        readonly boardId: string;
        readonly artifactFieldId: string;
    };
    readonly notion: {
        readonly apiKey: string;
        readonly parentPageId: string;
    };
    readonly openai: {
        readonly apiKey: string;
        readonly model: string;
    };
};
export type Config = typeof config;
//# sourceMappingURL=config.d.ts.map