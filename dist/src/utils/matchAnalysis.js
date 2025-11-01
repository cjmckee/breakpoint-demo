import * as fs from 'fs';
import * as path from 'path';
export function saveMatchData(matchData, outputPath) {
    const filePath = outputPath || `match-analysis-${matchData.matchId}.json`;
    const fullPath = path.resolve(filePath);
    fs.writeFileSync(fullPath, JSON.stringify(matchData, null, 2), 'utf-8');
    console.log(`📊 Match data exported to: ${fullPath}`);
    return fullPath;
}
