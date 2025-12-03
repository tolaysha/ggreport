import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';
import type { SprintReportStructured } from '../ai/types';
/**
 * Data required to build a sprint report page
 */
export interface SprintReportPageData {
    sprintName: string;
    report: SprintReportStructured;
}
/**
 * Build the page title for a sprint report
 */
export declare function buildPageTitle(sprintName: string): string;
/**
 * Build all content blocks for the sprint report page
 * Matches the exact template structure
 */
export declare function buildPageBlocks(data: SprintReportPageData): BlockObjectRequest[];
/**
 * Log the structure of blocks that would be created (for mock mode)
 */
export declare function logBlocksStructure(blocks: BlockObjectRequest[]): void;
//# sourceMappingURL=builder.d.ts.map