/**
 * Jira Connection Test
 *
 * Проверяет соединение с Jira API.
 * Выполняет минимальный запрос для проверки авторизации и доступности.
 */

import axios from 'axios';

import { isJiraConfigured, JIRA_CONFIG } from '../../config';
import { logger } from '../../utils/logger';

export interface JiraConnectionTestResult {
  service: 'Jira';
  success: boolean;
  message: string;
  details?: {
    baseUrl: string;
    email: string;
    serverInfo?: {
      version: string;
      deploymentType: string;
    };
  };
  error?: string;
}

/**
 * Тестирует соединение с Jira API.
 *
 * Выполняет запрос к /rest/api/3/myself для проверки:
 * - Доступности Jira сервера
 * - Корректности авторизации (email + API token)
 */
export async function testJiraConnection(): Promise<JiraConnectionTestResult> {
  const baseResult: JiraConnectionTestResult = {
    service: 'Jira',
    success: false,
    message: '',
  };

  // Проверка конфигурации
  if (!isJiraConfigured()) {
    return {
      ...baseResult,
      message: 'Конфигурация Jira не задана',
      error: 'Отсутствуют JIRA_BASE_URL, JIRA_EMAIL или JIRA_API_TOKEN',
    };
  }

  const auth = Buffer.from(
    `${JIRA_CONFIG.email}:${JIRA_CONFIG.apiToken}`,
  ).toString('base64');

  try {
    logger.debug('Testing Jira connection...', { baseUrl: JIRA_CONFIG.baseUrl });

    // Запрос информации о текущем пользователе — минимальный тест авторизации
    const response = await axios.get(`${JIRA_CONFIG.baseUrl}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    const user = response.data;

    // Дополнительно запросим информацию о сервере
    let serverInfo: { version: string; deploymentType: string } | undefined;
    try {
      const serverResponse = await axios.get(
        `${JIRA_CONFIG.baseUrl}/rest/api/3/serverInfo`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      serverInfo = {
        version: serverResponse.data.version,
        deploymentType: serverResponse.data.deploymentType,
      };
    } catch {
      // Информация о сервере опциональна
    }

    return {
      service: 'Jira',
      success: true,
      message: `Соединение успешно. Авторизован как: ${user.displayName} (${user.emailAddress})`,
      details: {
        baseUrl: JIRA_CONFIG.baseUrl,
        email: JIRA_CONFIG.email,
        serverInfo,
      },
    };
  } catch (error) {
    let errorMessage = 'Неизвестная ошибка';

    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          errorMessage = 'Ошибка авторизации (401). Проверьте JIRA_EMAIL и JIRA_API_TOKEN';
        } else if (status === 403) {
          errorMessage = 'Доступ запрещён (403). Проверьте права доступа API токена';
        } else if (status === 404) {
          errorMessage = 'Endpoint не найден (404). Проверьте JIRA_BASE_URL';
        } else {
          errorMessage = `HTTP ошибка ${status}: ${error.response.statusText}`;
        }
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Соединение отклонено. Проверьте JIRA_BASE_URL';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Хост не найден. Проверьте JIRA_BASE_URL';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Таймаут соединения. Сервер недоступен';
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      ...baseResult,
      message: 'Не удалось подключиться к Jira',
      error: errorMessage,
      details: {
        baseUrl: JIRA_CONFIG.baseUrl,
        email: JIRA_CONFIG.email,
      },
    };
  }
}

