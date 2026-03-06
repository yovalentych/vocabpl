"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChatCircle,
  PaperPlaneRight,
  Plus,
  X,
  ArrowLeft,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { csrfFetch } from "@/lib/csrf-client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  name: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  otherParticipant: Participant;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  role: "teacher" | "student";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "щойно";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} хв`;
  if (diff < 86_400_000) return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  userId: string;
  username: string;
}

export default function MessagesPage({ userId }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations || []);
    setContacts(data.contacts || []);
    setLoading(false);
  }, []);

  const loadThread = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c))
      );
    },
    []
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeId) {
      loadThread(activeId);
      pollRef.current = setInterval(() => loadThread(activeId), 3000);
    } else {
      pollRef.current = setInterval(loadConversations, 15000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeId, loadThread, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openConversation(id: string) {
    setActiveId(id);
    setMessages([]);
    setMobileView("thread");
  }

  async function startConversation(contactId: string) {
    const res = await csrfFetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: contactId }),
    });
    if (!res.ok) return;
    const { conversationId } = await res.json();
    await loadConversations();
    openConversation(conversationId);
    setShowNew(false);
    setContactSearch("");
  }

  async function sendMessage() {
    if (!text.trim() || !activeId || sending) return;
    setSending(true);
    const optimistic: Message = {
      _id: `tmp-${Date.now()}`,
      conversationId: activeId,
      senderId: userId,
      senderName: "",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    const sentText = text.trim();
    setText("");

    const res = await csrfFetch(`/api/conversations/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sentText }),
    });
    if (res.ok) {
      const { message } = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m._id === optimistic._id ? message : m))
      );
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeId
            ? { ...c, lastMessageText: sentText, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    }
    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const activeConv = conversations.find((c) => c._id === activeId);
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Group messages by date
  function dayKey(iso: string) {
    return new Date(iso).toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
    });
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-5xl flex-col px-4 py-4 sm:px-6">
      <div className="flex flex-1 overflow-hidden rounded-[24px] border border-ink/10 bg-paper shadow-soft">
        {/* ── Left: conversation list ── */}
        <div
          className={`flex w-full flex-col border-r border-ink/10 sm:w-72 ${
            mobileView === "thread" ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">Повідомлення</h1>
              {totalUnread > 0 && (
                <span className="rounded-full bg-terracotta px-1.5 py-0.5 text-[10px] font-bold text-paper">
                  {totalUnread}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowNew((v) => !v)}
              className="rounded-xl border border-ink/10 p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink"
              title="Нова розмова"
            >
              {showNew ? <X size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
            </button>
          </div>

          {/* New conversation panel */}
          {showNew && (
            <div className="border-b border-ink/10 p-3">
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-ink/15 px-3 py-1.5">
                <MagnifyingGlass size={14} className="shrink-0 text-ink/40" />
                <input
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Знайти контакт..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40"
                  autoFocus
                />
              </div>
              {filteredContacts.length === 0 ? (
                <p className="px-1 py-2 text-xs text-ink/40">
                  {contacts.length === 0
                    ? "Немає доступних контактів"
                    : "Нічого не знайдено"}
                </p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredContacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => startConversation(c.id)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-ink/5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/10 text-xs font-bold text-ink/60">
                        {initials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-ink/40">
                          {c.role === "teacher" ? "Викладач" : "Студент"}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-moss border-t-transparent" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <ChatCircle size={40} weight="thin" className="mb-3 text-ink/20" />
                <p className="text-sm text-ink/40">Ще немає розмов</p>
                <p className="mt-1 text-xs text-ink/30">
                  Натисніть + щоб написати першим
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => openConversation(conv._id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink/[0.03] ${
                    activeId === conv._id ? "bg-moss/5" : ""
                  }`}
                >
                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-paper ${
                      activeId === conv._id ? "bg-moss" : "bg-ink/40"
                    }`}
                  >
                    {initials(conv.otherParticipant?.name || "?")}
                    {conv.unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta text-[9px] font-bold text-paper">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`truncate text-sm font-medium ${
                          conv.unreadCount > 0 ? "text-ink" : "text-ink/80"
                        }`}
                      >
                        {conv.otherParticipant?.name || "—"}
                      </span>
                      {conv.lastMessageAt && (
                        <span className="shrink-0 text-[10px] text-ink/30">
                          {timeLabel(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p
                      className={`truncate text-xs ${
                        conv.unreadCount > 0 ? "font-semibold text-ink/70" : "text-ink/40"
                      }`}
                    >
                      {conv.lastMessageText || "Розмова розпочата"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: message thread ── */}
        <div
          className={`flex flex-1 flex-col ${
            mobileView === "list" ? "hidden sm:flex" : "flex"
          }`}
        >
          {activeConv ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
                <button
                  className="sm:hidden rounded-xl border border-ink/10 p-1.5 text-ink/60 hover:bg-ink/5"
                  onClick={() => setMobileView("list")}
                >
                  <ArrowLeft size={16} weight="bold" />
                </button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss text-sm font-bold text-paper">
                  {initials(activeConv.otherParticipant?.name || "?")}
                </div>
                <span className="font-semibold">
                  {activeConv.otherParticipant?.name || "—"}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-ink/30">Напишіть перше повідомлення</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {messages.map((msg, i) => {
                      const isMe = msg.senderId === userId;
                      const prevMsg = messages[i - 1];
                      const showDay =
                        !prevMsg || dayKey(msg.createdAt) !== dayKey(prevMsg.createdAt);
                      const prevSame = prevMsg && prevMsg.senderId === msg.senderId;

                      return (
                        <div key={msg._id}>
                          {showDay && (
                            <div className="my-4 flex items-center gap-3">
                              <div className="flex-1 border-t border-ink/10" />
                              <span className="text-xs text-ink/30">
                                {dayKey(msg.createdAt)}
                              </span>
                              <div className="flex-1 border-t border-ink/10" />
                            </div>
                          )}
                          <div
                            className={`flex ${isMe ? "justify-end" : "justify-start"} ${
                              prevSame ? "mt-0.5" : "mt-3"
                            }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-[18px] px-4 py-2.5 text-sm leading-relaxed ${
                                isMe
                                  ? "rounded-br-sm bg-moss text-paper"
                                  : "rounded-bl-sm bg-ink/[0.06] text-ink"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                              <p
                                className={`mt-1 text-right text-[10px] ${
                                  isMe ? "text-paper/50" : "text-ink/30"
                                }`}
                              >
                                {timeLabel(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-ink/10 p-3">
                <div className="flex items-end gap-2 rounded-[18px] border border-ink/15 bg-ink/[0.02] px-4 py-2 focus-within:border-moss/40 focus-within:bg-paper focus-within:ring-2 focus-within:ring-moss/10">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Повідомлення... (Enter — надіслати, Shift+Enter — новий рядок)"
                    className="max-h-32 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-ink/30"
                    style={{ overflowY: "auto" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !text.trim()}
                    className="mb-0.5 shrink-0 rounded-xl bg-moss p-2 text-paper transition-colors hover:bg-moss/90 disabled:opacity-40"
                  >
                    <PaperPlaneRight size={16} weight="fill" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <ChatCircle size={56} weight="thin" className="text-ink/15" />
              <div>
                <p className="font-medium text-ink/40">Оберіть розмову</p>
                <p className="mt-1 text-sm text-ink/25">
                  або натисніть + щоб написати комусь
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
