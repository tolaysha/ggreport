import OpenAI from 'openai';

import { IS_MOCK, OPENAI_CONFIG } from '../config';
import { logger } from '../utils/logger';

import type {
  SprintReportGenerationContext,
} from './prompts';
import {
  buildStructuredReportPrompt,
  mapOpenAIResponseToSprintReportStructured,
  SYSTEM_PROMPT,
} from './prompts';
import type { SprintReportStructured } from './types';

/**
 * Generate a mock sprint report for testing
 */
function generateMockReport(
  context: SprintReportGenerationContext,
): SprintReportStructured {
  const sprintNumber =
    context.sprintMeta.sprintNumber ??
    (context.sprintMeta.sprintName.match(/(\d+)/)?.[1] ?? '4');
  const nextSprintNumber = String(Number(sprintNumber) + 1);

  return {
    version: {
      number: context.versionMeta?.number ?? '1',
      deadline: context.versionMeta?.deadline ?? '29 Марта 2026',
      goal:
        context.versionMeta?.goal ??
        'Запуск MVP продукта с базовым функционалом для первых пользователей.',
      progressPercent: context.versionMeta?.progressPercent ?? 35,
    },
    sprint: {
      number: sprintNumber,
      startDate: context.sprintMeta.startDate ?? '17 Ноября 2025',
      endDate: context.sprintMeta.endDate ?? '28 Ноября 2025',
      goal:
        context.sprintMeta.goal ??
        'Реализация основного пользовательского сценария и подготовка демо для партнёров.',
      progressPercent: context.sprintMeta.progressPercent ?? 78,
    },
    overview: `В этом спринте команда сфокусировалась на реализации ключевого пользовательского сценария. Мы успешно завершили основную часть запланированных задач, что позволило нам приблизиться к целям версии.

Главным достижением стала возможность для пользователей полноценно работать с основным функционалом продукта. Также была улучшена производительность системы, что положительно скажется на пользовательском опыте.

Часть задач пришлось перенести на следующий спринт из-за необходимости более глубокой проработки требований совместно с партнёрами. Тем не менее, спринт можно считать успешным — мы достигли ${context.sprintMeta.progressPercent ?? 78}% выполнения запланированного объёма работ.`,
    notDone: [
      {
        title: 'Интеграция с внешней системой уведомлений',
        reason:
          'Потребовалось дополнительное согласование формата данных с партнёром',
        requiredForCompletion:
          'Финализировать спецификацию и получить тестовый доступ к системе партнёра',
        newDeadline: 'Спринт ' + nextSprintNumber,
      },
      {
        title: 'Расширенный отчёт для администраторов',
        reason: 'Изменились требования к составу данных в отчёте',
        requiredForCompletion: 'Уточнить требования с заказчиком и обновить макеты',
        newDeadline: 'Спринт ' + nextSprintNumber,
      },
    ],
    achievements: [
      {
        title: 'Запущен основной пользовательский сценарий',
        description:
          'Пользователи теперь могут полностью пройти путь от регистрации до получения результата. Это ключевой функционал продукта.',
      },
      {
        title: 'Улучшена скорость работы системы',
        description:
          'Время отклика системы сократилось на 40%, что делает работу с продуктом более комфортной.',
      },
      {
        title: 'Подготовлена демонстрация для партнёров',
        description:
          'Создан наглядный сценарий демонстрации возможностей продукта, который будет показан на встрече с партнёрами.',
      },
    ],
    artifacts: [
      {
        title: 'Демонстрация основного сценария работы',
        description:
          'Видеозапись полного пользовательского пути от входа в систему до получения результата. Показывает ключевую ценность продукта.',
        jiraLink: 'https://jira.example.com/browse/PROJ-123',
        attachmentsNote: 'Видео (3 мин), скриншоты интерфейса',
      },
      {
        title: 'Обновлённый интерфейс личного кабинета',
        description:
          'Новый дизайн личного кабинета пользователя с улучшенной навигацией и более понятной структурой информации.',
        jiraLink: 'https://jira.example.com/browse/PROJ-124',
        attachmentsNote: 'UX-макеты, скриншоты',
      },
    ],
    nextSprint: {
      sprintNumber: nextSprintNumber,
      goal:
        'Завершить интеграцию с партнёрской системой и подготовить продукт к закрытому бета-тестированию.',
    },
    blockers: [
      {
        title: 'Ожидание доступа к тестовой среде партнёра',
        description:
          'Для завершения интеграции необходим доступ к тестовой среде, который пока не предоставлен.',
        resolutionProposal:
          'Эскалировать запрос через менеджера партнёрской программы, установить крайний срок получения доступа.',
      },
    ],
    pmQuestions: [
      {
        title: 'Приоритет функционала уведомлений',
        description:
          'Предлагаем обсудить, насколько критично наличие уведомлений в реальном времени для первой версии продукта, или можно ограничиться email-уведомлениями.',
      },
      {
        title: 'Расширение команды',
        description:
          'Для ускорения работы над интеграциями рекомендуем рассмотреть возможность привлечения дополнительного специалиста на следующий квартал.',
      },
    ],
  };
}

export class OpenAIClient {
  private client: OpenAI | null = null;
  private model: string;

  constructor() {
    // Only initialize OpenAI client if not in mock mode
    if (!IS_MOCK) {
      this.client = new OpenAI({
        apiKey: OPENAI_CONFIG.apiKey,
      });
    }
    this.model = OPENAI_CONFIG.model;
  }

  /**
   * Generate a structured sprint report using OpenAI
   */
  async generateSprintReportStructured(
    context: SprintReportGenerationContext,
  ): Promise<SprintReportStructured> {
    // Mock mode - return hardcoded data
    if (IS_MOCK) {
      logger.info('[MOCK] Generating mock sprint report...');
      const mockReport = generateMockReport(context);
      logger.info('[MOCK] Mock sprint report generated');
      return mockReport;
    }

    // Real mode - call OpenAI API
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = buildStructuredReportPrompt(context);

    logger.info('Generating structured sprint report with OpenAI...');
    logger.debug('Prompt length', { chars: prompt.length });

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    logger.debug('OpenAI response received', {
      tokens: response.usage?.total_tokens,
    });

    try {
      const rawData = JSON.parse(content);
      const report = mapOpenAIResponseToSprintReportStructured(rawData);
      logger.info('Structured sprint report generated successfully');
      return report;
    } catch (error) {
      logger.error('Failed to parse OpenAI response', { content });
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  }
}

// Singleton instance
export const openaiClient = new OpenAIClient();
