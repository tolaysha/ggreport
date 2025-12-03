# Project Context: Toys AI Sprint Report Automation

## 1. High-level Project Description

This repo contains a Node.js + TypeScript CLI tool that automates creation of sprint reports in Notion using data from Jira and AI-generated text.

The broader product context is the **Toys AI** project — an AI-powered physical toy-tutor for kids that combines:
- a physical device ("Smart Core" + covers),
- an AI voice interaction pipeline,
- educational and emotional interaction scenarios.

This CLI is a tooling/operation layer for the engineering/product process: it helps generate clear, partner-ready sprint reports from Jira to Notion.

## 2. What the CLI Does

The CLI:
- fetches sprint issues from Jira (by sprint name or ID),
- aggregates and normalizes them into internal domain types (`SprintIssue`),
- selects 2–3 demo issues that are good for showcasing to partners (Done, have artifacts, high impact),
- calls an AI model (OpenAI) to generate structured text sections:
  - Sprint summary
  - What was done
  - What was not done and why
  - Demo section with highlights
- creates a Notion page with separate sections/blocks based on this data.

There is also a MOCK mode:
- when `MOCK_MODE=true`, the tool uses fake Jira issues, fake AI text, and simulates Notion page creation.
- this allows us to develop and test the pipeline without real API calls.

## 3. Domain Types

The main domain types in the codebase are:

- `SprintIssue` — normalized representation of a Jira issue for sprint reporting:
  - `key`, `summary`, `status`, `statusCategory`, `storyPoints`, `assignee`, `artifact`.
- `SprintReportStructured` — the structured result of AI generation:
  - `version`, `sprint`, `overview`, `notDone`, `achievements`, `artifacts`, `nextSprint`, `blockers`, `pmQuestions`.
- `NotionPageResult` — the result of creating a Notion page:
  - `id`, `url`.

The pipeline operates only on these domain types. Integration details with Jira/Notion/OpenAI are hidden behind adapters that map raw API responses to these types.

## 4. Current Goals for This Tool

- Make sprint reporting fast and consistent.
- Provide partner-facing, human-readable summaries in Russian without manual copy-paste.
- Keep integration details (Jira, Notion, OpenAI) decoupled from the reporting logic, so we can:
  - change field mappings,
  - adjust prompts and AI behavior,
  - or swap tools, without rewriting the pipeline.

## 5. Report Template

The generated Notion page follows a specific template in Russian:
1. **Версия** — Version info callout (number, deadline, goal, progress %)
2. **Спринт** — Sprint info callout (number, dates, goal, progress %)
3. **Отчет по итогам реализованного спринта**
   - Overview спринта (5-10 sentences)
   - Не реализовано в прошедшем спринте
   - Ключевые достижения, выводы и инсайты спринта
4. **Артефакты по итогам реализованного спринта**
5. **Планирование следующего спринта** (+ blockers)
6. **Вопросы и предложения от Product Manager**

## 6. Practices for Using AI in This Repo

When using AI (Cursor / LLMs) to modify this repo:

- **Always respect the domain types:**
  - Keep `SprintIssue`, `SprintReportStructured`, and `NotionPageResult` as central abstractions.
  - Map external APIs into these types in a single place (Jira client, OpenAI client, Notion client).
- **Do not spread raw Jira/Notion/OpenAI response shapes across the code.**
- **Keep business logic (selection of demo issues, report structure) separate from HTTP/integration logic.**
- If you change report structure or prompts, update this doc and the typing accordingly.
- Prefer small, focused modules and explicit logging for the pipeline steps.
- **Type safety**: Functions like `toSprintIssue()` convert raw API types (e.g., `ParsedJiraIssue`) to domain types (`SprintIssue`). Never call conversion functions on already-converted domain objects.

This document is the single source of truth for the project context and should be kept up to date when the overall purpose or architecture of the tool changes.

