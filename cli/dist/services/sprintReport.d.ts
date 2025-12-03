import type { NotionPageResult, SprintReportStructured, VersionMeta } from '../ai/types';
export interface SprintReportOptions {
    sprintNameOrId: string;
    dryRun?: boolean;
    versionMeta?: Partial<VersionMeta>;
}
export interface SprintReportResult {
    success: boolean;
    page?: NotionPageResult;
    report?: SprintReportStructured;
    error?: string;
}
/**
 * Main sprint report generation pipeline
 *
 * Steps:
 * 1. Fetch sprint data from Jira (or use mock data)
 * 2. Convert to domain types and select demos
 * 3. Generate structured report with OpenAI
 * 4. Create Notion page with structured content
 */
export declare function generateSprintReport(options: SprintReportOptions): Promise<SprintReportResult>;
//# sourceMappingURL=sprintReport.d.ts.map