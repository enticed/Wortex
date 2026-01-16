# AI Puzzle Generation System

Automated puzzle generation using Anthropic's Claude (Haiku 4.5) to maintain a 30-day buffer of daily puzzles.

## Overview

The AI system:
- Generates daily word puzzles from historical quotes and literary passages
- Alternates between historical and literature quotes daily
- Automatically adjusts difficulty Monday (1) through Sunday (5)
- Creates semantically similar "facsimile" phrases
- Generates multiple-choice bonus questions
- Maintains a 30-day buffer via automated cron job

## Setup

### 1. Anthropic API Key

1. Create an Anthropic account at https://console.anthropic.com
2. Generate an API key
3. Add to `.env.local`:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2. Optional: Cron Secret (for production)

Add a secret for securing the cron endpoint:

```bash
CRON_SECRET=your_random_secret_here
```

### 3. Deploy Configuration

The `vercel.json` file is already configured to run the buffer maintenance job daily at 2:00 AM UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/puzzle-buffer",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Usage

### Manual Generation (Admin UI)

1. Navigate to `/admin/puzzles`
2. Click the **"AI Generate"** button
3. Configure:
   - **Start Date**: First puzzle date (defaults to tomorrow)
   - **Number of Puzzles**: How many to generate (1-30)
4. Click **"Generate"**

The system will:
- Generate puzzles sequentially (~1 second each)
- Save to database with `created_by_ai: true`
- Set `approved: false` (requires manual review)
- Show success/error status

### Automated Buffer Maintenance

The cron job runs daily and:
1. Counts future puzzles (from today onwards)
2. If buffer < 30 days, generates needed puzzles
3. Continues from last scheduled puzzle date
4. Logs results to Vercel function logs

#### Manual Trigger

Test the cron job manually:

```bash
curl https://your-domain.com/api/cron/puzzle-buffer \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or via admin script:

```bash
node scripts/trigger-puzzle-buffer.mjs
```

## Puzzle Generation Logic

### Difficulty Progression

Difficulty scales 1-5 based on day of week:
- **Monday**: 1 (easiest - common, well-known phrases)
- **Tuesday**: 2 (easy - familiar phrases)
- **Wednesday**: 3 (moderate - somewhat famous quotes)
- **Thursday**: 4 (challenging - less common quotes)
- **Friday**: 5 (very challenging - obscure/literary quotes)
- **Saturday**: 6 → capped at 5
- **Sunday**: 5 (hardest)

### Quote Type Alternation

Alternates daily based on date parity:
- **Even days** (0, 2, 4, ...): Historical quotes
- **Odd days** (1, 3, 5, ...): Literature/poetry quotes

### AI Prompt Structure

The AI receives:
- Quote type (historical/literature)
- Difficulty level with description
- Word count requirements (8-25 words)
- Facsimile length constraint (±30%)
- Bonus question format

### Generated Data

Each puzzle includes:
- **Target Phrase**: Original quote (8-25 words)
- **Facsimile Phrase**: Semantically similar phrase
- **Difficulty**: 1-5 (calculated from day of week)
- **Bonus Question**: "Who is the source of this quote?"
  - 4 multiple choice options
  - Correct answer marked
  - Plausible distractors (same era/context)
- **Metadata**:
  - Source (author/speaker name)
  - Theme
  - Tags

## API Endpoints

### `POST /api/admin/puzzles/generate`

Generate puzzles manually.

**Request:**
```json
{
  "startDate": "2026-01-20",
  "count": 7
}
```

**Response:**
```json
{
  "success": true,
  "generated": 7,
  "saved": 7,
  "errors": [],
  "puzzles": [...]
}
```

### `GET/POST /api/cron/puzzle-buffer`

Automated buffer maintenance.

**Response:**
```json
{
  "success": true,
  "message": "Generated 15 puzzles. Buffer now at 30 days.",
  "previousBuffer": 15,
  "currentBuffer": 30,
  "targetBuffer": 30,
  "generated": 15,
  "saved": 15
}
```

## Database Schema

Puzzles are saved with these additional fields:

```typescript
{
  date: string;              // YYYY-MM-DD
  target_phrase: string;
  facsimile_phrase: string;
  difficulty: number;        // 1-5
  bonus_question: {
    type: 'quote' | 'literature';
    question: string;
    options: Array<{
      id: string;
      person: string;
      year?: number;
    }>;
    correctAnswerId: string;
  };
  created_by_ai: boolean;    // true
  approved: boolean;         // false (requires review)
  metadata: {
    source: string;          // Author/speaker name
    theme: string;
    tags: string[];
  };
}
```

## Approval Workflow

AI-generated puzzles require manual review:

1. Generated with `approved: false`
2. Admin reviews at `/admin/puzzles`
3. Edit if needed at `/admin/puzzles/[date]`
4. Change status to "Published" to approve

## Cost Estimates

Using **Claude 3.5 Haiku**:
- Input: ~400 tokens per puzzle
- Output: ~300 tokens per puzzle
- Total: ~700 tokens per puzzle

**Pricing** (as of January 2025):
- $0.25 per million input tokens
- $1.25 per million output tokens

**Cost per puzzle**: ~$0.0004 (less than half a cent)
**30 puzzles/month**: ~$0.012 ($0.36/year)

## Monitoring

### Check Buffer Status

```sql
SELECT COUNT(*) as buffer_days
FROM puzzles
WHERE date >= CURRENT_DATE;
```

### View AI-Generated Puzzles

```sql
SELECT date, target_phrase, difficulty, approved, created_at
FROM puzzles
WHERE created_by_ai = true
ORDER BY date DESC
LIMIT 10;
```

### Check Pending Approval

```sql
SELECT COUNT(*) as pending_approval
FROM puzzles
WHERE created_by_ai = true
AND approved = false;
```

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"

Add the API key to `.env.local` and restart the dev server.

### "Puzzle already exists for this date"

The system won't overwrite existing puzzles. Delete the existing puzzle first or choose a different start date.

### "Target phrase word count outside 8-25 range"

The AI occasionally generates invalid phrases. This is logged and the generation fails. Retry or adjust the prompt if this happens frequently.

### Cron Job Not Running

1. Check Vercel dashboard → Project → Cron Jobs
2. Ensure `vercel.json` is deployed
3. Check function logs for errors
4. Verify `ANTHROPIC_API_KEY` is set in Vercel environment variables

## Future Enhancements

- **User feedback integration**: Adjust difficulty based on player success rates
- **Quality scoring**: Rate generated puzzles and filter low-quality ones
- **Custom themes**: Generate puzzles around specific topics/events
- **Multi-language support**: Generate puzzles in different languages
- **A/B testing**: Compare AI-generated vs human-created puzzle performance

## Support

For issues or questions:
- Check Vercel function logs
- Review database puzzle records
- Test manual generation first
- Ensure API key is valid and has credits
