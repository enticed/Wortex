/**
 * Badge system utilities for homepage achievements
 */

export interface Badge {
  emoji: string;
  tier: string;
  color: string;
}

/**
 * Get participation badge based on total games played
 */
export function getParticipationBadge(totalGames: number): Badge {
  if (totalGames >= 365) {
    return { emoji: '👑', tier: 'Crown', color: 'text-yellow-500' };
  }
  if (totalGames >= 180) {
    return { emoji: '🏆', tier: 'Trophy', color: 'text-yellow-600' };
  }
  if (totalGames >= 90) {
    return { emoji: '💎', tier: 'Diamond', color: 'text-blue-400' };
  }
  if (totalGames >= 30) {
    return { emoji: '🔥', tier: 'Flame', color: 'text-orange-500' };
  }
  if (totalGames >= 14) {
    return { emoji: '⚡', tier: 'Lightning', color: 'text-yellow-400' };
  }
  if (totalGames >= 7) {
    return { emoji: '✨', tier: 'Sparkle', color: 'text-purple-400' };
  }
  if (totalGames >= 3) {
    return { emoji: '⭐', tier: 'Star', color: 'text-yellow-500' };
  }
  if (totalGames >= 1) {
    return { emoji: '🌱', tier: 'Seedling', color: 'text-green-500' };
  }
  return { emoji: '🎯', tier: 'Newcomer', color: 'text-gray-400' };
}

/**
 * Get performance badge based on average stars
 */
export function getPerformanceBadge(averageStars: number): Badge {
  if (averageStars >= 4.5) {
    return { emoji: '⭐⭐⭐⭐⭐', tier: '5-Star', color: 'text-yellow-400' };
  }
  if (averageStars >= 3.5) {
    return { emoji: '⭐⭐⭐⭐', tier: '4-Star', color: 'text-yellow-500' };
  }
  if (averageStars >= 2.5) {
    return { emoji: '⭐⭐⭐', tier: '3-Star', color: 'text-yellow-600' };
  }
  if (averageStars >= 1.5) {
    return { emoji: '⭐⭐', tier: '2-Star', color: 'text-orange-500' };
  }
  if (averageStars >= 0.5) {
    return { emoji: '⭐', tier: '1-Star', color: 'text-orange-600' };
  }
  return { emoji: '🎯', tier: 'Beginner', color: 'text-gray-400' };
}

/**
 * Calculate average stars from total stars and total games
 * This matches the calculation used in the stats table
 */
export function calculateAverageStars(
  oneStar: number,
  twoStar: number,
  threeStar: number,
  fourStar: number,
  fiveStar: number
): number {
  const totalGames = oneStar + twoStar + threeStar + fourStar + fiveStar;
  if (totalGames === 0) return 0;

  const totalStars = (oneStar * 1) + (twoStar * 2) + (threeStar * 3) + (fourStar * 4) + (fiveStar * 5);
  return totalStars / totalGames;
}
