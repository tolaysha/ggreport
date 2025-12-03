import type { JiraIssue, JiraSprint, ParsedJiraIssue, SprintData } from './types';
export declare class JiraClient {
    private client;
    private artifactFieldId;
    constructor();
    /**
     * Find a sprint by name or ID
     */
    findSprint(sprintNameOrId: string): Promise<JiraSprint | null>;
    /**
     * Get all issues for a sprint
     */
    getIssuesForSprint(sprintId: number): Promise<JiraIssue[]>;
    /**
     * Parse raw Jira issue into a normalized format
     */
    parseIssue(issue: JiraIssue): ParsedJiraIssue;
    /**
     * Main method: get sprint data with parsed issues
     */
    getSprintData(sprintNameOrId: string): Promise<SprintData>;
}
export declare const jiraClient: JiraClient;
//# sourceMappingURL=client.d.ts.map