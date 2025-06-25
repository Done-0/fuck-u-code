/**
 * Progress display utilities
 */

import ora, { type Ora } from 'ora';
import chalk from 'chalk';

export function createSpinner(text: string): Ora {
  return ora({
    text,
    spinner: 'dots',
    color: 'cyan',
  });
}

export function createProgressBar(total: number, label: string): ProgressBar {
  return new ProgressBar(total, label);
}

export class ProgressBar {
  private current = 0;
  private total: number;
  private label: string;
  private spinner: Ora;
  private startTime = 0;
  private barWidth = 20;

  constructor(total: number, label: string) {
    this.total = total;
    this.label = label;
    this.spinner = ora({
      text: this.formatText(),
      spinner: 'dots',
      color: 'cyan',
    });
  }

  start(): void {
    this.startTime = Date.now();
    this.spinner.start();
  }

  increment(): void {
    this.current++;
    this.spinner.text = this.formatText();
  }

  update(current: number): void {
    this.current = current;
    this.spinner.text = this.formatText();
  }

  succeed(text?: string): void {
    this.spinner.succeed(text || this.formatText());
  }

  fail(text?: string): void {
    this.spinner.fail(text);
  }

  private formatText(): string {
    const percent = this.total > 0 ? Math.round((this.current / this.total) * 100) : 0;
    const bar = this.renderBar(percent);
    const stats = chalk.gray(`[${this.current}/${this.total}]`);
    const percentStr = chalk.cyan(`${percent}%`);
    const eta = this.getETA();

    return `${this.label} ${bar} ${stats} ${percentStr}${eta}`;
  }

  private renderBar(percent: number): string {
    const filled = Math.round((percent / 100) * this.barWidth);
    const empty = this.barWidth - filled;
    const filledBar = chalk.cyan('█'.repeat(filled));
    const emptyBar = chalk.gray('░'.repeat(empty));
    return `${filledBar}${emptyBar}`;
  }

  private getETA(): string {
    if (this.current === 0 || this.startTime === 0) return '';

    const elapsed = Date.now() - this.startTime;
    const rate = this.current / elapsed;
    const remaining = this.total - this.current;
    const eta = remaining / rate;

    if (eta < 1000) return '';
    if (eta < 60000) return chalk.gray(` ~${Math.round(eta / 1000)}s`);
    return chalk.gray(` ~${Math.round(eta / 60000)}m`);
  }
}
