/**
 * Mock mode flag - when true, skips real API calls and uses mock data
 */
export declare const IS_MOCK: boolean;
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