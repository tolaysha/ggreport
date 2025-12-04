import axios, { type AxiosInstance } from 'axios';

import { IS_MOCK, JIRA_CONFIG } from '../config';
import { logger } from '../utils/logger';

import type {
  JiraIssue,
  JiraSearchJqlResponse,
  JiraSprint,
  JiraSprintResponse,
  ParsedJiraIssue,
  SprintData,
} from './types';

export class JiraClient {
  private client: AxiosInstance | null = null;
  private artifactFieldId: string;

  constructor() {
    // Only initialize HTTP client if not in mock mode
    if (!IS_MOCK) {
      const auth = Buffer.from(
        `${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`,
      ).toString('base64');

      this.client = axios.create({
        baseURL: JIRA_CONFIG.baseUrl,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });
    }

    this.artifactFieldId = JIRA_CONFIG.artifactFieldId;
  }

  /**
   * Find a sprint by name or ID
   */
  async findSprint(sprintNameOrId: string): Promise<JiraSprint | null> {
    if (IS_MOCK) {
      throw new Error('findSprint should not be called in mock mode');
    }

    if (!this.client) {
      throw new Error('Jira client not initialized');
    }

    const isNumeric = /^\d+$/.test(sprintNameOrId);

    if (isNumeric) {
      // Direct sprint lookup by ID
      try {
        const response = await this.client.get<JiraSprint>(
          `/rest/agile/1.0/sprint/${sprintNameOrId}`,
        );
        return response.data;
      } catch (error) {
        logger.error(`Failed to fetch sprint by ID: ${sprintNameOrId}`, error);
        return null;
      }
    }

    // Search by name - need to get sprints from board
    if (!JIRA_CONFIG.boardId) {
      throw new Error(
        'JIRA_BOARD_ID is required when searching by sprint name',
      );
    }

    let startAt = 0;
    const maxResults = 50;

    while (true) {
      const response = await this.client.get<JiraSprintResponse>(
        `/rest/agile/1.0/board/${JIRA_CONFIG.boardId}/sprint`,
        {
          params: { startAt, maxResults },
        },
      );

      const sprint = response.data.values.find(
        s => s.name.toLowerCase() === sprintNameOrId.toLowerCase(),
      );

      if (sprint) {
        return sprint;
      }

      if (response.data.isLast) {
        break;
      }

      startAt += maxResults;
    }

    return null;
  }

  /**
   * Get all issues for a sprint
   */
  async getIssuesForSprint(sprintId: number): Promise<JiraIssue[]> {
    if (IS_MOCK) {
      throw new Error('getIssuesForSprint should not be called in mock mode');
    }

    if (!this.client) {
      throw new Error('Jira client not initialized');
    }

    const issues: JiraIssue[] = [];
    const maxResults = 100;
    const jql = `sprint = ${sprintId}`;
    let nextPageToken: string | undefined;

    // Using new Jira API endpoint (POST /rest/api/3/search/jql)
    // Old GET /rest/api/3/search is deprecated since Dec 2024
    // New API uses cursor-based pagination with nextPageToken
    while (true) {
      logger.debug(`Fetching issues for sprint ${sprintId}`, {
        maxResults,
        hasNextPage: !!nextPageToken,
      });

      const requestBody: {
        jql: string;
        maxResults: number;
        fields: string[];
        nextPageToken?: string;
      } = {
        jql,
        maxResults,
        fields: [
          'summary',
          'status',
          'assignee',
          'customfield_10016', // Story points (common field)
          this.artifactFieldId,
        ],
      };

      // Add pagination token if not first page
      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }

      const response = await this.client.post<JiraSearchJqlResponse>(
        '/rest/api/3/search/jql',
        requestBody,
      );

      issues.push(...response.data.issues);

      // Check if there are more pages
      if (response.data.isLast || !response.data.nextPageToken) {
        break;
      }

      nextPageToken = response.data.nextPageToken;
    }

    logger.info(`Fetched ${issues.length} issues for sprint ${sprintId}`);
    return issues;
  }

  /**
   * Parse raw Jira issue into a normalized format
   */
  parseIssue(issue: JiraIssue): ParsedJiraIssue {
    const fields = issue.fields;

    // Extract story points (try common field names)
    const storyPoints =
      (fields.customfield_10016 as number) ??
      (fields.customfield_10004 as number) ?? // Another common story points field
      null;

    // Extract artifact from custom field
    const artifactValue = fields[this.artifactFieldId];
    let artifact: string | null = null;

    if (typeof artifactValue === 'string') {
      artifact = artifactValue;
    } else if (
      artifactValue &&
      typeof artifactValue === 'object' &&
      'value' in artifactValue
    ) {
      artifact = String(artifactValue.value);
    }

    return {
      key: issue.key,
      summary: fields.summary,
      status: fields.status.name,
      statusCategory: fields.status.statusCategory.key, // 'done', 'indeterminate', 'new'
      storyPoints,
      assignee: fields.assignee?.displayName ?? null,
      artifact,
    };
  }

  /**
   * Main method: get sprint data with parsed issues
   */
  async getSprintData(sprintNameOrId: string): Promise<SprintData> {
    if (IS_MOCK) {
      throw new Error('getSprintData should not be called in mock mode');
    }

    logger.info(`Fetching sprint data for: ${sprintNameOrId}`);

    const sprint = await this.findSprint(sprintNameOrId);
    if (!sprint) {
      throw new Error(`Sprint not found: ${sprintNameOrId}`);
    }

    logger.info(`Found sprint: ${sprint.name} (ID: ${sprint.id})`);

    const rawIssues = await this.getIssuesForSprint(sprint.id);
    const issues = rawIssues.map(issue => this.parseIssue(issue));

    return {
      sprint,
      issues,
    };
  }
}

// Singleton instance
export const jiraClient = new JiraClient();
