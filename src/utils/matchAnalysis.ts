/**
 * Tennis Rally Analysis Sub-Agent Utility
 *
 * Provides helpers for analyzing match simulation outputs using a specialized
 * sub-agent that validates tennis realism and design goal compliance.
 */

import type { MatchAnalysisData } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Save match analysis data to a JSON file
 */
export function saveMatchData(matchData: MatchAnalysisData, outputPath?: string): string {
  const filePath = outputPath || `match-analysis-${matchData.matchId}.json`;
  const fullPath = path.resolve(filePath);

  fs.writeFileSync(fullPath, JSON.stringify(matchData, null, 2), 'utf-8');

  console.log(`📊 Match data exported to: ${fullPath}`);
  return fullPath;
}
