"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import {
  Bell,
  User,
  UserPlus,
  UserMinus,
  UserCheck,
  SignOut,
  ClipboardText,
  Copy,
  Archive,
  PaperPlaneTilt,
  CheckCircle,
  Ticket,
  ArrowClockwise,
  ArrowsClockwise,
  Warning,
  XCircle,
  BookOpen,
  Trash,
  Check,
  Envelope
} from "@phosphor-icons/react";
import type { NotificationStatus } from "@/lib/notifications";

type Notification = {
  _id: string;
  category: string;
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
  status: NotificationStatus;
  readAt?: string;
  createdAt: string;
};

type Props = {
  notification: Notification;
  onMarkRead: (id: string, status: NotificationStatus) => void;
  onDelete: (id: string) => void;
};

const iconMap: Record<string, any> = {
  bell: Bell,
  user: User,
  "user-plus": UserPlus,
  "user-minus": UserMinus,
  "user-check": UserCheck,
  "sign-out": SignOut,
  "clipboard-text": ClipboardText,
  copy: Copy,
  archive: Archive,
  "paper-plane-tilt": PaperPlaneTilt,
  "check-circle": CheckCircle,
  ticket: Ticket,
  "arrow-clockwise": ArrowClockwise,
  "arrows-clockwise": ArrowsClockwise,
  warning: Warning,
  "x-circle": XCircle,
  "book-open": BookOpen
};

function getRelativeTime(dateString: string, locale: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (locale === "uk") {
    if (diffMins < 1) return "щойно";
    if (diffMins < 60) return `${diffMins} хв тому`;
    if (diffHours < 24) return `${diffHours} год тому`;
    if (diffDays === 1) return "вчора";
    if (diffDays < 7) return `${diffDays} днів тому`;
    return date.toLocaleDateString("uk-UA");
  } else {
    if (diffMins < 1) return "teraz";
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays === 1) return "wczoraj";
    if (diffDays < 7) return `${diffDays} dni temu`;
    return date.toLocaleDateString("pl-PL");
  }
}

export default function NotificationItem({ notification, onMarkRead, onDelete }: Props) {
  const { t, locale } = useLocale();

  const IconComponent = iconMap[notification.icon] || Bell;
  const isUnread = notification.status === "unread";
  const isUrgent = notification.priority === "urgent";

  const handleToggleRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMarkRead(notification._id, isUnread ? "read" : "unread");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(notification._id);
  };

  return (
    <div
      className={`group relative rounded-xl border transition-all ${
        isUnread
          ? "border-l-4 border-l-moss border-t border-r border-b border-ink/10 bg-moss/5"
          : "border-ink/10 bg-paper hover:bg-ink/5"
      } ${isUrgent ? "border-l-terracotta" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex-shrink-0 rounded-full p-2 ${
              isUrgent
                ? "bg-terracotta/10 text-terracotta"
                : isUnread
                ? "bg-moss/10 text-moss"
                : "bg-ink/10 text-ink/60"
            }`}
          >
            <IconComponent size={20} weight="bold" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className={`text-sm ${
                  isUnread ? "font-semibold text-ink" : "font-medium text-ink/80"
                }`}
              >
                {notification.title}
              </h3>

              <span className="flex-shrink-0 text-xs text-ink/40">
                {getRelativeTime(notification.createdAt, locale)}
              </span>
            </div>

            <p className="text-sm text-ink/70 mb-3">{notification.message}</p>

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {notification.actions.map((action, idx) => {
                  const variantClasses =
                    action.variant === "primary"
                      ? "bg-moss text-paper hover:bg-moss/90"
                      : action.variant === "danger"
                      ? "bg-terracotta text-paper hover:bg-terracotta/90"
                      : "border border-ink/20 text-ink/70 hover:bg-ink/10";

                  return (
                    <Link
                      key={idx}
                      href={action.href as any}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${variantClasses}`}
                    >
                      {action.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Quick actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleToggleRead}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs font-medium text-ink/70 hover:bg-ink/10 transition"
                title={
                  isUnread
                    ? t.notifications.actions.markRead
                    : t.notifications.actions.markUnread
                }
              >
                {isUnread ? (
                  <>
                    <Check size={14} weight="bold" className="inline mr-1" />
                    {t.notifications.actions.markRead}
                  </>
                ) : (
                  <>
                    <Envelope size={14} weight="bold" className="inline mr-1" />
                    {t.notifications.actions.markUnread}
                  </>
                )}
              </button>

              <button
                onClick={handleDelete}
                className="rounded-full border border-ink/20 px-3 py-1 text-xs font-medium text-ink/70 hover:bg-terracotta/10 hover:text-terracotta hover:border-terracotta/30 transition"
                title={t.notifications.actions.delete}
              >
                <Trash size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
