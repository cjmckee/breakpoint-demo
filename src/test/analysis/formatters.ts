import type { DistributionStats } from './stats.js';
import { computeHistogram } from './stats.js';

const _log = console.log;

/** Use this instead of console.log so output works even when console.log is suppressed */
export function print(...args: unknown[]): void {
  _log(...args);
}

export function printHeader(title: string): void {
  print('');
  print(`── ${title} ${'─'.repeat(Math.max(0, 60 - title.length - 4))}`);
  print('');
}

export function printBanner(title: string): void {
  print('');
  print('═'.repeat(64));
  print(`  ${title}`);
  print('═'.repeat(64));
}

/**
 * Print a formatted table with column alignment
 */
export function printTable(headers: string[], rows: (string | number)[][]): void {
  // Calculate column widths
  const widths = headers.map((h, i) => {
    const dataMax = rows.reduce((max, row) => Math.max(max, String(row[i] ?? '').length), 0);
    return Math.max(h.length, dataMax);
  });

  // Header row
  const headerLine = headers.map((h, i) => h.padEnd(widths[i])).join(' │ ');
  print(`  ${headerLine}`);
  print(`  ${widths.map(w => '─'.repeat(w)).join('─┼─')}`);

  // Data rows
  for (const row of rows) {
    const line = row.map((cell, i) => {
      const str = typeof cell === 'number' ? cell.toFixed(1) : String(cell);
      return str.padStart(widths[i]);
    }).join(' │ ');
    print(`  ${line}`);
  }
}

/**
 * Print a histogram showing quality distribution with threshold markers
 */
export function printHistogram(
  values: number[],
  thresholds?: { label: string; value: number }[],
  bucketSize: number = 10,
): void {
  const buckets = computeHistogram(values, bucketSize);
  const n = values.length;
  const maxCount = Math.max(...buckets);
  const barScale = maxCount > 0 ? 30 / maxCount : 0;

  for (let i = 0; i < buckets.length; i++) {
    const lo = i * bucketSize;
    const hi = lo + bucketSize;
    const pct = (buckets[i] / n * 100);
    const bar = '█'.repeat(Math.round(buckets[i] * barScale));
    const label = `${String(lo).padStart(3)}-${String(hi).padEnd(3)}`;
    const pctStr = `${pct.toFixed(1)}%`.padStart(6);

    // Check if any threshold falls in this bucket
    const markers = (thresholds ?? [])
      .filter(t => t.value >= lo && t.value < hi)
      .map(t => ` ◄ ${t.label}=${t.value.toFixed(0)}`)
      .join('');

    print(`    ${label}: ${bar} ${pctStr}${markers}`);
  }
}

export function fmtPct(count: number, total: number): string {
  return `${(count / total * 100).toFixed(1)}%`;
}

export function fmtNum(n: number, decimals: number = 1): string {
  return n.toFixed(decimals);
}

export function fmtStats(stats: DistributionStats): string {
  return `mean=${fmtNum(stats.mean)} std=${fmtNum(stats.stddev)} P10=${fmtNum(stats.p10)} P90=${fmtNum(stats.p90)}`;
}
