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
    const baseStyle = 'w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ';

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
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl max-h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Bonus Round
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Answer correctly for bonus points!
          </p>
        </div>

        {/* Question */}
        <div className="mb-6">
          <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-4 mb-6">
            <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
              {bonusQuestion.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {bonusQuestion.options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleSelectAnswer(option.id)}
                disabled={hasAnswered}
                className={getButtonStyle(option.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 mr-3">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
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
          <div className={`mb-6 p-4 rounded-lg ${
            selectedAnswer === bonusQuestion.correctAnswerId
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
          }`}>
            <p className="font-semibold">
              {selectedAnswer === bonusQuestion.correctAnswerId
                ? '🎉 Correct! Well done!'
                : '❌ Incorrect. Better luck next time!'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!hasAnswered && (
            <>
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Submit Answer
              </button>
              <button
                onClick={onSkip}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-semibold transition-colors"
              >
                Skip
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
