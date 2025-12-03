import type { SprintReportGenerationContext } from './prompts';
import type { SprintReportStructured } from './types';
export declare class OpenAIClient {
    private client;
    private model;
    constructor();
    /**
     * Generate a structured sprint report using OpenAI
     */
    generateSprintReportStructured(context: SprintReportGenerationContext): Promise<SprintReportStructured>;
}
export declare const openaiClient: OpenAIClient;
//# sourceMappingURL=openaiClient.d.ts.map