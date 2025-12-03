"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSprintReport = generateSprintReport;
const openaiClient_1 = require("../ai/openaiClient");
const config_1 = require("../config");
const client_1 = require("../jira/client");
const client_2 = require("../notion/client");
const logger_1 = require("../utils/logger");
const demoSelector_1 = require("./demoSelector");
/**
 * Convert ParsedJiraIssue to domain SprintIssue type
 */
function toSprintIssue(issue) {
    return {
        key: issue.key,
        summary: issue.summary,
        status: issue.status,
        statusCategory: issue.statusCategory,
        storyPoints: issue.storyPoints,
        assignee: issue.assignee,
        artifact: issue.artifact,
    };
}
/**
 * Calculate completion percentage
 */
function calculateProgressPercent(issues) {
    const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
    const completedPoints = issues
        .filter(i => i.statusCategory === 'done')
        .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
    return totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
}
/**
 * Format date to Russian locale
 */
function formatDateRussian(dateStr) {
    if (!dateStr) {
        return undefined;
    }
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }
    catch {
        return dateStr;
    }
}
/**
 * Extract sprint number from sprint name
 */
function extractSprintNumber(sprintName) {
    const match = sprintName.match(/(\d+)/);
    return match?.[1] ?? '1';
}
/**
 * Generate mock issues for testing
 */
function generateMockIssues() {
    return [
        {
            key: 'PROJ-101',
            summary: 'Реализовать основной пользовательский сценарий',
            status: 'Done',
            statusCategory: 'done',
            storyPoints: 8,
            assignee: 'Иван Петров',
            artifact: 'https://figma.com/demo-scenario',
        },
        {
            key: 'PROJ-102',
            summary: 'Улучшить производительность главной страницы',
            status: 'Done',
            statusCategory: 'done',
            storyPoints: 5,
            assignee: 'Мария Сидорова',
            artifact: null,
        },
        {
            key: 'PROJ-103',
            summary: 'Добавить систему уведомлений',
            status: 'Done',
            statusCategory: 'done',
            storyPoints: 3,
            assignee: 'Иван Петров',
            artifact: 'https://loom.com/notifications-demo',
        },
        {
            key: 'PROJ-104',
            summary: 'Интеграция с внешней системой',
            status: 'In Progress',
            statusCategory: 'indeterminate',
            storyPoints: 8,
            assignee: 'Алексей Козлов',
            artifact: null,
        },
        {
            key: 'PROJ-105',
            summary: 'Расширенный отчёт для администраторов',
            status: 'To Do',
            statusCategory: 'new',
            storyPoints: 5,
            assignee: null,
            artifact: null,
        },
        {
            key: 'PROJ-106',
            summary: 'Обновить дизайн личного кабинета',
            status: 'Done',
            statusCategory: 'done',
            storyPoints: 5,
            assignee: 'Мария Сидорова',
            artifact: 'https://figma.com/cabinet-redesign',
        },
    ];
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
async function generateSprintReport(options) {
    const { sprintNameOrId, dryRun = false, versionMeta } = options;
    try {
        let issues;
        let sprintName;
        let startDate;
        let endDate;
        let sprintGoal;
        // Step 1: Fetch sprint data from Jira (or mock)
        if (config_1.IS_MOCK) {
            logger_1.logger.info('[MOCK] Step 1: Using mock sprint data...');
            issues = generateMockIssues();
            sprintName = sprintNameOrId;
            startDate = '17 Ноября 2025';
            endDate = '28 Ноября 2025';
            sprintGoal = 'Реализация основного пользовательского сценария';
        }
        else {
            logger_1.logger.info('Step 1: Fetching sprint data from Jira...');
            const sprintData = await client_1.jiraClient.getSprintData(sprintNameOrId);
            const { sprint, issues: rawIssues } = sprintData;
            sprintName = sprint.name;
            startDate = formatDateRussian(sprint.startDate);
            endDate = formatDateRussian(sprint.endDate);
            sprintGoal = sprint.goal;
            issues = rawIssues.map(toSprintIssue);
        }
        console.log(`✓ Loaded ${issues.length} issues from Jira`);
        // Step 2: Analyze issues and select demos
        logger_1.logger.info('Step 2: Analyzing issues...');
        // selectDemoIssues expects SprintIssue[] and returns SprintIssue[]
        // No conversion needed - issues is already SprintIssue[]
        const demoIssues = (0, demoSelector_1.selectDemoIssues)(issues, { maxDemos: 3 });
        console.log(`✓ Selected ${demoIssues.length} demo issues`);
        const progressPercent = calculateProgressPercent(issues);
        // Step 3: Generate structured report with OpenAI
        logger_1.logger.info('Step 3: Generating structured report with AI...');
        const context = {
            versionMeta,
            sprintMeta: {
                sprintName,
                sprintNumber: extractSprintNumber(sprintName),
                startDate,
                endDate,
                goal: sprintGoal,
                progressPercent,
            },
            issues,
            // demoIssues is already SprintIssue[] from selectDemoIssues, no conversion needed
            demoIssues,
        };
        const report = await openaiClient_1.openaiClient.generateSprintReportStructured(context);
        console.log('✓ Generated structured AI sprint report');
        // Dry run - print the report and exit
        if (dryRun) {
            logger_1.logger.info('Dry run mode - skipping Notion page creation');
            console.log('\n--- Generated Report (JSON) ---');
            console.log(JSON.stringify(report, null, 2));
            console.log('--- End Report ---\n');
            return { success: true, report };
        }
        // Step 4: Create Notion page
        logger_1.logger.info('Step 4: Creating Notion page...');
        const page = await client_2.notionClient.createSprintReportPage({
            sprintName,
            report,
        });
        console.log(`✓ Created sprint report page with id: ${page.id}`);
        console.log(`\n🎉 Sprint report created: ${page.url}\n`);
        return { success: true, page, report };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger_1.logger.error('Failed to generate sprint report', { error: message });
        return { success: false, error: message };
    }
}
//# sourceMappingURL=sprintReport.js.map