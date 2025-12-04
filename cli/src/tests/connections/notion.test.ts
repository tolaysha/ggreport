/**
 * Notion Connection Test
 *
 * Проверяет соединение с Notion API.
 * Выполняет минимальный запрос для проверки авторизации и доступности родительской страницы.
 */

import { Client } from '@notionhq/client';

import { isNotionConfigured, NOTION_CONFIG } from '../../config';
import { logger } from '../../utils/logger';

export interface NotionConnectionTestResult {
  service: 'Notion';
  success: boolean;
  message: string;
  details?: {
    parentPageId: string;
    pageTitle?: string;
    workspaceName?: string;
  };
  error?: string;
}

/**
 * Тестирует соединение с Notion API.
 *
 * Выполняет запрос к родительской странице для проверки:
 * - Корректности API ключа
 * - Доступности родительской страницы
 * - Наличия прав на создание дочерних страниц
 */
export async function testNotionConnection(): Promise<NotionConnectionTestResult> {
  const baseResult: NotionConnectionTestResult = {
    service: 'Notion',
    success: false,
    message: '',
  };

  // Проверка конфигурации
  if (!isNotionConfigured()) {
    return {
      ...baseResult,
      message: 'Конфигурация Notion не задана',
      error: 'Отсутствуют NOTION_API_KEY или NOTION_PARENT_PAGE_ID',
    };
  }

  try {
    logger.debug('Testing Notion connection...', {
      parentPageId: NOTION_CONFIG.parentPageId,
    });

    const client = new Client({
      auth: NOTION_CONFIG.apiKey,
    });

    // Проверяем доступ к родительской странице
    const page = await client.pages.retrieve({
      page_id: NOTION_CONFIG.parentPageId,
    });

    // Извлекаем заголовок страницы
    let pageTitle = 'Без названия';
    if ('properties' in page && page.properties.title) {
      const titleProp = page.properties.title;
      if ('title' in titleProp && Array.isArray(titleProp.title)) {
        pageTitle = titleProp.title.map((t: { plain_text: string }) => t.plain_text).join('') || 'Без названия';
      }
    }

    // Попробуем получить информацию о пользователе (workspace)
    let workspaceName: string | undefined;
    try {
      const users = await client.users.list({ page_size: 1 });
      if (users.results.length > 0) {
        const user = users.results[0];
        if (user && 'name' in user) {
          workspaceName = user.name ?? undefined;
        }
      }
    } catch {
      // Информация о workspace опциональна
    }

    return {
      service: 'Notion',
      success: true,
      message: `Соединение успешно. Родительская страница: "${pageTitle}"`,
      details: {
        parentPageId: NOTION_CONFIG.parentPageId,
        pageTitle,
        workspaceName,
      },
    };
  } catch (error) {
    let errorMessage = 'Неизвестная ошибка';

    if (error && typeof error === 'object' && 'code' in error) {
      const notionError = error as { code: string; message?: string; status?: number };

      switch (notionError.code) {
        case 'unauthorized':
          errorMessage = 'Ошибка авторизации. Проверьте NOTION_API_KEY';
          break;
        case 'object_not_found':
          errorMessage =
            'Страница не найдена. Проверьте NOTION_PARENT_PAGE_ID и убедитесь, что интеграция подключена к странице';
          break;
        case 'restricted_resource':
          errorMessage =
            'Доступ к странице запрещён. Подключите интеграцию к родительской странице через меню Share';
          break;
        case 'rate_limited':
          errorMessage = 'Превышен лимит запросов. Попробуйте позже';
          break;
        case 'validation_error':
          errorMessage = `Ошибка валидации: ${notionError.message}`;
          break;
        default:
          errorMessage = notionError.message ?? `Ошибка Notion API: ${notionError.code}`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      ...baseResult,
      message: 'Не удалось подключиться к Notion',
      error: errorMessage,
      details: {
        parentPageId: NOTION_CONFIG.parentPageId,
      },
    };
  }
}

