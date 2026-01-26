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
  difficulty?: number,
  existingQuotes?: Set<string>
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
  const difficultyDesc = difficultyDescriptions[calculatedDifficulty as keyof typeof difficultyDescriptions];

  // Different bonus question format based on quote type
  const bonusOptionsFormat = calculatedQuoteType === 'historical'
    ? '  "bonusOptions": [\n' +
      '    {"person": "Correct Person Name", "year": 1950},\n' +
      '    {"person": "Plausible Wrong Person 1", "year": 1945},\n' +
      '    {"person": "Plausible Wrong Person 2", "year": 1960},\n' +
      '    {"person": "Plausible Wrong Person 3", "year": 1955}\n' +
      '  ],\n' +
      '  NOTE: For ancient figures (before year 1), use null for year: {"person": "Socrates", "year": null}'
    : '  "bonusOptions": [\n' +
      '    {"author": "Correct Author Name", "book": "Book Title"},\n' +
      '    {"author": "Plausible Wrong Author 1", "book": "Their Book Title"},\n' +
      '    {"author": "Plausible Wrong Author 2", "book": "Their Book Title"},\n' +
      '    {"author": "Plausible Wrong Author 3", "book": "Their Book Title"}\n' +
      '  ],';

  // Build uniqueness constraint for prompt
  let uniquenessConstraint = '';
  if (existingQuotes && existingQuotes.size > 0) {
    const recentQuotes = Array.from(existingQuotes).slice(-10); // Show last 10 for context
    uniquenessConstraint = '\n\n0. UNIQUENESS REQUIREMENT (CRITICAL):\n' +
      '   - Your quote MUST be completely different from these recently used quotes:\n' +
      recentQuotes.map(q => '     * "' + q + '"').join('\n') +
      '\n   - Do NOT generate ANY of the above quotes\n' +
      '   - Choose a quote from a different source, era, or context\n' +
      '   - Ensure your quote is unique and has not been used before\n';
  }

  // Build a list of example quotes that meet the word count requirement
  const exampleQuotes = calculatedQuoteType === 'historical'
    ? [
        '"The only thing we have to fear is fear itself." - Franklin D. Roosevelt (10 words)',
        '"Ask not what your country can do for you; ask what you can do for your country." - John F. Kennedy (17 words)',
        '"In the end, we will remember not the words of our enemies, but the silence of our friends." - Martin Luther King Jr. (19 words)',
        '"The only way to do great work is to love what you do." - Steve Jobs (13 words)',
        '"That which does not kill us makes us stronger." - Friedrich Nietzsche (10 words)',
      ]
    : [
        '"It was the best of times, it was the worst of times." - Charles Dickens (13 words)',
        '"All happy families are alike; each unhappy family is unhappy in its own way." - Leo Tolstoy (15 words)',
        '"It is a truth universally acknowledged that a single man in possession of a good fortune must be in want of a wife." - Jane Austen (24 words)',
        '"To be, or not to be, that is the question." - William Shakespeare (10 words)',
        '"The only way out of the labyrinth of suffering is to forgive." - John Green (13 words)',
      ];

  const prompt = `Generate a word puzzle for a game. The quote MUST have 6-28 words (split by spaces).

${uniquenessConstraint}

EXAMPLES OF VALID ${calculatedQuoteType} QUOTES (6-28 words):
${exampleQuotes.join('\n')}

TASK:
- Difficulty: ${calculatedDifficulty}/5 (${difficultyDesc})
- Quote type: ${quoteSource}
- Word count: MUST be 6-28 words (count by splitting on spaces)

CRITICAL: First think through your quote choice, then validate word count, then return JSON.

Return in this exact format (no markdown):
{
  "thinking": "I'm considering the quote: [quote here]. Let me count: [word 1] [word 2] [word 3]... Total: X words. This is [valid/invalid] because [reason]. [If invalid, repeat with new quote until valid]",
  "targetPhrase": "exact quote with ALL original punctuation",
  "facsimilePhrase": "similar meaning phrase here",
  "source": "Full name of author/speaker",
  "sourceYear": year as number or null,
  "theme": "brief theme description",
  "tags": ["tag1", "tag2"],
${bonusOptionsFormat}
  "correctAnswerIndex": 0
}

The "thinking" field MUST show you counting words. DO NOT skip this step.
REJECT quotes with 5 or fewer words (too short).
REJECT quotes with 29+ words (too long for mobile UX).`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    temperature: 1.0, // Higher temperature for more variety and uniqueness
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

    // Log the AI's thinking process if available
    if (aiResponse.thinking) {
      console.log('[AI Thinking]:', aiResponse.thinking);
    }
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

  if (targetWords < 6 || targetWords > 28) {
    throw new Error('Target phrase word count (' + targetWords + ') outside 6-28 range. Quote: "' + puzzle.targetPhrase + '"');
  }

  const lengthDiff = Math.abs(targetWords - facsimileWords) / targetWords;
  if (lengthDiff > 0.3) {
    console.warn('Facsimile length differs by ' + (lengthDiff * 100).toFixed(1) + '% from target');
  }

  return puzzle;
}

/**
 * Generate multiple puzzles in batch with retry logic and duplicate prevention
 */
export async function generatePuzzleBatch(
  startDate: Date,
  count: number,
  existingQuotes?: Set<string>
): Promise<Array<GeneratedPuzzle & { date: string }>> {
  const puzzles: Array<GeneratedPuzzle & { date: string }> = [];
  const maxRetries = 10; // Increased retries for word count and duplicate detection
  const usedQuotes = new Set<string>(existingQuotes || []);

  for (let i = 0; i < count; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + i);
    let lastError: Error | null = null;

    // Retry up to maxRetries times if validation fails or duplicate detected
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const puzzle = await generatePuzzle(targetDate, undefined, undefined, usedQuotes);

        // Check for duplicates (case-insensitive, trimmed comparison)
        const normalizedQuote = puzzle.targetPhrase.toLowerCase().trim();
        if (usedQuotes.has(normalizedQuote)) {
          throw new Error(`Duplicate quote detected: "${puzzle.targetPhrase}"`);
        }

        // Check for similar quotes (same beginning - first 30 characters)
        const quoteBeginning = normalizedQuote.substring(0, 30);
        for (const existingQuote of usedQuotes) {
          if (existingQuote.substring(0, 30) === quoteBeginning) {
            throw new Error(`Similar quote detected (same beginning): "${puzzle.targetPhrase}" matches "${existingQuote}"`);
          }
        }

        // Add to used quotes set to prevent duplicates within this batch
        usedQuotes.add(normalizedQuote);

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
