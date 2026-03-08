export interface DistributionStats {
  mean: number;
  median: number;
  stddev: number;
  min: number;
  max: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
}

export function computeStats(values: number[]): DistributionStats {
  if (values.length === 0) {
    return { mean: 0, median: 0, stddev: 0, min: 0, max: 0, p10: 0, p25: 0, p75: 0, p90: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;

  return {
    mean,
    median: sorted[Math.floor(n / 2)],
    stddev: Math.sqrt(variance),
    min: sorted[0],
    max: sorted[n - 1],
    p10: sorted[Math.floor(n * 0.1)],
    p25: sorted[Math.floor(n * 0.25)],
    p75: sorted[Math.floor(n * 0.75)],
    p90: sorted[Math.floor(n * 0.9)],
  };
}

/**
 * Count how many values fall into each bucket (0-10, 10-20, ..., 90-100)
 */
export function computeHistogram(values: number[], bucketSize: number = 10): number[] {
  const bucketCount = Math.ceil(100 / bucketSize);
  const buckets = new Array(bucketCount).fill(0);
  for (const v of values) {
    const idx = Math.min(Math.floor(v / bucketSize), bucketCount - 1);
    buckets[idx]++;
  }
  return buckets;
}
