import { Client } from '@notionhq/client';

import type { NotionPageResult, SprintReportStructured } from '../ai/types';
import { IS_MOCK, NOTION_CONFIG } from '../config';
import { logger } from '../utils/logger';

import { buildPageBlocks, buildPageTitle, logBlocksStructure } from './builder';

/**
 * Input data for creating a sprint report page
 */
export interface CreateSprintReportPageInput {
  sprintName: string;
  report: SprintReportStructured;
}

export class NotionClient {
  private client: Client | null = null;

  constructor() {
    // Only initialize Notion client if not in mock mode
    if (!IS_MOCK) {
      this.client = new Client({
        auth: NOTION_CONFIG.apiKey,
      });
    }
  }

  /**
   * Create a sprint report page in Notion
   */
  async createSprintReportPage(
    data: CreateSprintReportPageInput,
  ): Promise<NotionPageResult> {
    const { sprintName, report } = data;
    const title = buildPageTitle(sprintName);
    const blocks = buildPageBlocks({ sprintName, report });

    // Mock mode - log what would be created
    if (IS_MOCK) {
      logger.info('[MOCK] Would create Notion page:', { title });
      logger.info('[MOCK] Page sections:');
      logger.info(`  - Версия №${report.version.number}`);
      logger.info(`  - Спринт №${report.sprint.number}`);
      logger.info('  - 1. Отчет по итогам реализованного спринта');
      logger.info('  - 2. Артефакты по итогам реализованного спринта');
      logger.info('  - 3. Планирование следующего спринта');
      logger.info('  - 4. Вопросы и предложения от Product Manager');

      // Log detailed block structure
      logBlocksStructure(blocks);

      const mockId = `mock-page-${Date.now()}`;
      const mockUrl = `https://www.notion.so/${mockId}`;

      logger.info(`[MOCK] Page would be created with ID: ${mockId}`);

      return {
        id: mockId,
        url: mockUrl,
      };
    }

    // Real mode - create page via Notion API
    if (!this.client) {
      throw new Error('Notion client not initialized');
    }

    logger.info(`Creating Notion page: ${title}`);
    logger.debug('Page blocks count', { count: blocks.length });

    // Create the page with title
    const page = await this.client.pages.create({
      parent: {
        page_id: NOTION_CONFIG.parentPageId,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      // Notion API limits blocks to 100 per request
      children: blocks.slice(0, 100),
    });

    // If we have more than 100 blocks, append them in batches
    if (blocks.length > 100) {
      const remainingBlocks = blocks.slice(100);
      const batchSize = 100;

      for (let i = 0; i < remainingBlocks.length; i += batchSize) {
        const batch = remainingBlocks.slice(i, i + batchSize);
        await this.client.blocks.children.append({
          block_id: page.id,
          children: batch,
        });
      }
    }

    // Extract the page URL
    const pageUrl = `https://www.notion.so/${page.id.replace(/-/g, '')}`;

    logger.info(`Notion page created: ${pageUrl}`);

    return {
      id: page.id,
      url: pageUrl,
    };
  }
}

// Singleton instance
export const notionClient = new NotionClient();
