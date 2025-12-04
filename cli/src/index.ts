#!/usr/bin/env node

interface CliArgs {
  sprint?: string;
  sprintId?: string;
  dryRun?: boolean;
  help?: boolean;
  test?: boolean;
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {};

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--test' || arg === '--e2e-test') {
      result.test = true;
    } else if (arg.startsWith('--sprint=')) {
      result.sprint = arg.replace('--sprint=', '');
    } else if (arg.startsWith('--sprint-id=')) {
      result.sprintId = arg.replace('--sprint-id=', '');
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Sprint Report Generator

Usage:
  npm run sprint-report -- --sprint="Sprint 4"
  npm run sprint-report -- --sprint-id=123
  npm run sprint-report -- --sprint="Sprint 4" --dry-run
  npm run sprint-report:test                              # E2E test mode

Options:
  --sprint=<name>     Sprint name to generate report for
  --sprint-id=<id>    Sprint ID to generate report for
  --dry-run           Generate report but don't create Notion page
  --test              Run in E2E test mode (resilient, always succeeds)
  --help, -h          Show this help message

Test Mode (--test):
  Runs the entire pipeline with resilient fallbacks:
  - Tries real Jira/OpenAI/Notion if configured
  - Falls back to mocks for any integration that fails or is not configured
  - Always completes successfully (exit code 0)
  - Useful for verifying the pipeline is wired correctly

Environment Variables (set in cli/.env):
  MOCK_MODE             Set to "true" to run with mock data (no API calls)
  JIRA_BASE_URL         Jira instance URL
  JIRA_EMAIL            Jira account email
  JIRA_API_TOKEN        Jira API token
  JIRA_BOARD_ID         Jira board ID (required for sprint name lookup)
  JIRA_ARTIFACT_FIELD_ID  Custom field ID for artifact
  NOTION_API_KEY        Notion API key
  NOTION_PARENT_PAGE_ID Parent page ID for reports
  OPENAI_API_KEY        OpenAI API key
  OPENAI_MODEL          OpenAI model (default: gpt-4o)

For more information, see: cli/README.md
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Help can run without config validation
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const sprintNameOrId = args.sprint ?? args.sprintId;

  if (!sprintNameOrId) {
    console.error('Error: Please provide --sprint or --sprint-id');
    printHelp();
    process.exit(1);
  }

  // Test mode: resilient pipeline that always succeeds
  if (args.test) {
    const { runSprintReportTestMode } = await import('./services/sprintReport');
    const { logger } = await import('./utils/logger');

    logger.info('Starting sprint report generation in TEST MODE', {
      sprint: sprintNameOrId,
    });

    console.log('\n🧪 Running in E2E TEST MODE...\n');

    await runSprintReportTestMode({ sprintNameOrId });

    // Test mode always exits with 0
    process.exit(0);
  }

  // Normal mode: Import config and validate AFTER arg parsing
  // This allows --help to work without valid credentials
  const { validateConfig } = await import('./config');

  try {
    validateConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ ${message}\n`);
    process.exit(1);
  }

  // Import remaining modules after config validation
  const { generateSprintReport } = await import('./services/sprintReport');
  const { logger } = await import('./utils/logger');

  logger.info('Starting sprint report generation', {
    sprint: sprintNameOrId,
    dryRun: args.dryRun ?? false,
  });

  const result = await generateSprintReport({
    sprintNameOrId,
    dryRun: args.dryRun,
  });

  if (!result.success) {
    console.error(`\n❌ Error: ${result.error}\n`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
