'use client';

import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Text, Circle } from 'react-konva';
import { gsap } from 'gsap';
import type { WordInVortex } from '@/types/game';

interface VortexProps {
  words: WordInVortex[];
  onWordGrab: (wordId: string) => void;
  isActive: boolean;
}

export default function Vortex({ words, onWordGrab, isActive }: VortexProps) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const stageRef = useRef<any>(null);
  const animationRef = useRef<gsap.core.Tween[]>([]);

  // Handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('vortex-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Animate words in the vortex
  useEffect(() => {
    if (!isActive) return;

    // Clear previous animations
    animationRef.current.forEach((tween) => tween.kill());
    animationRef.current = [];

    // Create spiral animations for each word
    words.forEach((word, index) => {
      const duration = 10; // 10 seconds per rotation
      const rotations = 5; // Number of complete rotations

      // Animate angle (rotation)
      const angleTween = gsap.to(word, {
        angle: `+=${360 * rotations}`,
        duration: duration,
        ease: 'none',
        repeat: -1,
        onUpdate: () => {
          // Force re-render
          stageRef.current?.batchDraw();
        },
      });

      // Animate radius (spiral inward)
      const radiusTween = gsap.to(word, {
        radius: 0.1, // Move toward center
        duration: duration,
        ease: 'power1.in',
        repeat: -1,
        repeatDelay: 0,
        onRepeat: () => {
          // Reset to outer edge when reaching center
          word.radius = 0.9;
        },
      });

      animationRef.current.push(angleTween, radiusTween);
    });

    return () => {
      animationRef.current.forEach((tween) => tween.kill());
    };
  }, [words, isActive]);

  // Calculate position from polar coordinates
  const getCartesianPosition = (angle: number, radius: number) => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const maxRadius = Math.min(dimensions.width, dimensions.height) / 2 - 50;

    const radian = (angle * Math.PI) / 180;
    const x = centerX + Math.cos(radian) * radius * maxRadius;
    const y = centerY + Math.sin(radian) * radius * maxRadius;

    return { x, y };
  };

  // Calculate font size based on radius (smaller near center)
  const getFontSize = (radius: number) => {
    return Math.max(12, 24 * radius); // Minimum 12px, max 24px
  };

  return (
    <div id="vortex-container" className="w-full h-full relative">
      <Stage width={dimensions.width} height={dimensions.height} ref={stageRef}>
        <Layer>
          {/* Draw vortex spiral guides (visual effect) */}
          {[0.9, 0.7, 0.5, 0.3, 0.1].map((radius, index) => {
            const centerX = dimensions.width / 2;
            const centerY = dimensions.height / 2;
            const maxRadius = Math.min(dimensions.width, dimensions.height) / 2 - 50;

            return (
              <Circle
                key={`spiral-${index}`}
                x={centerX}
                y={centerY}
                radius={radius * maxRadius}
                stroke="#8b5cf6"
                strokeWidth={1}
                opacity={0.2}
                dash={[10, 10]}
              />
            );
          })}

          {/* Draw words */}
          {words.map((word) => {
            const pos = getCartesianPosition(word.angle, word.radius);
            const fontSize = getFontSize(word.radius);

            return (
              <Text
                key={word.id}
                x={pos.x}
                y={pos.y}
                text={word.word}
                fontSize={fontSize}
                fill={word.isGrabbed ? '#10b981' : '#374151'}
                fontFamily="Arial"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                offsetX={fontSize * word.word.length * 0.3} // Center text
                offsetY={fontSize / 2}
                opacity={word.isGrabbed ? 0.5 : 1}
                onClick={() => !word.isGrabbed && onWordGrab(word.id)}
                onTap={() => !word.isGrabbed && onWordGrab(word.id)}
                shadowColor="black"
                shadowBlur={2}
                shadowOpacity={0.3}
                cursor="pointer"
              />
            );
          })}
        </Layer>
      </Stage>

      {/* Center vortex visual */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-16 h-16 rounded-full bg-gradient-radial from-purple-500/50 to-transparent animate-pulse" />
      </div>
    </div>
  );
}
