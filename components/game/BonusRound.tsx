'use client';

import { useState } from 'react';
import type { BonusQuestion, BonusOption } from '@/types/game';

interface BonusRoundProps {
  bonusQuestion: BonusQuestion;
  onAnswer: (selectedAnswerId: string, isCorrect: boolean) => void;
  onSkip: () => void;
}

export default function BonusRound({ bonusQuestion, onAnswer, onSkip }: BonusRoundProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleSelectAnswer = (answerId: string) => {
    if (hasAnswered) return;
    setSelectedAnswer(answerId);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || hasAnswered) return;

    const isCorrect = selectedAnswer === bonusQuestion.correctAnswerId;
    setHasAnswered(true);

    // Wait a moment to show the result, then trigger callback
    setTimeout(() => {
      onAnswer(selectedAnswer, isCorrect);
    }, 1500);
  };

  const getOptionLabel = (option: BonusOption): string => {
    if (bonusQuestion.type === 'literature') {
      return `${option.author} - ${option.book}`;
    } else if (bonusQuestion.type === 'quote') {
      return `${option.person} (${option.year})`;
    }
    return '';
  };

  const getButtonStyle = (optionId: string): string => {
    const baseStyle = 'w-full text-left p-2 rounded-lg border-2 transition-all duration-200 text-sm ';

    if (!hasAnswered) {
      if (selectedAnswer === optionId) {
        return baseStyle + 'bg-blue-100 border-blue-500 dark:bg-blue-900 dark:border-blue-400';
      }
      return baseStyle + 'bg-white border-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900';
    }

    // After answering, show correct/incorrect
    const isCorrect = optionId === bonusQuestion.correctAnswerId;
    const isSelected = optionId === selectedAnswer;

    if (isCorrect) {
      return baseStyle + 'bg-green-100 border-green-500 dark:bg-green-900 dark:border-green-400';
    } else if (isSelected && !isCorrect) {
      return baseStyle + 'bg-red-100 border-red-500 dark:bg-red-900 dark:border-red-400';
    }

    return baseStyle + 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600 opacity-50';
  };

  return (
    <div className="w-full h-full max-w-2xl mx-auto animate-fade-in flex flex-col">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col h-full overflow-hidden mx-2">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0 px-3 pt-2 pb-1">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
            Bonus Round
          </h2>
        </div>

        {/* Scrollable Content Area - Grows to fill available space with extra padding for button */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-24">
          {/* Question */}
          <div className="mb-2">
            <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-2 mb-2">
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                {bonusQuestion.question}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-1.5">
              {bonusQuestion.options.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(option.id)}
                  disabled={hasAnswered}
                  className={getButtonStyle(option.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 mr-2">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getOptionLabel(option)}
                      </div>
                    </div>
                    {hasAnswered && option.id === bonusQuestion.correctAnswerId && (
                      <div className="ml-2 text-green-600 dark:text-green-400 font-bold">✓</div>
                    )}
                    {hasAnswered && option.id === selectedAnswer && option.id !== bonusQuestion.correctAnswerId && (
                      <div className="ml-2 text-red-600 dark:text-red-400 font-bold">✗</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Result Message */}
          {hasAnswered && (
            <div className={`mb-2 p-2 rounded-lg ${
              selectedAnswer === bonusQuestion.correctAnswerId
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              <p className="text-sm font-semibold">
                {selectedAnswer === bonusQuestion.correctAnswerId
                  ? '🎉 Correct! Well done!'
                  : '❌ Incorrect. Better luck next time!'}
              </p>
            </div>
          )}
        </div>

        {/* Actions - Fixed at bottom with safe area */}
        <div
          className="flex-shrink-0 px-3 pt-1.5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
        >
          <div className="flex gap-2 mb-1.5">
            {!hasAnswered && (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Submit Answer
                </button>
                <button
                  onClick={onSkip}
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-semibold transition-colors text-sm whitespace-nowrap"
                >
                  Skip
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
