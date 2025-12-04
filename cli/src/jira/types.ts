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
  // Story points - might be in different fields depending on Jira config
  customfield_10016?: number; // Common story points field
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

// New Jira API response format (POST /rest/api/3/search/jql)
export interface JiraSearchJqlResponse {
  issues: JiraIssue[];
  isLast: boolean;
  nextPageToken?: string;
}

export interface JiraSprintResponse {
  values: JiraSprint[];
  isLast: boolean;
}

// Parsed issue with normalized fields
export interface ParsedJiraIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string; // 'done' | 'in_progress' | 'todo'
  storyPoints: number | null;
  assignee: string | null;
  artifact: string | null;
}

export interface SprintData {
  sprint: JiraSprint;
  issues: ParsedJiraIssue[];
}

