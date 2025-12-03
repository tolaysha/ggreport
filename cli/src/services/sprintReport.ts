import { openaiClient } from '../ai/openaiClient';
import type { SprintReportGenerationContext } from '../ai/prompts';
import type {
  NotionPageResult,
  SprintIssue,
  SprintReportStructured,
  VersionMeta,
} from '../ai/types';
import { IS_MOCK } from '../config';
import { jiraClient } from '../jira/client';
import type { ParsedJiraIssue } from '../jira/types';
import { notionClient } from '../notion/client';
import { logger } from '../utils/logger';

import { selectDemoIssues } from './demoSelector';

export interface SprintReportOptions {
  sprintNameOrId: string;
  dryRun?: boolean;
  versionMeta?: Partial<VersionMeta>;
}

export interface SprintReportResult {
  success: boolean;
  page?: NotionPageResult;
  report?: SprintReportStructured;
  error?: string;
}

/**
 * Convert ParsedJiraIssue to domain SprintIssue type
 */
function toSprintIssue(issue: ParsedJiraIssue): SprintIssue {
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
function calculateProgressPercent(issues: SprintIssue[]): number {
  const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const completedPoints = issues
    .filter(i => i.statusCategory === 'done')
    .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  return totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
}

/**
 * Format date to Russian locale
 */
function formatDateRussian(dateStr: string | undefined): string | undefined {
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
  } catch {
    return dateStr;
  }
}

/**
 * Extract sprint number from sprint name
 */
function extractSprintNumber(sprintName: string): string {
  const match = sprintName.match(/(\d+)/);
  return match?.[1] ?? '1';
}

/**
 * Generate mock issues for testing
 */
function generateMockIssues(): SprintIssue[] {
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
export async function generateSprintReport(
  options: SprintReportOptions,
): Promise<SprintReportResult> {
  const { sprintNameOrId, dryRun = false, versionMeta } = options;

  try {
    let issues: SprintIssue[];
    let sprintName: string;
    let startDate: string | undefined;
    let endDate: string | undefined;
    let sprintGoal: string | undefined;

    // Step 1: Fetch sprint data from Jira (or mock)
    if (IS_MOCK) {
      logger.info('[MOCK] Step 1: Using mock sprint data...');
      issues = generateMockIssues();
      sprintName = sprintNameOrId;
      startDate = '17 Ноября 2025';
      endDate = '28 Ноября 2025';
      sprintGoal = 'Реализация основного пользовательского сценария';
    } else {
      logger.info('Step 1: Fetching sprint data from Jira...');
      const sprintData = await jiraClient.getSprintData(sprintNameOrId);
      const { sprint, issues: rawIssues } = sprintData;

      sprintName = sprint.name;
      startDate = formatDateRussian(sprint.startDate);
      endDate = formatDateRussian(sprint.endDate);
      sprintGoal = sprint.goal;
      issues = rawIssues.map(toSprintIssue);
    }

    console.log(`✓ Loaded ${issues.length} issues from Jira`);

    // Step 2: Analyze issues and select demos
    logger.info('Step 2: Analyzing issues...');
    // selectDemoIssues expects SprintIssue[] and returns SprintIssue[]
    // No conversion needed - issues is already SprintIssue[]
    const demoIssues = selectDemoIssues(issues, { maxDemos: 3 });

    console.log(`✓ Selected ${demoIssues.length} demo issues`);

    const progressPercent = calculateProgressPercent(issues);

    // Step 3: Generate structured report with OpenAI
    logger.info('Step 3: Generating structured report with AI...');
    const context: SprintReportGenerationContext = {
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

    const report = await openaiClient.generateSprintReportStructured(context);
    console.log('✓ Generated structured AI sprint report');

    // Dry run - print the report and exit
    if (dryRun) {
      logger.info('Dry run mode - skipping Notion page creation');
      console.log('\n--- Generated Report (JSON) ---');
      console.log(JSON.stringify(report, null, 2));
      console.log('--- End Report ---\n');
      return { success: true, report };
    }

    // Step 4: Create Notion page
    logger.info('Step 4: Creating Notion page...');
    const page = await notionClient.createSprintReportPage({
      sprintName,
      report,
    });

    console.log(`✓ Created sprint report page with id: ${page.id}`);
    console.log(`\n🎉 Sprint report created: ${page.url}\n`);

    return { success: true, page, report };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to generate sprint report', { error: message });
    return { success: false, error: message };
  }
}
