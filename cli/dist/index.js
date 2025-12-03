#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
function parseArgs(args) {
    const result = {};
    for (const arg of args) {
        if (arg === '--help' || arg === '-h') {
            result.help = true;
        }
        else if (arg === '--dry-run') {
            result.dryRun = true;
        }
        else if (arg.startsWith('--sprint=')) {
            result.sprint = arg.replace('--sprint=', '');
        }
        else if (arg.startsWith('--sprint-id=')) {
            result.sprintId = arg.replace('--sprint-id=', '');
        }
    }
    return result;
}
function printHelp() {
    console.log(`
Sprint Report Generator

Usage:
  npm run sprint-report -- --sprint="Sprint 4"
  npm run sprint-report -- --sprint-id=123
  npm run sprint-report -- --sprint="Sprint 4" --dry-run

Options:
  --sprint=<name>     Sprint name to generate report for
  --sprint-id=<id>    Sprint ID to generate report for
  --dry-run           Generate report but don't create Notion page
  --help, -h          Show this help message

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
async function main() {
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
    // Import config and validate AFTER arg parsing
    // This allows --help to work without valid credentials
    const { validateConfig } = await Promise.resolve().then(() => __importStar(require('./config')));
    try {
        validateConfig();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`\n❌ ${message}\n`);
        process.exit(1);
    }
    // Import remaining modules after config validation
    const { generateSprintReport } = await Promise.resolve().then(() => __importStar(require('./services/sprintReport')));
    const { logger } = await Promise.resolve().then(() => __importStar(require('./utils/logger')));
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
//# sourceMappingURL=index.js.map