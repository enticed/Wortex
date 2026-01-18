'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useDroppable } from '@dnd-kit/core';
import Word from './Word';
import type { WordInVortex } from '@/types/game';

interface VortexProps {
  words: WordInVortex[];
  onWordGrab: (wordId: string) => void;
  onAutoCapture?: (wordId: string) => void; // Called when facsimile word reaches 240° rotation
  isActive: boolean;
  speed?: number; // Speed multiplier: 0.5 = slow, 1.0 = normal, 2.0 = fast
  isFacsimileComplete?: boolean; // Stop auto-capture when facsimile phrase is complete
  facsimileWords?: Set<string>; // Set of facsimile word texts (lowercase) for quick lookup
  totalWordsSeen?: number; // Total words seen for display
  expectedWords?: string[]; // Expected words for target phrase (for fast-speed highlighting)
  placedWords?: string[]; // Currently placed words in target area (for fast-speed highlighting)
}

export default function Vortex({ words, onWordGrab, onAutoCapture, isActive, speed = 1.0, isFacsimileComplete = false, facsimileWords, totalWordsSeen = 0, expectedWords = [], placedWords = [] }: VortexProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'vortex',
  });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const animationRefs = useRef<Map<string, gsap.core.Tween[]>>(new Map());
  const animatedWordIds = useRef<Set<string>>(new Set());
  const autoCaptureTriggered = useRef<Set<string>>(new Set()); // Track which words have triggered auto-capture
  const wordRotations = useRef<Map<string, number>>(new Map()); // Track accumulated rotation per word

  // Handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate position from polar coordinates
  const getCartesianPosition = (angle: number, radius: number) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    // Use 90% of available space (10% margin for word size)
    const maxRadius = Math.min(dimensions.width, dimensions.height) * 0.45;

    const radian = (angle * Math.PI) / 180;
    const x = centerX + Math.cos(radian) * radius * maxRadius;
    const y = centerY + Math.sin(radian) * radius * maxRadius;

    return { x, y };
  };

  // Calculate spiral position based on progress (0 = entrance, 1 = center)
  // Words enter from the left side and spiral inward
  const getSpiralPosition = (progress: number) => {
    // Progress from 0 (entrance) to 1 (center)
    // Radius: Start at edge (1.0) and spiral to center (0.1)
    const radius = 1.0 - (progress * 0.9);

    // Angle: Start at 180° (left side) and make 4-5 full rotations
    const rotations = 4.5; // 4.5 full rotations from entrance to center
    const angle = 180 + (progress * 360 * rotations);

    return { radius, angle };
  };

  // Calculate font size and scale based on radius (larger at outer positions)
  const getScale = (radius: number) => {
    // Scale from 1.3 (outer) to 0.4 (inner)
    return 0.4 + (radius * 0.9);
  };

  // Calculate fog opacity for slow speeds (increased by 15%)
  const getFogOpacity = () => {
    if (speed >= 1.0) return 0; // No fog at normal or fast speeds
    if (speed >= 0.75) return 0.30; // Subtle fog (was 0.15)
    if (speed >= 0.50) return 0.50; // Moderate fog (was 0.35)
    if (speed >= 0.25) return 0.75; // Heavy fog (was 0.60)
    return 1.0; // Fully opaque at 0x (paused, was 0.85)
  };

  // Calculate highlighting opacity for fast speeds
  const getHighlightOpacity = () => {
    if (speed <= 1.0) return 0; // No highlighting at normal or slow speeds
    if (speed <= 1.25) return 0.20; // Barely visible
    if (speed <= 1.50) return 0.50; // Noticeable
    if (speed <= 1.75) return 0.75; // Clear
    return 1.0; // Fully visible at 2.00x
  };

  // Determine if a word is needed or unnecessary for highlighting
  const getWordHighlightType = (wordText: string): 'needed' | 'unnecessary' | null => {
    const highlightOpacity = getHighlightOpacity();
    if (highlightOpacity === 0) return null; // No highlighting at slow/normal speeds

    const wordLower = wordText.toLowerCase();

    // Count how many times this word is needed
    const neededCount = expectedWords.filter(w => w.toLowerCase() === wordLower).length;

    if (neededCount === 0) {
      // Word doesn't belong in target phrase at all
      return 'unnecessary';
    }

    // Count how many times this word has been placed
    const placedCount = placedWords.filter(w => w.toLowerCase() === wordLower).length;

    if (placedCount >= neededCount) {
      // Already have enough of this word
      return 'unnecessary';
    }

    // Still need this word
    return 'needed';
  };

  // Animate words in the vortex
  useEffect(() => {
    if (!isActive) return;

    words.forEach((word) => {
      // Skip if this word is already being animated or is grabbed
      if (animatedWordIds.current.has(word.id) || word.isGrabbed) return;

      const wordElement = wordRefs.current.get(word.id);
      // IMPORTANT: Don't mark as animated if element isn't ready yet
      // This allows retry on next render when element becomes available
      if (!wordElement) return;

      // Mark this word as animated
      animatedWordIds.current.add(word.id);

      // Initialize rotation tracking for this word
      if (!wordRotations.current.has(word.id)) {
        wordRotations.current.set(word.id, 0);
      }

      // Each word starts at progress 0 (entrance) and animates to progress 1 (center)
      const wordData = { progress: 0 };
      let previousAngle = 180; // Starting angle

      // Animate the word along the spiral path from entrance to center
      const baseDuration = 15; // Base duration in seconds
      const spiralTween = gsap.to(wordData, {
        progress: 1,
        duration: baseDuration / speed, // Adjust duration based on speed
        ease: 'none', // Linear progression
        onUpdate: () => {
          // Get fresh element ref in case it changed
          const currentElement = wordRefs.current.get(word.id);
          if (currentElement) {
            const spiralPos = getSpiralPosition(wordData.progress);
            const pos = getCartesianPosition(spiralPos.angle, spiralPos.radius);
            const currentScale = getScale(spiralPos.radius);

            currentElement.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${currentScale})`;

            // Fade out as approaching center
            const opacity = wordData.progress < 0.9 ? 1 : (1 - (wordData.progress - 0.9) * 10);
            currentElement.style.opacity = String(Math.max(0, opacity));

            // Track rotation for auto-capture
            // Calculate rotation since last update (handling 360° wrap-around)
            let angleDelta = spiralPos.angle - previousAngle;
            if (angleDelta > 180) angleDelta -= 360;
            if (angleDelta < -180) angleDelta += 360;

            // Update accumulated rotation
            const currentRotation = wordRotations.current.get(word.id) || 0;
            const newRotation = currentRotation + Math.abs(angleDelta);
            wordRotations.current.set(word.id, newRotation);
            previousAngle = spiralPos.angle;

            // Auto-capture words at 240° rotation (2/3 turn)
            // Only while facsimile phrase is incomplete
            // Trigger at 215° to account for departure angle adjustment
            if (onAutoCapture &&
                !isFacsimileComplete &&
                newRotation >= 215 &&
                !autoCaptureTriggered.current.has(word.id)) {

              // Check if this word belongs to the facsimile phrase
              const wordBelongsToFacsimile = facsimileWords?.has(word.word.toLowerCase());

              if (!wordBelongsToFacsimile) {
                // Word doesn't belong to facsimile - don't animate, just mark as triggered
                autoCaptureTriggered.current.add(word.id);
                return; // Continue spiraling normally
              }

              // Word belongs to facsimile - animate it flying off
              autoCaptureTriggered.current.add(word.id);

              // Calculate current position for departure
              const centerX = dimensions.width / 2;
              const centerY = dimensions.height / 2;
              const maxRadius = Math.min(dimensions.width, dimensions.height) * 0.45;

              // Calculate departure point from current spiral position
              const departureRadian = (spiralPos.angle * Math.PI) / 180;
              const currentX = centerX + Math.cos(departureRadian) * spiralPos.radius * maxRadius;
              const currentY = centerY + Math.sin(departureRadian) * spiralPos.radius * maxRadius;

              // Calculate exit trajectory: from current position toward bottom center
              const exitX = centerX;
              const exitY = dimensions.height; // Bottom edge

              // Animate word flying to bottom
              gsap.to(currentElement, {
                x: exitX,
                y: exitY,
                scale: 0.5,
                opacity: 0,
                duration: 0.4,
                ease: 'power2.in',
                onComplete: () => {
                  onAutoCapture(word.id);
                }
              });

              // Kill the spiral animation so it doesn't interfere
              spiralTween.kill();
            }
          }
        },
        onComplete: () => {
          // Word reached the center - remove from animated set
          animatedWordIds.current.delete(word.id);
        },
      });

      animationRefs.current.set(word.id, [spiralTween]);
    });
  }, [words, isActive, speed]); // Re-run when speed changes

  // Clean up animations for removed words
  useEffect(() => {
    const currentWordIds = new Set(words.map(w => w.id));

    // Remove refs and animations for words that no longer exist
    wordRefs.current.forEach((_, id) => {
      if (!currentWordIds.has(id)) {
        const anims = animationRefs.current.get(id);
        if (anims) {
          anims.forEach(anim => anim.kill());
          animationRefs.current.delete(id);
        }
        wordRefs.current.delete(id);
        animatedWordIds.current.delete(id);
        autoCaptureTriggered.current.delete(id);
        wordRotations.current.delete(id);
      }
    });
  }, [words, speed, isActive, onAutoCapture]); // Re-run when speed changes to update animation durations

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        setNodeRef(node);
      }}
      className={`w-full h-full relative overflow-hidden transition-all ${
        isOver ? 'ring-4 ring-red-500 ring-inset' : ''
      }`}
    >
      {/* Vortex spiral guide - show the spiral path */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={dimensions.width}
        height={dimensions.height}
        suppressHydrationWarning
      >
        {/* Draw a smooth spiral path from left entrance to center */}
        <path
          d={(() => {
            const centerX = dimensions.width / 2;
            const centerY = dimensions.height / 2;
            const maxRadius = Math.min(dimensions.width, dimensions.height) * 0.45;
            const points: string[] = [];

            // Generate spiral path: entrance at left (180°) spiraling to center
            for (let i = 0; i <= 100; i++) {
              const progress = i / 100;
              const spiralPos = getSpiralPosition(progress);
              const angle = (spiralPos.angle * Math.PI) / 180;
              const radius = spiralPos.radius * maxRadius;
              const x = centerX + Math.cos(angle) * radius;
              const y = centerY + Math.sin(angle) * radius;
              points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
            }

            return points.join(' ');
          })()}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          opacity="0.3"
          strokeDasharray="8 8"
          suppressHydrationWarning
        />
      </svg>

      {/* Fog overlay for slow speeds - light gray for fog-like appearance */}
      {getFogOpacity() > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-20 bg-gray-300 dark:bg-gray-600 transition-opacity duration-500"
          style={{ opacity: getFogOpacity() }}
        />
      )}

      {/* Center vortex visual with word count */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-radial from-purple-500/50 to-transparent animate-pulse" />
        <div className="absolute text-sm font-bold text-purple-700 dark:text-purple-300">
          {totalWordsSeen}
        </div>
      </div>

      {/* Draggable words */}
      <div className="absolute inset-0">
        {words.map((word) => {
          if (word.isGrabbed) return null;

          // All words start at the entrance (progress = 0)
          const spiralPos = getSpiralPosition(0);
          const initialPos = getCartesianPosition(spiralPos.angle, spiralPos.radius);
          const initialScale = getScale(spiralPos.radius);

          // Determine highlight type for fast speeds
          const highlightType = getWordHighlightType(word.word);
          const highlightOpacity = getHighlightOpacity();

          return (
            <div
              key={word.id}
              ref={(el) => {
                if (el) wordRefs.current.set(word.id, el);
              }}
              className="absolute top-0 left-0"
              style={{
                transform: `translate(-50%, -50%) translate(${initialPos.x}px, ${initialPos.y}px) scale(${initialScale})`,
                opacity: 1,
              }}
            >
              <Word
                id={word.id}
                text={word.word}
                isPlaced={false}
                vortexHighlightType={highlightType}
                vortexHighlightOpacity={highlightOpacity}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
