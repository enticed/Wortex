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

Requirements:
- Target phrase: ${calculatedQuoteType === 'historical' ? 'A famous historical quote (8-25 words)' : 'A memorable line from classic literature or poetry (8-25 words)'}
- Difficulty: ${calculatedDifficulty}/5 - ${difficultyDescriptions[calculatedDifficulty as keyof typeof difficultyDescriptions]}
- Facsimile phrase: Create a semantically similar phrase with similar word count (±30%), but different wording. This is a "spin-off" of the original that maintains the core meaning.
- Bonus question: "Who is the source of this quote?" with 4 multiple choice options (including correct answer)

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "targetPhrase": "exact quote text",
  "facsimilePhrase": "similar meaning phrase",
  "source": "Full name of author/speaker",
  "sourceYear": year as number or null,
  "theme": "brief theme description",
  "tags": ["tag1", "tag2"],
  "bonusOptions": [
    {"person": "Correct Author", "year": 1950},
    {"person": "Wrong Author 1", "year": 1945},
    {"person": "Wrong Author 2", "year": 1960},
    {"person": "Wrong Author 3", "year": 1955}
  ],
  "correctAnswerIndex": 0
}

Important:
- targetPhrase must be 8-25 words
- facsimilePhrase should be similar length (±30%)
- All bonus options should be plausible (same era, similar context)
- correctAnswerIndex is the index (0-3) of the correct option`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    temperature: 0.8, // Some creativity but consistent
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
    const cleanedText = content.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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
