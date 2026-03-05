# Dialogue Converter Skill

Convert plain-text dialogue into the TypeScript `DialogueLine[]` format used in story events.

## When to use

Use this skill when the user provides dialogue in a plain-text format and wants it converted to the TypeScript dialogue array format used in `src/data/storyEvents/`.

## Input format

The user will provide dialogue in a simple format like:

```
The sun sets over the courts.
keith: Hey, have you seen the new racquets?
{jen} walks over with a grin.
coach_gonzalez: Welcome, {keith}! Let's get started.
```

### Conventions:
- Lines WITHOUT a `character_id:` prefix = narration (speaker is `null`)
- Lines WITH a `character_id:` prefix = that character speaking
- `{character_id}` anywhere in text = character reference, rendered as `{characterId: 'character_id'}` in the output

## Output format

Convert to the `DialogueLine[]` TypeScript format:

```typescript
type DialogueLine = [string | null, FormattedText];
type FormattedText = (string | { characterId: string })[];
```

### Rules:

1. **Narrator/narration lines** (no speaker prefix) use `null` as the speaker:
   ```typescript
   [null, ['The sun sets over the courts.']]
   ```

2. **Character lines** (`character_id: text`) use their ID string as the speaker:
   ```typescript
   ['keith', ['Hey, have you seen the new racquets?']]
   ```

3. **Character references** in text (`{character_id}`) become `{characterId: 'character_id'}` objects in the FormattedText array. Split the surrounding text into separate string segments:
   ```typescript
   [null, [{characterId: 'jen'}, ' walks over with a grin.']]
   ['coach_gonzalez', ['Welcome, ', {characterId: 'keith'}, '! Let\'s get started.']]
   ```

4. **Escape single quotes** in strings (use `\'`).

5. **Trim whitespace** from lines but preserve intentional formatting.

6. **Empty lines** should be skipped.

## Example transformation

Input:
```
It's a quiet day at the Academy.
keith: AAAHHHH! I made it!
{keith} falls into the grass.
jen: Really, we all made it. The Academy team.
coach_gonzalez: Alright, everyone. {keith}? I can't believe you're on this team.
```

Output:
```typescript
dialogue: [
  [null, ['It\'s a quiet day at the Academy.']],
  ['keith', ['AAAHHHH! I made it!']],
  [null, [{characterId: 'keith'}, ' falls into the grass.']],
  ['jen', ['Really, we all made it. The Academy team.']],
  ['coach_gonzalez', ['Alright, everyone. ', {characterId: 'keith'}, '? I can\'t believe you\'re on this team.']],
],
```

## Workflow

1. Parse each line of the user's input
2. Determine if it has a `character_id:` prefix (character speaking) or not (narration)
3. Find any `{character_id}` references in the text and split into FormattedText segments
4. Escape single quotes
5. Output the formatted TypeScript `dialogue` array
6. If the user specifies where to insert it (a file and event ID), edit the file directly. Otherwise, output the code for the user to copy.
