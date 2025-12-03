import type { SprintIssue, SprintReportStructured, VersionMeta } from './types';
/**
 * Base project context for AI prompts.
 * See docs/project-context.md for the full description.
 *
 * TODO: This constant can be used when building system/context prompts for LLM calls
 * to provide consistent project understanding across different AI interactions.
 */
export declare const BASE_PROJECT_CONTEXT = "\nThis CLI is part of the Toys AI project. It generates sprint reports in Notion using Jira data and AI-generated text.\n\nKey domain types:\n- SprintIssue: normalized Jira issue (key, summary, status, storyPoints, assignee, artifact)\n- SprintReportStructured: AI-generated report sections (version, sprint, overview, notDone, achievements, artifacts, nextSprint, blockers, pmQuestions)\n- NotionPageResult: created page info (id, url)\n\nThe pipeline: Jira \u2192 SprintIssue[] \u2192 AI \u2192 SprintReportStructured \u2192 Notion page.\n\nSee docs/project-context.md in the repo for full context.\n";
/**
 * Context for generating a structured sprint report
 */
export interface SprintReportGenerationContext {
    versionMeta?: Partial<VersionMeta>;
    sprintMeta: {
        sprintName: string;
        sprintNumber?: string;
        startDate?: string;
        endDate?: string;
        goal?: string;
        progressPercent?: number;
    };
    issues: SprintIssue[];
    demoIssues: SprintIssue[];
}
/**
 * System prompt for the AI model
 */
export declare const SYSTEM_PROMPT = "\u0422\u044B \u2014 \u043E\u043F\u044B\u0442\u043D\u044B\u0439 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043F\u0438\u0448\u0435\u0442 \u043E\u0442\u0447\u0451\u0442\u044B \u043F\u043E \u0441\u043F\u0440\u0438\u043D\u0442\u0430\u043C \u0434\u043B\u044F \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u043E\u0432 \u0438 \u0441\u0442\u0435\u0439\u043A\u0445\u043E\u043B\u0434\u0435\u0440\u043E\u0432.\n\n\u0412\u0410\u0416\u041D\u042B\u0415 \u041F\u0420\u0410\u0412\u0418\u041B\u0410:\n1. \u041F\u0438\u0448\u0438 \u0422\u041E\u041B\u042C\u041A\u041E \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C \u044F\u0437\u044B\u043A\u0435.\n2. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0431\u0438\u0437\u043D\u0435\u0441-\u044F\u0437\u044B\u043A, \u043F\u043E\u043D\u044F\u0442\u043D\u044B\u0439 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u0430\u043C \u0438 \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u0443.\n3. \u041D\u0415 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0442\u0435\u0440\u043C\u0438\u043D\u044B: API, \u0431\u044D\u043A\u0435\u043D\u0434, \u0444\u0440\u043E\u043D\u0442\u0435\u043D\u0434, pipeline, DevOps, \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0430, \u043C\u043E\u0434\u0435\u043B\u0438, \u043C\u0438\u043A\u0440\u043E\u0441\u0435\u0440\u0432\u0438\u0441\u044B, \u0434\u0435\u043F\u043B\u043E\u0439 \u0438 \u0442.\u043F.\n4. \u041E\u043F\u0438\u0441\u044B\u0432\u0430\u0439 \u0444\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B \u0441 \u0442\u043E\u0447\u043A\u0438 \u0437\u0440\u0435\u043D\u0438\u044F \u043F\u043E\u043B\u044C\u0437\u044B \u0434\u043B\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F/\u0431\u0438\u0437\u043D\u0435\u0441\u0430.\n5. \u0411\u0443\u0434\u044C \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u043C, \u043D\u043E \u043F\u043E\u043D\u044F\u0442\u043D\u044B\u043C.\n6. \u041E\u0442\u0432\u0435\u0447\u0430\u0439 \u0422\u041E\u041B\u042C\u041A\u041E \u0432\u0430\u043B\u0438\u0434\u043D\u044B\u043C JSON \u0431\u0435\u0437 markdown-\u0440\u0430\u0437\u043C\u0435\u0442\u043A\u0438.";
/**
 * Build the user prompt for generating a structured sprint report
 */
export declare function buildStructuredReportPrompt(context: SprintReportGenerationContext): string;
/**
 * Validate and map raw OpenAI response to SprintReportStructured
 */
export declare function mapOpenAIResponseToSprintReportStructured(raw: unknown): SprintReportStructured;
//# sourceMappingURL=prompts.d.ts.map