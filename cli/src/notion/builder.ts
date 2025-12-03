import type { BlockObjectRequest } from '@notionhq/client/build/src/api-endpoints';

import type { SprintReportStructured } from '../ai/types';

/**
 * Data required to build a sprint report page
 */
export interface SprintReportPageData {
  sprintName: string;
  report: SprintReportStructured;
}

// =============================================================================
// Block Builder Helpers
// =============================================================================

/**
 * Create a paragraph block with plain text
 */
function paragraph(text: string): BlockObjectRequest {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

/**
 * Create a paragraph block with bold text
 */
function paragraphBold(text: string): BlockObjectRequest {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: { content: text },
          annotations: { bold: true },
        },
      ],
    },
  };
}

/**
 * Create a heading 1 block
 */
function heading1(text: string): BlockObjectRequest {
  return {
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

/**
 * Create a heading 2 block
 */
function heading2(text: string): BlockObjectRequest {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

/**
 * Create a heading 3 block
 */
function heading3(text: string): BlockObjectRequest {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

/**
 * Create a bulleted list item
 */
function bulletItem(text: string): BlockObjectRequest {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  };
}

/**
 * Create a divider block
 */
function divider(): BlockObjectRequest {
  return {
    object: 'block',
    type: 'divider',
    divider: {},
  };
}

/**
 * Create a callout block with multiline content
 * The emoji parameter must be a valid Notion emoji
 */
function calloutMultiline(
  lines: string[],
  emoji: string,
): BlockObjectRequest {
  const richText = lines.flatMap((line, index) => {
    const parts: Array<{
      type: 'text';
      text: { content: string };
      annotations?: { bold?: boolean };
    }> = [];

    // First line is bold
    if (index === 0) {
      parts.push({
        type: 'text',
        text: { content: line },
        annotations: { bold: true },
      });
    } else {
      parts.push({
        type: 'text',
        text: { content: line },
      });
    }

    // Add newline if not last line
    if (index < lines.length - 1) {
      parts.push({
        type: 'text',
        text: { content: '\n' },
      });
    }

    return parts;
  });

  return {
    object: 'block',
    type: 'callout',
    callout: {
      icon: { type: 'emoji', emoji: emoji as '🚀' },
      rich_text: richText,
    },
  };
}

// =============================================================================
// Page Building Functions
// =============================================================================

/**
 * Build the page title for a sprint report
 */
export function buildPageTitle(sprintName: string): string {
  const date = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `Отчёт по спринту: ${sprintName} (${date})`;
}

/**
 * Build the version callout (aside) block
 */
function buildVersionCallout(report: SprintReportStructured): BlockObjectRequest {
  const { version } = report;
  return calloutMultiline(
    [
      `Версия №${version.number} — дедлайн реализации ${version.deadline}`,
      `Цель версии — ${version.goal}`,
      `Версия реализована на ${version.progressPercent}%`,
    ],
    '🚀',
  );
}

/**
 * Build the sprint callout (aside) block
 */
function buildSprintCallout(report: SprintReportStructured): BlockObjectRequest {
  const { sprint } = report;
  return calloutMultiline(
    [
      `Спринт №${sprint.number} — срок реализации с ${sprint.startDate} по ${sprint.endDate}`,
      `Цель спринта — ${sprint.goal}`,
      `Спринт реализован на ${sprint.progressPercent}%`,
    ],
    '✅',
  );
}

/**
 * Build section 1: Sprint Report Results
 */
function buildSection1Blocks(report: SprintReportStructured): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  // Section heading
  blocks.push(heading1('1. Отчет по итогам реализованного спринта:'));

  // Placeholder for timeline screenshot
  blocks.push(
    paragraph(
      '[Скриншот timeline спринта из Jira будет добавлен вручную]',
    ),
  );

  blocks.push(divider());

  // Overview subsection
  blocks.push(heading2('Overview спринта:'));
  blocks.push(paragraph(report.overview));

  blocks.push(divider());

  // Not done subsection
  blocks.push(paragraphBold('Не реализовано в прошедшем спринте:'));

  if (report.notDone.length === 0) {
    blocks.push(paragraph('Все задачи спринта выполнены.'));
  } else {
    for (const item of report.notDone) {
      const text = `${item.title} — ${item.reason}; нужно: ${item.requiredForCompletion}; новый дедлайн: ${item.newDeadline}`;
      blocks.push(bulletItem(text));
    }
  }

  blocks.push(divider());

  // Achievements subsection
  blocks.push(paragraphBold('Ключевые достижения, выводы и инсайты спринта:'));

  if (report.achievements.length === 0) {
    blocks.push(paragraph('—'));
  } else {
    for (const item of report.achievements) {
      const text = `${item.title} — ${item.description}`;
      blocks.push(bulletItem(text));
    }
  }

  return blocks;
}

/**
 * Build section 2: Artifacts
 */
function buildSection2Blocks(report: SprintReportStructured): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  blocks.push(heading1('2. Артефакты по итогам реализованного спринта:'));

  if (report.artifacts.length === 0) {
    blocks.push(paragraph('Артефакты будут добавлены позже.'));
  } else {
    for (const artifact of report.artifacts) {
      // Artifact title
      blocks.push(heading3(artifact.title));

      // Description
      blocks.push(paragraph(`Описание: ${artifact.description}`));

      // Jira link if present
      if (artifact.jiraLink) {
        blocks.push(paragraph(`Эпик / задача в Jira: ${artifact.jiraLink}`));
      }

      // Attachments note if present
      if (artifact.attachmentsNote) {
        blocks.push(paragraph(`Артефакты: ${artifact.attachmentsNote}`));
      }

      // Placeholder for actual artifacts
      blocks.push(
        paragraph('[Скриншоты/видео/макеты будут добавлены вручную]'),
      );

      blocks.push(divider());
    }
  }

  return blocks;
}

/**
 * Build section 3: Next Sprint Plan
 */
function buildSection3Blocks(report: SprintReportStructured): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  blocks.push(heading1('3. Планирование следующего спринта:'));

  // Sprint number and goal
  blocks.push(paragraphBold(`Спринт №${report.nextSprint.sprintNumber}`));
  blocks.push(
    paragraph(`Цель следующего спринта — ${report.nextSprint.goal}`),
  );

  // Placeholder for timeline screenshot
  blocks.push(
    paragraph(
      '[Скриншот timeline следующего спринта из Jira будет добавлен вручную]',
    ),
  );

  blocks.push(divider());

  // Blockers subsection
  blocks.push(paragraphBold('Блокеры для реализации следующего спринта:'));

  if (report.blockers.length === 0) {
    blocks.push(paragraph('Нет'));
  } else {
    for (const blocker of report.blockers) {
      const text = `${blocker.title} — ${blocker.description}; предложенное решение: ${blocker.resolutionProposal}`;
      blocks.push(bulletItem(text));
    }
  }

  return blocks;
}

/**
 * Build section 4: PM Questions and Proposals
 */
function buildSection4Blocks(report: SprintReportStructured): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  blocks.push(heading1('4. Вопросы и предложения от Product Manager:'));

  if (report.pmQuestions.length === 0) {
    blocks.push(paragraph('Нет'));
  } else {
    for (const question of report.pmQuestions) {
      const text = `${question.title} — ${question.description}`;
      blocks.push(bulletItem(text));
    }
  }

  return blocks;
}

/**
 * Build all content blocks for the sprint report page
 * Matches the exact template structure
 */
export function buildPageBlocks(data: SprintReportPageData): BlockObjectRequest[] {
  const { report } = data;
  const blocks: BlockObjectRequest[] = [];

  // Top section: Version and Sprint callouts
  blocks.push(buildVersionCallout(report));
  blocks.push(buildSprintCallout(report));

  blocks.push(divider());

  // Section 1: Sprint Report Results
  blocks.push(...buildSection1Blocks(report));

  blocks.push(divider());

  // Section 2: Artifacts
  blocks.push(...buildSection2Blocks(report));

  // Section 3: Next Sprint Plan
  blocks.push(...buildSection3Blocks(report));

  blocks.push(divider());

  // Section 4: PM Questions
  blocks.push(...buildSection4Blocks(report));

  return blocks;
}

/**
 * Log the structure of blocks that would be created (for mock mode)
 */
export function logBlocksStructure(blocks: BlockObjectRequest[]): void {
  console.log('\n📄 Notion page structure:');
  console.log('─'.repeat(50));

  for (const block of blocks) {
    const type = block.type;
    let preview = '';

    switch (type) {
      case 'heading_1':
        preview = `H1: ${(block as { heading_1: { rich_text: Array<{ text: { content: string } }> } }).heading_1.rich_text[0]?.text.content ?? ''}`;
        break;
      case 'heading_2':
        preview = `  H2: ${(block as { heading_2: { rich_text: Array<{ text: { content: string } }> } }).heading_2.rich_text[0]?.text.content ?? ''}`;
        break;
      case 'heading_3':
        preview = `    H3: ${(block as { heading_3: { rich_text: Array<{ text: { content: string } }> } }).heading_3.rich_text[0]?.text.content ?? ''}`;
        break;
      case 'paragraph':
        const pText = (block as { paragraph: { rich_text: Array<{ text: { content: string } }> } }).paragraph.rich_text[0]?.text.content ?? '';
        preview = `    P: ${pText.substring(0, 60)}${pText.length > 60 ? '...' : ''}`;
        break;
      case 'bulleted_list_item':
        const bText = (block as { bulleted_list_item: { rich_text: Array<{ text: { content: string } }> } }).bulleted_list_item.rich_text[0]?.text.content ?? '';
        preview = `    • ${bText.substring(0, 55)}${bText.length > 55 ? '...' : ''}`;
        break;
      case 'callout':
        const cText = (block as { callout: { rich_text: Array<{ text: { content: string } }> } }).callout.rich_text[0]?.text.content ?? '';
        preview = `  📌 Callout: ${cText.substring(0, 45)}${cText.length > 45 ? '...' : ''}`;
        break;
      case 'divider':
        preview = '  ─────────';
        break;
      default:
        preview = `  [${type}]`;
    }

    console.log(preview);
  }

  console.log('─'.repeat(50));
  console.log(`Total blocks: ${blocks.length}\n`);
}
