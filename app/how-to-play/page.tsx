'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';

export default function HowToPlayPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 pt-16">
        <div className="max-w-4xl mx-auto relative">
          {/* Close Button */}
          <button
            onClick={() => router.push('/')}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            How to Play Wortex
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            {/* Overview */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Game Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Wortex is a daily word puzzle where you reconstruct a famous quotation from a swirling vortex of words. Each puzzle features a <span className="font-semibold text-emerald-600 dark:text-emerald-400">Mystery Quote</span> (the famous quotation you&apos;ll assemble) and a pre-assembled <span className="font-semibold text-purple-600 dark:text-purple-400">Hint Phrase</span> (a playful spoof version) that provides clues and adds extra words to the vortex to increase the challenge.
              </p>
            </section>

            {/* Phase 1 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Phase 1: Word Collection
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                In the first phase, your goal is to collect all the words needed for the <span className="font-semibold text-emerald-600 dark:text-emerald-400">Mystery Quote</span>:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>The <span className="font-semibold text-purple-600 dark:text-purple-400">Hint Phrase</span> is displayed at the top, already assembled, to give you context</li>
                <li>Words from both the Mystery Quote and the Hint Phrase swirl together in the central vortex</li>
                <li>Drag words from the vortex to the <span className="font-semibold text-emerald-600 dark:text-emerald-400">green assembly area</span> in the middle</li>
                <li>Don&apos;t worry about word order yet - just collect all the words you think belong in the Mystery Quote</li>
                <li>Words you don&apos;t need can be dismissed by dragging them to the right edge</li>
                <li>Phase 1 ends automatically when you&apos;ve collected all the required words for the Mystery Quote</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">
                <span className="font-semibold">Tip:</span> The Hint Phrase provides valuable clues about the meaning and theme of the Mystery Quote!
              </p>
            </section>

            {/* Phase 2 */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Phase 2: Word Arrangement
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                In the second phase, the vortex disappears and you focus on arranging the Mystery Quote:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>The <span className="font-semibold text-purple-600 dark:text-purple-400">Hint Phrase</span> remains visible at the top to guide you</li>
                <li>Your collected words appear in the <span className="font-semibold text-emerald-600 dark:text-emerald-400">green assembly area</span> in the middle</li>
                <li>Drag words to reorder them into the correct sequence</li>
                <li>Arrange the quote from beginning to end, leaving any unnecessary words at the end of the phrase</li>
                <li>Each word movement costs <span className="font-semibold">0.25 points</span></li>
                <li>Three hint buttons appear below to assist if you get stuck (0.5 points each)</li>
                <li>The phrase border turns <span className="text-emerald-600 dark:text-emerald-400">green</span> when correctly assembled</li>
              </ul>
            </section>

            {/* Hints */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Hints (Phase 2 Only)
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Three hint types are available in Phase 2. Each hint costs <span className="font-semibold">0.5 points</span>:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li><span className="font-semibold">Unnecessary Word Hint:</span> Identifies a word that doesn&apos;t belong in the Mystery Quote and moves it to the end</li>
                <li><span className="font-semibold">Correct String Hint:</span> Reveals a sequence of consecutive words already in the correct order</li>
                <li><span className="font-semibold">Next Word Hint:</span> Shows which word should come next in the phrase</li>
              </ul>
            </section>

            {/* Vortex Speed Slider */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Vortex Speed Control
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                The speed slider on the left side of the screen allows you to adjust vortex rotation. Each speed setting has trade-offs:
              </p>
              <div className="space-y-3 ml-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Slower Speeds (0.5x - 0.9x)</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Words are easier to see and grab, but increasing <span className="font-semibold">fog</span> hampers visibility. Better for careful word selection.
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Standard Speed (1.0x)</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Balanced gameplay with no fog and no color coding. Required for Pure Rankings on leaderboards.
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <p className="font-semibold text-red-900 dark:text-red-300 mb-1">Faster Speeds (1.1x - 2.0x)</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Words are harder to catch, but <span className="font-semibold">color coding</span> appears: needed words show <span className="text-emerald-600 dark:text-emerald-400">green</span>, unnecessary words show <span className="text-red-600 dark:text-red-400">red</span>. Better for fast gameplay.
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm">
                <span className="font-semibold">Note:</span> Playing at speeds other than 1.0x moves your score to Boosted Rankings instead of Pure Rankings.
              </p>
            </section>

            {/* Bonus Question */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Bonus Question
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                After assembling the Mystery Quote, you&apos;ll face a multiple-choice question about the quote&apos;s source. Answer correctly for a <span className="font-semibold text-emerald-600 dark:text-emerald-400">10% score reduction</span>!
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li><span className="font-semibold">Literary quotes:</span> Answer format is Author Name and Book Title</li>
                <li><span className="font-semibold">Historical & Poetry quotes:</span> Answer format is Person&apos;s Name and Year</li>
              </ul>
            </section>

            {/* Scoring */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Scoring System
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Your score is calculated based on efficiency. <span className="font-semibold">Lower scores are better!</span>
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-3">
                <p className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                  Score = (Words Seen / Unique Words) + (Reorder Moves × 0.25) + (Hints Used × 0.5)
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li><span className="font-semibold">Words Seen:</span> Total number of word instances you viewed from the vortex (including repeats)</li>
                <li><span className="font-semibold">Unique Words:</span> Number of distinct words needed for the Mystery Quote</li>
                <li><span className="font-semibold">Reorder Moves:</span> Each word movement in Phase 2 costs 0.25 points</li>
                <li><span className="font-semibold">Hints Used:</span> Each hint costs 0.5 points</li>
                <li><span className="font-semibold">Bonus Correct:</span> Reduces your final score by 10%</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-3">
                The perfect score is 1.0 - achieved by seeing every word exactly once with no reordering or hints. Vortex speed does not directly affect your score, but playing at speeds other than 1.0x places you in Boosted Rankings.
              </p>
            </section>

            {/* Leaderboards */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Leaderboards
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Two types of leaderboards track your progress:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li><span className="font-semibold text-emerald-600 dark:text-emerald-400">Pure Rankings:</span> First play of each puzzle at standard speed (1.0x only)</li>
                <li><span className="font-semibold text-purple-600 dark:text-purple-400">Boosted Rankings:</span> Repeat plays or games with adjusted speed (any speed other than 1.0x)</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                Daily and Global leaderboards are available to compare your performance with other players!
              </p>
            </section>

            {/* Controls */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Game Controls
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li><span className="font-semibold">Vortex Speed Slider:</span> Adjust rotation speed (left side) - affects fog and color coding</li>
                <li><span className="font-semibold">Dismiss Zone:</span> Drag unwanted words to the right edge to remove them from view</li>
                <li><span className="font-semibold">Drag & Drop:</span> Works with both mouse and touch input for word movement</li>
                <li><span className="font-semibold">Word Reordering:</span> In Phase 2, drag words within the assembly area to rearrange them</li>
              </ul>
            </section>

            {/* Pro Tips */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Pro Tips
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                <li>Study the Hint Phrase carefully - it provides valuable context for the Mystery Quote</li>
                <li>At slower speeds, use the fog strategically to focus on specific words</li>
                <li>At faster speeds, the color coding (green/red) helps you quickly identify needed words</li>
                <li>Dismissed words can be retrieved from the right edge if you change your mind</li>
                <li>In Phase 2, plan your word arrangement carefully to minimize moves and save points</li>
                <li>Pay attention to grammar, punctuation, and context when ordering words</li>
                <li>The Hint Phrase often contains a humorous twist on the original quote&apos;s theme</li>
              </ul>
            </section>

            {/* Daily Puzzle & Archive */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Daily Puzzle & Archive
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                A new Wortex puzzle is released every day at midnight in your timezone.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Archive Mode:</span> Missed a day? The Archive lets you play previous puzzles for practice. Note that Archive games <span className="font-semibold">do not count</span> towards leaderboards or awards - they&apos;re purely for fun and practice!
              </p>
            </section>
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Start Playing
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
