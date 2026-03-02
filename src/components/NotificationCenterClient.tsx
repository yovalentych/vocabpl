"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useSearchParams, useRouter } from "next/navigation";
import NotificationItem from "@/components/NotificationItem";
import type { NotificationCategory, NotificationStatus } from "@/lib/notifications";

type Notification = {
  _id: string;
  userId: string;
  userRole: "admin" | "tutor" | "user";
  category: NotificationCategory;
  type: string;
  priority: "urgent" | "normal" | "low";
  title: string;
  message: string;
  icon: string;
  actions?: Array<{
    label: string;
    href: string;
    variant?: "primary" | "secondary" | "danger";
  }>;
  metadata?: Record<string, unknown>;
  status: NotificationStatus;
  readAt?: string;
  createdAt: string;
  expiresAt: string;
};

type NotificationsResponse = {
  notifications: Notification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats: {
    unreadCount: number;
    unreadByCategory: Record<string, number>;
  };
};

export default function NotificationCenterClient() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState({
    unreadCount: 0,
    unreadByCategory: {} as Record<string, number>
  });

  const categoryParam = (searchParams.get("category") as NotificationCategory) || null;
  const statusParam = (searchParams.get("status") as "unread" | "all") || "all";

  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | null>(
    categoryParam
  );
  const [selectedStatus, setSelectedStatus] = useState<"unread" | "all">(statusParam);
  const [offset, setOffset] = useState(0);

  const limit = 50;

  const fetchNotifications = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set("limit", String(limit));
        params.set("offset", String(reset ? 0 : offset));

        if (selectedCategory) {
          params.set("category", selectedCategory);
        }

        if (selectedStatus === "unread") {
          params.set("status", "unread");
        }

        const res = await fetch(`/api/notifications?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch notifications");

        const data: NotificationsResponse = await res.json();

        if (reset) {
          setNotifications(data.notifications);
          setOffset(data.notifications.length);
        } else {
          setNotifications(prev => [...prev, ...data.notifications]);
          setOffset(prev => prev + data.notifications.length);
        }

        setHasMore(data.pagination.hasMore);
        setStats(data.stats);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, selectedStatus, offset]
  );

  useEffect(() => {
    setOffset(0);
    fetchNotifications(true);
  }, [selectedCategory, selectedStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Poll for new notifications every 30s when page is visible
      if (!document.hidden) {
        fetchNotifications(true);
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications(true);
      }
    };

    const handleNotificationUpdate = () => {
      fetchNotifications(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("notification-update", handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("notification-update", handleNotificationUpdate);
    };
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const body: Record<string, unknown> = { action: "mark_read" };

      if (selectedCategory) {
        body.category = selectedCategory;
      }

      const res = await fetch("/api/notifications/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Failed to mark all as read");

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: "read" as NotificationStatus, readAt: new Date().toISOString() }))
      );

      // Dispatch event to update NavBar badge
      window.dispatchEvent(new Event("notification-update"));

      // Refresh to get updated stats
      fetchNotifications(true);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleMarkRead = async (id: string, newStatus: NotificationStatus) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Failed to update notification");

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n._id === id
            ? { ...n, status: newStatus, readAt: newStatus === "read" ? new Date().toISOString() : undefined }
            : n
        )
      );

      // Dispatch event to update NavBar badge
      window.dispatchEvent(new Event("notification-update"));
    } catch (error) {
      console.error("Failed to update notification:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.notifications.deleteConfirm || "Ви впевнені?")) return;

    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete notification");

      // Remove from local state
      setNotifications(prev => prev.filter(n => n._id !== id));

      // Dispatch event to update NavBar badge
      window.dispatchEvent(new Event("notification-update"));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleCategoryChange = (category: NotificationCategory | null) => {
    setSelectedCategory(category);
    setOffset(0);

    // Update URL
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (selectedStatus !== "all") params.set("status", selectedStatus);

    const url = params.toString() ? `/notifications?${params.toString()}` : "/notifications";
    router.push(url as any);
  };

  const handleStatusChange = (status: "unread" | "all") => {
    setSelectedStatus(status);
    setOffset(0);

    // Update URL
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (status !== "all") params.set("status", status);

    const url = params.toString() ? `/notifications?${params.toString()}` : "/notifications";
    router.push(url as any);
  };

  const categories: Array<{ key: NotificationCategory | null; label: string }> = [
    { key: null, label: t.notifications.categories.all },
    { key: "classes", label: t.notifications.categories.classes },
    { key: "assignments", label: t.notifications.categories.assignments },
    { key: "subscription", label: t.notifications.categories.subscription },
    { key: "credits", label: t.notifications.categories.credits },
    { key: "workbook", label: t.notifications.categories.workbook }
  ];

  const unreadInCategory = selectedCategory
    ? stats.unreadByCategory[selectedCategory] || 0
    : stats.unreadCount;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">
          {t.notifications.title}
        </h1>
        {stats.unreadCount > 0 && (
          <p className="text-sm text-ink/60">
            {stats.unreadCount} {stats.unreadCount === 1 ? "нове сповіщення" : "нових сповіщень"}
          </p>
        )}
      </div>

      {/* Category tabs */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.key;
            const count = cat.key ? stats.unreadByCategory[cat.key] || 0 : stats.unreadCount;

            return (
              <button
                key={cat.key || "all"}
                onClick={() => handleCategoryChange(cat.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? "bg-ink text-paper"
                    : "border border-ink/20 text-ink/70 hover:bg-ink/10"
                }`}
              >
                {cat.label}
                {count > 0 && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive ? "bg-paper/20 text-paper" : "bg-terracotta/20 text-terracotta"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status filter & actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange("all")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedStatus === "all"
                ? "bg-ink/10 text-ink"
                : "text-ink/60 hover:bg-ink/5"
            }`}
          >
            {t.notifications.status.all}
          </button>
          <button
            onClick={() => handleStatusChange("unread")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedStatus === "unread"
                ? "bg-ink/10 text-ink"
                : "text-ink/60 hover:bg-ink/5"
            }`}
          >
            {t.notifications.status.unread}
            {unreadInCategory > 0 && (
              <span className="ml-2 rounded-full bg-terracotta/20 px-2 py-0.5 text-xs font-semibold text-terracotta">
                {unreadInCategory}
              </span>
            )}
          </button>
        </div>

        {unreadInCategory > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/10 transition"
          >
            {t.notifications.actions.markAllRead}
          </button>
        )}
      </div>

      {/* Notifications list */}
      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-ink/40">{t.common.loading}</div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 text-6xl opacity-20">🔔</div>
          <h3 className="text-lg font-semibold text-ink mb-1">
            {t.notifications.empty.title}
          </h3>
          <p className="text-sm text-ink/60">{t.notifications.empty.message}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => fetchNotifications(false)}
            disabled={loading}
            className="rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink/70 hover:bg-ink/10 transition disabled:opacity-50"
          >
            {loading ? t.common.loading : t.notifications.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
