"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { driver, DriveStep, Driver } from "driver.js";

interface TutorialContextType {
  isActive: boolean;
  hasCompletedTutorial: boolean;
  hasSeenTutorialPrompt: boolean;
  currentTutorialPhase: TutorialPhase | null;
  startTutorial: (phase: TutorialPhase) => void;
  completeTutorial: () => void;
  skipTutorial: () => void;
  resetTutorial: () => void;
  dismissTutorialPrompt: () => void;
  driverInstance: Driver | null;
}

export type TutorialPhase =
  | "welcome"
  | "pre-game"
  | "phase1"
  | "phase1-complete"
  | "phase2"
  | "scoring"
  | "stats"
  | "leaderboard"
  | "archive"
  | "complete";

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_STORAGE_KEY = "wortex-tutorial-completed";
const TUTORIAL_SKIPPED_KEY = "wortex-tutorial-skipped";
const TUTORIAL_PHASES_KEY = "wortex-tutorial-phases-completed";
const TUTORIAL_PROMPT_DISMISSED_KEY = "wortex-tutorial-prompt-dismissed";

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage to prevent flash of tutorial prompt
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    if (typeof window === 'undefined') return false;
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    const skipped = localStorage.getItem(TUTORIAL_SKIPPED_KEY) === "true";
    return completed || skipped;
  });

  const [hasSeenTutorialPrompt, setHasSeenTutorialPrompt] = useState(() => {
    if (typeof window === 'undefined') return false;
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    const skipped = localStorage.getItem(TUTORIAL_SKIPPED_KEY) === "true";
    const promptDismissed = localStorage.getItem(TUTORIAL_PROMPT_DISMISSED_KEY) === "true";
    return completed || skipped || promptDismissed;
  });

  const [isActive, setIsActive] = useState(false);
  const [currentTutorialPhase, setCurrentTutorialPhase] = useState<TutorialPhase | null>(null);
  const [driverInstance, setDriverInstance] = useState<Driver | null>(null);

  // Initialize Driver.js instance
  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Previous",
      doneBtnText: "Got it! →",
      closeBtnText: "Skip Tutorial",
      allowClose: true,
      overlayOpacity: 0.7,
      popoverClass: "wortex-tutorial-popover",
      onDestroyed: () => {
        console.log('[TutorialContext Debug] onDestroyed - setting isActive to false');
        setIsActive(false);
        setCurrentTutorialPhase(null);
      },
      onDestroyStarted: () => {
        const activeIndex = driverObj.getActiveIndex();
        const totalSteps = driverObj.getConfig("steps")?.length || 0;

        console.log('[Tutorial Debug] onDestroyStarted called', { activeIndex, totalSteps });

        // If user is on the last step, they completed it naturally
        if (activeIndex === totalSteps - 1) {
          console.log('[Tutorial Debug] Last step - allowing destruction without confirmation');
          return true; // Allow destruction, no confirmation needed
        }

        // User clicked skip/close in the middle - ask for confirmation
        if (activeIndex !== null && activeIndex < totalSteps - 1) {
          console.log('[Tutorial Debug] Mid-tutorial close - showing confirmation');
          const shouldSkip = confirm(
            "Are you sure you want to skip the tutorial? You can always access it later from the menu."
          );
          if (!shouldSkip) {
            console.log('[Tutorial Debug] User cancelled skip');
            return false; // Cancel destruction
          }
          console.log('[Tutorial Debug] User confirmed skip');
          skipTutorial();
          return true; // Allow destruction after skipping
        }

        // Default: allow destruction
        console.log('[Tutorial Debug] Default case - allowing destruction');
        return true;
      },
    });

    setDriverInstance(driverObj);

    return () => {
      if (driverObj) {
        driverObj.destroy();
      }
    };
  }, []);

  const startTutorial = useCallback(
    (phase: TutorialPhase) => {
      if (!driverInstance) return;

      setIsActive(true);
      setCurrentTutorialPhase(phase);

      // Import and start the appropriate tutorial steps
      // This will be called from individual components
    },
    [driverInstance]
  );

  const completeTutorial = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    localStorage.removeItem(TUTORIAL_SKIPPED_KEY);
    setHasCompletedTutorial(true);
    setIsActive(false);
    setCurrentTutorialPhase(null);

    if (driverInstance) {
      driverInstance.destroy();
    }
  }, [driverInstance]);

  const skipTutorial = useCallback(() => {
    localStorage.setItem(TUTORIAL_SKIPPED_KEY, "true");
    setHasCompletedTutorial(true);
    setIsActive(false);
    setCurrentTutorialPhase(null);

    if (driverInstance) {
      driverInstance.destroy();
    }
  }, [driverInstance]);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    localStorage.removeItem(TUTORIAL_SKIPPED_KEY);
    localStorage.removeItem(TUTORIAL_PHASES_KEY);
    localStorage.removeItem(TUTORIAL_PROMPT_DISMISSED_KEY);
    setHasCompletedTutorial(false);
    setHasSeenTutorialPrompt(false);
    setIsActive(false);
    setCurrentTutorialPhase(null);
  }, []);

  const dismissTutorialPrompt = useCallback(() => {
    localStorage.setItem(TUTORIAL_PROMPT_DISMISSED_KEY, "true");
    setHasSeenTutorialPrompt(true);
  }, []);

  const value: TutorialContextType = {
    isActive,
    hasCompletedTutorial,
    hasSeenTutorialPrompt,
    currentTutorialPhase,
    startTutorial,
    completeTutorial,
    skipTutorial,
    resetTutorial,
    dismissTutorialPrompt,
    driverInstance,
  };

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
