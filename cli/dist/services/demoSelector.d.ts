import type { SprintIssue } from '../ai/types';
export interface DemoSelectorOptions {
    maxDemos?: number;
    preferWithArtifact?: boolean;
    preferHighPoints?: boolean;
}
/**
 * Select top issues for demo based on simple heuristics.
 *
 * Priority:
 * 1. Done issues with artifacts and high story points
 * 2. Done issues with artifacts
 * 3. Done issues with high story points
 * 4. Other done issues
 */
export declare function selectDemoIssues(issues: SprintIssue[], options?: DemoSelectorOptions): SprintIssue[];
//# sourceMappingURL=demoSelector.d.ts.map