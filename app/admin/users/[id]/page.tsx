'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TierBadge from '@/components/admin/TierBadge';
import type { Database } from '@/types/database';

type UserRow = Database['public']['Tables']['users']['Row'];
type StatsRow = Database['public']['Tables']['stats']['Row'];

interface UserDetailsResponse {
  user: UserRow;
  stats: StatsRow | null;
  recentScores: any[];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserRow | null>(null);
  const [stats, setStats] = useState<StatsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTierModal, setShowTierModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'free' | 'premium' | 'admin'>('free');
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then(p => setUserId(p.id));
  }, [params]);

  // Fetch user details
  async function fetchUser() {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data: UserDetailsResponse = await response.json();

      if (response.ok) {
        setUser(data.user);
        setStats(data.stats);
        setSelectedTier(data.user.user_tier);
      } else {
        console.error('Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Update user tier
  async function updateTier() {
    if (!userId || !user) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_tier: selectedTier }),
      });

      if (response.ok) {
        await fetchUser(); // Refresh user data
        setShowTierModal(false);
      } else {
        console.error('Failed to update tier');
        alert('Failed to update user tier');
      }
    } catch (error) {
      console.error('Error updating tier:', error);
      alert('Error updating user tier');
    }
  }

  // Delete user
  async function deleteUser() {
    if (!userId || deleteConfirmation !== 'DELETE') return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/users');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    } finally {
      setDeleting(false);
    }
  }

  // Format date
  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading user details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {user.username || user.display_name || 'Anonymous User'}
          </h1>
          <TierBadge tier={user.user_tier} />
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="User ID" value={user.id.substring(0, 12) + '...'} />
          <InfoRow label="Username" value={user.username || '—'} />
          <InfoRow label="Display Name" value={user.display_name || '—'} />
          <InfoRow label="Email" value={user.email || '—'} />
          <InfoRow label="Account Type" value={user.is_anonymous ? 'Anonymous' : 'Registered'} />
          <InfoRow label="Timezone" value={user.timezone} />
          <InfoRow label="Joined" value={formatDate(user.created_at)} />
          <InfoRow label="Last Login" value={formatDate(user.last_login)} />
          <InfoRow label="Last Active" value={formatDate(user.last_active)} />
          <InfoRow
            label="Subscription"
            value={
              user.subscription_status === 'active'
                ? `Active (expires ${formatDate(user.subscription_expires_at)})`
                : user.subscription_status
            }
          />
        </div>
      </div>

      {/* Stats Card */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Game Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Total Games" value={stats.total_games} />
            <StatBox label="Average Score" value={stats.average_score.toFixed(2)} />
            <StatBox label="Current Streak" value={`${stats.current_streak} days`} />
            <StatBox label="Best Streak" value={`${stats.best_streak} days`} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Admin Actions
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowTierModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Change Tier
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            Delete User
          </button>
        </div>
      </div>

      {/* Tier Change Modal */}
      {showTierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Change User Tier
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  User: {user.username || user.display_name || 'Anonymous'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Current Tier: <TierBadge tier={user.user_tier} size="sm" />
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select New Tier:
                </label>
                <div className="space-y-2">
                  {(['free', 'premium', 'admin'] as const).map((tier) => (
                    <label key={tier} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tier"
                        value={tier}
                        checked={selectedTier === tier}
                        onChange={(e) => setSelectedTier(e.target.value as any)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <TierBadge tier={tier} size="sm" />
                    </label>
                  ))}
                </div>
              </div>
              {selectedTier === 'admin' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Warning: Changing to Admin gives full access to all admin features.
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowTierModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={updateTier}
                  disabled={selectedTier === user.user_tier}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
              🚨 Delete User Account
            </h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <p>You are about to DELETE:</p>
                <ul className="ml-4 list-disc">
                  <li>Username: {user.username || 'N/A'}</li>
                  <li>Email: {user.email || 'N/A'}</li>
                  <li>Total Games: {stats?.total_games || 0}</li>
                  <li>Created: {formatDate(user.created_at)}</li>
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                  ⚠️ THIS ACTION CANNOT BE UNDONE!
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This will permanently delete all user data, scores, and stats.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="DELETE"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteUser}
                  disabled={deleteConfirmation !== 'DELETE' || deleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-900 dark:text-gray-100 mt-1">{value}</dd>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}
