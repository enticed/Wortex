import { DriveStep } from "driver.js";

/**
 * Tutorial Steps Configuration for Wortex
 *
 * Addresses 16 key user confusion points identified in early testing:
 * 1. Hint Phrase purpose
 * 2. Speed slider usage
 * 3. Removing words from Mystery Quote area (can't do it)
 * 4. Reordering words in Phase 1 (can't do it)
 * 5. Stacked words in vortex (known bug)
 * 6. Getting hints in Phase 1 (use speed slider)
 * 7. How to rearrange words in Phase 2
 * 8. Identifying unneeded words in Phase 2
 * 9. What to do with unneeded words
 * 10. Knowing if assembling correctly
 * 11. Finding next word when stuck
 * 12. Removing unnecessary words
 * 13. Scoring system
 * 14. Tracking improvement
 * 15. Pure vs Boosted scores
 * 16. Playing past puzzles
 */

// Welcome screen steps (shown on homepage)
export const welcomeSteps: DriveStep[] = [
  {
    element: "#app-container",
    popover: {
      title: "Welcome to Wortex! 🌀",
      description: `
        <div class="space-y-2">
          <p>Wortex is a unique word puzzle where you collect and arrange words to reveal famous quotes.</p>
          <p><strong>This quick tutorial will guide you through the game.</strong></p>
          <p class="text-sm"><strong>💡 Tutorial Tip:</strong> Steps with a <span style="background-color: #fef3c7; padding: 0.125rem 0.25rem; border-radius: 0.25rem;">yellow background</span> require you to interact with the game (not just click "Next").</p>
          <p>Click "Next" to continue, or you can skip it anytime and replay it later from the menu.</p>        </div>
      `,
      side: "over",
      align: "center",
      showButtons: ["next", "close"],
    },
  },
  {
    element: "#play-button",
    popover: {
      title: "Ready to Learn?",
      description: `
        <div class="space-y-2" style="background-color: #fef3c7; padding: 0.75rem; border-radius: 0.5rem; margin: -0.5rem; margin-bottom: 0.5rem;">
          <p class="font-semibold" style="color: #92400e;">⚠️ Action Required</p>
        </div>
        <div class="space-y-2">
          <p><strong>Click the "Start Tutorial" button below</strong> to continue to the next page.</p>
          <p class="text-sm">The tutorial will automatically resume on the next page!</p>        </div>
      `,
      side: "top",
      align: "center",
      showButtons: ["previous", "close"],
      onPopoverRender: (popover, options) => {
        const playButton = document.querySelector('#play-button');
        if (playButton) {
          const handlePlayClick = (e: Event) => {
            console.log('[Tutorial Debug] Play button clicked - closing tutorial');
            setTimeout(() => {
              options.driver.destroy();
            }, 0);
          };
          playButton.addEventListener('click', handlePlayClick, { once: true });
        }
      },
    },
  },
];

// Pre-game page steps
export const preGameSteps: DriveStep[] = [
  // Step 3: Hint Phrase Explanation
  {
    element: "#hint-phrase-explanation",
    popover: {
      title: "The Hint Phrase (Key Concept!)",
      description: `
        <div class="space-y-2">
          <p>Every puzzle has a <strong>Hint Phrase</strong> that gives you clues about the Mystery Quote.</p>
          <p class="text-sm">In this tutorial, the hint phrase is <em>"Minimalist design philosophy"</em> and the mystery quote is <em>"Less is more"</em>.</p>
          <p class="text-sm">The Hint Phrase is NOT the answer - it's just a clue to help you identify the right words!</p>        </div>
      `,
      side: "bottom",
      align: "center",
      showButtons: ["next", "previous", "close"],
    },
  },
  // Step 4: Two Phases of Gameplay
  {
    element: "#game-info",
    popover: {
      title: "Two Phases of Gameplay",
      description: `
        <div class="space-y-2">
          <p><strong>Phase 1: Word Collection</strong><br/>
          Grab the right words from the spinning vortex</p>
          <p><strong>Phase 2: Word Arrangement</strong><br/>
          Rearrange them to form the correct quote</p>
          <p class="text-sm"><strong>Scoring:</strong> Lower scores are better! The fewer words you see and the fewer moves you make, the better your score.</p>        </div>
      `,
      side: "bottom",
      align: "start",
      showButtons: ["next", "previous", "close"],
    },
  },
  // Step 5: Continue to Game (action required)
  {
    element: "#continue-to-game-button",
    popover: {
      title: "Ready to Play!",
      description: `
        <div class="space-y-2" style="background-color: #fef3c7; padding: 0.75rem; border-radius: 0.5rem; margin: -0.5rem; margin-bottom: 0.5rem;">
          <p class="font-semibold" style="color: #92400e;">⚠️ Action Required</p>
        </div>
        <div class="space-y-2">
          <p>Now let's try it out with a simple practice puzzle!</p>
          <p class="text-sm font-semibold">Click "Continue to Game" below to start playing!</p>        </div>
      `,
      side: "top",
      align: "center",
      showButtons: ["previous", "close"],
      onPopoverRender: (popover, options) => {
        const continueButton = document.querySelector('#continue-to-game-button');
        if (continueButton) {
          const handleContinueClick = (e: Event) => {
            console.log('[Tutorial Debug] Continue button clicked - closing tutorial');
            setTimeout(() => {
              options.driver.destroy();
            }, 0);
          };
          continueButton.addEventListener('click', handleContinueClick, { once: true });
        }
      },
    },
  },
];

// Phase 1 gameplay steps
export const phase1Steps: DriveStep[] = [
  {
    element: ".hint-phrase-container",
    popover: {
      title: "The Hint Phrase is here again!",
      description: `
        <div class="space-y-2">
          <p>This alternate phrase gives you a <strong>clue about the mystery quote</strong>, but it also makes the game challenging:</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Words from the hint phrase are <strong>mixed into the vortex</strong></li>
            <li>You must figure out which words belong to the actual quote</li>
            <li>Hint phrase words are extras you don't need</li>
          </ul>
          <p class="text-sm italic">Think of it as a helpful distraction! 😊</p>        </div>
      `,
      side: "bottom",
      align: "start",
      showButtons: ["next", "previous", "close"],
    },
  },
  {
    element: ".vortex-container",
    popover: {
      title: "The Vortex",
      description: `
        <div class="space-y-2">
          <p><strong>Drag words UP</strong> from the vortex to the Mystery Quote area above.</p>
          <p class="text-sm">Note: Sometimes words stack on top of each other in the vortex. This is a known visual bug we're working on - just grab the visible word and others will appear!</p>        </div>
      `,
      side: "top",
      align: "center",
      showButtons: ["next", "previous", "close"],
    },
  },
  {
    element: ".speed-slider",
    popover: {
      title: "Speed Slider - Your Secret Weapon!",
      description: `
        <div class="space-y-2">
          <p><strong>Slower Speed (0-0.9x):</strong></p>
          <ul class="list-disc pl-5 text-sm">
            <li>✅ Easier to grab words</li>
            <li>❌ Fog appears, making words harder to read</li>
          </ul>
          <p><strong>Faster Speed (1.1x-2.0x):</strong></p>
          <ul class="list-disc pl-5 text-sm">
            <li>✅ <strong>COLOR-CODED HINTS!</strong> Green = needed words, Red = extras</li>
            <li>❌ Harder to grab moving words</li>
          </ul>
          <p class="font-semibold">Pro tip: Start fast to see which words you need, then slow down to grab them!</p>
          <p class="text-xs italic">⚠️ Using speeds other than 1.0x affects your leaderboard ranking (more on that later)</p>        </div>
      `,
      side: "left",
      align: "start",
      showButtons: ["next", "previous", "close"],
    },
  },
  {
    element: ".mystery-quote-area",
    popover: {
      title: "Important: Phase 1 Limitations",
      description: `
        <div class="space-y-2">
          <p><strong>In Phase 1, you cannot:</strong></p>
          <ul class="list-disc pl-5 space-y-1">
            <li>❌ Remove words once added to Mystery Quote</li>
            <li>❌ Reorder words (that comes in Phase 2!)</li>
          </ul>
          <p class="text-sm">Don't worry about making mistakes - you'll fix everything in Phase 2. Just collect all the words you think belong to the quote!</p>        </div>
      `,
      side: "bottom",
      align: "center",
      showButtons: ["next", "previous", "close"],
    },
  },
  {
    element: ".vortex-container",
    popover: {
      title: "Dismissing Words (Optional)",
      description: `
        <div class="space-y-2" style="background-color: #fef3c7; padding: 0.75rem; border-radius: 0.5rem; margin: -0.5rem; margin-bottom: 0.5rem;">
          <p class="font-semibold" style="color: #92400e;">⚠️ Action Required</p>
        </div>
        <div class="space-y-2">
          <p><strong>Flick words to the RIGHT</strong> (swipe quickly) to remove them from the vortex.</p>
          <p>Use this when:</p>
          <ul class="list-disc pl-5 text-sm">
            <li>You know a word isn't needed</li>
            <li>You want to clear clutter</li>
          </ul>
          <p class="text-xs italic">This doesn't affect your score - it's completely optional and just helps you focus!</p>
          <p class="text-sm font-semibold mt-2">Try grabbing a word to get started!</p>        </div>
      `,
      side: "top",
      align: "center",
      showButtons: ["previous", "close"],
      onPopoverRender: (popover, options) => {
        const vortexContainer = document.querySelector('.vortex-container');
        if (vortexContainer) {
          const handleWordGrab = (e: Event) => {
            console.log('[Tutorial Debug] Pointer event detected on vortex - closing tutorial');
            setTimeout(() => {
              options.driver.destroy();
            }, 100);
          };
          vortexContainer.addEventListener('mousedown', handleWordGrab, { once: true, capture: true });
          vortexContainer.addEventListener('touchstart', handleWordGrab, { once: true, capture: true });
        }
      },
    },
  },
];

// Phase 2 gameplay steps
export const phase2Steps: DriveStep[] = [
  {
    element: ".mystery-quote-area",
    disableActiveInteraction: false,
    popover: {
      title: "Phase 2: Word Arrangement",
      description: `
        <div class="space-y-2">
          <p>Now arrange the words in the correct order to reveal the quote!</p>
          <p><strong>How to rearrange words:</strong></p>
          <ol class="list-decimal pl-5 space-y-1 text-sm">
            <li><strong>Tap/click</strong> a word to grab it</li>
            <li>Check the <strong>orange-highlighted word</strong> in the header to confirm you grabbed the right one</li>
            <li><strong>Drag</strong> it to a new position</li>
            <li>Look for the <strong>gold indicator arrows</strong> showing where it will drop</li>
            <li><strong>Release</strong> to place it</li>
          </ol>
          <p class="text-xs">Each move costs 0.25 points, so think before you move!</p>        </div>
      `,
      side: "top",
      align: "start",
      showButtons: ["next", "previous", "close"],
    },
  },
  {
    element: ".mystery-quote-area",
    disableActiveInteraction: false,
    popover: {
      title: "The Assembly Header - Your Friend!",
      description: `
        <div class="space-y-2">
          <p>When you grab a word, it appears in the header in <strong class="text-orange-500">bright orange</strong>.</p>
          <p class="text-sm">This confirms you've grabbed the right word before you move it!</p>        </div>
      `,
      side: "top",
      align: "start",
      showButtons: ["next", "previous", "close"],
    },
  },
  {
    element: ".hint-buttons",
    popover: {
      title: "Stuck? Use Hints!",
      description: `
        <div class="space-y-2">
          <p>Three powerful hint types (0.5 points each):</p>
          <p><strong>1. Unneeded Word:</strong> Identifies and removes a word that doesn't belong</p>
          <p><strong>2. Correct String:</strong> Temporarily highlights consecutive words already in the right order with a green border</p>
          <p><strong>3. Next Word:</strong> Shows which word should come next in sequence</p>
          <p class="text-sm italic">Use these when you're truly stuck - they're lifesavers!</p>        </div>
      `,
      side: "top",
      align: "start",
      showButtons: ["next", "previous", "close"],
    },
  },
  {
    element: ".mystery-quote-area",
    disableActiveInteraction: false,
    popover: {
      title: "Dealing with Unneeded Words",
      description: `
        <div class="space-y-2">
          <p><strong>Q: How do I know which words aren't needed?</strong><br/>
          A: Trial and error! Or use the "Unneeded Word" hint.</p>
          <p><strong>Q: What do I do with unneeded words?</strong><br/>
          A: Move them to the <strong>end of the word block</strong>. The app ignores anything after the correct quote!</p>
          <p class="text-sm">Think of it like sweeping clutter to the end of your desk.</p>        </div>
      `,
      side: "top",
      align: "start",
      showButtons: ["next", "previous", "close"],
    },
  },
  {
    element: ".mystery-quote-area",
    disableActiveInteraction: false,
    popover: {
      title: "How to Know You're Correct",
      description: `
        <div class="space-y-2" style="background-color: #fef3c7; padding: 0.75rem; border-radius: 0.5rem; margin: -0.5rem; margin-bottom: 0.5rem;">
          <p class="font-semibold" style="color: #92400e;">⚠️ Action Required</p>
        </div>
        <div class="space-y-2">
          <p><strong>Use "Correct String" Hint:</strong> Temporarily highlights consecutive words already in the right order with a green border</p>
          <p><strong>Use "Next Word" Hint:</strong> Shows which word should come next in sequence</p>
          <p class="text-sm italic">When you've arranged all words correctly, the puzzle completes automatically! 🎉</p>
          <p class="text-sm font-semibold mt-2">Try grabbing a word to get started!</p>        </div>
      `,
      side: "top",
      align: "start",
      showButtons: ["previous", "close"],
      onPopoverRender: (popover, options) => {
        const mysteryQuoteArea = document.querySelector('.mystery-quote-area');
        if (mysteryQuoteArea) {
          const handleWordGrab = (e: Event) => {
            console.log('[Tutorial Debug] Phase 2 word grab detected - closing tutorial');
            setTimeout(() => {
              options.driver.destroy();
            }, 100);
          };
          mysteryQuoteArea.addEventListener('mousedown', handleWordGrab, { once: true, capture: true });
          mysteryQuoteArea.addEventListener('touchstart', handleWordGrab, { once: true, capture: true });
        }
      },
    },
  },
];

// Bonus Round tutorial (shown when bonus round appears)
export const bonusRoundSteps: DriveStep[] = [
  {
    element: ".bonus-round-container",
    disableActiveInteraction: false,
    popover: {
      title: "Bonus Round",
      description: `
        <div class="space-y-2" style="background-color: #fef3c7; padding: 0.75rem; border-radius: 0.5rem; margin: -0.5rem; margin-bottom: 0.5rem;">
          <p class="font-semibold" style="color: #92400e;">⚠️ Action Required</p>
        </div>
        <div class="space-y-2">
          <p>Answer the trivia question below about the quote or its author!</p>
          <p><strong>Correct answer:</strong> Get a 10% bonus (your score is multiplied by 0.9)</p>
          <p><strong>Wrong or skipped:</strong> No penalty, score stays the same</p>
          <p class="text-sm italic">Remember: Lower scores are better, so the bonus actually reduces your score! 🎯</p>
          <p class="text-sm font-semibold mt-2">Select an answer and click Submit to continue!</p>        </div>
      `,
      side: "top",
      align: "start",
      showButtons: ["close"],
      onPopoverRender: (popover, options) => {
        // Watch for the final results header to appear (indicating bonus was answered)
        const observer = new MutationObserver(() => {
          const finalResultsHeader = document.querySelector('.final-results-header');
          if (finalResultsHeader) {
            console.log('[Tutorial Debug] Final results detected - closing bonus tutorial step');
            observer.disconnect();
            setTimeout(() => {
              options.driver.destroy();
            }, 100);
          }
        });

        // Observe the entire document body for the final results to appear
        observer.observe(document.body, { childList: true, subtree: true });
      },
    },
  },
];

// Final Results tutorial (steps 15-18 - all shown on final results page)
export const finalResultsSteps: DriveStep[] = [
  // Step 15: Understanding Your Score
  {
    element: ".final-results-container",
    disableActiveInteraction: false,
    popover: {
      title: "Understanding Your Score",
      description: `
        <div class="space-y-2">
          <p><strong>Phase 1 Score:</strong> Words Seen ÷ Total Unique Words</p>
          <p><strong>Phase 2 Score:</strong> (Moves × 0.25) + (Hints × 0.5)</p>
          <p><strong>Final Score:</strong> Phase 1 + Phase 2</p>
          <p><strong>Bonus Correct:</strong> Final Score × 0.9 (10% reduction!)</p>
          <p class="font-semibold text-lg">Remember: Lower scores are better!</p>        </div>
      `,
      side: "bottom",
      align: "start",
      showButtons: ["next", "previous", "close"],
    },
  },
  // Step 16: Track Your Improvement
  {
    element: "#compare-previous-button",
    popover: {
      title: "Track Your Improvement!",
      description: `
        <div class="space-y-2">
          <p>Click here to see how you're improving over time:</p>
          <ul class="list-disc pl-5 space-y-1 text-sm">
            <li>Current streak (consecutive days played)</li>
            <li>Total games played</li>
            <li>Average score over time</li>
            <li>Score distribution histogram</li>
            <li>Recent game history</li>
          </ul>
          <p class="text-sm">Look for <strong>downward trends</strong> in your average - that means you're improving!</p>        </div>
      `,
      side: "top",
      align: "start",
      showButtons: ["next", "previous", "close"],
    },
  },
  // Step 17: Pure vs Boosted Rankings
  {
    element: "#compare-leaderboard-button",
    popover: {
      title: "Pure vs Boosted Rankings",
      description: `
        <div class="space-y-2">
          <p>Click here to compare with today's best scores!</p>
          <p><strong>Pure Rankings:</strong></p>
          <ul class="list-disc pl-5 text-sm">
            <li>First-time plays ONLY</li>
            <li>Must use 1.0x speed (no slider adjustments)</li>
            <li>Most competitive and fair comparison</li>
          </ul>
          <p><strong>Boosted Rankings:</strong></p>
          <ul class="list-disc pl-5 text-sm">
            <li>Repeat plays allowed</li>
            <li>Any speed setting permitted</li>
            <li>Practice makes perfect!</li>
          </ul>
          <p class="text-xs italic">Separate lists ensure fair comparisons since speed adjustments and retries provide advantages.</p>        </div>
      `,
      side: "top",
      align: "start",
      showButtons: ["next", "previous", "close"],
    },
  },
  // Step 20: Create an Account
  {
    element: "#user-menu-button",
    popover: {
      title: "Create an Account!",
      description: `
        <div class="space-y-2">
          <p>Click the <strong>account icon</strong> to create a free account and unlock:</p>
          <ul class="list-disc pl-5 space-y-1 text-sm">
            <li>📊 Track your stats and progress</li>
            <li>🔥 Build daily streaks</li>
            <li>🏆 Compete on the leaderboard</li>
            <li>⭐ Earn achievement stars</li>
          </ul>
          <p class="text-sm italic">Plus, premium subscribers ($1/month) can access the full puzzle archive!</p>        </div>
      `,
      side: "bottom",
      align: "end",
      showButtons: ["next", "previous", "close"],
    },
  },
  // Step 21: Return to Home (FINAL STEP - requires user action)
  {
    element: "#home-link",
    disableActiveInteraction: false,
    popover: {
      title: "🏠 Return to Homepage",
      description: `
        <div class="space-y-2" style="background-color: #fef3c7; padding: 0.75rem; border-radius: 0.5rem; margin: -0.5rem; margin-bottom: 0.5rem;">
          <p class="font-semibold" style="color: #92400e;">⚠️ Action Required</p>
        </div>
        <div class="space-y-2">
          <p>Click the <strong>Wortex</strong> title to return to the homepage and complete the tutorial!</p>
          <p class="text-sm">You can always click this to get back home from anywhere in the app.</p>        </div>
      `,
      side: "bottom",
      align: "start",
      showButtons: ["previous", "close"],
      onPopoverRender: (popover, options) => {
        const homeLink = document.querySelector('#home-link');
        if (homeLink) {
          const handleHomeLinkClick = (e: Event) => {
            console.log('[Tutorial Debug] Home link clicked - preventing navigation and completing tutorial');

            // Prevent default navigation
            e.preventDefault();

            // Destroy the tutorial (this will trigger completion logic)
            options.driver.destroy();

            // Wait a bit for the tutorial completion to be saved to localStorage
            // Then navigate to home
            setTimeout(() => {
              console.log('[Tutorial Debug] Navigating to home after tutorial completion');
              window.location.href = '/';
            }, 200);
          };
          homeLink.addEventListener('click', handleHomeLinkClick, { once: true });
        }
      },
    },
  },
];

// Legacy exports (now unused, but keeping for compatibility)
export const statsSteps: DriveStep[] = [];
export const leaderboardSteps: DriveStep[] = [];
export const accountSteps: DriveStep[] = [];

// Archive explanation steps (not part of main tutorial)
export const archiveSteps: DriveStep[] = [
  {
    element: ".archive-link",
    popover: {
      title: "Premium Feature: Game Archive",
      description: `
        <div class="space-y-2">
          <p><strong>Premium subscribers</strong> ($1/month) can access past puzzles anytime!</p>
          <p class="text-sm">⚠️ Archive plays:</p>
          <ul class="list-disc pl-5 text-sm">
            <li>Don't count toward your streak</li>
            <li>Don't appear on leaderboards</li>
            <li>Perfect for practice!</li>
          </ul>
          <p class="text-xs">Only today's puzzle affects your stats and rankings.</p>
        </div>
      `,
      side: "bottom",
      align: "start",
    },
  },
];

// Tutorial complete
export const tutorialCompleteSteps: DriveStep[] = [
  {
    popover: {
      title: "Tutorial Complete! 🎉",
      description: `
        <div class="space-y-3">
          <p class="text-lg">You're ready to play Wortex!</p>
          <p><strong>Quick Recap:</strong></p>
          <ul class="list-disc pl-5 space-y-1 text-sm">
            <li>Phase 1: Collect words (use speed slider for hints!)</li>
            <li>Phase 2: Arrange words (use hint buttons when stuck)</li>
            <li>Lower scores = better performance</li>
            <li>Play daily to build your streak!</li>
          </ul>
          <p class="text-sm">You can replay this tutorial anytime from the menu.</p>
          <p class="font-semibold">Good luck! 🌀</p>
        </div>
      `,
      side: "over",
      align: "center",
    },
  },
];
