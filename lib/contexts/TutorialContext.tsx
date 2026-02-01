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
  | "bonusRound"
  | "finalResults"
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
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  const [hasSeenTutorialPrompt, setHasSeenTutorialPrompt] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentTutorialPhase, setCurrentTutorialPhase] = useState<TutorialPhase | null>(null);
  const [driverInstance, setDriverInstance] = useState<Driver | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check tutorial completion and prompt dismissal status on mount
  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY) === "true";
    const skipped = localStorage.getItem(TUTORIAL_SKIPPED_KEY) === "true";
    const promptDismissed = localStorage.getItem(TUTORIAL_PROMPT_DISMISSED_KEY) === "true";
    setHasCompletedTutorial(completed || skipped);
    setHasSeenTutorialPrompt(completed || skipped || promptDismissed);
    setIsHydrated(true);
  }, []);

  // Initialize Driver.js instance
  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Previous",
      doneBtnText: "Got it! →",
      allowClose: true,
      overlayOpacity: 0.7,
      popoverClass: "wortex-tutorial-popover",
      onDestroyed: () => {
        console.log('[TutorialContext Debug] onDestroyed - setting isActive to false');
        setIsActive(false);
        setCurrentTutorialPhase(null);
      },
      onDestroyStarted: () => {
        console.log('[Tutorial Debug] onDestroyStarted called');
        // Always allow destruction - the tutorial steps handle their own confirmation
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
