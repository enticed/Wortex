/**
 * AI Puzzle Generator Service
 * Uses Anthropic Claude (Haiku 4.5) to generate daily puzzles
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export type QuoteType = 'historical' | 'literature';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

interface GeneratedPuzzle {
  targetPhrase: string;
  facsimilePhrase: string;
  difficulty: number; // 1-5
  bonusQuestion: {
    type: 'quote' | 'literature';
    question: string;
    options: Array<{
      id: string;
      person: string;
      year?: number;
    }>;
    correctAnswerId: string;
  };
  metadata: {
    source: string;
    theme: string;
    tags: string[];
  };
}

/**
 * Calculate difficulty based on day of week
 * Monday (1) = 1 (easiest), Sunday (0) = 5 (hardest)
 */
export function getDifficultyForDay(dayOfWeek: DayOfWeek): number {
  if (dayOfWeek === 0) return 5; // Sunday - hardest
  return dayOfWeek; // Monday=1, Tuesday=2, ..., Saturday=6 -> capped at 5
}

/**
 * Determine quote type based on date (alternates daily)
 */
export function getQuoteTypeForDate(date: Date): QuoteType {
  const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  return daysSinceEpoch % 2 === 0 ? 'historical' : 'literature';
}

/**
 * Generate a single puzzle using AI
 */
export async function generatePuzzle(
  targetDate: Date,
  quoteType?: QuoteType,
  difficulty?: number
): Promise<GeneratedPuzzle> {
  const dayOfWeek = targetDate.getDay() as DayOfWeek;
  const calculatedDifficulty = difficulty ?? getDifficultyForDay(dayOfWeek);
  const calculatedQuoteType = quoteType ?? getQuoteTypeForDate(targetDate);

  const difficultyDescriptions = {
    1: 'very easy - common, well-known phrases with simple vocabulary',
    2: 'easy - familiar phrases with straightforward language',
    3: 'moderate - somewhat famous quotes with moderate vocabulary',
    4: 'challenging - less common quotes with complex vocabulary',
    5: 'very challenging - obscure or literary quotes with advanced vocabulary',
  };

  const prompt = `Generate a word puzzle based on a ${calculatedQuoteType === 'historical' ? 'historical quote from a famous person' : 'quote from classic literature or poetry'}.

STRICT REQUIREMENTS:
1. Target phrase: ${calculatedQuoteType === 'historical' ? 'A famous historical quote' : 'A memorable line from classic literature or poetry'}
   - MUST be between 8-25 words (count carefully, this is critical)
   - Must be the exact, complete quote

2. Difficulty: ${calculatedDifficulty}/5 - ${difficultyDescriptions[calculatedDifficulty as keyof typeof difficultyDescriptions]}

3. Facsimile phrase: Create a semantically similar phrase that:
   - Maintains the core meaning of the original
   - Uses different wording (a "spin-off" of the original)
   - Has similar word count (within ±30% of target phrase length)

4. Bonus question: "Who is the source of this quote?"
   - MUST include exactly 4 multiple choice options
   - One correct answer + 3 plausible distractors
   - All options should be from the same era and context

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "targetPhrase": "exact quote text here",
  "facsimilePhrase": "similar meaning phrase here",
  "source": "Full name of author/speaker",
  "sourceYear": year as number or null,
  "theme": "brief theme description",
  "tags": ["tag1", "tag2"],
  "bonusOptions": [
    {"person": "Correct Author Name", "year": 1950},
    {"person": "Plausible Wrong Author 1", "year": 1945},
    {"person": "Plausible Wrong Author 2", "year": 1960},
    {"person": "Plausible Wrong Author 3", "year": 1955}
  ],
  "correctAnswerIndex": 0
}

CRITICAL VALIDATION:
- Count words in targetPhrase before responding - it MUST be 8-25 words
- bonusOptions array MUST have exactly 4 elements
- correctAnswerIndex MUST be 0-3 (the index of the correct answer in bonusOptions)

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    temperature: 0.7, // Balanced creativity and compliance
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from AI');
  }

  // Parse AI response
  let aiResponse: any;
  try {
    // Remove markdown code blocks if present
    let cleanedText = content.text.trim();
    // Remove code block markers at start
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3);
    }
    // Remove code block markers at end
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();
    aiResponse = JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse AI response:', content.text);
    throw new Error(`Invalid JSON from AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Validate and structure the puzzle
  const bonusOptions = aiResponse.bonusOptions.map((opt: any, idx: number) => ({
    id: String(idx + 1),
    person: opt.person,
    year: opt.year || undefined,
  }));

  const puzzle: GeneratedPuzzle = {
    targetPhrase: aiResponse.targetPhrase,
    facsimilePhrase: aiResponse.facsimilePhrase,
    difficulty: calculatedDifficulty,
    bonusQuestion: {
      type: calculatedQuoteType === 'historical' ? 'quote' : 'literature',
      question: 'Who is the source of this quote?',
      options: bonusOptions,
      correctAnswerId: bonusOptions[aiResponse.correctAnswerIndex].id,
    },
    metadata: {
      source: aiResponse.source || 'Unknown',
      theme: aiResponse.theme || '',
      tags: aiResponse.tags || [],
    },
  };

  // Validate word counts
  const targetWords = puzzle.targetPhrase.split(/\s+/).length;
  const facsimileWords = puzzle.facsimilePhrase.split(/\s+/).length;

  if (targetWords < 8 || targetWords > 25) {
    throw new Error(`Target phrase word count (${targetWords}) outside 8-25 range`);
  }

  const lengthDiff = Math.abs(targetWords - facsimileWords) / targetWords;
  if (lengthDiff > 0.3) {
    console.warn(`Facsimile length differs by ${(lengthDiff * 100).toFixed(1)}% from target`);
  }

  return puzzle;
}

/**
 * Generate multiple puzzles in batch
 */
export async function generatePuzzleBatch(
  startDate: Date,
  count: number
): Promise<Array<GeneratedPuzzle & { date: string }>> {
  const puzzles: Array<GeneratedPuzzle & { date: string }> = [];

  for (let i = 0; i < count; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + i);

    try {
      const puzzle = await generatePuzzle(targetDate);
      puzzles.push({
        ...puzzle,
        date: targetDate.toISOString().split('T')[0], // YYYY-MM-DD
      });

      // Small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to generate puzzle for ${targetDate.toISOString()}:`, error);
      throw error;
    }
  }

  return puzzles;
}
