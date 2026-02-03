/**
 * Utilities for generating share text for social media
 */

interface ScoreShareData {
  finalScore: number;
  stars: number;
  puzzleDate: string;
  facsimilePhrase: string;
  bonusEarned: boolean;
}

interface LeaderboardShareData {
  rank: number;
  score: number;
  totalPlayers: number;
  rankingType: 'pure' | 'boosted';
  puzzleDate: string;
}

interface InviteShareData {
  facsimilePhrase: string;
  puzzleDate?: string;
}

/**
 * Convert number to star emojis
 */
function starsToEmoji(count: number): string {
  return '⭐'.repeat(Math.max(0, Math.min(5, count)));
}

/**
 * Format date to readable string (e.g., "Feb 2, 2025")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Generate share text for personal score
 */
export function generateScoreShareText(data: ScoreShareData): string {
  const stars = starsToEmoji(data.stars);
  const bonus = data.bonusEarned ? ' (+10% bonus!)' : '';

  return `🌀 Wortex Daily Puzzle
📅 ${formatDate(data.puzzleDate)}
${stars} Score: ${data.finalScore.toFixed(2)}${bonus}
💡 Hint: "${data.facsimilePhrase}"

Can you beat my score?
👉 wortex.live`;
}

/**
 * Generate share text for leaderboard position
 */
export function generateLeaderboardShareText(data: LeaderboardShareData): string {
  const rankEmoji = data.rank === 1 ? '🥇' : data.rank === 2 ? '🥈' : data.rank === 3 ? '🥉' : '🏅';
  const rankingLabel = data.rankingType === 'pure' ? 'Pure' : 'Boosted';

  return `🏆 Wortex Leaderboard
📅 ${formatDate(data.puzzleDate)}
${rankEmoji} Ranked #${data.rank} of ${data.totalPlayers} players
⭐ Score: ${data.score.toFixed(2)} (${rankingLabel})

Join the competition!
👉 wortex.live`;
}

/**
 * Generate share text for general invitation
 */
export function generateInviteText(data: InviteShareData): string {
  const dateText = data.puzzleDate ? `\n📅 ${formatDate(data.puzzleDate)}` : '';

  return `🌀 Try today's Wortex puzzle!${dateText}
💡 Hint: "${data.facsimilePhrase}"

Can you guess the famous quote?
👉 wortex.live`;
}

/**
 * Copy text to clipboard
 * Returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Use native share API if available (primarily mobile)
 * Returns true if native share was used, false if not available
 */
export async function nativeShare(text: string, url: string = 'https://wortex.live'): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        text: text,
        url: url,
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      console.log('Native share cancelled or failed:', err);
      return false;
    }
  }
  return false;
}

/**
 * Open Twitter/X share dialog
 */
export function shareToTwitter(text: string): void {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'width=550,height=420');
}

/**
 * Open Facebook share dialog
 */
export function shareToFacebook(url: string = 'https://wortex.live'): void {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(shareUrl, '_blank', 'width=550,height=420');
}
