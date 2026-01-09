'use client';

import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import Word from './Word';
import type { WordInVortex } from '@/types/game';

interface VortexProps {
  words: WordInVortex[];
  onWordGrab: (wordId: string) => void;
  isActive: boolean;
}

export default function Vortex({ words, onWordGrab, isActive }: VortexProps) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const animationRefs = useRef<Map<string, gsap.core.Tween[]>>(new Map());

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
    const maxRadius = Math.min(dimensions.width, dimensions.height) / 2 - 80;

    const radian = (angle * Math.PI) / 180;
    const x = centerX + Math.cos(radian) * radius * maxRadius;
    const y = centerY + Math.sin(radian) * radius * maxRadius;

    return { x, y };
  };

  // Calculate font size and scale based on radius (smaller near center)
  const getScale = (radius: number) => {
    return Math.max(0.5, radius); // Scale from 0.5 to 1.0
  };

  // Animate words in the vortex
  useEffect(() => {
    if (!isActive) return;

    words.forEach((word) => {
      const wordElement = wordRefs.current.get(word.id);
      if (!wordElement || word.isGrabbed) return;

      // Clear existing animations for this word
      const existingAnims = animationRefs.current.get(word.id);
      if (existingAnims) {
        existingAnims.forEach(anim => anim.kill());
      }

      const duration = 10; // 10 seconds for full cycle
      const rotations = 5;

      // Create a timeline for this word
      const timeline = gsap.timeline({ repeat: -1 });

      // Animate the word's polar coordinates
      const wordData = { angle: word.angle, radius: word.radius };

      const angleTween = gsap.to(wordData, {
        angle: `+=${360 * rotations}`,
        duration: duration,
        ease: 'none',
        repeat: -1,
        onUpdate: () => {
          if (wordElement && !word.isGrabbed) {
            const pos = getCartesianPosition(wordData.angle, wordData.radius);
            const scale = getScale(wordData.radius);
            wordElement.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${scale})`;
            wordElement.style.opacity = String(Math.max(0.3, wordData.radius));
          }
        },
      });

      const radiusTween = gsap.to(wordData, {
        radius: 0.15,
        duration: duration,
        ease: 'power1.in',
        repeat: -1,
        onRepeat: () => {
          wordData.radius = 0.95;
          wordData.angle = Math.random() * 360;
        },
      });

      animationRefs.current.set(word.id, [angleTween, radiusTween]);
    });

    return () => {
      animationRefs.current.forEach((anims) => {
        anims.forEach(anim => anim.kill());
      });
      animationRefs.current.clear();
    };
  }, [words, isActive, dimensions]);

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
      }
    });
  }, [words]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {/* Vortex spiral guides */}
      <svg className="absolute inset-0 pointer-events-none" width={dimensions.width} height={dimensions.height}>
        {[0.9, 0.7, 0.5, 0.3, 0.15].map((radius, index) => {
          const centerX = dimensions.width / 2;
          const centerY = dimensions.height / 2;
          const maxRadius = Math.min(dimensions.width, dimensions.height) / 2 - 80;
          const r = radius * maxRadius;

          return (
            <circle
              key={`spiral-${index}`}
              cx={centerX}
              cy={centerY}
              r={r}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="1"
              opacity="0.2"
              strokeDasharray="10 10"
            />
          );
        })}
      </svg>

      {/* Center vortex visual */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <div className="w-16 h-16 rounded-full bg-gradient-radial from-purple-500/50 to-transparent animate-pulse" />
      </div>

      {/* Draggable words */}
      <div className="absolute inset-0">
        {words.map((word) => {
          if (word.isGrabbed) return null;

          const initialPos = getCartesianPosition(word.angle, word.radius);
          const initialScale = getScale(word.radius);

          return (
            <div
              key={word.id}
              ref={(el) => {
                if (el) wordRefs.current.set(word.id, el);
              }}
              className="absolute top-0 left-0 transition-opacity"
              style={{
                transform: `translate(-50%, -50%) translate(${initialPos.x}px, ${initialPos.y}px) scale(${initialScale})`,
                opacity: Math.max(0.3, word.radius),
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
