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
  if (dayOfWeek === 6) return 5; // Saturday - also hardest
  return dayOfWeek; // Monday=1, Tuesday=2, ..., Friday=5
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

  const quoteSource = calculatedQuoteType === 'historical'
    ? 'historical quote from a famous person'
    : 'quote from classic literature or poetry';
  const targetPhraseDesc = calculatedQuoteType === 'historical'
    ? 'A famous historical quote'
    : 'A memorable line from classic literature or poetry';
  const difficultyDesc = difficultyDescriptions[calculatedDifficulty as keyof typeof difficultyDescriptions];

  // Different bonus question format based on quote type
  const bonusOptionsFormat = calculatedQuoteType === 'historical'
    ? '  "bonusOptions": [\n' +
      '    {"person": "Correct Person Name", "year": 1950},\n' +
      '    {"person": "Plausible Wrong Person 1", "year": 1945},\n' +
      '    {"person": "Plausible Wrong Person 2", "year": 1960},\n' +
      '    {"person": "Plausible Wrong Person 3", "year": 1955}\n' +
      '  ],'
    : '  "bonusOptions": [\n' +
      '    {"author": "Correct Author Name", "book": "Book Title"},\n' +
      '    {"author": "Plausible Wrong Author 1", "book": "Their Book Title"},\n' +
      '    {"author": "Plausible Wrong Author 2", "book": "Their Book Title"},\n' +
      '    {"author": "Plausible Wrong Author 3", "book": "Their Book Title"}\n' +
      '  ],';

  const bonusFieldDescription = calculatedQuoteType === 'historical'
    ? '   - Each option: {"person": "Name", "year": number}'
    : '   - Each option: {"author": "Author Name", "book": "Book Title"}';

  const prompt = 'Generate a word puzzle based on a ' + quoteSource + '.\n\n' +
    'STRICT REQUIREMENTS:\n' +
    '1. Target phrase: ' + targetPhraseDesc + '\n' +
    '   - CRITICAL: MUST be between 8-25 words total (count every single word)\n' +
    '   - Must be the exact, complete quote (no truncation)\n' +
    '   - Examples of valid lengths:\n' +
    '     * "To be or not to be that is the question" (10 words) ✓\n' +
    '     * "Ask not what your country can do for you" (9 words) ✓\n' +
    '   - TOO SHORT: "I have a dream" (4 words) ✗\n' +
    '   - Choose quotes with at least 8 words or use a complete sentence\n\n' +
    '2. Difficulty: ' + calculatedDifficulty + '/5 - ' + difficultyDesc + '\n\n' +
    '3. Facsimile phrase: Create a semantically similar phrase that:\n' +
    '   - Maintains the core meaning of the original\n' +
    '   - Uses different wording (a "spin-off" of the original)\n' +
    '   - Has similar word count (within ±30% of target phrase length)\n\n' +
    '4. Bonus question: "Who is the source of this quote?"\n' +
    '   - MUST include exactly 4 multiple choice options\n' +
    '   - One correct answer + 3 plausible distractors\n' +
    '   - All options should be from the same era and context\n' +
    bonusFieldDescription + '\n\n' +
    'Return ONLY valid JSON (no markdown, no code blocks) in this exact format:\n' +
    '{\n' +
    '  "targetPhrase": "exact quote text here",\n' +
    '  "facsimilePhrase": "similar meaning phrase here",\n' +
    '  "source": "Full name of author/speaker",\n' +
    '  "sourceYear": year as number or null,\n' +
    '  "theme": "brief theme description",\n' +
    '  "tags": ["tag1", "tag2"],\n' +
    bonusOptionsFormat + '\n' +
    '  "correctAnswerIndex": 0\n' +
    '}\n\n' +
    'CRITICAL VALIDATION (your response will be rejected if these fail):\n' +
    '- Count words in targetPhrase by splitting on spaces - MUST be 8-25 words\n' +
    '- If your quote has fewer than 8 words, choose a different quote or add context\n' +
    '- bonusOptions array MUST have exactly 4 elements\n' +
    '- correctAnswerIndex MUST be 0-3 (the index of the correct answer in bonusOptions)\n';

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
    // Remove code block markers at start (using character concatenation to avoid parsing issues)
    const codeBlockStart = String.fromCharCode(96, 96, 96); // backtick x3
    const codeBlockJsonStart = codeBlockStart + 'json';
    if (cleanedText.startsWith(codeBlockJsonStart)) {
      cleanedText = cleanedText.slice(7);
    }
    if (cleanedText.startsWith(codeBlockStart)) {
      cleanedText = cleanedText.slice(3);
    }
    // Remove code block markers at end
    if (cleanedText.endsWith(codeBlockStart)) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();
    aiResponse = JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse AI response:', content.text);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error('Invalid JSON from AI: ' + errorMsg);
  }

  // Validate bonus question presence and structure
  if (!aiResponse.bonusOptions || !Array.isArray(aiResponse.bonusOptions)) {
    throw new Error('Missing bonusOptions array in AI response');
  }
  if (aiResponse.bonusOptions.length !== 4) {
    throw new Error('bonusOptions must have exactly 4 elements, got ' + aiResponse.bonusOptions.length);
  }
  if (aiResponse.correctAnswerIndex === undefined || aiResponse.correctAnswerIndex < 0 || aiResponse.correctAnswerIndex > 3) {
    throw new Error('correctAnswerIndex must be 0-3, got ' + aiResponse.correctAnswerIndex);
  }

  // Validate and structure the puzzle
  // Handle both historical (person/year) and literature (author/book) formats
  const bonusOptions = aiResponse.bonusOptions.map((opt: any, idx: number) => {
    if (calculatedQuoteType === 'historical') {
      return {
        id: String(idx + 1),
        person: opt.person,
        year: opt.year || undefined,
      };
    } else {
      return {
        id: String(idx + 1),
        author: opt.author,
        book: opt.book,
      };
    }
  });

  // Store the correct answer ID before shuffling
  const correctAnswerId = bonusOptions[aiResponse.correctAnswerIndex].id;

  // Shuffle the bonus options to randomize answer order
  const shuffledOptions = [...bonusOptions].sort(() => Math.random() - 0.5);

  const puzzle: GeneratedPuzzle = {
    targetPhrase: aiResponse.targetPhrase,
    facsimilePhrase: aiResponse.facsimilePhrase,
    difficulty: calculatedDifficulty,
    bonusQuestion: {
      type: calculatedQuoteType === 'historical' ? 'quote' : 'literature',
      question: 'Who is the source of this quote?',
      options: shuffledOptions,
      correctAnswerId: correctAnswerId,
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
    throw new Error('Target phrase word count (' + targetWords + ') outside 8-25 range');
  }

  const lengthDiff = Math.abs(targetWords - facsimileWords) / targetWords;
  if (lengthDiff > 0.3) {
    console.warn('Facsimile length differs by ' + (lengthDiff * 100).toFixed(1) + '% from target');
  }

  return puzzle;
}

/**
 * Generate multiple puzzles in batch with retry logic
 */
export async function generatePuzzleBatch(
  startDate: Date,
  count: number
): Promise<Array<GeneratedPuzzle & { date: string }>> {
  const puzzles: Array<GeneratedPuzzle & { date: string }> = [];
  const maxRetries = 3;

  for (let i = 0; i < count; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + i);
    let lastError: Error | null = null;

    // Retry up to maxRetries times if validation fails
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const puzzle = await generatePuzzle(targetDate);
        puzzles.push({
          ...puzzle,
          date: targetDate.toISOString().split('T')[0], // YYYY-MM-DD
        });

        // Success - break retry loop
        lastError = null;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Attempt ${attempt + 1}/${maxRetries} failed for ${targetDate.toISOString().split('T')[0]}: ${lastError.message}`);

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    // If all retries failed, throw the last error
    if (lastError) {
      console.error('Failed to generate puzzle for ' + targetDate.toISOString() + ' after ' + maxRetries + ' attempts:', lastError);
      throw lastError;
    }

    // Small delay to avoid rate limiting
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return puzzles;
}
