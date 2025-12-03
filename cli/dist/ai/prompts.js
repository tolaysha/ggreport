"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PROMPT = void 0;
exports.buildStructuredReportPrompt = buildStructuredReportPrompt;
exports.mapOpenAIResponseToSprintReportStructured = mapOpenAIResponseToSprintReportStructured;
/**
 * Format issues list for the prompt
 */
function formatIssuesForPrompt(issues) {
    if (issues.length === 0) {
        return 'Нет задач';
    }
    return issues
        .map(i => `- ${i.key}: ${i.summary} | Статус: ${i.status} | Story Points: ${i.storyPoints ?? 0} | Исполнитель: ${i.assignee ?? 'не назначен'}${i.artifact ? ` | Артефакт: ${i.artifact}` : ''}`)
        .join('\n');
}
/**
 * System prompt for the AI model
 */
exports.SYSTEM_PROMPT = `Ты — опытный менеджер продукта, который пишет отчёты по спринтам для партнёров и стейкхолдеров.

ВАЖНЫЕ ПРАВИЛА:
1. Пиши ТОЛЬКО на русском языке.
2. Используй бизнес-язык, понятный партнёрам и руководству.
3. НЕ используй технические термины: API, бэкенд, фронтенд, pipeline, DevOps, архитектура, модели, микросервисы, деплой и т.п.
4. Описывай функционал с точки зрения пользы для пользователя/бизнеса.
5. Будь конкретным, но понятным.
6. Отвечай ТОЛЬКО валидным JSON без markdown-разметки.`;
/**
 * Build the user prompt for generating a structured sprint report
 */
function buildStructuredReportPrompt(context) {
    const { versionMeta, sprintMeta, issues, demoIssues } = context;
    const doneIssues = issues.filter(i => i.statusCategory === 'done');
    const notDoneIssues = issues.filter(i => i.statusCategory !== 'done');
    const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
    const completedPoints = doneIssues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
    const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    return `Сгенерируй структурированный отчёт по спринту.

## ВХОДНЫЕ ДАННЫЕ

### Информация о версии
- Номер версии: ${versionMeta?.number ?? '1'}
- Дедлайн версии: ${versionMeta?.deadline ?? 'не указан'}
- Цель версии: ${versionMeta?.goal ?? 'не указана'}
- Прогресс версии: ${versionMeta?.progressPercent ?? progressPercent}%

### Информация о спринте
- Название спринта: ${sprintMeta.sprintName}
- Номер спринта: ${sprintMeta.sprintNumber ?? extractSprintNumber(sprintMeta.sprintName)}
- Даты: с ${sprintMeta.startDate ?? 'не указано'} по ${sprintMeta.endDate ?? 'не указано'}
- Цель спринта: ${sprintMeta.goal ?? 'не указана'}
- Прогресс: ${sprintMeta.progressPercent ?? progressPercent}%

### Статистика
- Всего задач: ${issues.length}
- Выполнено: ${doneIssues.length}
- Не выполнено: ${notDoneIssues.length}
- Story Points: ${completedPoints}/${totalPoints}

### Выполненные задачи
${formatIssuesForPrompt(doneIssues)}

### Невыполненные задачи
${formatIssuesForPrompt(notDoneIssues)}

### Выбранные задачи для демо (артефакты)
${formatIssuesForPrompt(demoIssues)}

---

## ТРЕБУЕМАЯ СТРУКТУРА ОТВЕТА

Верни JSON объект со следующей структурой:

{
  "version": {
    "number": "номер версии",
    "deadline": "дата дедлайна на русском (например, '29 Марта 2026')",
    "goal": "краткая цель версии (1-2 предложения)",
    "progressPercent": число от 0 до 100
  },
  "sprint": {
    "number": "номер спринта",
    "startDate": "дата начала на русском",
    "endDate": "дата окончания на русском",
    "goal": "краткая цель спринта (1-2 предложения)",
    "progressPercent": число от 0 до 100
  },
  "overview": "Описание сути спринта (5-10 предложений): что планировали, что сделали, какие были сложности, что важно для партнёров. БЕЗ технических терминов!",
  "notDone": [
    {
      "title": "Название задачи простым языком",
      "reason": "Причина, почему не сделано",
      "requiredForCompletion": "Что нужно для завершения",
      "newDeadline": "Новый дедлайн или '—'"
    }
  ],
  "achievements": [
    {
      "title": "Короткий тезис достижения",
      "description": "Пояснение простым языком"
    }
  ],
  "artifacts": [
    {
      "title": "Название артефакта",
      "description": "Описание артефакта и его ценности",
      "jiraLink": "ссылка на задачу (если есть) или null",
      "attachmentsNote": "описание вложений (скриншоты, видео, макеты) или null"
    }
  ],
  "nextSprint": {
    "sprintNumber": "номер следующего спринта",
    "goal": "цель следующего спринта (1-2 предложения)"
  },
  "blockers": [
    {
      "title": "Название блокера",
      "description": "Пояснение",
      "resolutionProposal": "Предлагаемое решение"
    }
  ],
  "pmQuestions": [
    {
      "title": "Вопрос или предложение",
      "description": "Пояснение"
    }
  ]
}

ВАЖНО:
- Все тексты на русском языке
- Массивы могут быть пустыми [], но структура должна быть полной
- Не используй технические термины
- overview должен быть понятен человеку без технического образования
- achievements — это ключевые достижения, выводы и инсайты спринта
- artifacts — основаны на выбранных задачах для демо`;
}
/**
 * Extract sprint number from sprint name
 */
function extractSprintNumber(sprintName) {
    const match = sprintName.match(/(\d+)/);
    return match?.[1] ?? '1';
}
/**
 * Validate and map raw OpenAI response to SprintReportStructured
 */
function mapOpenAIResponseToSprintReportStructured(raw) {
    const data = raw;
    // Helper to safely get nested object
    const getObject = (obj, defaultVal) => typeof obj === 'object' && obj !== null
        ? obj
        : defaultVal;
    // Helper to safely get string
    const getString = (val, defaultVal) => typeof val === 'string' ? val : defaultVal;
    // Helper to safely get number
    const getNumber = (val, defaultVal) => typeof val === 'number' ? val : defaultVal;
    // Helper to safely get array
    const getArray = (val, mapper) => Array.isArray(val) ? val.map(mapper) : [];
    const versionRaw = getObject(data.version, {});
    const sprintRaw = getObject(data.sprint, {});
    const nextSprintRaw = getObject(data.nextSprint, {});
    return {
        version: {
            number: getString(versionRaw.number, '1'),
            deadline: getString(versionRaw.deadline, '—'),
            goal: getString(versionRaw.goal, ''),
            progressPercent: getNumber(versionRaw.progressPercent, 0),
        },
        sprint: {
            number: getString(sprintRaw.number, '1'),
            startDate: getString(sprintRaw.startDate, '—'),
            endDate: getString(sprintRaw.endDate, '—'),
            goal: getString(sprintRaw.goal, ''),
            progressPercent: getNumber(sprintRaw.progressPercent, 0),
        },
        overview: getString(data.overview, ''),
        notDone: getArray(data.notDone, item => {
            const obj = getObject(item, {});
            return {
                title: getString(obj.title, ''),
                reason: getString(obj.reason, ''),
                requiredForCompletion: getString(obj.requiredForCompletion, ''),
                newDeadline: getString(obj.newDeadline, '—'),
            };
        }),
        achievements: getArray(data.achievements, item => {
            const obj = getObject(item, {});
            return {
                title: getString(obj.title, ''),
                description: getString(obj.description, ''),
            };
        }),
        artifacts: getArray(data.artifacts, item => {
            const obj = getObject(item, {});
            const jiraLinkVal = obj.jiraLink;
            const attachmentsNoteVal = obj.attachmentsNote;
            return {
                title: getString(obj.title, ''),
                description: getString(obj.description, ''),
                jiraLink: typeof jiraLinkVal === 'string' && jiraLinkVal ? jiraLinkVal : undefined,
                attachmentsNote: typeof attachmentsNoteVal === 'string' && attachmentsNoteVal
                    ? attachmentsNoteVal
                    : undefined,
            };
        }),
        nextSprint: {
            sprintNumber: getString(nextSprintRaw.sprintNumber, String(Number(getString(sprintRaw.number, '1')) + 1)),
            goal: getString(nextSprintRaw.goal, ''),
        },
        blockers: getArray(data.blockers, item => {
            const obj = getObject(item, {});
            return {
                title: getString(obj.title, ''),
                description: getString(obj.description, ''),
                resolutionProposal: getString(obj.resolutionProposal, ''),
            };
        }),
        pmQuestions: getArray(data.pmQuestions, item => {
            const obj = getObject(item, {});
            return {
                title: getString(obj.title, ''),
                description: getString(obj.description, ''),
            };
        }),
    };
}
//# sourceMappingURL=prompts.js.map