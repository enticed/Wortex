'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useDroppable } from '@dnd-kit/core';
import Word from './Word';
import type { WordInVortex } from '@/types/game';

interface VortexProps {
  words: WordInVortex[];
  onWordGrab: (wordId: string) => void;
  isActive: boolean;
}

export default function Vortex({ words, onWordGrab, isActive }: VortexProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'vortex',
  });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const animationRefs = useRef<Map<string, gsap.core.Tween[]>>(new Map());
  const animatedWordIds = useRef<Set<string>>(new Set());

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
      const wordData = { progress: 0 };

      // Animate the word along the spiral path from entrance to center
      const spiralTween = gsap.to(wordData, {
        progress: 1,
        duration: 15, // 15 seconds to complete the full spiral journey
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
          }
        },
        onComplete: () => {
          // Word reached the center - remove from animated set
          animatedWordIds.current.delete(word.id);
        },
      });

      animationRefs.current.set(word.id, [spiralTween]);
    });
  }, [words, isActive]);

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
  }, [words]);

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

      {/* Center vortex visual */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <div className="w-16 h-16 rounded-full bg-gradient-radial from-purple-500/50 to-transparent animate-pulse" />
      </div>

      {/* Draggable words */}
      <div className="absolute inset-0">
        {words.map((word) => {
          if (word.isGrabbed) return null;

          // All words start at the entrance (progress = 0)
          const spiralPos = getSpiralPosition(0);
          const initialPos = getCartesianPosition(spiralPos.angle, spiralPos.radius);
          const initialScale = getScale(spiralPos.radius);

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
              <Word id={word.id} text={word.word} isPlaced={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
