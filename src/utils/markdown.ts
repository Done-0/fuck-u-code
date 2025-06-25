/**
 * Terminal Markdown renderer
 *
 * Converts Markdown to chalk-styled terminal output with block-level state
 * machine (code fences, tables, normal text) and placeholder-based inline
 * formatting to prevent bold/italic matching inside code spans.
 */

import chalk from 'chalk';
import { getTerminalWidth, displayWidth, padEndByWidth, wrapAnsiLine } from './terminal.js';

const enum BlockState {
  Normal = 0,
  FencedCode = 1,
  Table = 2,
}

/**
 * Render a Markdown string to chalk-styled terminal output.
 *
 * @param markdown - Raw Markdown text
 * @param indent - Number of spaces to prepend to every output line (default: 0)
 * @returns Chalk-styled string ready for console.log
 */
export function renderMarkdownToTerminal(markdown: string, indent = 0): string {
  const lines = markdown.split('\n');
  const output: string[] = [];
  let state = BlockState.Normal;
  let codeFence = '';
  let tableBuffer: string[] = [];
  const indentStr = indent > 0 ? ' '.repeat(indent) : '';
  const contentWidth = Math.max(20, getTerminalWidth() - indent);
  let prevBlank = false;

  for (const raw of lines) {
    if (state === BlockState.FencedCode) {
      prevBlank = false;
      if (isClosingFence(raw, codeFence)) {
        state = BlockState.Normal;
        codeFence = '';
      } else {
        const wrapped = wrapAnsiLine(chalk.gray(`  ${raw}`), contentWidth);
        for (const seg of wrapped) output.push(indentStr + seg);
      }
      continue;
    }

    const fenceMatch = /^(\s*)(```+|~~~+)(.*)/.exec(raw);
    if (fenceMatch) {
      prevBlank = false;
      if (state === BlockState.Table && tableBuffer.length > 0) {
        output.push(...renderTable(tableBuffer, indentStr));
        tableBuffer = [];
      }
      state = BlockState.FencedCode;
      codeFence = fenceMatch[2] ?? '';
      const lang = (fenceMatch[3] ?? '').trim();
      if (lang) {
        output.push(indentStr + chalk.gray.dim(`  [${lang}]`));
      }
      continue;
    }

    const trimmed = raw.trimStart();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      prevBlank = false;
      if (state !== BlockState.Table) {
        state = BlockState.Table;
        tableBuffer = [];
      }
      tableBuffer.push(raw);
      continue;
    }

    if (state === BlockState.Table) {
      if (tableBuffer.length > 0) {
        output.push(...renderTable(tableBuffer, indentStr));
        tableBuffer = [];
      }
      state = BlockState.Normal;
    }

    if (raw.trim() === '') {
      if (prevBlank) continue;
      prevBlank = true;
    } else {
      prevBlank = false;
    }

    const rendered = renderBlockLine(raw, contentWidth);
    const wrapped = wrapAnsiLine(rendered.text, contentWidth, rendered.hangingIndent);
    for (const seg of wrapped) output.push(indentStr + seg);
  }

  if (state === BlockState.Table && tableBuffer.length > 0) {
    output.push(...renderTable(tableBuffer, indentStr));
  }

  return output.join('\n');
}

/** Check if a line closes the current fenced code block */
function isClosingFence(line: string, openFence: string): boolean {
  const trimmed = line.trim();
  const fenceChar = openFence[0] ?? '`';
  const minLen = openFence.length;
  if (!trimmed.startsWith(fenceChar.repeat(minLen))) return false;
  return /^(`{3,}|~{3,})\s*$/.test(trimmed);
}

/** Parse a table row into cells, stripping leading/trailing pipes and whitespace */
function parseTableCells(row: string): string[] {
  const trimmed = row.trim();
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const stripped = inner.endsWith('|') ? inner.slice(0, -1) : inner;
  return stripped.split('|').map((cell) => cell.trim());
}

/** Check if a row is a separator row (|---|---|) */
function isSeparatorRow(row: string): boolean {
  return /^\|[\s:|-]+\|$/.test(row.trim());
}

/**
 * Render a Markdown table with proper column alignment and borders.
 *
 * Calculates the display width of each column (accounting for CJK characters),
 * then renders with box-drawing characters. Columns are truncated if the table
 * would exceed terminal width.
 */
function renderTable(rows: string[], indentStr: string): string[] {
  if (rows.length === 0) return [];

  // Parse data rows (skip separator rows)
  const dataRows: string[][] = [];

  for (const row of rows) {
    if (!isSeparatorRow(row)) {
      dataRows.push(parseTableCells(row));
    }
  }

  if (dataRows.length === 0) return rows.map((r) => indentStr + chalk.gray(r));

  const firstRow = dataRows[0];
  if (!firstRow) return rows.map((r) => indentStr + chalk.gray(r));
  const colCount = firstRow.length;

  // Calculate max display width per column
  const colWidths: number[] = new Array<number>(colCount).fill(0);
  for (const row of dataRows) {
    for (let c = 0; c < colCount; c++) {
      const cell = row[c] ?? '';
      const width = displayWidth(cell);
      if (width > (colWidths[c] ?? 0)) colWidths[c] = width;
    }
  }

  // Clamp total width to terminal width
  const termWidth = getTerminalWidth();
  const indentWidth = displayWidth(indentStr);
  const overhead = 3 * colCount + 1;
  const availableWidth = termWidth - indentWidth - overhead;
  const totalContentWidth = colWidths.reduce((sum, w) => sum + w, 0);

  if (totalContentWidth > availableWidth && availableWidth > colCount) {
    // Proportionally shrink columns, minimum 3 chars each
    const scale = availableWidth / totalContentWidth;
    for (let c = 0; c < colCount; c++) {
      colWidths[c] = Math.max(3, Math.floor((colWidths[c] ?? 0) * scale));
    }
  }

  const output: string[] = [];

  // Build horizontal separator
  const hLine = '├' + colWidths.map((w) => '─'.repeat(w + 2)).join('┼') + '┤';
  const topLine = '┌' + colWidths.map((w) => '─'.repeat(w + 2)).join('┬') + '┐';
  const bottomLine = '└' + colWidths.map((w) => '─'.repeat(w + 2)).join('┴') + '┘';

  output.push(indentStr + chalk.gray(topLine));

  let isHeader = true;
  for (const row of rows) {
    if (isSeparatorRow(row)) {
      output.push(indentStr + chalk.gray(hLine));
      isHeader = false;
      continue;
    }

    const cells = parseTableCells(row);
    const formattedCells = cells.slice(0, colCount).map((cell, c) => {
      const maxW = colWidths[c] ?? 0;
      const cellWidth = displayWidth(cell);
      const formatted = renderInline(cell);
      if (cellWidth > maxW) {
        const truncated = truncatePlainText(cell, maxW);
        return padEndByWidth(renderInline(truncated), maxW);
      }
      return padEndByWidth(formatted, maxW + (displayWidth(formatted) - cellWidth));
    });

    const line =
      chalk.gray('│') +
      formattedCells
        .map((cell, c) => {
          const maxW = colWidths[c] ?? 0;
          const content = ` ${padEndByWidth(cell, maxW)} `;
          return isHeader ? chalk.bold(content) : content;
        })
        .join(chalk.gray('│')) +
      chalk.gray('│');

    output.push(indentStr + line);
  }

  output.push(indentStr + chalk.gray(bottomLine));

  return output;
}

/** Truncate plain text (no ANSI) to fit within maxWidth display columns */
function truncatePlainText(text: string, maxWidth: number): string {
  if (displayWidth(text) <= maxWidth) return text;
  let width = 0;
  let result = '';
  for (const char of text) {
    const codePoint = char.codePointAt(0) || 0;
    const charWidth =
      (codePoint >= 0x1100 && codePoint <= 0x115f) ||
      (codePoint >= 0x2e80 && codePoint <= 0x9fff) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7af) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
      (codePoint >= 0xff01 && codePoint <= 0xff60) ||
      (codePoint >= 0x20000 && codePoint <= 0x3134f)
        ? 2
        : 1;
    if (width + charWidth > maxWidth - 1) break;
    result += char;
    width += charWidth;
  }
  return result + '…';
}

interface BlockLineResult {
  text: string;
  hangingIndent: number;
}

/** Render a single non-code, non-table line with block-level detection */
function renderBlockLine(line: string, contentWidth: number): BlockLineResult {
  // Horizontal rule — must come before list detection (--- could be confused)
  if (/^(\s*)([-*_])\s*(\2\s*){2,}$/.test(line)) {
    return { text: chalk.gray('─'.repeat(contentWidth)), hangingIndent: 0 };
  }

  // ATX headings (# through ######)
  const headingMatch = /^(#{1,6})\s+(.*?)(?:\s+#+\s*)?$/.exec(line);
  if (headingMatch) {
    const level = (headingMatch[1] ?? '').length;
    const text = renderInline(headingMatch[2] ?? '');
    if (level === 1) return { text: chalk.bold.yellow(text), hangingIndent: 0 };
    if (level === 2) return { text: chalk.bold.cyan(text), hangingIndent: 0 };
    if (level === 3) return { text: chalk.bold.magenta(text), hangingIndent: 0 };
    if (level === 4) return { text: chalk.bold.blue(text), hangingIndent: 0 };
    return { text: chalk.bold(text), hangingIndent: 0 };
  }

  // Blockquote (supports nested `>>`)
  const bqMatch = /^(\s*>)+\s?(.*)/.exec(line);
  if (bqMatch) {
    const depth = (line.match(/>/g) || []).length;
    const prefix = chalk.gray('  │ '.repeat(depth));
    const content = bqMatch[2] ?? '';
    return { text: prefix + chalk.gray(renderInline(content)), hangingIndent: depth * 4 };
  }

  // Unordered list item (-, *, +) with indent awareness
  const ulMatch = /^(\s*)([-*+])\s+(.*)/.exec(line);
  if (ulMatch) {
    const listIndent = ulMatch[1] ?? '';
    return {
      text: `${listIndent}  • ${renderInline(ulMatch[3] ?? '')}`,
      hangingIndent: listIndent.length + 4,
    };
  }

  // Ordered list item
  const olMatch = /^(\s*)(\d+)[.)]\s+(.*)/.exec(line);
  if (olMatch) {
    const listIndent = olMatch[1] ?? '';
    const numStr = olMatch[2] ?? '';
    return {
      text: `${listIndent}  ${numStr}. ${renderInline(olMatch[3] ?? '')}`,
      hangingIndent: listIndent.length + 2 + numStr.length + 2,
    };
  }

  // Plain paragraph / text
  return { text: renderInline(line), hangingIndent: 0 };
}

// Inline code placeholders — extracted first so bold/italic won't match inside code
const PLACEHOLDER_PREFIX = '\x00CODE';
const PLACEHOLDER_SUFFIX = '\x00';

/** Apply inline Markdown formatting (code, links, bold, italic, strikethrough) */
function renderInline(text: string): string {
  // Extract inline code spans into placeholders to protect from further formatting
  const codeSpans: string[] = [];
  let processed = text.replace(/`([^`]+)`/g, (_, code: string) => {
    const idx = codeSpans.length;
    codeSpans.push(chalk.cyan(code));
    return `${PLACEHOLDER_PREFIX}${idx}${PLACEHOLDER_SUFFIX}`;
  });

  // Links: [text](url)
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, linkText: string, url: string) => `${chalk.cyan(linkText)} ${chalk.gray.dim(`(${url})`)}`
  );

  // Images: ![alt](url)
  processed = processed.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt: string) =>
    chalk.dim(`[${alt || 'image'}]`)
  );

  // Bold + italic (***text*** or ___text___)
  processed = processed.replace(/(\*{3}|_{3})(.+?)\1/g, (_, _marker: string, content: string) =>
    chalk.bold.dim(content)
  );

  // Bold (**text** or __text__)
  processed = processed.replace(/(\*{2}|_{2})(.+?)\1/g, (_, _marker: string, content: string) =>
    chalk.bold(content)
  );

  // Italic (*text* or _text_) — dim as terminal italic fallback
  // Negative lookbehind/ahead prevents matching inside ** pairs
  processed = processed.replace(
    /(?<![*_])([*_])(?!\1)(.+?)(?<!\1)\1(?!\1)/g,
    (_, _marker: string, content: string) => chalk.dim(content)
  );

  // Strikethrough (~~text~~)
  processed = processed.replace(/~~(.+?)~~/g, (_, content: string) => chalk.strikethrough(content));

  // Restore inline code placeholders
  for (let i = 0; i < codeSpans.length; i++) {
    const span = codeSpans[i];
    if (span === undefined) continue;
    processed = processed.replace(`${PLACEHOLDER_PREFIX}${i}${PLACEHOLDER_SUFFIX}`, span);
  }

  return processed;
}
