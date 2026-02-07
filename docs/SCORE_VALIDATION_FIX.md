# Server-Side Score Validation - Security Fix

## Issue
**Severity:** CRITICAL (P0)
**CVE:** Internal - Client-side score manipulation vulnerability

The application accepted scores directly from the client without server-side validation, allowing:
1. **Score manipulation** - Submit arbitrarily high/low scores
2. **Leaderboard poisoning** - Fake perfect scores to dominate rankings
3. **Streak manipulation** - False completion to maintain streaks
4. **Star rating fraud** - Submit incorrect star calculations
5. **Time manipulation** - Submit impossible completion times

## Fix Applied

### Implementation

**Files Created:**
- `lib/validation/scoreValidator.ts` - Comprehensive score validation logic

**Files Modified:**
- `app/api/score/submit/route.ts` - Integrated validation before accepting scores

### Validation Rules Implemented

#### 1. Phase 1 Score Validation (Word Finding Efficiency)
```typescript
// Phase 1 = totalWordsSeen / uniqueWords
// Perfect play = 1.0 (saw exactly the unique words needed)
// Worst case = 20.0 (very inefficient but possible)

MIN_PHASE1_SCORE = 1.0
MAX_PHASE1_SCORE = 20.0
```

**Rejects:**
- Scores < 1.0 (impossible - can't see fewer words than needed)
- Scores > 20.0 (unreasonably inefficient)

#### 2. Phase 2 Score Validation (Reordering Efficiency)
```typescript
// Phase 2 = 0.25 * number of moves
// Perfect play = 0 (no reordering needed)
// Max moves = quoteWordCount * 3

MAX_PHASE2_SCORE = (quoteWordCount * 3) * 0.25
```

**Rejects:**
- Scores not a multiple of 0.25 (each move = 0.25 points)
- Scores > maximum for word count
- Negative scores

#### 3. Final Score Calculation
```typescript
expectedFinalScore = phase1Score + phase2Score + (bonusCorrect ? 1 : 0)
```

**Rejects:**
- Final score doesn't match calculation (within 0.01 tolerance for floating point)

#### 4. Time Validation
```typescript
MIN_TIME = Math.max(5, uniqueWords) // At least 5s or 1s per word
MAX_TIME = 24 * 60 * 60 // 24 hours maximum
```

**Rejects:**
- Time < 5 seconds (suspiciously fast)
- Time > 24 hours (unreasonable)

**Warnings:**
- Time < uniqueWords seconds (faster than humanly possible)
- Time > 1 hour (user may have left game open)

#### 5. Speed Validation
```typescript
MIN_SPEED = 0.5
MAX_SPEED = 3.0
```

**Rejects:**
- Speed outside valid range
- Min speed > Max speed

#### 6. Star Calculation
```typescript
// Recalculated from phase scores
stars = calculateFinalStars(phase1Score, phase2Score, quoteWordCount)
```

**Replaces:**
- Any client-provided star value with server-calculated value

#### 7. Duplicate Detection
```typescript
// Check for identical scores within 5 minutes
```

**Rejects:**
- Duplicate submissions (possible replay attack or bug)

### Validation Flow

```
1. Client submits score with all fields
2. Rate limiting check (10 submissions / minute)
3. Required field validation
4. Duplicate submission check
5. Comprehensive score validation
   ├─ Phase 1 score range
   ├─ Phase 2 score range and increments
   ├─ Final score calculation
   ├─ Time bounds
   ├─ Speed values
   └─ Puzzle word count validation
6. Fetch actual puzzle data from database
7. Sanitize submission (recalculate derived values)
   ├─ Recalculate final score
   ├─ Recalculate stars
   ├─ Round all scores to 2 decimals
   └─ Validate against puzzle word count
8. Save sanitized values to database
```

### What Gets Recalculated (Never Trusted)

- **Final Score** - Always recalculated from phase1 + phase2 + bonus
- **Stars** - Always recalculated from phase scores and word count
- **All decimals** - Rounded to 2 places to prevent floating point issues

## Example Validations

### Valid Submission
```json
{
  "userId": "abc-123",
  "puzzleId": "xyz-789",
  "finalScore": 3.5,
  "phase1Score": 2.0,
  "phase2Score": 1.5,
  "bonusCorrect": false,
  "timeTakenSeconds": 120,
  "speed": 1.0
}
```
✅ **Accepted** - All values within valid ranges

### Invalid Submissions

#### Impossible Perfect Score
```json
{
  "phase1Score": 0.5,  // ❌ Less than 1.0
  "phase2Score": 0,
  "bonusCorrect": false
}
```
**Rejected:** "Phase 1 score too low (0.5). Minimum is 1.0"

#### Manipulated Final Score
```json
{
  "finalScore": 1.0,    // ❌ Doesn't match calculation
  "phase1Score": 5.0,
  "phase2Score": 3.0,
  "bonusCorrect": false
  // Should be 8.0
}
```
**Rejected:** "Final score mismatch. Expected 8.0, got 1.0"

#### Invalid Phase 2 Score
```json
{
  "phase2Score": 2.33  // ❌ Not a multiple of 0.25
}
```
**Warning:** "Phase 2 score is not a multiple of 0.25. This may indicate score manipulation."

#### Suspiciously Fast Time
```json
{
  "timeTakenSeconds": 2,  // ❌ Too fast for 15 unique words
  "uniqueWords": 15
}
```
**Warning:** "Time taken (2s) seems suspiciously fast for 15 unique words. Minimum expected: 15s"

## Testing

### Unit Tests

**File:** `__tests__/unit/scoreValidator.test.ts` (30 tests)

```
✓ should recalculate final score from components
✓ should recalculate final score without bonus
✓ should recalculate stars correctly
✓ should round scores to 2 decimal places
✓ should reject negative scores
✓ should reject invalid speed values
✓ should accept valid speed values
✓ should enforce phase2 score must be multiple of 0.25
✓ should validate final score calculation
✓ should validate reasonable time limits
✓ should detect impossible perfect scores
✓ should detect unreasonably high scores
✓ should validate phase2 score against word count
✓ should handle perfect play (minimum scores)
✓ should handle worst reasonable play (high scores)
✓ should handle zero phase2 score
... and more
```

### Test Results

```
✅ Unit Tests: 94 passed
✅ Integration Tests: 29 passed
✅ Total: 123 tests passing
✅ No regressions detected
```

## Security Impact

### Before Fix

| Attack | Possible? | Impact |
|--------|-----------|--------|
| Submit score of 0.1 | ✅ Yes | Dominate leaderboard with impossible perfect score |
| Submit score of 9999 | ✅ Yes | Pollute statistics, break leaderboard display |
| Submit negative time | ✅ Yes | Invalid data in database |
| Submit wrong stars | ✅ Yes | Incorrect rankings and achievements |
| Submit duplicate scores | ✅ Yes | Spam database, inflate play counts |

### After Fix

| Attack | Possible? | Response |
|--------|-----------|----------|
| Submit score < 1.0 | ❌ No | 400 error: "Phase 1 score too low" |
| Submit score > 20.0 | ❌ No | 400 error: "Phase 1 score too high" |
| Submit wrong final score | ❌ No | Server recalculates, ignores client value |
| Submit wrong stars | ❌ No | Server recalculates, ignores client value |
| Duplicate submission | ❌ No | 429 error: "Duplicate detected" |

## Implementation Details

### Validation Function

```typescript
export async function validateScoreSubmission(
  submission: ScoreSubmission
): Promise<ValidationResult> {
  // 1. Basic constraints (negative values, etc.)
  // 2. Speed validation (0.5 - 3.0)
  // 3. Fetch puzzle from database
  // 4. Validate Phase 1 score range
  // 5. Validate Phase 2 score (multiples of 0.25, max based on word count)
  // 6. Validate final score = phase1 + phase2 + bonus
  // 7. Validate star calculation
  // 8. Validate time bounds
  // 9. Return validation result with errors/warnings
}
```

### Sanitization Function

```typescript
export function sanitizeScoreSubmission(
  submission: ScoreSubmission,
  quoteWordCount: number
): ScoreSubmission {
  // Recalculate final score (never trust client)
  const sanitizedFinalScore = phase1 + phase2 + (bonus ? 1 : 0);

  // Recalculate stars (never trust client)
  const sanitizedStars = calculateFinalStars(phase1, phase2, wordCount);

  // Round all values to 2 decimals
  // Return sanitized submission
}
```

## Monitoring & Logging

### Warning Logs

```typescript
// Suspicious but not invalid submissions get logged
console.warn('[ScoreSubmit] Validation warnings:', [
  "Time taken (3s) seems suspiciously fast",
  "Phase 2 score not a multiple of 0.25"
]);
```

**Action:** Monitor these warnings for patterns indicating cheating attempts

### Error Logs

```typescript
// Invalid submissions are logged and rejected
console.warn('[ScoreSubmit] Validation failed:',
  "Phase 1 score too low (0.5). Minimum is 1.0"
);
```

**Action:** High frequency from same IP may indicate attack

## Edge Cases Handled

1. **Perfect Play** - Score of 1.0 + 0 + bonus = valid
2. **No Reordering** - Phase 2 score of 0 = valid
3. **Very Long Puzzle** - Max scores scale with word count
4. **Floating Point** - Tolerance of 0.01 for score calculations
5. **Replay Attacks** - Duplicate detection within 5-minute window
6. **Missing Optional Fields** - Default values assigned

## Future Enhancements

1. **Difficulty Adjustment**
   - Track success rates by puzzle
   - Adjust max score thresholds for harder puzzles

2. **Anomaly Detection**
   - Flag users with consistent perfect scores
   - Detect patterns of minimum-time completions

3. **Historical Validation**
   - Check user's score distribution
   - Alert on sudden dramatic improvements

4. **Client-Side Hints**
   - Provide validation feedback before submission
   - Help legitimate users avoid errors

## Related Documentation

- [lib/validation/scoreValidator.ts](../lib/validation/scoreValidator.ts) - Implementation
- [app/api/score/submit/route.ts](../app/api/score/submit/route.ts) - Endpoint integration
- [PRE_LAUNCH_CHECKLIST.md](./PRE_LAUNCH_CHECKLIST.md) - All fixes tracker

## Next Steps

With score validation implemented:
1. ✅ **DONE:** Hardcoded session secret
2. ✅ **DONE:** Rate limiting
3. ✅ **DONE:** Server-side score validation
4. ⏳ **NEXT:** CSRF protection
5. ⏳ Security headers
6. ⏳ RLS policies

---

**Fixed:** 2026-02-06
**Verified:** ✅ All tests passing (123 total)
**Deployed to Production:** [ ] Pending
