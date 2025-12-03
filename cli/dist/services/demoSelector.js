"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectDemoIssues = selectDemoIssues;
const logger_1 = require("../utils/logger");
const DEFAULT_OPTIONS = {
    maxDemos: 3,
    preferWithArtifact: true,
    preferHighPoints: true,
};
/**
 * Select top issues for demo based on simple heuristics.
 *
 * Priority:
 * 1. Done issues with artifacts and high story points
 * 2. Done issues with artifacts
 * 3. Done issues with high story points
 * 4. Other done issues
 */
function selectDemoIssues(issues, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    // Only consider done issues
    const doneIssues = issues.filter(i => i.statusCategory === 'done');
    if (doneIssues.length === 0) {
        logger_1.logger.warn('No done issues found for demo selection');
        return [];
    }
    // Score each issue
    const scored = doneIssues.map(issue => {
        let score = 0;
        // Artifact bonus
        if (opts.preferWithArtifact && issue.artifact) {
            score += 100;
        }
        // Story points bonus
        if (opts.preferHighPoints && issue.storyPoints) {
            score += issue.storyPoints * 10;
        }
        // Small bonus for having an assignee (accountability)
        if (issue.assignee) {
            score += 5;
        }
        return { issue, score };
    });
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    // Take top N
    const selected = scored.slice(0, opts.maxDemos).map(s => s.issue);
    logger_1.logger.info(`Selected ${selected.length} demo issues`, {
        issues: selected.map(i => i.key),
    });
    return selected;
}
//# sourceMappingURL=demoSelector.js.map