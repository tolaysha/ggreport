import type { NotionPageResult, SprintReportStructured } from '../ai/types';
/**
 * Input data for creating a sprint report page
 */
export interface CreateSprintReportPageInput {
    sprintName: string;
    report: SprintReportStructured;
}
export declare class NotionClient {
    private client;
    private parentPageId;
    constructor();
    /**
     * Create a sprint report page in Notion
     */
    createSprintReportPage(data: CreateSprintReportPageInput): Promise<NotionPageResult>;
}
export declare const notionClient: NotionClient;
//# sourceMappingURL=client.d.ts.map