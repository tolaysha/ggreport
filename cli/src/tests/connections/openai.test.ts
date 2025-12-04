/**
 * OpenAI Connection Test
 *
 * Проверяет соединение с OpenAI API.
 * Выполняет минимальный запрос для проверки авторизации и доступности модели.
 */

import OpenAI from 'openai';

import { isOpenAIConfigured, OPENAI_CONFIG } from '../../config';
import { logger } from '../../utils/logger';

export interface OpenAIConnectionTestResult {
  service: 'OpenAI';
  success: boolean;
  message: string;
  details?: {
    model: string;
    modelsAvailable?: string[];
  };
  error?: string;
}

/**
 * Тестирует соединение с OpenAI API.
 *
 * Выполняет запрос списка моделей для проверки:
 * - Корректности API ключа
 * - Доступности API
 * - Наличия нужной модели
 */
export async function testOpenAIConnection(): Promise<OpenAIConnectionTestResult> {
  const baseResult: OpenAIConnectionTestResult = {
    service: 'OpenAI',
    success: false,
    message: '',
  };

  // Проверка конфигурации
  if (!isOpenAIConfigured()) {
    return {
      ...baseResult,
      message: 'Конфигурация OpenAI не задана',
      error: 'Отсутствует OPENAI_API_KEY',
    };
  }

  try {
    logger.debug('Testing OpenAI connection...', { model: OPENAI_CONFIG.model });

    const client = new OpenAI({
      apiKey: OPENAI_CONFIG.apiKey,
    });

    // Запрос списка моделей — минимальный тест авторизации
    const modelsResponse = await client.models.list();
    const models = modelsResponse.data;

    // Проверяем наличие нужной модели
    const targetModel = OPENAI_CONFIG.model;
    const availableModels = models.map(m => m.id);

    // GPT-4o и другие модели могут иметь варианты (gpt-4o-2024-05-13, etc.)
    const modelAvailable = availableModels.some(
      m => m === targetModel || m.startsWith(targetModel),
    );

    // Фильтруем только релевантные модели для вывода
    const relevantModels = availableModels
      .filter(m => m.startsWith('gpt-') || m.startsWith('o1') || m.startsWith('o3'))
      .slice(0, 10);

    if (!modelAvailable) {
      return {
        service: 'OpenAI',
        success: true,
        message: `Соединение успешно, но модель "${targetModel}" может быть недоступна`,
        details: {
          model: targetModel,
          modelsAvailable: relevantModels,
        },
      };
    }

    return {
      service: 'OpenAI',
      success: true,
      message: `Соединение успешно. Модель "${targetModel}" доступна`,
      details: {
        model: targetModel,
        modelsAvailable: relevantModels,
      },
    };
  } catch (error) {
    let errorMessage = 'Неизвестная ошибка';

    if (error instanceof OpenAI.APIError) {
      const status = error.status;

      if (status === 401) {
        errorMessage = 'Ошибка авторизации (401). Проверьте OPENAI_API_KEY';
      } else if (status === 403) {
        errorMessage = 'Доступ запрещён (403). Проверьте права API ключа';
      } else if (status === 429) {
        errorMessage = 'Превышен лимит запросов (429). Проверьте квоты и лимиты';
      } else if (status === 500 || status === 503) {
        errorMessage = `Сервер OpenAI недоступен (${status}). Попробуйте позже`;
      } else {
        errorMessage = `OpenAI API ошибка ${status}: ${error.message}`;
      }
    } else if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Соединение отклонено. Проверьте сетевое подключение';
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Таймаут соединения. Проверьте сетевое подключение';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      ...baseResult,
      message: 'Не удалось подключиться к OpenAI',
      error: errorMessage,
      details: {
        model: OPENAI_CONFIG.model,
      },
    };
  }
}

