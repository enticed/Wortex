"use client";

import { useEffect } from "react";
import { DriveStep } from "driver.js";
import { useTutorial, TutorialPhase } from "@/lib/contexts/TutorialContext";

interface UseTutorialStepsOptions {
  phase: TutorialPhase;
  steps: DriveStep[];
  autoStart?: boolean;
  onComplete?: () => void;
  delay?: number; // Delay before starting tutorial (in ms)
}

/**
 * Hook to run tutorial steps for a specific phase
 *
 * @param options Configuration for the tutorial steps
 * @returns Object with manual trigger function
 *
 * @example
 * ```tsx
 * const { triggerTutorial } = useTutorialSteps({
 *   phase: "phase1",
 *   steps: phase1Steps,
 *   autoStart: true,
 *   delay: 500,
 * });
 * ```
 */
export function useTutorialSteps({
  phase,
  steps,
  autoStart = false,
  onComplete,
  delay = 0,
}: UseTutorialStepsOptions) {
  const { driverInstance, hasCompletedTutorial, isActive, startTutorial, completeTutorial } =
    useTutorial();

  const triggerTutorial = () => {
    if (!driverInstance || hasCompletedTutorial) return;

    startTutorial(phase);

    // Set up completion callback
    const originalOnDestroyStarted = driverInstance.getConfig().onDestroyStarted;
    const originalOnDestroyed = driverInstance.getConfig().onDestroyed;

    driverInstance.setConfig({
      onDestroyStarted: (element, step, opts) => {
        console.log('[useTutorialSteps Debug] onDestroyStarted wrapper called for phase:', phase);
        if (originalOnDestroyStarted) {
          const result = originalOnDestroyStarted(element, step, opts);
          console.log('[useTutorialSteps Debug] Original handler returned:', result);
          if (result === false) return false;
        }
        console.log('[useTutorialSteps Debug] Wrapper returning true');
        return true; // Allow destruction to proceed
      },
      onDestroyed: (element, step, opts) => {
        console.log('[useTutorialSteps Debug] onDestroyed wrapper called for phase:', phase);

        // IMPORTANT: Call the original onDestroyed first (sets isActive to false)
        if (originalOnDestroyed) {
          console.log('[useTutorialSteps Debug] Calling original onDestroyed');
          originalOnDestroyed(element, step, opts);
        }

        // Mark this phase as completed
        const phasesCompleted = JSON.parse(localStorage.getItem('wortex-tutorial-phases-completed') || '[]');
        if (!phasesCompleted.includes(phase)) {
          phasesCompleted.push(phase);
          localStorage.setItem('wortex-tutorial-phases-completed', JSON.stringify(phasesCompleted));
          console.log('[useTutorialSteps Debug] Marked phase as complete:', phase, 'All completed phases:', phasesCompleted);
        }

        // Check if ALL tutorial phases are complete (all 19 steps across 6 phases)
        const allPhases = ['welcome', 'pre-game', 'phase1', 'phase2', 'bonusRound', 'finalResults'];
        const allPhasesComplete = allPhases.every(p => phasesCompleted.includes(p));

        if (allPhasesComplete) {
          console.log('[useTutorialSteps Debug] All tutorial phases complete - marking tutorial as complete');
          completeTutorial();
        }

        if (onComplete) {
          onComplete();
        }
      },
    });

    // Apply steps and start
    driverInstance.setSteps(steps);
    driverInstance.drive();
  };

  useEffect(() => {
    // Check if this specific phase has been completed
    const phasesCompleted = JSON.parse(localStorage.getItem('wortex-tutorial-phases-completed') || '[]');
    const phaseAlreadyCompleted = phasesCompleted.includes(phase);

    console.log('[useTutorialSteps Debug] Effect triggered for phase:', phase, {
      autoStart,
      hasCompletedTutorial,
      isActive,
      phaseAlreadyCompleted,
      phasesCompleted,
      willStart: autoStart && !hasCompletedTutorial && !isActive && !phaseAlreadyCompleted,
    });

    if (autoStart && !hasCompletedTutorial && !isActive && !phaseAlreadyCompleted) {
      console.log('[useTutorialSteps Debug] Scheduling tutorial start for phase:', phase, 'in', delay, 'ms');
      const timer = setTimeout(() => {
        console.log('[useTutorialSteps Debug] Starting tutorial for phase:', phase);
        triggerTutorial();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [autoStart, hasCompletedTutorial, isActive, delay, phase]);

  return {
    triggerTutorial,
    isRunning: isActive,
    hasCompleted: hasCompletedTutorial,
  };
}
