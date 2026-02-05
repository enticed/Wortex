'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useDroppable } from '@dnd-kit/core';
import Word from './Word';
import type { WordInVortex } from '@/types/game';

// Generate jagged lightning bolt path from start to end position
function generateLightningPath(start: { x: number; y: number }, end: { x: number; y: number }): string {
  const segments = 8;
  let path = `M ${start.x} ${start.y}`;

  for (let i = 1; i <= segments; i++) {
    const progress = i / segments;
    const x = start.x + (end.x - start.x) * progress;
    const y = start.y + (end.y - start.y) * progress;

    // Add random jitter for jagged lightning appearance
    const jitterX = (Math.random() - 0.5) * 40;
    const jitterY = (Math.random() - 0.5) * 30;

    path += ` L ${x + jitterX} ${y + jitterY}`;
  }

  // Ensure we end exactly at the target
  path += ` L ${end.x} ${end.y}`;

  return path;
}

interface VortexProps {
  words: WordInVortex[];
  onWordGrab: (wordId: string) => void;
  isActive: boolean;
  speed?: number; // Speed multiplier: 0.5 = slow, 1.0 = normal, 2.0 = fast
  totalWordsSeen?: number; // Total words seen for display
  expectedWords?: string[]; // Expected words for target phrase (for fast-speed highlighting)
  placedWords?: string[]; // Currently placed words in target area (for fast-speed highlighting)
}

export default function Vortex({ words, onWordGrab, isActive, speed = 1.0, totalWordsSeen = 0, expectedWords = [], placedWords = [] }: VortexProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'vortex',
  });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const animationRefs = useRef<Map<string, gsap.core.Tween[]>>(new Map());
  const animatedWordIds = useRef<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);
  const wordEntryCounter = useRef<number>(0);
  const seenWordIds = useRef<Set<string>>(new Set());

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

  // Calculate fog opacity for slow speeds - shifted to be more aggressive
  const getFogOpacity = () => {
    if (speed >= 1.0) return 0; // No fog at normal or fast speeds
    if (speed >= 0.75) return 0.50; // Moderate fog (moved from 0.50x)
    if (speed >= 0.50) return 0.75; // Heavy fog (moved from 0.25x)
    if (speed >= 0.25) return 1.0; // Fully opaque (moved from 0.00x)
    return 1.0; // Max opacity (CSS clamps at 1.0)
  };

  // Check if paused (0.00x) for extra dense fog
  const isPaused = () => speed === 0;

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

  // Check if lightning should be active (fast speeds 1.25x+)
  const shouldShowLightning = () => {
    return speed >= 1.25;
  };

  // Trigger lightning strike at word position
  const triggerLightning = (wordPosition: { x: number; y: number }, wordId: string) => {
    if (!svgRef.current) return;

    // Random edge position for lightning origin (varies per strike)
    const edges = [
      { x: Math.random() * dimensions.width, y: 0 }, // Top edge
      { x: dimensions.width, y: Math.random() * dimensions.height }, // Right edge
      { x: Math.random() * dimensions.width, y: dimensions.height }, // Bottom edge
      { x: 0, y: Math.random() * dimensions.height }, // Left edge
    ];
    const origin = edges[Math.floor(Math.random() * edges.length)];

    // Generate lightning bolt path
    const pathData = generateLightningPath(origin, wordPosition);

    // Create SVG path element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', '#FCD34D'); // Yellow-gold lightning
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('filter', 'url(#lightning-glow)');
    path.style.opacity = '0';

    svgRef.current.appendChild(path);

    // Animate lightning flash
    gsap.to(path, {
      opacity: 1,
      duration: 0.05,
      ease: 'power2.in',
      onComplete: () => {
        gsap.to(path, {
          opacity: 0,
          duration: 0.15,
          ease: 'power2.out',
          onComplete: () => path.remove(),
        });
      },
    });

    // Brief vortex flash
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        backgroundColor: 'rgba(252, 211, 77, 0.2)',
        duration: 0.05,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
      });
    }

    // Fade out the word with white flash
    const wordElement = wordRefs.current.get(wordId);
    if (wordElement) {
      gsap.to(wordElement, {
        opacity: 0,
        scale: 1.2,
        duration: 0.2,
        ease: 'power2.out',
      });
    }
  };

  // Track word entries and trigger lightning at fast speeds
  useEffect(() => {
    // Only process if lightning should be active
    if (!shouldShowLightning() || !isActive) {
      // Reset tracking when lightning becomes inactive
      seenWordIds.current.clear();
      wordEntryCounter.current = 0;
      return;
    }

    // Detect new words by tracking IDs we haven't seen before
    const currentWordIds = new Set(words.map(w => w.id));
    const newWords = words.filter(w => !seenWordIds.current.has(w.id));

    // Add all current word IDs to seen set
    currentWordIds.forEach(id => seenWordIds.current.add(id));

    // Remove IDs that are no longer in vortex (grabbed/removed)
    const idsToRemove: string[] = [];
    seenWordIds.current.forEach(id => {
      if (!currentWordIds.has(id)) {
        idsToRemove.push(id);
      }
    });
    idsToRemove.forEach(id => seenWordIds.current.delete(id));

    // Process each new word
    newWords.forEach(newWord => {
      wordEntryCounter.current++;

      console.log('[Lightning] New word entered:', newWord.word, 'counter:', wordEntryCounter.current);

      // Vary the interval: every 4-6 words (random)
      const lightningInterval = 4 + Math.floor(Math.random() * 3); // 4, 5, or 6

      if (wordEntryCounter.current >= lightningInterval) {
        console.log('[Lightning] Triggering strike at interval:', lightningInterval);
        wordEntryCounter.current = 0;

        // Find a word to zap (prefer one that's visible and not grabbed)
        // Wait a bit for word to be in position
        setTimeout(() => {
          const availableWords = words.filter(w => !w.isGrabbed);
          if (availableWords.length > 0) {
            const targetWord = availableWords[Math.floor(Math.random() * availableWords.length)];
            const wordElement = wordRefs.current.get(targetWord.id);

            if (wordElement) {
              const rect = wordElement.getBoundingClientRect();
              const containerRect = containerRef.current?.getBoundingClientRect();

              if (containerRect) {
                const wordPosition = {
                  x: rect.left + rect.width / 2 - containerRect.left,
                  y: rect.top + rect.height / 2 - containerRect.top,
                };

                console.log('[Lightning] Striking word:', targetWord.word, 'at position:', wordPosition);
                triggerLightning(wordPosition, targetWord.id);

                // Remove word after brief delay
                setTimeout(() => {
                  onWordGrab(targetWord.id);
                }, 200);
              }
            }
          }
        }, 500); // Give word time to animate into position
      }
    });
  }, [words, speed, isActive, shouldShowLightning, onWordGrab]);

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

      // Each word starts at progress 0 (entrance) and animates to progress 1 (center)
      // Add angular offset to prevent stacking at entrance
      const angularOffset = (word.angle % 30) - 15; // Random offset between -15° and +15°
      const wordData = { progress: 0 };

      // Animate the word along the spiral path from entrance to center
      const baseDuration = 15; // Base duration in seconds at 1x speed
      const spiralTween = gsap.to(wordData, {
        progress: 1,
        duration: baseDuration, // Base duration - will be scaled by timeScale
        ease: 'none', // Linear progression
        paused: speed === 0, // Start paused if speed is 0
        onUpdate: () => {
          // Get fresh element ref in case it changed
          const currentElement = wordRefs.current.get(word.id);
          if (currentElement) {
            const spiralPos = getSpiralPosition(wordData.progress);
            // Apply angular offset to prevent stacking at entrance
            const adjustedAngle = spiralPos.angle + angularOffset;
            const pos = getCartesianPosition(adjustedAngle, spiralPos.radius);
            const currentScale = getScale(spiralPos.radius);

            currentElement.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${currentScale})`;

            // Fade out as approaching center
            const opacity = wordData.progress < 0.9 ? 1 : (1 - (wordData.progress - 0.9) * 10);
            currentElement.style.opacity = String(Math.max(0, opacity));
          }
        },
        onComplete: () => {
          // Word reached the center - remove from animated set
          animatedWordIds.current.delete(word.id);
        },
      });

      // Set initial timeScale based on current speed
      if (speed !== 0) {
        spiralTween.timeScale(speed);
      }

      animationRefs.current.set(word.id, [spiralTween]);
    });
  }, [words, isActive]); // Only re-run when words or isActive changes, not speed

  // Update animation speed/pause state when speed changes
  useEffect(() => {
    animationRefs.current.forEach((anims) => {
      anims.forEach((anim) => {
        if (speed === 0) {
          anim.pause(); // Pause animation at 0x
        } else {
          anim.timeScale(speed); // Update playback speed
          anim.resume(); // Resume if paused
        }
      });
    });
  }, [speed]);

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
      }
    });
  }, [words, isActive]); // Clean up removed words

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

      {/* Lightning SVG layer for fast speeds */}
      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none z-40"
        width={dimensions.width}
        height={dimensions.height}
        suppressHydrationWarning
      >
        <defs>
          {/* Glow filter for lightning */}
          <filter id="lightning-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feFlood floodColor="#FCD34D" floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Fog effect for slow speeds - base overlay + animated clouds */}
      {getFogOpacity() > 0 && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden transition-opacity duration-500" style={{ opacity: getFogOpacity() }}>
          {/* Base fog overlay - consistent coverage for handicapping (extra dense when paused) */}
          <div className={isPaused() ? 'fog-base-overlay-paused' : 'fog-base-overlay'} />

          {/* Animated fog layers - lighter wispy clouds for visual interest */}
          <div className="fog-layer fog-layer-1" />
          <div className="fog-layer fog-layer-2" />
          <div className="fog-layer fog-layer-3" />
        </div>
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

          // All words start at the entrance (progress = 0) but with random angular offset
          // to prevent stacking. Use word.angle as seed for consistent positioning.
          const angularOffset = (word.angle % 30) - 15; // Random offset between -15° and +15°
          const spiralPos = getSpiralPosition(0);
          const adjustedAngle = spiralPos.angle + angularOffset;
          const initialPos = getCartesianPosition(adjustedAngle, spiralPos.radius);
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
