'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BonusQuestion } from '@/types/game';

interface PuzzleFormData {
  date: string;
  targetPhrase: string;
  facsimilePhrase: string;
  difficulty: number;
  bonusType: 'quote' | 'literature';
  bonusQuestion: string;
  bonusOptions: Array<{
    id: string;
    person?: string;
    year?: number;
    author?: string;
    book?: string;
  }>;
  correctAnswerId: string;
  status: 'draft' | 'scheduled' | 'published';
  metadata: {
    source?: string;
    theme?: string;
    tags?: string[];
  };
}

interface PuzzleEditorFormProps {
  puzzle?: any; // Existing puzzle data for edit mode
  mode: 'create' | 'edit';
}

export default function PuzzleEditorForm({ puzzle, mode }: PuzzleEditorFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRedeployModal, setShowRedeployModal] = useState(false);
  const [redeployDate, setRedeployDate] = useState('');

  // Initialize form data from puzzle or defaults
  const initializeFormData = (): PuzzleFormData => {
    if (mode === 'edit' && puzzle) {
      const bonusQ = puzzle.bonus_question;
      // Map database 'approved' field to UI 'status' field
      const status = puzzle.approved ? 'published' : 'draft';
      return {
        date: puzzle.date,
        targetPhrase: puzzle.target_phrase,
        facsimilePhrase: puzzle.facsimile_phrase,
        difficulty: puzzle.difficulty,
        bonusType: bonusQ?.type || 'quote',
        bonusQuestion: bonusQ?.question || '',
        bonusOptions: bonusQ?.options || [
          { id: '1', person: '', year: undefined },
          { id: '2', person: '', year: undefined },
          { id: '3', person: '', year: undefined },
          { id: '4', person: '', year: undefined },
        ],
        correctAnswerId: bonusQ?.correctAnswerId || '1',
        status: status,
        metadata: puzzle.metadata || {
          source: '',
          theme: '',
          tags: [],
        },
      };
    }

    return {
      date: new Date().toISOString().split('T')[0],
      targetPhrase: '',
      facsimilePhrase: '',
      difficulty: 3,
      bonusType: 'quote',
      bonusQuestion: '',
      bonusOptions: [
        { id: '1', person: '', year: undefined },
        { id: '2', person: '', year: undefined },
        { id: '3', person: '', year: undefined },
        { id: '4', person: '', year: undefined },
      ],
      correctAnswerId: '1',
      status: 'draft',
      metadata: {
        source: '',
        theme: '',
        tags: [],
      },
    };
  };

  const [formData, setFormData] = useState<PuzzleFormData>(initializeFormData());

  const updateField = (field: keyof PuzzleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateBonusOption = (index: number, field: string, value: any) => {
    const newOptions = [...formData.bonusOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData(prev => ({ ...prev, bonusOptions: newOptions }));
  };

  const addBonusOption = () => {
    const newId = (formData.bonusOptions.length + 1).toString();
    setFormData(prev => ({
      ...prev,
      bonusOptions: [
        ...prev.bonusOptions,
        { id: newId, person: '', year: undefined },
      ],
    }));
  };

  const removeBonusOption = (index: number) => {
    if (formData.bonusOptions.length <= 2) {
      alert('You must have at least 2 bonus options');
      return;
    }
    setFormData(prev => ({
      ...prev,
      bonusOptions: prev.bonusOptions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Validate
      if (!formData.targetPhrase.trim()) {
        throw new Error('Target phrase is required');
      }
      if (!formData.facsimilePhrase.trim()) {
        throw new Error('Facsimile phrase is required');
      }
      if (!formData.bonusQuestion.trim()) {
        throw new Error('Bonus question is required');
      }

      const targetWords = formData.targetPhrase.trim().split(/\s+/).filter(w => w);
      const facsimileWords = formData.facsimilePhrase.trim().split(/\s+/).filter(w => w);

      if (targetWords.length < 5) {
        throw new Error('Target phrase must have at least 5 words');
      }
      if (facsimileWords.length < 5) {
        throw new Error('Facsimile phrase must have at least 5 words');
      }

      // Build bonus question
      const bonusQuestion: BonusQuestion = {
        type: formData.bonusType,
        question: formData.bonusQuestion,
        options: formData.bonusOptions,
        correctAnswerId: formData.correctAnswerId,
      };

      const requestBody = {
        date: formData.date,
        target_phrase: formData.targetPhrase.trim(),
        facsimile_phrase: formData.facsimilePhrase.trim(),
        difficulty: formData.difficulty,
        bonus_question: bonusQuestion,
        status: formData.status,
        metadata: formData.metadata,
      };

      // Submit to API
      const url = mode === 'edit' ? `/api/admin/puzzles/${puzzle.id}` : '/api/admin/puzzles';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${mode} puzzle`);
      }

      // Success - redirect to puzzles list
      router.push('/admin/puzzles');
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  const handleRedeploy = async () => {
    if (!redeployDate) {
      alert('Please select a date');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const bonusQuestion: BonusQuestion = {
        type: formData.bonusType,
        question: formData.bonusQuestion,
        options: formData.bonusOptions,
        correctAnswerId: formData.correctAnswerId,
      };

      const response = await fetch('/api/admin/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: redeployDate,
          target_phrase: formData.targetPhrase.trim(),
          facsimile_phrase: formData.facsimilePhrase.trim(),
          difficulty: formData.difficulty,
          bonus_question: bonusQuestion,
          status: 'scheduled',
          metadata: formData.metadata,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to redeploy puzzle');
      }

      router.push('/admin/puzzles');
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Puzzle Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => updateField('date', e.target.value)}
              required
              disabled={mode === 'edit'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {mode === 'edit' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Date cannot be changed. Use "Redeploy" to schedule this puzzle for another date.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty (1-5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.difficulty}
              onChange={(e) => updateField('difficulty', parseInt(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Target Phrase */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Phrase (Original Quote)
          </label>
          <textarea
            value={formData.targetPhrase}
            onChange={(e) => updateField('targetPhrase', e.target.value)}
            placeholder="Enter the original quote or phrase"
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.targetPhrase.trim().split(/\s+/).filter(w => w).length} words
          </p>
        </div>

        {/* Facsimile Phrase */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Facsimile Phrase (Spin-off)
          </label>
          <textarea
            value={formData.facsimilePhrase}
            onChange={(e) => updateField('facsimilePhrase', e.target.value)}
            placeholder="Enter the similar phrase with different wording"
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.facsimilePhrase.trim().split(/\s+/).filter(w => w).length} words
          </p>
        </div>

        {/* Bonus Question */}
        <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bonus Question
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Type
                </label>
                <select
                  value={formData.bonusType}
                  onChange={(e) => updateField('bonusType', e.target.value as 'quote' | 'literature')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="quote">Quote (Person & Year)</option>
                  <option value="literature">Literature (Author & Book)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Text
              </label>
              <input
                type="text"
                value={formData.bonusQuestion}
                onChange={(e) => updateField('bonusQuestion', e.target.value)}
                placeholder="e.g., Who said this famous quote?"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            {/* Bonus Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Answer Options
              </label>
              <div className="space-y-3">
                {formData.bonusOptions.map((option, index) => (
                  <div key={option.id} className="flex gap-2 items-start">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={formData.correctAnswerId === option.id}
                      onChange={() => updateField('correctAnswerId', option.id)}
                      className="mt-3"
                    />
                    {formData.bonusType === 'quote' ? (
                      <>
                        <input
                          type="text"
                          value={option.person || ''}
                          onChange={(e) => updateBonusOption(index, 'person', e.target.value)}
                          placeholder="Person name"
                          required
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <input
                          type="number"
                          value={option.year || ''}
                          onChange={(e) => updateBonusOption(index, 'year', e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Year (optional)"
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={option.author || ''}
                          onChange={(e) => updateBonusOption(index, 'author', e.target.value)}
                          placeholder="Author name"
                          required
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={option.book || ''}
                          onChange={(e) => updateBonusOption(index, 'book', e.target.value)}
                          placeholder="Book title"
                          required
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => removeBonusOption(index)}
                      className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addBonusOption}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Add option
              </button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Metadata (Optional)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source
              </label>
              <input
                type="text"
                value={formData.metadata.source || ''}
                onChange={(e) => updateField('metadata', { ...formData.metadata, source: e.target.value })}
                placeholder="e.g., Poor Richard's Almanack"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <input
                type="text"
                value={formData.metadata.theme || ''}
                onChange={(e) => updateField('metadata', { ...formData.metadata, theme: e.target.value })}
                placeholder="e.g., wisdom, health"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as 'draft' | 'scheduled' | 'published')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="draft">Draft (not visible)</option>
            <option value="scheduled">Scheduled (will publish on date)</option>
            <option value="published">Published (immediately available)</option>
          </select>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6 border-t border-gray-300 dark:border-gray-600">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Puzzle'}
          </button>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => setShowRedeployModal(true)}
              disabled={isSaving}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-colors"
            >
              Redeploy to Another Date
            </button>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSaving}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Redeploy Modal */}
      {showRedeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Redeploy Puzzle
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This will create a copy of this puzzle for a new date. The original puzzle will remain unchanged.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Date
              </label>
              <input
                type="date"
                value={redeployDate}
                onChange={(e) => setRedeployDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleRedeploy}
                disabled={isSaving || !redeployDate}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-colors"
              >
                {isSaving ? 'Redeploying...' : 'Redeploy'}
              </button>
              <button
                onClick={() => {
                  setShowRedeployModal(false);
                  setRedeployDate('');
                }}
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
