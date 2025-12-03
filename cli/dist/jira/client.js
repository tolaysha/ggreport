"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jiraClient = exports.JiraClient = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class JiraClient {
    client;
    artifactFieldId;
    constructor() {
        const auth = Buffer.from(`${config_1.config.jira.email}:${config_1.config.jira.apiToken}`).toString('base64');
        this.client = axios_1.default.create({
            baseURL: config_1.config.jira.baseUrl,
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
        });
        this.artifactFieldId = config_1.config.jira.artifactFieldId;
    }
    /**
     * Find a sprint by name or ID
     */
    async findSprint(sprintNameOrId) {
        const isNumeric = /^\d+$/.test(sprintNameOrId);
        if (isNumeric) {
            // Direct sprint lookup by ID
            try {
                const response = await this.client.get(`/rest/agile/1.0/sprint/${sprintNameOrId}`);
                return response.data;
            }
            catch (error) {
                logger_1.logger.error(`Failed to fetch sprint by ID: ${sprintNameOrId}`, error);
                return null;
            }
        }
        // Search by name - need to get sprints from board
        if (!config_1.config.jira.boardId) {
            throw new Error('JIRA_BOARD_ID is required when searching by sprint name');
        }
        let startAt = 0;
        const maxResults = 50;
        while (true) {
            const response = await this.client.get(`/rest/agile/1.0/board/${config_1.config.jira.boardId}/sprint`, {
                params: { startAt, maxResults },
            });
            const sprint = response.data.values.find(s => s.name.toLowerCase() === sprintNameOrId.toLowerCase());
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
    async getIssuesForSprint(sprintId) {
        const issues = [];
        let startAt = 0;
        const maxResults = 100;
        const jql = `sprint = ${sprintId}`;
        while (true) {
            logger_1.logger.debug(`Fetching issues for sprint ${sprintId}`, {
                startAt,
                maxResults,
            });
            const response = await this.client.get('/rest/api/3/search', {
                params: {
                    jql,
                    startAt,
                    maxResults,
                    fields: [
                        'summary',
                        'status',
                        'assignee',
                        'customfield_10016', // Story points (common field)
                        this.artifactFieldId,
                    ].join(','),
                },
            });
            issues.push(...response.data.issues);
            if (startAt + response.data.maxResults >= response.data.total) {
                break;
            }
            startAt += maxResults;
        }
        logger_1.logger.info(`Fetched ${issues.length} issues for sprint ${sprintId}`);
        return issues;
    }
    /**
     * Parse raw Jira issue into a normalized format
     */
    parseIssue(issue) {
        const fields = issue.fields;
        // Extract story points (try common field names)
        const storyPoints = fields.customfield_10016 ??
            fields.customfield_10004 ?? // Another common story points field
            null;
        // Extract artifact from custom field
        const artifactValue = fields[this.artifactFieldId];
        let artifact = null;
        if (typeof artifactValue === 'string') {
            artifact = artifactValue;
        }
        else if (artifactValue &&
            typeof artifactValue === 'object' &&
            'value' in artifactValue) {
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
    async getSprintData(sprintNameOrId) {
        logger_1.logger.info(`Fetching sprint data for: ${sprintNameOrId}`);
        const sprint = await this.findSprint(sprintNameOrId);
        if (!sprint) {
            throw new Error(`Sprint not found: ${sprintNameOrId}`);
        }
        logger_1.logger.info(`Found sprint: ${sprint.name} (ID: ${sprint.id})`);
        const rawIssues = await this.getIssuesForSprint(sprint.id);
        const issues = rawIssues.map(issue => this.parseIssue(issue));
        return {
            sprint,
            issues,
        };
    }
}
exports.JiraClient = JiraClient;
// Singleton instance
exports.jiraClient = new JiraClient();
//# sourceMappingURL=client.js.map