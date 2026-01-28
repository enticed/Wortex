/**
 * Star rating calculation utilities
 */

/**
 * Calculate Phase 1 stars (word finding efficiency)
 */
export function calculatePhase1Stars(score: number): number {
  if (score <= 1.5) return 5;
  if (score <= 2.5) return 4;
  if (score <= 3.5) return 3;
  if (score <= 4.5) return 2;
  return 1;
}

/**
 * Calculate Phase 2 stars (reordering efficiency)
 */
export function calculatePhase2Stars(score: number, quoteWordCount: number): number {
  // Calculate thresholds based on quote length
  // 5 stars: up to 1 move per word (0.25 points per move)
  const fiveStarMax = quoteWordCount * 0.25;
  // 4 stars: up to 1.5 moves per word (50% more than 5 stars)
  const fourStarMax = fiveStarMax * 1.5;
  // 3 stars: up to 2 moves per word (50% more than 4 stars)
  const threeStarMax = fourStarMax * 1.5;
  // 2 stars: up to 2.5 moves per word (50% more than 3 stars)
  const twoStarMax = threeStarMax * 1.5;

  if (score <= fiveStarMax) return 5;
  if (score <= fourStarMax) return 4;
  if (score <= threeStarMax) return 3;
  if (score <= twoStarMax) return 2;
  return 1;
}

/**
 * Calculate final star rating for a completed game
 * This averages the stars from Phase 1 and Phase 2
 */
export function calculateFinalStars(
  phase1Score: number,
  phase2Score: number,
  quoteWordCount: number
): number {
  const phase1Stars = calculatePhase1Stars(phase1Score);
  const phase2Stars = calculatePhase2Stars(phase2Score, quoteWordCount);

  // Average the two phases and round to nearest integer
  const averageStars = (phase1Stars + phase2Stars) / 2;
  return Math.round(averageStars);
}
