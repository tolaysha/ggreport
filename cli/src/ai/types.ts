/**
 * Domain types for the structured sprint report.
 * These types represent all parts of the report and are the ONLY way
 * the rest of the pipeline should interact with the AI report.
 */

export interface VersionMeta {
  number: string;            // e.g. "1"
  deadline: string;          // e.g. "29 Марта 2026"
  goal: string;              // 1–2 sentences
  progressPercent: number;   // 0–100
}

export interface SprintMeta {
  number: string;            // e.g. "4"
  startDate: string;         // e.g. "17 Ноября 2025"
  endDate: string;           // e.g. "28 Ноября 2025"
  goal: string;              // 1–2 sentences
  progressPercent: number;   // 0–100
}

export interface NotDoneItem {
  title: string;             // Задача простым языком
  reason: string;            // Причина не реализации простым языком
  requiredForCompletion: string; // Что нужно сделать для завершения
  newDeadline: string;       // Новый дедлайн реализации (может быть "—" или конкретная дата)
}

export interface AchievementItem {
  title: string;             // Короткий тезис
  description: string;       // Простое пояснение
}

export interface ArtifactItem {
  title: string;             // Название артефакта
  description: string;       // Простое описание артефакта
  jiraLink?: string;         // Ссылка на эпик / задачу
  attachmentsNote?: string;  // Краткое описание вложений ("скриншоты", "видео", "UX-макеты" и т.п.)
}

export interface NextSprintPlan {
  sprintNumber: string;      // Номер следующего спринта
  goal: string;              // 1–2 предложения о ключевой цели
}

export interface BlockerItem {
  title: string;             // Блокер простым языком
  description: string;       // Дополнительные пояснения
  resolutionProposal: string;// Предлагаемый способ устранения
}

export interface PMQuestionOrProposal {
  title: string;             // Тезис простым языком
  description: string;       // Пояснение по вопросу или предложению
}

/**
 * The fully structured sprint report matching the Notion template.
 * All text is in Russian, business language without technical jargon.
 */
export interface SprintReportStructured {
  version: VersionMeta;
  sprint: SprintMeta;
  overview: string;              // 5–10 предложений
  notDone: NotDoneItem[];
  achievements: AchievementItem[];
  artifacts: ArtifactItem[];
  nextSprint: NextSprintPlan;
  blockers: BlockerItem[];
  pmQuestions: PMQuestionOrProposal[];
}

/**
 * Result of creating a Notion page
 */
export interface NotionPageResult {
  id: string;
  url: string;
}

/**
 * Domain type for sprint issues (used across the pipeline)
 */
export interface SprintIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string; // 'done' | 'indeterminate' | 'new'
  storyPoints: number | null;
  assignee: string | null;
  artifact: string | null;
}

