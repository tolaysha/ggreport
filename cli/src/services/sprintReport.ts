import { openaiClient } from '../ai/openaiClient';
import type { SprintReportGenerationContext } from '../ai/prompts';
import type {
  NotionPageResult,
  SprintIssue,
  SprintReportStructured,
  VersionMeta,
} from '../ai/types';
import {
  IS_MOCK,
  isJiraConfigured,
  isNotionConfigured,
  isOpenAIConfigured,
  validateConfig,
} from '../config';
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

  // Validate configuration before making any API calls
  // In MOCK_MODE, this allows running without real credentials
  // In real mode, this throws an error if required env vars are missing
  validateConfig();

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

// =============================================================================
// Test Mode Pipeline
// =============================================================================

export interface TestModeOptions {
  sprintNameOrId: string;
}

interface TestModeSummary {
  jira: 'real' | 'mock';
  openai: 'real' | 'mock';
  notion: 'real' | 'mock';
  sprintName: string;
  pageId: string;
  pageUrl: string;
}

/**
 * Generate mock sprint report for test mode (same as OpenAI client mock)
 */
function generateMockReportForTestMode(
  sprintName: string,
  issues: SprintIssue[],
): SprintReportStructured {
  const sprintNumber = extractSprintNumber(sprintName);
  const nextSprintNumber = String(Number(sprintNumber) + 1);
  const progressPercent = calculateProgressPercent(issues);

  return {
    version: {
      number: '1',
      deadline: '29 Марта 2026',
      goal: 'Запуск MVP продукта с базовым функционалом для первых пользователей.',
      progressPercent: 35,
    },
    sprint: {
      number: sprintNumber,
      startDate: '17 Ноября 2025',
      endDate: '28 Ноября 2025',
      goal: 'Реализация основного пользовательского сценария и подготовка демо для партнёров.',
      progressPercent,
    },
    overview: `В этом спринте команда сфокусировалась на реализации ключевого пользовательского сценария. Мы успешно завершили основную часть запланированных задач, что позволило нам приблизиться к целям версии.

Главным достижением стала возможность для пользователей полноценно работать с основным функционалом продукта. Также была улучшена производительность системы, что положительно скажется на пользовательском опыте.

Часть задач пришлось перенести на следующий спринт из-за необходимости более глубокой проработки требований совместно с партнёрами. Тем не менее, спринт можно считать успешным — мы достигли ${progressPercent}% выполнения запланированного объёма работ.`,
    notDone: [
      {
        title: 'Интеграция с внешней системой уведомлений',
        reason: 'Потребовалось дополнительное согласование формата данных с партнёром',
        requiredForCompletion: 'Финализировать спецификацию и получить тестовый доступ к системе партнёра',
        newDeadline: 'Спринт ' + nextSprintNumber,
      },
    ],
    achievements: [
      {
        title: 'Запущен основной пользовательский сценарий',
        description: 'Пользователи теперь могут полностью пройти путь от регистрации до получения результата.',
      },
      {
        title: 'Улучшена скорость работы системы',
        description: 'Время отклика системы сократилось на 40%, что делает работу с продуктом более комфортной.',
      },
    ],
    artifacts: [
      {
        title: 'Демонстрация основного сценария работы',
        description: 'Видеозапись полного пользовательского пути от входа в систему до получения результата.',
        jiraLink: 'https://jira.example.com/browse/PROJ-123',
        attachmentsNote: 'Видео (3 мин), скриншоты интерфейса',
      },
    ],
    nextSprint: {
      sprintNumber: nextSprintNumber,
      goal: 'Завершить интеграцию с партнёрской системой и подготовить продукт к закрытому бета-тестированию.',
    },
    blockers: [
      {
        title: 'Ожидание доступа к тестовой среде партнёра',
        description: 'Для завершения интеграции необходим доступ к тестовой среде, который пока не предоставлен.',
        resolutionProposal: 'Эскалировать запрос через менеджера партнёрской программы.',
      },
    ],
    pmQuestions: [
      {
        title: 'Приоритет функционала уведомлений',
        description: 'Предлагаем обсудить, насколько критично наличие уведомлений в реальном времени для первой версии продукта.',
      },
    ],
  };
}

/**
 * Run the sprint report pipeline in TEST MODE.
 *
 * This mode is resilient and will ALWAYS complete successfully:
 * - Tries real integrations (Jira, OpenAI, Notion) if configured
 * - Falls back to mocks for any integration that fails or is not configured
 * - Never throws errors - logs issues and continues
 *
 * Use this as a "bull test" to verify the pipeline is wired correctly.
 */
export async function runSprintReportTestMode(
  options: TestModeOptions,
): Promise<void> {
  const { sprintNameOrId } = options;

  const summary: TestModeSummary = {
    jira: 'mock',
    openai: 'mock',
    notion: 'mock',
    sprintName: sprintNameOrId,
    pageId: '',
    pageUrl: '',
  };

  let issues: SprintIssue[];
  let sprintName: string = sprintNameOrId;
  let startDate: string | undefined;
  let endDate: string | undefined;
  let sprintGoal: string | undefined;

  // -------------------------------------------------------------------------
  // Step 1: Jira - Fetch sprint data (or use mock)
  // -------------------------------------------------------------------------
  console.log('Step 1: Fetching sprint data...');

  if (!isJiraConfigured()) {
    console.log('  [TEST] Jira not configured, using mock issues.');
    issues = generateMockIssues();
    startDate = '17 Ноября 2025';
    endDate = '28 Ноября 2025';
    sprintGoal = 'Реализация основного пользовательского сценария';
  } else {
    try {
      logger.debug('[TEST] Attempting real Jira integration...');
      const sprintData = await jiraClient.getSprintData(sprintNameOrId);
      const { sprint, issues: rawIssues } = sprintData;

      sprintName = sprint.name;
      startDate = formatDateRussian(sprint.startDate);
      endDate = formatDateRussian(sprint.endDate);
      sprintGoal = sprint.goal;
      issues = rawIssues.map(toSprintIssue);
      summary.jira = 'real';
      console.log(`  ✓ Loaded ${issues.length} issues from Jira (REAL)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  [TEST] Jira integration failed: ${message}`);
      console.log('  [TEST] Falling back to mock issues.');
      issues = generateMockIssues();
      startDate = '17 Ноября 2025';
      endDate = '28 Ноября 2025';
      sprintGoal = 'Реализация основного пользовательского сценария';
    }
  }

  console.log(`  ✓ Using ${issues.length} issues (${summary.jira})`);

  // -------------------------------------------------------------------------
  // Step 2: Demo selection (works with both real and mock issues)
  // -------------------------------------------------------------------------
  console.log('Step 2: Selecting demo issues...');
  const demoIssues = selectDemoIssues(issues, { maxDemos: 3 });
  console.log(`  ✓ Selected ${demoIssues.length} demo issues`);

  const progressPercent = calculateProgressPercent(issues);

  // -------------------------------------------------------------------------
  // Step 3: OpenAI - Generate structured report (or use mock)
  // -------------------------------------------------------------------------
  console.log('Step 3: Generating structured report with AI...');

  let report: SprintReportStructured;

  if (!isOpenAIConfigured()) {
    console.log('  [TEST] OpenAI not configured, using mock structured report.');
    report = generateMockReportForTestMode(sprintName, issues);
  } else {
    try {
      logger.debug('[TEST] Attempting real OpenAI integration...');
      const context: SprintReportGenerationContext = {
        sprintMeta: {
          sprintName,
          sprintNumber: extractSprintNumber(sprintName),
          startDate,
          endDate,
          goal: sprintGoal,
          progressPercent,
        },
        issues,
        demoIssues,
      };

      report = await openaiClient.generateSprintReportStructured(context);
      summary.openai = 'real';
      console.log('  ✓ Generated structured report with OpenAI (REAL)');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  [TEST] OpenAI integration failed: ${message}`);
      console.log('  [TEST] Falling back to mock structured report.');
      report = generateMockReportForTestMode(sprintName, issues);
    }
  }

  console.log(`  ✓ Report generated (${summary.openai})`);

  // -------------------------------------------------------------------------
  // Step 4: Notion - Create page (or use mock)
  // -------------------------------------------------------------------------
  console.log('Step 4: Creating Notion page...');

  let page: NotionPageResult;

  if (!isNotionConfigured()) {
    console.log('  [TEST] Notion not configured, using mock page result.');
    page = {
      id: 'test-mode-mock-page-id',
      url: 'https://notion.so/mock-test-page',
    };
  } else {
    try {
      logger.debug('[TEST] Attempting real Notion integration...');
      page = await notionClient.createSprintReportPage({
        sprintName,
        report,
      });
      summary.notion = 'real';
      console.log(`  ✓ Created Notion page (REAL): ${page.url}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  [TEST] Notion integration failed: ${message}`);
      console.log('  [TEST] Falling back to mock page result.');
      page = {
        id: 'test-mode-mock-page-id',
        url: 'https://notion.so/mock-test-page',
      };
    }
  }

  summary.pageId = page.id;
  summary.pageUrl = page.url;

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST MODE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Sprint:    ${summary.sprintName}`);
  console.log(`Jira:      ${summary.jira.toUpperCase()}`);
  console.log(`OpenAI:    ${summary.openai.toUpperCase()}`);
  console.log(`Notion:    ${summary.notion.toUpperCase()}`);
  console.log(`Page ID:   ${summary.pageId}`);
  console.log(`Page URL:  ${summary.pageUrl}`);
  console.log('='.repeat(60));
  console.log('\n✅ Test mode completed successfully!\n');
}
