export interface JiraUser {
    accountId: string;
    displayName: string;
    emailAddress?: string;
}
export interface JiraStatus {
    name: string;
    statusCategory: {
        key: string;
        name: string;
    };
}
export interface JiraIssueFields {
    summary: string;
    status: JiraStatus;
    assignee: JiraUser | null;
    customfield_10016?: number;
    [key: string]: unknown;
}
export interface JiraIssue {
    id: string;
    key: string;
    fields: JiraIssueFields;
}
export interface JiraSprint {
    id: number;
    name: string;
    state: 'active' | 'closed' | 'future';
    startDate?: string;
    endDate?: string;
    goal?: string;
}
export interface JiraSearchResponse {
    issues: JiraIssue[];
    total: number;
    maxResults: number;
    startAt: number;
}
export interface JiraSprintResponse {
    values: JiraSprint[];
    isLast: boolean;
}
export interface ParsedJiraIssue {
    key: string;
    summary: string;
    status: string;
    statusCategory: string;
    storyPoints: number | null;
    assignee: string | null;
    artifact: string | null;
}
export interface SprintData {
    sprint: JiraSprint;
    issues: ParsedJiraIssue[];
}
//# sourceMappingURL=types.d.ts.map