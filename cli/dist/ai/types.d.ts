/**
 * Domain types for the structured sprint report.
 * These types represent all parts of the report and are the ONLY way
 * the rest of the pipeline should interact with the AI report.
 */
export interface VersionMeta {
    number: string;
    deadline: string;
    goal: string;
    progressPercent: number;
}
export interface SprintMeta {
    number: string;
    startDate: string;
    endDate: string;
    goal: string;
    progressPercent: number;
}
export interface NotDoneItem {
    title: string;
    reason: string;
    requiredForCompletion: string;
    newDeadline: string;
}
export interface AchievementItem {
    title: string;
    description: string;
}
export interface ArtifactItem {
    title: string;
    description: string;
    jiraLink?: string;
    attachmentsNote?: string;
}
export interface NextSprintPlan {
    sprintNumber: string;
    goal: string;
}
export interface BlockerItem {
    title: string;
    description: string;
    resolutionProposal: string;
}
export interface PMQuestionOrProposal {
    title: string;
    description: string;
}
/**
 * The fully structured sprint report matching the Notion template.
 * All text is in Russian, business language without technical jargon.
 */
export interface SprintReportStructured {
    version: VersionMeta;
    sprint: SprintMeta;
    overview: string;
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
    statusCategory: string;
    storyPoints: number | null;
    assignee: string | null;
    artifact: string | null;
}
//# sourceMappingURL=types.d.ts.map