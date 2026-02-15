"use client";

import { useState, useEffect } from "react";
import { Video, FolderOpen, YoutubeLogo, Plus, Pencil, Trash } from "@phosphor-icons/react";

type Tab = "videos" | "categories" | "channels";

interface Category {
  _id: string;
  name: string;
  nameUk: string;
  description: string;
  descriptionUk: string;
  icon: string;
  order: number;
  active: boolean;
}

interface VideoItem {
  _id: string;
  title: string;
  titleUk: string;
  description: string;
  descriptionUk: string;
  videoUrl: string;
  provider: string;
  thumbnail: string;
  duration: number;
  level: string;
  categoryId: string;
  tags: string[];
  transcript: string;
  transcriptUk: string;
  transcriptSource?: string;
  vocabulary: Array<{ word: string; translation: string; timestamp: number }>;
  flashcards?: Array<{ front: string; back: string; hint?: string }>;
  mythFacts?: Array<{ statement: string; isTrue: boolean; explanation?: string }>;
  openQuestions?: Array<{ question: string; sampleAnswer?: string; keywords?: string[] }>;
  order: number;
  active: boolean;
  views: number;
}

interface Channel {
  _id: string;
  name: string;
  nameUk: string;
  description: string;
  descriptionUk: string;
  channelUrl: string;
  thumbnail: string;
  order: number;
  recommended: boolean;
}

export default function AdminVideoPanel() {
  const [tab, setTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === "categories") {
        const res = await fetch("/api/admin/video/categories");
        const data = await res.json();
        setCategories(data.categories || []);
      } else if (tab === "videos") {
        const res = await fetch("/api/admin/video/videos");
        const data = await res.json();
        setVideos(data.videos || []);
      } else if (tab === "channels") {
        const res = await fetch("/api/admin/video/channels");
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleDelete = async (id: string) => {
    if (!confirm("Ви впевнені що хочете видалити?")) return;

    const endpoint =
      tab === "categories"
        ? "/api/admin/video/categories"
        : tab === "videos"
        ? "/api/admin/video/videos"
        : "/api/admin/video/channels";

    await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    loadData();
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async (data: any) => {
    const endpoint =
      tab === "categories"
        ? "/api/admin/video/categories"
        : tab === "videos"
        ? "/api/admin/video/videos"
        : "/api/admin/video/channels";

    const method = editingId ? "PUT" : "POST";
    await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...data } : data)
    });

    handleCloseForm();
    loadData();
  };

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video size={24} weight="bold" className="text-terracotta" />
          <h2 className="text-xl font-semibold">Відео менеджмент</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-paper transition hover:bg-terracotta/90"
        >
          <Plus size={16} weight="bold" />
          Додати {tab === "categories" ? "категорію" : tab === "videos" ? "відео" : "канал"}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("categories")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "categories"
              ? "bg-ink text-paper"
              : "border border-ink/20 text-ink/70 hover:bg-ink/5"
          }`}
        >
          <FolderOpen size={16} weight="bold" />
          Категорії
        </button>
        <button
          onClick={() => setTab("videos")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "videos"
              ? "bg-ink text-paper"
              : "border border-ink/20 text-ink/70 hover:bg-ink/5"
          }`}
        >
          <Video size={16} weight="bold" />
          Відео
        </button>
        <button
          onClick={() => setTab("channels")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "channels"
              ? "bg-ink text-paper"
              : "border border-ink/20 text-ink/70 hover:bg-ink/5"
          }`}
        >
          <YoutubeLogo size={16} weight="bold" />
          Канали
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-terracotta border-t-transparent" />
          <p className="text-sm text-ink/60">Завантаження...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tab === "categories" &&
            categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/60 p-4"
              >
                <div>
                  <p className="font-semibold">
                    {cat.name} / {cat.nameUk}
                  </p>
                  <p className="text-xs text-ink/60">
                    Order: {cat.order} | {cat.active ? "Активна" : "Неактивна"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(cat._id)}
                    className="rounded-full border border-ink/20 p-2 text-ink/60 transition hover:bg-ink/5"
                  >
                    <Pencil size={16} weight="bold" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    className="rounded-full border border-terracotta/30 p-2 text-terracotta transition hover:bg-terracotta/10"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                </div>
              </div>
            ))}

          {tab === "videos" &&
            videos.map((video) => (
              <div
                key={video._id}
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/60 p-4"
              >
                <div>
                  <p className="font-semibold">
                    {video.title} / {video.titleUk}
                  </p>
                  <p className="text-xs text-ink/60">
                    {video.level} | {Math.floor(video.duration / 60)}хв | {video.views} переглядів |{" "}
                    {video.active ? "Активне" : "Неактивне"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(video._id)}
                    className="rounded-full border border-ink/20 p-2 text-ink/60 transition hover:bg-ink/5"
                  >
                    <Pencil size={16} weight="bold" />
                  </button>
                  <button
                    onClick={() => handleDelete(video._id)}
                    className="rounded-full border border-terracotta/30 p-2 text-terracotta transition hover:bg-terracotta/10"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                </div>
              </div>
            ))}

          {tab === "channels" &&
            channels.map((channel) => (
              <div
                key={channel._id}
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/60 p-4"
              >
                <div>
                  <p className="font-semibold">
                    {channel.name} / {channel.nameUk}
                  </p>
                  <p className="text-xs text-ink/60">
                    {channel.channelUrl} | {channel.recommended ? "Рекомендований" : "Не рекомендований"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(channel._id)}
                    className="rounded-full border border-ink/20 p-2 text-ink/60 transition hover:bg-ink/5"
                  >
                    <Pencil size={16} weight="bold" />
                  </button>
                  <button
                    onClick={() => handleDelete(channel._id)}
                    className="rounded-full border border-terracotta/30 p-2 text-terracotta transition hover:bg-terracotta/10"
                  >
                    <Trash size={16} weight="bold" />
                  </button>
                </div>
              </div>
            ))}

          {((tab === "categories" && categories.length === 0) ||
            (tab === "videos" && videos.length === 0) ||
            (tab === "channels" && channels.length === 0)) && (
            <div className="py-12 text-center">
              <p className="text-sm text-ink/60">
                Немає {tab === "categories" ? "категорій" : tab === "videos" ? "відео" : "каналів"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <FormModal
          tab={tab}
          editingId={editingId}
          categories={categories}
          videos={videos}
          channels={channels}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

interface FormModalProps {
  tab: Tab;
  editingId: string | null;
  categories: Category[];
  videos: VideoItem[];
  channels: Channel[];
  onSave: (data: any) => void;
  onClose: () => void;
}

function FormModal({ tab, editingId, categories, videos, channels, onSave, onClose }: FormModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [transcriptStatus, setTranscriptStatus] = useState<string | null>(null);

  useEffect(() => {
    if (editingId) {
      if (tab === "categories") {
        const cat = categories.find((c) => c._id === editingId);
        if (cat) setFormData(cat);
      } else if (tab === "videos") {
        const video = videos.find((v) => v._id === editingId);
        if (video) setFormData(video);
      } else if (tab === "channels") {
        const channel = channels.find((ch) => ch._id === editingId);
        if (channel) setFormData(channel);
      }
    }
  }, [editingId, tab, categories, videos, channels]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (typeof payload.vocabulary === "string") {
      try {
        payload.vocabulary = JSON.parse(payload.vocabulary || "[]");
      } catch {
        payload.vocabulary = [];
      }
    }
    if (typeof payload.flashcards === "string") {
      try {
        payload.flashcards = JSON.parse(payload.flashcards || "[]");
      } catch {
        payload.flashcards = [];
      }
    }
    if (typeof payload.mythFacts === "string") {
      try {
        payload.mythFacts = JSON.parse(payload.mythFacts || "[]");
      } catch {
        payload.mythFacts = [];
      }
    }
    if (typeof payload.openQuestions === "string") {
      try {
        payload.openQuestions = JSON.parse(payload.openQuestions || "[]");
      } catch {
        payload.openQuestions = [];
      }
    }
    onSave(payload);
  };

  const handleFetchTranscript = async (lang: "pl" | "uk") => {
    setTranscriptStatus("Завантаження...");
    try {
      const res = await fetch("/api/admin/video/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: formData.videoUrl, lang })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTranscriptStatus(data?.error || "Не вдалося отримати транскрипт");
        return;
      }
      if (lang === "uk") {
        setFormData({ ...formData, transcriptUk: data.transcript, transcriptSource: "youtube" });
      } else {
        setFormData({ ...formData, transcript: data.transcript, transcriptSource: "youtube" });
      }
      setTranscriptStatus("Готово");
    } catch (error) {
      setTranscriptStatus("Помилка з'єднання");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-ink/10 bg-paper p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-semibold">
          {editingId ? "Редагувати" : "Додати"}{" "}
          {tab === "categories" ? "категорію" : tab === "videos" ? "відео" : "канал"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "categories" && (
            <>
              <input
                type="text"
                placeholder="Назва (EN)"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Назва (UK)"
                value={formData.nameUk || ""}
                onChange={(e) => setFormData({ ...formData, nameUk: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                required
              />
              <textarea
                placeholder="Опис (EN)"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={3}
              />
              <textarea
                placeholder="Опис (UK)"
                value={formData.descriptionUk || ""}
                onChange={(e) => setFormData({ ...formData, descriptionUk: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={3}
              />
              <input
                type="text"
                placeholder="Іконка (назва з Phosphor Icons)"
                value={formData.icon || ""}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Порядок"
                value={formData.order || 0}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active !== false}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <span className="text-sm">Активна</span>
              </label>
            </>
          )}

          {tab === "videos" && (
            <>
              <input
                type="text"
                placeholder="Назва (EN)"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Назва (UK)"
                value={formData.titleUk || ""}
                onChange={(e) => setFormData({ ...formData, titleUk: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                required
              />
              <textarea
                placeholder="Опис (EN)"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={2}
              />
              <textarea
                placeholder="Опис (UK)"
                value={formData.descriptionUk || ""}
                onChange={(e) => setFormData({ ...formData, descriptionUk: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={2}
              />
              <input
                type="url"
                placeholder="URL відео (YouTube, Vimeo, тощо)"
                value={formData.videoUrl || ""}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                required
              />
              <select
                value={formData.provider || "youtube"}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="custom">Custom</option>
              </select>
              <input
                type="url"
                placeholder="URL мініатюри"
                value={formData.thumbnail || ""}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Тривалість (секунди)"
                value={formData.duration || 0}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              />
              <select
                value={formData.level || "A1"}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
              <select
                value={formData.categoryId || ""}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                required
              >
                <option value="">Виберіть категорію</option>
                {categories.map((cat) => (
                  <option key={cat._id.toString()} value={cat._id.toString()}>
                    {cat.nameUk}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Теги (через кому)"
                value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(",").map((t) => t.trim())
                  })
                }
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              />
              <div className="rounded-2xl border border-ink/10 bg-paper/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-ink/40">Транскрипт</p>
                <p className="mt-1 text-xs text-ink/50">
                  Можна вручну вставити або спробувати отримати з YouTube (якщо доступно).
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleFetchTranscript("pl")}
                    className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink/60 transition hover:bg-ink/5"
                  >
                    Авто транскрипт PL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFetchTranscript("uk")}
                    className="rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink/60 transition hover:bg-ink/5"
                  >
                    Авто транскрипт UK
                  </button>
                  {transcriptStatus && (
                    <span className="text-xs text-ink/50">{transcriptStatus}</span>
                  )}
                </div>
              </div>
              <textarea
                placeholder="Транскрипт (EN)"
                value={formData.transcript || ""}
                onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={4}
              />
              <textarea
                placeholder="Транскрипт (UK)"
                value={formData.transcriptUk || ""}
                onChange={(e) => setFormData({ ...formData, transcriptUk: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={4}
              />
              <textarea
                placeholder="Слова (JSON): [{\"word\":\"...\",\"translation\":\"...\",\"timestamp\":0}]"
                value={
                  typeof formData.vocabulary === "string"
                    ? formData.vocabulary
                    : JSON.stringify(formData.vocabulary || [], null, 2)
                }
                onChange={(e) => setFormData({ ...formData, vocabulary: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={4}
              />
              <textarea
                placeholder="Flashcards (JSON): [{\"front\":\"\",\"back\":\"\",\"hint\":\"\"}]"
                value={
                  typeof formData.flashcards === "string"
                    ? formData.flashcards
                    : JSON.stringify(formData.flashcards || [], null, 2)
                }
                onChange={(e) => setFormData({ ...formData, flashcards: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={4}
              />
              <textarea
                placeholder="Prawda czy Mit (JSON): [{\"statement\":\"\",\"isTrue\":true,\"explanation\":\"\"}]"
                value={
                  typeof formData.mythFacts === "string"
                    ? formData.mythFacts
                    : JSON.stringify(formData.mythFacts || [], null, 2)
                }
                onChange={(e) => setFormData({ ...formData, mythFacts: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={4}
              />
              <textarea
                placeholder="Відкриті питання (JSON): [{\"question\":\"\",\"sampleAnswer\":\"\",\"keywords\":[\"...\"]}]"
                value={
                  typeof formData.openQuestions === "string"
                    ? formData.openQuestions
                    : JSON.stringify(formData.openQuestions || [], null, 2)
                }
                onChange={(e) => setFormData({ ...formData, openQuestions: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={4}
              />
              <input
                type="number"
                placeholder="Порядок"
                value={formData.order || 0}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active !== false}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <span className="text-sm">Активне</span>
              </label>
            </>
          )}

          {tab === "channels" && (
            <>
              <input
                type="text"
                placeholder="Назва каналу (EN)"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                required
              />
              <input
                type="text"
                placeholder="Назва каналу (UK)"
                value={formData.nameUk || ""}
                onChange={(e) => setFormData({ ...formData, nameUk: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                required
              />
              <textarea
                placeholder="Опис (EN)"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={3}
              />
              <textarea
                placeholder="Опис (UK)"
                value={formData.descriptionUk || ""}
                onChange={(e) => setFormData({ ...formData, descriptionUk: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                rows={3}
              />
              <input
                type="url"
                placeholder="URL каналу"
                value={formData.channelUrl || ""}
                onChange={(e) => setFormData({ ...formData, channelUrl: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
                required
              />
              <input
                type="url"
                placeholder="URL мініатюри"
                value={formData.thumbnail || ""}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Порядок"
                value={formData.order || 0}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full rounded-2xl border border-ink/20 bg-paper px-4 py-2 text-sm"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.recommended !== false}
                  onChange={(e) => setFormData({ ...formData, recommended: e.target.checked })}
                />
                <span className="text-sm">Рекомендований</span>
              </label>
            </>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90"
            >
              Зберегти
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink/5"
            >
              Скасувати
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
