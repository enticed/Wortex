# Tutorial Editing Guide

This guide shows you how to edit the tutorial content in Wortex.

## File Location

All tutorial content is in: **`lib/tutorial/tutorialSteps.ts`**

## Tutorial Structure

The tutorial has 18 steps total, numbered 1-18:

1. **Welcome** (Homepage)
2. **Ready to Learn** (Homepage)
3. **Two Phases of Gameplay** (Pre-game page)
4. **The Hint Phrase** (Game - Phase 1)
5. **The Vortex** (Game - Phase 1)
6. **Speed Slider** (Game - Phase 1)
7. **Phase 1 Limitations** (Game - Phase 1)
8. **Dismissing Words** (Game - Phase 1)
9. **Phase 2: Word Arrangement** (Game - Phase 2)
10. **The Assembly Header** (Game - Phase 2)
11. **Stuck? Use Hints!** (Game - Phase 2)
12. **Dealing with Unneeded Words** (Game - Phase 2)
13. **How to Know You're Correct** (Game - Phase 2)
14. **Bonus Round** (After puzzle completion)
15. **Understanding Your Score** (After bonus round)
16. **Create an Account!** (After results)
17. **Track Your Improvement!** (Optional - Stats page)
18. **Pure vs Boosted Rankings** (Optional - Leaderboard page)

## How to Edit Tutorial Content

### Step 1: Open the file

Open `lib/tutorial/tutorialSteps.ts` in your editor.

### Step 2: Find the step you want to edit

Each tutorial step is an object in an array. Search for the step number or title.

For example, to edit Step 6 (Speed Slider), search for "6 of 18" or "Speed Slider".

### Step 3: Edit the content

Each step has two main parts:

#### Title
```typescript
title: "Speed Slider - Your Secret Weapon!",
```

#### Description (HTML content)
```typescript
description: `
  <div class="space-y-2">
    <p><strong>Slower Speed (0-0.9x):</strong></p>
    <ul class="list-disc pl-5 text-sm">
      <li>✅ Easier to grab words</li>
      <li>❌ Fog appears, making words harder to read</li>
    </ul>
    <p class="font-semibold">Pro tip: Start fast to see which words you need, then slow down to grab them!</p>
    <div class="text-xs text-gray-400 mt-4">6 of 18</div>
  </div>
`,
```

### HTML Elements You Can Use

- `<p>` - Paragraph
- `<strong>` - Bold text
- `<ul class="list-disc pl-5">` - Bulleted list
- `<ol class="list-decimal pl-5">` - Numbered list
- `<li>` - List item
- `<br/>` - Line break

### Text Styling Classes

- `text-sm` - Small text
- `text-xs` - Extra small text
- `font-semibold` - Semi-bold
- `italic` - Italic
- `space-y-2` - Vertical spacing between elements
- `mt-4` - Margin top

### Step Counter

**IMPORTANT**: Always keep the step counter at the bottom:
```html
<div class="text-xs text-gray-400 mt-4">X of 18</div>
```
Replace X with the correct step number.

## Example: Editing Step 4 (The Hint Phrase)

**Before:**
```typescript
{
  element: ".hint-phrase-container",
  popover: {
    title: "The Hint Phrase (Key Concept!)",
    description: `
      <div class="space-y-2">
        <p>This pre-assembled phrase gives you a <strong>clue about the mystery quote</strong>, but it also makes the game challenging:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Words from the hint phrase are <strong>mixed into the vortex</strong></li>
          <li>You must figure out which words belong to the actual quote</li>
          <li>Hint phrase words are extras you don't need</li>
        </ul>
        <p class="text-sm italic">Think of it as a helpful distraction! 😊</p>
        <div class="text-xs text-gray-400 mt-4">4 of 18</div>
      </div>
    `,
    side: "bottom",
    align: "start",
    showButtons: ["next", "previous", "close"],
  },
},
```

**After** (with changes):
```typescript
{
  element: ".hint-phrase-container",
  popover: {
    title: "Understanding the Hint Phrase", // Changed title
    description: `
      <div class="space-y-2">
        <p>The hint phrase at the top provides <strong>context clues</strong> about the mystery quote:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Hint words are <strong>mixed with quote words</strong> in the vortex</li>
          <li>Your job is to separate them</li>
          <li>Ignore hint phrase words - they're decoys!</li>
        </ul>
        <p class="text-sm italic">Use it as a guide, not the answer! 🎯</p> // Changed emoji
        <div class="text-xs text-gray-400 mt-4">4 of 18</div>
      </div>
    `,
    side: "bottom",
    align: "start",
    showButtons: ["next", "previous", "close"],
  },
},
```

## Step Counter Location

The step counter (`X of 18`) is currently at the bottom of each popover. If you want to move it to a different location (like top-right), change:

**Current (bottom):**
```html
<div class="text-xs text-gray-400 mt-4">6 of 18</div>
```

**Top-right corner:**
```html
<div class="flex justify-end">
  <div class="text-xs text-gray-400">6 of 18</div>
</div>
```

**Bottom-left (in italics):**
```html
<div class="text-xs text-gray-400 italic mt-4">6 of 18</div>
```

## Testing Your Changes

1. Save the file
2. The dev server will automatically reload
3. Reset the tutorial: Click the menu → "Replay Tutorial"
4. Go through the tutorial to see your changes

## Tips

- Keep descriptions concise - users want to play, not read!
- Use emojis sparingly for visual interest
- Bold (`<strong>`) important concepts
- Use lists for multiple related points
- Test on mobile - popovers must fit small screens
