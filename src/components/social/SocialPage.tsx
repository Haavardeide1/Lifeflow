'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { Card } from '@/components/shared/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import type { StatusUpdate, StatusComment, StatusKudo } from '@/types';
import {
  fetchStatusUpdates,
  createStatusUpdate,
  fetchStatusComments,
  createStatusComment,
  fetchStatusKudos,
  toggleStatusKudo,
  fetchFriendsList,
} from '@/lib/supabaseSync';
import { MessageSquare, Heart, Send, Sparkles } from 'lucide-react';

function formatDateTime(value: string): string {
  const d = new Date(value);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function shortName(username?: string | null, displayName?: string | null, fallback?: string | null): string {
  return displayName || username || fallback || 'Unknown';
}

export function SocialPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const [friendStats, setFriendStats] = useState<{
    userId: string;
    displayName: string | null;
    username: string;
    avatarColor: string;
    currentStreakDays: number;
  }[]>([]);

  const [statusText, setStatusText] = useState('');
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [comments, setComments] = useState<StatusComment[]>([]);
  const [kudos, setKudos] = useState<StatusKudo[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const friendMap = useMemo(() => {
    const map = new Map<string, { streak: number; name: string; avatarColor: string }>();
    friendStats.forEach((f) => {
      map.set(f.userId, {
        streak: f.currentStreakDays,
        name: f.displayName || f.username,
        avatarColor: f.avatarColor,
      });
    });
    return map;
  }, [friendStats]);

  const commentsByStatus = useMemo(() => {
    const grouped: Record<string, StatusComment[]> = {};
    comments.forEach((c) => {
      if (!grouped[c.statusId]) grouped[c.statusId] = [];
      grouped[c.statusId].push(c);
    });
    return grouped;
  }, [comments]);

  const kudosByStatus = useMemo(() => {
    const grouped: Record<string, StatusKudo[]> = {};
    kudos.forEach((k) => {
      if (!grouped[k.statusId]) grouped[k.statusId] = [];
      grouped[k.statusId].push(k);
    });
    return grouped;
  }, [kudos]);

  const loadFeed = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const friendStatsData = await fetchFriendsList(user.id);
      setFriendStats(friendStatsData);
      const userIds = [user.id, ...friendStatsData.map((f) => f.userId)];
      const statusesData = await fetchStatusUpdates(userIds);
      const statusIds = statusesData.map((s) => s.id);
      const [commentsData, kudosData] = await Promise.all([
        fetchStatusComments(statusIds),
        fetchStatusKudos(statusIds),
      ]);
      setStatuses(statusesData);
      setComments(commentsData);
      setKudos(kudosData);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handlePost = async () => {
    if (!user) return;
    const body = statusText.trim();
    if (!body) return;
    setLoading(true);
    try {
      await createStatusUpdate(user.id, body);
      setStatusText('');
      await loadFeed();
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async (statusId: string) => {
    if (!user) return;
    const body = (commentDrafts[statusId] || '').trim();
    if (!body) return;
    setLoading(true);
    try {
      await createStatusComment(statusId, user.id, body);
      setCommentDrafts((prev) => ({ ...prev, [statusId]: '' }));
      await loadFeed();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKudos = async (statusId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await toggleStatusKudo(statusId, user.id);
      await loadFeed();
    } finally {
      setLoading(false);
    }
  };

  const hasStatuses = statuses.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-semibold">Social</h1>
            <p className="text-[12px] text-gray-400 dark:text-white/40">
              Share a quick update with friends and send kudos.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium">
            <Sparkles size={12} />
            Friends only
          </div>
        </div>

        <Card title="Post a status">
          <div className="p-4 space-y-3">
            <textarea
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="What are you working on today?"
              className="w-full min-h-[90px] bg-transparent text-[14px] text-gray-700 dark:text-white/80 placeholder:text-gray-300 dark:placeholder:text-white/20 resize-none outline-none"
            />
            <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-white/40">
              <span>Visible to friends only</span>
              <button
                onClick={handlePost}
                disabled={loading || statusText.trim().length === 0}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[13px] font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <Send size={14} />
                Post
              </button>
            </div>
          </div>
        </Card>

        {!hasStatuses ? (
          <EmptyState
            title="No status updates yet"
            description="Post an update or add friends to see their progress."
          />
        ) : (
          statuses.map((status) => {
            const authorName = shortName(status.username, status.displayName, status.userId === user?.id ? profile?.username : undefined);
            const streak = friendMap.get(status.userId)?.streak ?? (status.userId === user?.id ? profile?.currentStreakDays || 0 : 0);
            const avatarColor = status.avatarColor || friendMap.get(status.userId)?.avatarColor || '#10b981';
            const statusComments = commentsByStatus[status.id] || [];
            const statusKudos = kudosByStatus[status.id] || [];
            const hasKudo = statusKudos.some((k) => k.userId === user?.id);

            return (
              <Card key={status.id} title={authorName}>
                <div className="p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-semibold"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {authorName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] text-gray-700 dark:text-white/80 whitespace-pre-wrap">{status.body}</p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-white/40 mt-2">
                        <span>{formatDateTime(status.createdAt)}</span>
                        {streak > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                            {streak} day streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[12px] text-gray-400 dark:text-white/40">
                    <button
                      onClick={() => handleToggleKudos(status.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                        hasKudo ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-gray-200 dark:border-white/[0.08]'
                      }`}
                    >
                      <Heart size={14} />
                      {statusKudos.length} kudos
                    </button>
                    {statusKudos.length > 0 && (
                      <span className="truncate">
                        {statusKudos
                          .slice(0, 3)
                          .map((k) => shortName(k.username, k.displayName))
                          .join(', ')}
                        {statusKudos.length > 3 ? ` +${statusKudos.length - 3}` : ''}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {statusComments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2 text-[12px] text-gray-500 dark:text-white/50">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                          style={{ backgroundColor: comment.avatarColor || '#475569' }}
                        >
                          {shortName(comment.username, comment.displayName)[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[12px]">
                            {shortName(comment.username, comment.displayName)}
                            <span className="text-[10px] text-gray-400 dark:text-white/30 ml-2">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </p>
                          <p className="text-[12px] text-gray-600 dark:text-white/70 whitespace-pre-wrap">{comment.body}</p>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-gray-400 dark:text-white/40" />
                      <input
                        value={commentDrafts[status.id] || ''}
                        onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [status.id]: e.target.value }))}
                        placeholder="Write a comment..."
                        className="flex-1 bg-transparent border-b border-gray-200 dark:border-white/[0.06] text-[12px] text-gray-700 dark:text-white/80 outline-none py-1"
                      />
                      <button
                        onClick={() => handleComment(status.id)}
                        disabled={loading || !(commentDrafts[status.id] || '').trim()}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
