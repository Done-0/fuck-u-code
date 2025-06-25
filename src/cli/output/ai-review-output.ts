/**
 * AI review output formatters for Markdown and HTML export.
 */

import { t } from '../../i18n/index.js';

/** Data structure for a single file's AI review result */
export interface AIReviewData {
  filePath: string;
  score: number;
  review: string;
}

/**
 * Generate a Markdown document from AI review results.
 * Each file gets its own section with score and the raw review content.
 */
export function renderAIReviewMarkdown(reviews: AIReviewData[]): string {
  const lines: string[] = [];
  const title = t('ai_review_output_title');

  lines.push(`# ${title}`);
  lines.push('');

  // Table of contents
  lines.push(`## ${t('output_table_of_contents')}`);
  lines.push('');
  for (const [i, { filePath }] of reviews.entries()) {
    const anchor = filePath.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    lines.push(`${i + 1}. [${filePath}](#${anchor})`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const [i, { filePath, score, review }] of reviews.entries()) {
    lines.push(`## ${i + 1}. ${filePath}`);
    lines.push('');
    lines.push(`**${t('report_file_score', { score: score.toFixed(1) })}**`);
    lines.push('');
    lines.push(review);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push(
    `> ${t('output_generated_by', { tool: '[fuck-u-code](https://github.com/Done-0/fuck-u-code)' })}`
  );

  return lines.join('\n');
}

/**
 * Generate an HTML document from AI review results.
 * Uses the same dark theme as the main HTML report (html.ts).
 */
export function renderAIReviewHtml(reviews: AIReviewData[]): string {
  const title = t('ai_review_output_title');
  const fileCards = reviews
    .map((r, i) => {
      const scoreColor = r.score < 30 ? '#3fb950' : r.score < 60 ? '#d29922' : '#f85149';
      return `    <div class="file-card">
      <div class="file-header">
        <span class="file-name">${i + 1}. ${escapeHtml(r.filePath)}</span>
        <span class="file-score" style="color:${scoreColor}">${t('report_file_score', { score: r.score.toFixed(1) })}</span>
      </div>
      <div class="review-content">${markdownToHtml(r.review)}</div>
    </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${t('html_lang')}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌸 ${escapeHtml(title)} 🌸</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; line-height: 1.6; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { text-align: center; font-size: 1.8rem; margin-bottom: 2rem; color: #f0c674; }
    .file-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .file-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #21262d; }
    .file-name { color: #d2a8ff; font-weight: 600; font-size: 1.1rem; }
    .file-score { font-weight: bold; }
    .review-content { font-size: 0.95rem; }
    .review-content h1 { font-size: 1.4rem; color: #f0c674; text-align: left; margin: 1rem 0 0.5rem; }
    .review-content h2 { font-size: 1.2rem; color: #bd93f9; margin: 1rem 0 0.5rem; border-bottom: 1px solid #21262d; padding-bottom: 0.3rem; }
    .review-content h3 { font-size: 1.05rem; color: #ff79c6; margin: 0.8rem 0 0.4rem; }
    .review-content p { margin: 0.5rem 0; }
    .review-content ul, .review-content ol { padding-left: 1.5rem; margin: 0.5rem 0; }
    .review-content li { margin: 0.25rem 0; }
    .review-content code { background: #21262d; color: #79c0ff; padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.9em; }
    .review-content pre { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; margin: 0.75rem 0; overflow-x: auto; }
    .review-content pre code { background: none; padding: 0; color: #c9d1d9; }
    .review-content blockquote { border-left: 3px solid #30363d; padding-left: 1rem; color: #8b949e; margin: 0.5rem 0; }
    .review-content hr { border: none; border-top: 1px solid #21262d; margin: 1rem 0; }
    .review-content strong { color: #e6edf3; }
    .review-content em { color: #8b949e; }
    .review-content table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
    .review-content th { background: #161b22; color: #bd93f9; text-align: left; padding: 0.5rem; border-bottom: 2px solid #30363d; }
    .review-content td { padding: 0.5rem; border-bottom: 1px solid #21262d; }
    .footer { text-align: center; margin-top: 2rem; color: #484f58; font-size: 0.85rem; border-top: 1px solid #21262d; padding-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌸 ${escapeHtml(title)} 🌸</h1>
${fileCards}
    <div class="footer">
      ${t('output_generated_by', { tool: '<a href="https://github.com/Done-0/fuck-u-code" style="color: #58a6ff;">fuck-u-code</a>' })}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Markdown → HTML converter for AI review content.
 *
 * Block-level state machine handles: fenced code blocks, headings, blockquotes,
 * unordered/ordered lists, tables (with thead/tbody), horizontal rules, and
 * paragraphs. Inline formatting uses a placeholder approach to prevent code
 * spans from being processed by bold/italic regex.
 */
function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const output: string[] = [];
  let inCodeBlock = false;
  let codeFence = '';
  const listStack: ('ul' | 'ol')[] = [];
  let tableState: 'none' | 'head' | 'body' = 'none';
  let blockquoteOpen = false;

  for (const raw of lines) {
    // ── Fenced code block ──
    const fenceMatch = /^(\s*)(```+|~~~+)(.*)/.exec(raw);
    if (fenceMatch && (!inCodeBlock || isClosingFence(raw, codeFence))) {
      if (inCodeBlock) {
        output.push('</code></pre>');
        inCodeBlock = false;
        codeFence = '';
      } else {
        closeBlockquote();
        closeAllLists();
        closeTable();
        const lang = (fenceMatch[3] ?? '').trim();
        const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : '';
        output.push(`<pre><code${langAttr}>`);
        inCodeBlock = true;
        codeFence = fenceMatch[2] ?? '';
      }
      continue;
    }

    if (inCodeBlock) {
      output.push(escapeHtml(raw));
      continue;
    }

    // ── Horizontal rule ──
    if (/^(\s*)([-*_])\s*(\2\s*){2,}$/.test(raw)) {
      closeBlockquote();
      closeAllLists();
      closeTable();
      output.push('<hr>');
      continue;
    }

    // ── ATX headings ──
    const headingMatch = /^(#{1,6})\s+(.*?)(?:\s+#+\s*)?$/.exec(raw);
    if (headingMatch) {
      closeBlockquote();
      closeAllLists();
      closeTable();
      const level = (headingMatch[1] ?? '').length;
      output.push(`<h${level}>${inlineToHtml(headingMatch[2] ?? '')}</h${level}>`);
      continue;
    }

    // ── Blockquote ──
    const bqMatch = /^>\s?(.*)/.exec(raw);
    if (bqMatch) {
      closeAllLists();
      closeTable();
      if (!blockquoteOpen) {
        output.push('<blockquote>');
        blockquoteOpen = true;
      }
      const content = bqMatch[1] ?? '';
      if (content.trim()) {
        output.push(`<p>${inlineToHtml(content)}</p>`);
      }
      continue;
    }
    closeBlockquote();

    // ── Table rows ──
    if (raw.trimStart().startsWith('|')) {
      closeAllLists();
      const cells = raw.split('|').slice(1, -1);

      // Separator row → transition from head to body
      if (cells.every((c) => /^[\s:-]+$/.test(c))) {
        if (tableState === 'head') {
          output.push('</thead>');
          output.push('<tbody>');
          tableState = 'body';
        }
        continue;
      }

      if (tableState === 'none') {
        output.push('<table>');
        output.push('<thead>');
        tableState = 'head';
        const ths = cells.map((c) => `<th>${inlineToHtml(c.trim())}</th>`).join('');
        output.push(`<tr>${ths}</tr>`);
      } else {
        const tds = cells.map((c) => `<td>${inlineToHtml(c.trim())}</td>`).join('');
        output.push(`<tr>${tds}</tr>`);
      }
      continue;
    }
    closeTable();

    // ── Unordered list ──
    const ulMatch = /^(\s*)[-*+]\s+(.*)/.exec(raw);
    if (ulMatch) {
      const depth = Math.floor((ulMatch[1] ?? '').length / 2);
      adjustListStack('ul', depth);
      output.push(`<li>${inlineToHtml(ulMatch[2] ?? '')}</li>`);
      continue;
    }

    // ── Ordered list ──
    const olMatch = /^(\s*)\d+[.)]\s+(.*)/.exec(raw);
    if (olMatch) {
      const depth = Math.floor((olMatch[1] ?? '').length / 3);
      adjustListStack('ol', depth);
      output.push(`<li>${inlineToHtml(olMatch[2] ?? '')}</li>`);
      continue;
    }
    closeAllLists();

    // ── Empty line ──
    if (raw.trim() === '') {
      output.push('');
      continue;
    }

    // ── Paragraph ──
    output.push(`<p>${inlineToHtml(raw)}</p>`);
  }

  // Close any remaining open blocks
  closeBlockquote();
  closeAllLists();
  closeTable();
  if (inCodeBlock) output.push('</code></pre>');

  return output.join('\n');

  function closeBlockquote(): void {
    if (blockquoteOpen) {
      output.push('</blockquote>');
      blockquoteOpen = false;
    }
  }

  function closeTable(): void {
    if (tableState === 'body') {
      output.push('</tbody>');
      output.push('</table>');
    } else if (tableState === 'head') {
      output.push('</thead>');
      output.push('</table>');
    }
    tableState = 'none';
  }

  function adjustListStack(type: 'ul' | 'ol', targetDepth: number): void {
    while (listStack.length > targetDepth + 1) {
      const tag = listStack.pop();
      if (tag) output.push(`</${tag}>`);
    }
    // Open new list or switch type at current depth
    if (listStack.length <= targetDepth) {
      while (listStack.length <= targetDepth) {
        output.push(`<${type}>`);
        listStack.push(type);
      }
    }
  }

  function closeAllLists(): void {
    while (listStack.length > 0) {
      const tag = listStack.pop();
      if (tag) output.push(`</${tag}>`);
    }
  }
}

/** Check if a line closes the current fenced code block */
function isClosingFence(line: string, openFence: string): boolean {
  const trimmed = line.trimEnd();
  const fenceChar = openFence[0] ?? '`';
  const minLen = openFence.length;
  if (!trimmed.startsWith(fenceChar.repeat(minLen))) return false;
  return /^(`{3,}|~{3,})\s*$/.test(trimmed);
}

/**
 * Apply inline Markdown formatting and output HTML.
 *
 * Uses a placeholder approach: inline code spans are extracted first so that
 * bold/italic/link regex won't corrupt code content. After all formatting is
 * applied, placeholders are restored with the styled HTML.
 */
function inlineToHtml(text: string): string {
  let result = escapeHtml(text);

  // 1. Extract inline code into placeholders
  const codeSpans: string[] = [];
  result = result.replace(/`([^`]+)`/g, (_, code: string) => {
    const idx = codeSpans.length;
    codeSpans.push(`<code>${code}</code>`);
    return `\x00CODE${idx}\x00`;
  });

  // 2. Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color:#58a6ff;text-decoration:none;">$1</a>'
  );

  // 3. Images: ![alt](url)
  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width:100%;">'
  );

  // 4. Bold + italic (***text*** or ___text___)
  result = result.replace(/(\*{3}|_{3})(.+?)\1/g, '<strong><em>$2</em></strong>');

  // 5. Bold (**text** or __text__)
  result = result.replace(/(\*{2}|_{2})(.+?)\1/g, '<strong>$2</strong>');

  // 6. Italic (*text* or _text_)
  result = result.replace(/(?<![*_])([*_])(?!\1)(.+?)(?<!\1)\1(?!\1)/g, '<em>$2</em>');

  // 7. Strikethrough (~~text~~)
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // 8. Restore code placeholders
  for (const [i, span] of codeSpans.entries()) {
    result = result.replace(`\x00CODE${i}\x00`, span);
  }

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
