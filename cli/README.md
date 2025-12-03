# Sprint Report CLI

A Node.js + TypeScript CLI tool that generates **fully structured sprint report pages** in Notion using:
- Data fetched from Jira (issues of a given sprint)
- AI-generated text in **Russian business language** (using OpenAI API)
- Structured Notion pages matching a specific template

## Project Context

For an overview of what this CLI does and how it fits into the Toys AI project, see:

- [`docs/project-context.md`](docs/project-context.md)

## Report Template

The CLI generates a Notion page with the following structure:

1. **Версия** — Version info callout (number, deadline, goal, progress %)
2. **Спринт** — Sprint info callout (number, dates, goal, progress %)
3. **Отчет по итогам реализованного спринта**
   - Overview спринта (5-10 sentences)
   - Не реализовано в прошедшем спринте (list of incomplete items with reasons)
   - Ключевые достижения, выводы и инсайты спринта
4. **Артефакты по итогам реализованного спринта** — Demo artifacts with descriptions
5. **Планирование следующего спринта** — Next sprint goal and blockers
6. **Вопросы и предложения от Product Manager**

All text is generated in **Russian**, using **business language** without technical jargon (no API, backend, frontend, pipeline, DevOps, etc.).

## Environment Configuration

The CLI uses a local `.env` file to store credentials for external services.

### Security Notes

> ⚠️ **Important Security Practices:**
> - Your `.env` file is **ignored by git** and should **never be committed**.
> - **Never paste real tokens or API keys** into prompts, screenshots, or chat messages.
> - Keep credentials only in your local `.env` file.

### Quick Setup

```bash
cd cli

# Copy the example file
cp env.example.txt .env

# Edit .env and fill in your real values
# (use your favorite editor)
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MOCK_MODE` | No | Set to `"true"` to run with mock data (no external API calls). Default: `false` |
| `JIRA_BASE_URL` | Yes* | Your Jira Cloud instance URL (e.g., `https://your-workspace.atlassian.net`) |
| `JIRA_EMAIL` | Yes* | Email associated with your Jira account |
| `JIRA_API_TOKEN` | Yes* | Jira API token (generate at Atlassian account settings) |
| `JIRA_BOARD_ID` | No | Board ID for sprint name lookups (required if using `--sprint` with name) |
| `JIRA_ARTIFACT_FIELD_ID` | No | Custom field ID for artifact links. Default: `customfield_10001` |
| `NOTION_API_KEY` | Yes* | Notion integration secret |
| `NOTION_PARENT_PAGE_ID` | Yes* | Notion page ID where reports will be created |
| `OPENAI_API_KEY` | Yes* | OpenAI API key |
| `OPENAI_MODEL` | No | OpenAI model to use. Default: `gpt-4o` |

*Required only when `MOCK_MODE` is not `true`.

### Config Validation

The CLI validates your configuration before making any API calls:

```bash
# Real mode — requires all credentials
MOCK_MODE=false npm run sprint-report -- --sprint="Sprint 4"

# Mock mode — credentials can be omitted
MOCK_MODE=true npm run sprint-report -- --sprint="Sprint 4"
```

If any required variable is missing in real mode, you'll see a clear error message:

```
❌ Configuration error: The following required environment variables are not set:
  - Missing JIRA_BASE_URL in environment. Set it in your .env file.
  - Missing OPENAI_API_KEY in environment. Set it in your .env file.

Tip: Copy env.example.txt to .env and fill in your credentials, or set MOCK_MODE=true to test without real APIs.
```

## Setup

### 1. Install dependencies

```bash
cd cli
npm install
```

### 2. Configure environment variables

See [Environment Configuration](#environment-configuration) above.

### Getting API Keys

#### Jira
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create an API token
3. Use your email and the token for authentication
4. Find your board ID in the Jira URL when viewing the board

#### Notion
1. Go to https://www.notion.so/my-integrations
2. Create a new integration
3. Copy the "Internal Integration Secret"
4. Share the parent page with your integration (important!)

#### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a new API key

## Usage

### From project root:

```bash
# By sprint name
npm run sprint-report -- --sprint="Sprint 4"

# By sprint ID
npm run sprint-report -- --sprint-id=123

# Dry run (generate report without creating Notion page)
npm run sprint-report -- --sprint="Sprint 4" --dry-run
```

### From cli directory:

```bash
cd cli
npm run sprint-report -- --sprint="Sprint 4"
```

### Mock Mode

To test the CLI without real Jira, Notion, or OpenAI API calls:

```bash
# Set environment variable inline
MOCK_MODE=true npm run sprint-report -- --sprint="Sprint 4"

# Or add to your .env file:
# MOCK_MODE=true
```

Mock mode will:
- Generate realistic mock Jira issues
- Return a hardcoded structured report (in Russian)
- Log what would be created in Notion without making API calls
- Display the full page structure in the console

This is useful for:
- Testing end-to-end flow without API credentials
- Debugging the report structure
- Demoing the tool

## Options

| Option | Description |
|--------|-------------|
| `--sprint=<name>` | Sprint name to generate report for |
| `--sprint-id=<id>` | Sprint ID to generate report for |
| `--dry-run` | Generate report but don't create Notion page |
| `--help`, `-h` | Show help message |

## Project Structure

```
cli/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── config.ts          # Environment config loader + validation
│   ├── ai/
│   │   ├── types.ts       # Domain types (SprintReportStructured, etc.)
│   │   ├── openaiClient.ts # OpenAI API wrapper
│   │   └── prompts.ts     # Prompt templates for Russian report
│   ├── jira/
│   │   ├── client.ts      # Jira API client
│   │   └── types.ts       # Jira types/interfaces
│   ├── notion/
│   │   ├── client.ts      # Notion API client
│   │   └── builder.ts     # Notion page structure builder
│   ├── services/
│   │   ├── sprintReport.ts # Main pipeline
│   │   └── demoSelector.ts # Demo issue selection
│   └── utils/
│       └── logger.ts      # Logging utility
├── docs/
│   └── project-context.md # Project context for AI assistants
├── .gitignore             # Ignores .env files
├── env.example.txt        # Example environment file (safe to commit)
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **Validate Config**: Checks that all required environment variables are set (in real mode)
2. **Fetch Sprint Data**: Retrieves all issues for the specified sprint from Jira (or uses mock data)
3. **Analyze Issues**: Categorizes issues (done/not done), calculates story points
4. **Select Demo Issues**: Picks 2-3 best issues for demo (prioritizes done issues with artifacts and high story points)
5. **Generate Structured Report**: Sends context to OpenAI to generate a `SprintReportStructured` object in Russian
6. **Create Notion Page**: Builds a formatted Notion page matching the template exactly

## Domain Types

The CLI uses strongly typed domain objects throughout the pipeline:

```typescript
// Main report structure
interface SprintReportStructured {
  version: VersionMeta;           // Версия
  sprint: SprintMeta;             // Спринт
  overview: string;               // Overview спринта
  notDone: NotDoneItem[];         // Не реализовано
  achievements: AchievementItem[];// Достижения
  artifacts: ArtifactItem[];      // Артефакты
  nextSprint: NextSprintPlan;     // Следующий спринт
  blockers: BlockerItem[];        // Блокеры
  pmQuestions: PMQuestionOrProposal[]; // Вопросы PM
}

// Sprint issue (used across the pipeline)
interface SprintIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  storyPoints: number | null;
  assignee: string | null;
  artifact: string | null;
}
```

## Customization

### Custom Artifact Field

If your Jira instance uses a different custom field for artifacts, update `JIRA_ARTIFACT_FIELD_ID` in your `.env` file. You can find the field ID by:

1. Opening a Jira issue with the artifact field filled
2. Viewing the issue via API: `GET /rest/api/3/issue/{issueKey}`
3. Looking for the field value in the response

### Demo Selection Logic

The demo selector in `src/services/demoSelector.ts` uses simple heuristics:
- Prefers done issues with artifacts
- Prefers issues with higher story points
- Can be extended to use LLM-based selection in the future

### Report Language and Style

The report is generated in **Russian business language**. To modify:
- Edit prompts in `src/ai/prompts.ts`
- Adjust the `SYSTEM_PROMPT` constant for style guidelines
- Modify `buildStructuredReportPrompt()` for structure changes

## Development

```bash
cd cli

# Build TypeScript
npm run build

# Run with ts-node (development)
npm run dev -- --sprint="Sprint 4"

# Test with mock mode
MOCK_MODE=true npm run dev -- --sprint="Sprint 4"
```

## Troubleshooting

### "Configuration error: Missing required environment variables"
- Ensure all required variables are set in `cli/.env`
- Check the file is named `.env` (not `.env.example`)
- Use `MOCK_MODE=true` to test without real credentials

### "Sprint not found"
- Make sure `JIRA_BOARD_ID` is set when searching by sprint name
- Check that the sprint name matches exactly (case-insensitive)

### Notion API errors
- Verify the parent page is shared with your integration
- Check that `NOTION_PARENT_PAGE_ID` is correct (use the page ID, not URL)

### OpenAI errors
- Verify your API key is valid and has sufficient credits
- The model `gpt-4o` is used by default; ensure your account has access
