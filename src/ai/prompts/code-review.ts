/**
 * Code review prompt templates
 *
 * Generates system prompts for AI code review. Uses XML-tagged structure
 * for clear section boundaries. Output is pure Markdown.
 */

import { t } from '../../i18n/index.js';

/** Get localized code review system prompt */
export function getCodeReviewPrompt(): string {
  return `<role>
${t('ai_prompt_role')}
</role>

<output-rules>
${t('ai_prompt_output_rules')}
</output-rules>

<metrics-definition>
- ${t('ai_prompt_metrics_complexity')}
- ${t('ai_prompt_metrics_nesting')}
- ${t('ai_prompt_metrics_params')}
- ${t('ai_prompt_metrics_lines')}
- ${t('ai_prompt_metrics_duplication')}
- ${t('ai_prompt_metrics_structure')}
- ${t('ai_prompt_metrics_error')}

${t('ai_prompt_metrics_note')}
</metrics-definition>

<constraints>
- ${t('ai_prompt_constraint_no_repeat')}
- ${t('ai_prompt_constraint_location')}
- ${t('ai_prompt_constraint_executable')}
- ${t('ai_prompt_constraint_priority')}
- ${t('ai_prompt_constraint_lang_aware')}
</constraints>

<output-format>
${t('ai_prompt_output_instruction')}

## 🔍 ${t('ai_prompt_summary')}
${t('ai_prompt_output_assessment')}

## 💩 ${t('ai_prompt_key_issues')}
${t('ai_prompt_output_critical_item')}

## 🔧 ${t('ai_prompt_refactoring')}
${t('ai_prompt_output_refactor_item')}

## 🔒 ${t('ai_prompt_security')}
${t('ai_prompt_output_security_item')}
</output-format>

<quality-rules>
- ${t('ai_prompt_quality_specific')}
- ${t('ai_prompt_quality_evidence')}
- ${t('ai_prompt_quality_concise')}
- ${t('ai_prompt_quality_syntax')}
</quality-rules>`;
}
