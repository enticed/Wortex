# Tutorial Options Evaluation for Wortex

## Executive Summary

Wortex is a mobile-first Next.js word puzzle game with complex mechanics (vortex word collection, speed controls, hints) that currently lacks interactive onboarding. This document evaluates tutorial implementation options.

**Current State:**
- Static "How to Play" page exists
- Pre-game tip rotation system (9 tips)
- No first-time user detection or guided walkthrough
- No interactive tutorial

**Key Challenge:** The game has a unique vortex mechanic and two-phase gameplay that requires hands-on learning.

---

## Option 1: Product Tour Overlay (Recommended)

### Description
Interactive step-by-step walkthrough using overlay tooltips that guide users through their first game experience.

### Implementation Approach

**Technology Options:**

1. **Custom React Components** (Recommended)
   - Build lightweight overlay system from scratch
   - Full control over styling and behavior
   - Leverages existing Tailwind CSS
   - Estimated effort: 8-12 hours

2. **Driver.js** (https://driverjs.com/)
   - Lightweight library (5KB gzipped)
   - Popular choice for product tours
   - Great for highlighting specific elements
   - Estimated effort: 4-6 hours

3. **Shepherd.js** (https://shepherdjs.dev/)
   - More feature-rich than Driver.js
   - Built-in step management
   - Accessibility-focused
   - Estimated effort: 6-8 hours

4. **Intro.js** (https://introjs.com/)
   - Mature library with extensive features
   - Larger bundle size (~15KB)
   - May be overkill for your needs
   - Estimated effort: 6-8 hours

### Recommended Flow

```
1. Homepage Welcome (Skip Tutorial option)
   ↓
2. Pre-Game: "Let's learn by doing!"
   ↓
3. Game Phase 1 Tutorial Mode:
   - Mini vortex with 5 words only
   - Guided steps:
     a) "Drag a green word to the Mystery Quote area"
     b) "Try the speed slider to slow down"
     c) "Drag an unwanted word to dismiss zone"
     d) "Collect remaining words"
   ↓
4. Phase 2 Tutorial Mode:
   - Simplified puzzle (4-5 words)
   - Guided steps:
     a) "Drag words to reorder them"
     b) "Use a hint if you're stuck"
     c) "Get all words in order"
   ↓
5. Tutorial Complete → Real Game Begins
```

### Integration Points

**Components to Create:**
```
components/tutorial/
├── TutorialContext.tsx          # Global state management
├── TutorialOverlay.tsx          # Main container with backdrop
├── TutorialStep.tsx             # Individual step component
├── TutorialHighlight.tsx        # Element highlighting effect
├── TutorialMiniGame.tsx         # Simplified game for learning
└── useTutorial.ts               # Hook for tutorial state
```

**Files to Modify:**
- [components/home/HomePage.tsx](components/home/HomePage.tsx) - Add welcome overlay trigger
- [app/pre-game/page.tsx](app/pre-game/page.tsx) - Replace tip with tutorial on first visit
- [components/game/GameBoard.tsx](components/game/GameBoard.tsx) - Add tutorial mode flag
- [lib/contexts/UserContext.tsx](lib/contexts/UserContext.tsx) - Track tutorial completion

### Pros
✅ Minimal disruption to existing UX
✅ Can be skipped easily
✅ Users learn by doing (high retention)
✅ Progressive disclosure of complex features
✅ Works on mobile and desktop

### Cons
❌ Requires state management complexity
❌ Need to maintain tutorial content separately
❌ May feel forced if not skippable
❌ Additional bundle size (5-15KB depending on library)

### Estimated Effort
- **Custom Build:** 8-12 hours
- **Using Library:** 4-8 hours
- **Testing & Polish:** 4-6 hours
- **Total:** 12-20 hours

### Cost
- Free (all recommended libraries are open-source)
- No ongoing maintenance costs

---

## Option 2: Interactive Tutorial Puzzle

### Description
Replace the pre-game tip screen with a simplified, tutorial-specific puzzle for first-time users.

### Implementation Approach

Create a dedicated tutorial puzzle with:
- 3-4 words in vortex (vs. 20-30 in real game)
- Simple quote: "Hello world" or "Welcome to Wortex"
- Locked speed at 1.0x
- Forced interactions (must try each feature)
- No scoring pressure

### Recommended Flow

```
1. User clicks "Play Today's Puzzle"
   ↓
2. Check: Has completed tutorial?
   No → Show TutorialGame
   Yes → Show normal pre-game tip
   ↓
3. TutorialGame Steps:
   Step 1: "Drag the word 'Hello' from the vortex"
   Step 2: "Now drag 'world'"
   Step 3: "Great! Try adjusting the speed slider"
   Step 4: "Drag 'to' to the dismiss zone (it's not needed)"
   ↓
4. Phase 2 Mini Tutorial:
   Step 1: "Reorder: 'world Hello' → 'Hello world'"
   Step 2: "Click 'Unnecessary Word' hint"
   ↓
5. Tutorial Complete → Proceed to real game
```

### Integration Points

**New Files:**
```
components/tutorial/
├── TutorialGame.tsx             # Standalone tutorial game
├── TutorialVortex.tsx           # Simplified vortex
└── tutorial-data.ts             # Tutorial puzzle definition
```

**Modify:**
- [app/pre-game/page.tsx](app/pre-game/page.tsx) - Conditional rendering
- [lib/utils/localStorage.ts](lib/utils/localStorage.ts) - Store tutorial completion

### Pros
✅ Most realistic learning experience
✅ Low cognitive load (simplified version)
✅ Natural fit with existing flow
✅ Can reuse existing game components
✅ No ongoing maintenance of separate content

### Cons
❌ Adds time to first game (30-60 seconds)
❌ Users might want to skip
❌ Harder to update tutorial content
❌ Must maintain tutorial puzzle data

### Estimated Effort
- **Component Development:** 10-15 hours
- **Tutorial Puzzle Design:** 2-3 hours
- **Testing & Polish:** 4-6 hours
- **Total:** 16-24 hours

### Cost
- Free (no external dependencies)

---

## Option 3: Video Tutorial + Optional Guided Mode

### Description
Embed a short video demonstration with optional "Tutorial Mode" toggle for first-time users.

### Implementation Approach

**Video Component:**
- 60-90 second explainer video showing gameplay
- Embedded via YouTube/Vimeo or self-hosted MP4
- Shown on first visit to homepage or how-to-play page
- Can be rewatched anytime from menu

**Optional Guided Mode:**
- Checkbox: "Enable tutorial hints during my first game"
- If enabled, shows contextual tooltips at key moments
- Automatically disables after first successful completion

### Recommended Flow

```
1. First visit to Homepage
   ↓
2. Auto-play video modal:
   "Welcome to Wortex! Watch this 90-second tutorial"
   [Video showing vortex, dragging, speed, hints]
   ↓
3. End of video:
   [x] Enable guided hints during my first game
   [Skip Tutorial] [Start Playing]
   ↓
4. If guided mode enabled:
   - Show contextual tooltips at key moments
   - E.g., "This is the dismiss zone - drag unwanted words here"
   ↓
5. After first game completion:
   - Disable guided mode automatically
```

### Integration Points

**New Components:**
```
components/tutorial/
├── VideoTutorial.tsx            # Video player modal
├── GuidedTooltip.tsx            # Contextual hints
└── useGuidedMode.ts             # Hook for tooltip logic
```

**Video Hosting Options:**
- **YouTube (unlisted):** Free, reliable, auto-transcoding
- **Vimeo:** Better player customization
- **Self-hosted:** Full control, but requires video optimization

### Pros
✅ Fastest to consume (passive watching)
✅ Can show complex mechanics clearly
✅ Optional guided mode respects user preference
✅ Video can be reused in marketing
✅ Accessible (can add captions)

### Cons
❌ Requires video production (time/cost)
❌ Passive learning (lower retention)
❌ Video may become outdated with UI changes
❌ Adds page load time if self-hosted
❌ Mobile users may skip video

### Estimated Effort
- **Video Production:** 8-16 hours (scripting, recording, editing)
- **Video Player Integration:** 2-3 hours
- **Guided Mode Tooltips:** 6-8 hours
- **Testing & Polish:** 3-4 hours
- **Total:** 19-31 hours

### Cost
- **Video Production:** $0 (DIY) or $200-500 (freelancer)
- **Hosting:** $0 (YouTube/Vimeo free tiers)

---

## Option 4: Progressive Disclosure with Tooltips

### Description
No formal tutorial - instead, show contextual tooltips that appear when users interact with features for the first time.

### Implementation Approach

Use localStorage to track which features have been discovered:
```typescript
{
  "seen_vortex": false,
  "seen_speed_slider": false,
  "seen_dismiss_zone": false,
  "seen_hints": false,
  "seen_leaderboard": false
}
```

Show brief, dismissible tooltips on first interaction:
- First vortex load: "Drag words from the vortex to build the quote"
- First speed change: "Slower = easier, Faster = color-coded hints"
- First Phase 2: "Reorder words to solve the puzzle"
- First hint button hover: "Hints cost 0.5 points but help you solve"

### Recommended Implementation

**Tooltip Library Options:**
1. **Floating UI** (https://floating-ui.com/) - Positioning library
2. **Radix UI Tooltip** (https://www.radix-ui.com/primitives) - Accessible tooltips
3. **Custom CSS + React** - Lightweight, full control

**Example Flow:**
```typescript
// In GameBoard.tsx
const [hasSeenVortexTip, setHasSeenVortexTip] = useState(
  localStorage.getItem('wortex-seen-vortex') === 'true'
);

useEffect(() => {
  if (!hasSeenVortexTip && gameState.phase === 1) {
    // Show tooltip after 2 seconds
    setTimeout(() => {
      setShowVortexTooltip(true);
    }, 2000);
  }
}, [gameState.phase]);

const handleDismissTooltip = () => {
  setShowVortexTooltip(false);
  localStorage.setItem('wortex-seen-vortex', 'true');
};
```

### Integration Points

**New Components:**
```
components/ui/
├── ContextualTooltip.tsx        # Smart tooltip component
└── useFirstTimeFeature.ts       # Hook for tracking feature discovery
```

**Files to Modify:**
- [components/game/Vortex.tsx](components/game/Vortex.tsx) - Add vortex tooltip
- [components/game/SpeedSlider.tsx](components/game/SpeedSlider.tsx) - Add speed tooltip
- [components/game/AssemblyArea.tsx](components/game/AssemblyArea.tsx) - Add Phase 2 tooltip
- [components/game/HintControls.tsx](components/game/HintControls.tsx) - Add hint tooltip

### Pros
✅ Non-intrusive (learn as you go)
✅ Respects experienced users
✅ Minimal development time
✅ Easy to maintain
✅ No "tutorial blocker" feeling

### Cons
❌ Users may miss tooltips
❌ No guaranteed learning path
❌ May not cover all features
❌ Harder to ensure completion
❌ Can feel incomplete

### Estimated Effort
- **Tooltip System:** 4-6 hours
- **Feature Detection Logic:** 3-4 hours
- **Content Writing:** 2-3 hours
- **Testing:** 2-3 hours
- **Total:** 11-16 hours

### Cost
- Free (using open-source libraries)

---

## Option 5: Hybrid Approach (Best of All)

### Description
Combine multiple approaches for a comprehensive onboarding experience.

### Implementation Strategy

**1. First Visit (Homepage):**
- Brief welcome modal: "Welcome to Wortex! Would you like a quick tutorial?"
- Options: [Yes, show me] [No, I'll figure it out] [Watch video instead]

**2. Tutorial Path A - Interactive Mini-Game:**
- Simplified 5-word puzzle with guided steps
- Takes 30-45 seconds
- Marks tutorial as complete

**3. Tutorial Path B - Video:**
- 90-second gameplay video
- Can skip at any time
- Marks tutorial as complete

**4. Tutorial Path C - Skip:**
- Enable "Progressive Tooltips" mode
- Shows contextual hints during first real game

**5. Always Available:**
- "How to Play" page (existing)
- "Replay Tutorial" in settings menu
- Help button ("?") in game header

### Integration Points

Combines elements from Options 1-4:
```
components/tutorial/
├── TutorialContext.tsx          # Global state
├── WelcomeModal.tsx             # First-visit choice
├── InteractiveTutorial.tsx      # Mini-game tutorial
├── VideoTutorial.tsx            # Video option
├── ContextualTooltip.tsx        # Progressive tooltips
└── TutorialSettings.tsx         # Replay/reset options
```

### Pros
✅ Accommodates all learning styles
✅ User chooses their preference
✅ Multiple safety nets for confused users
✅ Professional, polished experience
✅ Future-proof (can iterate on each part)

### Cons
❌ Highest development time
❌ More code to maintain
❌ Complexity in state management
❌ Risk of over-engineering

### Estimated Effort
- **Welcome Modal:** 3-4 hours
- **Interactive Tutorial:** 10-15 hours
- **Video Production + Integration:** 10-18 hours
- **Progressive Tooltips:** 6-8 hours
- **Settings Integration:** 2-3 hours
- **Testing & Polish:** 6-8 hours
- **Total:** 37-56 hours

### Cost
- **Video Production:** $0-500 (depending on DIY vs. freelance)
- **Libraries:** Free (all open-source)

---

## Comparison Matrix

| Feature | Option 1:<br>Product Tour | Option 2:<br>Tutorial Puzzle | Option 3:<br>Video + Guided | Option 4:<br>Tooltips Only | Option 5:<br>Hybrid |
|---------|--------------------------|------------------------------|----------------------------|---------------------------|---------------------|
| **Development Time** | 12-20h | 16-24h | 19-31h | 11-16h | 37-56h |
| **Cost** | $0 | $0 | $0-500 | $0 | $0-500 |
| **User Control** | Medium | Low | High | High | Highest |
| **Learning Effectiveness** | High | Highest | Medium | Low-Medium | Highest |
| **Mobile-Friendly** | ✅ | ✅ | ⚠️ (video) | ✅ | ✅ |
| **Maintenance** | Medium | Low | High | Low | High |
| **Skippable** | ✅ | ⚠️ | ✅ | N/A | ✅ |
| **Bundle Size Impact** | +5-15KB | +0KB | +2-5KB | +2-4KB | +10-20KB |
| **Accessibility** | Good | Good | Excellent (captions) | Good | Excellent |

---

## Recommendation

### For MVP (Fastest Time to Value):
**Option 1: Product Tour Overlay using Driver.js**

**Rationale:**
- Proven library (used by major apps)
- 4-6 hour implementation
- Highly customizable
- Mobile-friendly
- Easy to iterate

**Implementation Plan:**
1. Install Driver.js: `npm install driver.js`
2. Create tutorial configuration in `lib/tutorial/steps.ts`
3. Add trigger logic in [components/home/HomePage.tsx](components/home/HomePage.tsx)
4. Store completion in localStorage
5. Test on mobile and desktop

**Sample Code:**
```typescript
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const tutorialSteps = [
  {
    element: '#play-button',
    popover: {
      title: 'Welcome to Wortex!',
      description: 'Click here to start your first puzzle',
      side: "bottom",
      align: 'start'
    }
  },
  // ... more steps
];

const driverObj = driver({
  showProgress: true,
  steps: tutorialSteps
});

// Trigger on first visit
if (!localStorage.getItem('wortex-tutorial-completed')) {
  driverObj.drive();
}
```

---

### For Long-Term Excellence:
**Option 5: Hybrid Approach**

**Rationale:**
- Best user experience
- Accommodates different learning preferences
- Professional and polished
- Positions Wortex as high-quality product

**Phased Rollout:**
1. **Phase 1 (Week 1-2):** Implement Welcome Modal + Progressive Tooltips (20h)
2. **Phase 2 (Week 3-4):** Add Interactive Tutorial (15h)
3. **Phase 3 (Week 5-6):** Create Video Tutorial (16h)
4. **Phase 4 (Week 7):** Polish and A/B test (8h)

---

## Next Steps

### If choosing Option 1 (Recommended MVP):

1. **Decision:** Confirm Driver.js as library choice
2. **Design:** Write tutorial script (what to say at each step)
3. **Implement:**
   - Install library
   - Create tutorial steps configuration
   - Add trigger logic to HomePage
   - Add localStorage tracking
4. **Test:**
   - First-time user flow
   - Skip functionality
   - Mobile responsiveness
5. **Launch:** Deploy with feature flag for gradual rollout

### If choosing Option 5 (Long-term):

1. **Decision:** Confirm phased approach and timeline
2. **Design:** Create comprehensive tutorial content strategy
3. **Implement Phase 1:** Welcome modal + tooltips
4. **Gather Feedback:** User testing and analytics
5. **Iterate:** Adjust based on data before building Phases 2-4

---

## Success Metrics

Track these metrics to measure tutorial effectiveness:

1. **Completion Rate:** % of users who finish tutorial vs. skip
2. **First Game Performance:** Average score of users who completed tutorial vs. skipped
3. **Retention:** 7-day return rate for tutorial completers vs. skippers
4. **Time to First Game:** How long until users play their first real game
5. **Help Page Visits:** Did tutorial reduce need for static help page?
6. **Tutorial Replay Rate:** % of users who replay tutorial from settings

**Analytics Implementation:**
```typescript
// Track tutorial events
analytics.track('tutorial_started', { method: 'auto' });
analytics.track('tutorial_completed', { duration: 45, steps: 8 });
analytics.track('tutorial_skipped', { step: 3 });
```

---

## Appendix: Library Comparison

### Driver.js
- **Size:** 5KB gzipped
- **GitHub Stars:** 22k+
- **License:** MIT
- **Pros:** Lightweight, simple API, great docs
- **Cons:** Less feature-rich than alternatives
- **Best For:** Simple product tours

### Shepherd.js
- **Size:** 8KB gzipped
- **GitHub Stars:** 13k+
- **License:** MIT
- **Pros:** Accessibility-focused, flexible positioning
- **Cons:** Slightly larger bundle
- **Best For:** Complex multi-step tours

### Intro.js
- **Size:** 15KB gzipped
- **GitHub Stars:** 22k+
- **License:** AGPL/Commercial
- **Pros:** Feature-rich, mature
- **Cons:** Larger size, license restrictions
- **Best For:** Enterprise apps needing full feature set

### Floating UI (formerly Popper.js)
- **Size:** 3KB gzipped
- **GitHub Stars:** 30k+
- **License:** MIT
- **Pros:** Best positioning engine, used by major frameworks
- **Cons:** Just positioning - need to build UI layer
- **Best For:** Custom tooltip implementations (Option 4)

**Recommendation:** Driver.js for Option 1, Floating UI for Option 4

---

## Questions for Decision-Making

Before proceeding, consider:

1. **Timeline:** How quickly do you need the tutorial live?
   - < 1 week: Option 4 (Tooltips)
   - 1-2 weeks: Option 1 (Product Tour)
   - 1-2 months: Option 5 (Hybrid)

2. **User Base:** What percentage of users are first-timers?
   - High churn: Invest in comprehensive tutorial (Option 5)
   - Loyal base: Keep it simple (Option 1 or 4)

3. **Analytics:** Do you have data on where users get stuck?
   - Yes: Target specific pain points with tooltips
   - No: Start with broad tour, then iterate

4. **Resources:** Can you create video content?
   - Yes: Option 3 or 5
   - No: Option 1, 2, or 4

5. **Maintenance:** How often does UI change?
   - Frequently: Avoid video (Option 3/5)
   - Stable: Video is safe investment

---

## Conclusion

For Wortex, I recommend **starting with Option 1 (Driver.js Product Tour)** as an MVP, then iterating toward **Option 5 (Hybrid)** based on user feedback and analytics.

**Immediate Action:** Install Driver.js and create a 5-step tutorial covering:
1. Welcome + game concept
2. Vortex word dragging
3. Speed slider trade-offs
4. Phase 2 reordering
5. Hint system

This provides immediate value while leaving room to expand into more sophisticated onboarding later.

**Budget:** 6-8 hours development + 2-3 hours testing = 8-11 hours total

**ROI:** If tutorial improves first-game completion by even 10%, it pays for itself in increased user retention.
