"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notionClient = exports.NotionClient = void 0;
const client_1 = require("@notionhq/client");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const builder_1 = require("./builder");
class NotionClient {
    client = null;
    constructor() {
        // Only initialize Notion client if not in mock mode
        if (!config_1.IS_MOCK) {
            this.client = new client_1.Client({
                auth: config_1.NOTION_CONFIG.apiKey,
            });
        }
    }
    /**
     * Create a sprint report page in Notion
     */
    async createSprintReportPage(data) {
        const { sprintName, report } = data;
        const title = (0, builder_1.buildPageTitle)(sprintName);
        const blocks = (0, builder_1.buildPageBlocks)({ sprintName, report });
        // Mock mode - log what would be created
        if (config_1.IS_MOCK) {
            logger_1.logger.info('[MOCK] Would create Notion page:', { title });
            logger_1.logger.info('[MOCK] Page sections:');
            logger_1.logger.info(`  - Версия №${report.version.number}`);
            logger_1.logger.info(`  - Спринт №${report.sprint.number}`);
            logger_1.logger.info('  - 1. Отчет по итогам реализованного спринта');
            logger_1.logger.info('  - 2. Артефакты по итогам реализованного спринта');
            logger_1.logger.info('  - 3. Планирование следующего спринта');
            logger_1.logger.info('  - 4. Вопросы и предложения от Product Manager');
            // Log detailed block structure
            (0, builder_1.logBlocksStructure)(blocks);
            const mockId = `mock-page-${Date.now()}`;
            const mockUrl = `https://www.notion.so/${mockId}`;
            logger_1.logger.info(`[MOCK] Page would be created with ID: ${mockId}`);
            return {
                id: mockId,
                url: mockUrl,
            };
        }
        // Real mode - create page via Notion API
        if (!this.client) {
            throw new Error('Notion client not initialized');
        }
        logger_1.logger.info(`Creating Notion page: ${title}`);
        logger_1.logger.debug('Page blocks count', { count: blocks.length });
        // Create the page with title
        const page = await this.client.pages.create({
            parent: {
                page_id: config_1.NOTION_CONFIG.parentPageId,
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
        logger_1.logger.info(`Notion page created: ${pageUrl}`);
        return {
            id: page.id,
            url: pageUrl,
        };
    }
}
exports.NotionClient = NotionClient;
// Singleton instance
exports.notionClient = new NotionClient();
//# sourceMappingURL=client.js.map