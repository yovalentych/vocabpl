"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PencilSimple,
  ArrowsClockwise,
  Archive,
  TrashSimple,
  Eye,
  EyeSlash,
  Warning,
  Check,
  X
} from "@phosphor-icons/react";
import Loader from "@/components/ui/Loader";

type ClassSettingsProps = {
  classId: string;
  classData: {
    name: string;
    description?: string;
    settings: {
      isPublic: boolean;
      inviteCode: string;
    };
    stats: {
      totalAssignments: number;
      completedAssignments: number;
    };
  };
  locale: "uk" | "pl";
  onUpdate: () => void;
};

export default function ClassSettings({ classId, classData, locale, onUpdate }: ClassSettingsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(classData.name);
  const [description, setDescription] = useState(classData.description || "");
  const [isPublic, setIsPublic] = useState(classData.settings.isPublic);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inviteCode, setInviteCode] = useState(classData.settings.inviteCode);

  const t = locale === "uk" ? {
    title: "Налаштування класу",
    basicInfo: "Основна інформація",
    className: "Назва класу",
    classDescription: "Опис класу",
    descriptionPlaceholder: "Додайте опис для вашого класу...",
    visibility: "Видимість",
    publicClass: "Публічний клас",
    publicDesc: "Клас відображається у публічному каталозі",
    privateClass: "Приватний клас",
    privateDesc: "Тільки за запрошенням",
    inviteCode: "Код запрошення",
    regenerateCode: "Згенерувати новий код",
    regenerateConfirm: "Згенерувати новий код запрошення? Старий код перестане працювати.",
    regenerateSuccess: "Код успішно оновлено!",
    dangerZone: "Небезпечна зона",
    archiveClass: "Архівувати клас",
    archiveDesc: "Клас буде прихований, але дані збережуться",
    archiveConfirm: "Ви впевнені, що хочете архівувати цей клас? Ви зможете відновити його пізніше.",
    archiveSuccess: "Клас успішно архівовано",
    deleteClass: "Видалити клас",
    deleteDesc: "Назавжди видалити клас та всі дані",
    deleteConfirm: "УВАГА: Це видалить клас, всі завдання та результати студентів. Цю дію неможливо скасувати. Введіть назву класу для підтвердження:",
    deleteBlocked: "Неможливо видалити клас з оціненими роботами. Спочатку архівуйте клас.",
    deleteSuccess: "Клас успішно видалено",
    edit: "Редагувати",
    save: "Зберегти",
    cancel: "Скасувати",
    saving: "Збереження...",
    maxLength: "Максимум 100 символів",
    nameRequired: "Назва обов'язкова"
  } : {
    title: "Ustawienia klasy",
    basicInfo: "Podstawowe informacje",
    className: "Nazwa klasy",
    classDescription: "Opis klasy",
    descriptionPlaceholder: "Dodaj opis dla swojej klasy...",
    visibility: "Widoczność",
    publicClass: "Klasa publiczna",
    publicDesc: "Klasa wyświetlana w publicznym katalogu",
    privateClass: "Klasa prywatna",
    privateDesc: "Tylko na zaproszenie",
    inviteCode: "Kod zaproszenia",
    regenerateCode: "Wygeneruj nowy kod",
    regenerateConfirm: "Wygenerować nowy kod zaproszenia? Stary kod przestanie działać.",
    regenerateSuccess: "Kod pomyślnie zaktualizowany!",
    dangerZone: "Strefa niebezpieczna",
    archiveClass: "Archiwizuj klasę",
    archiveDesc: "Klasa będzie ukryta, ale dane zostaną zachowane",
    archiveConfirm: "Czy na pewno chcesz zarchiwizować tę klasę? Będziesz mógł ją później przywrócić.",
    archiveSuccess: "Klasa pomyślnie zarchiwizowana",
    deleteClass: "Usuń klasę",
    deleteDesc: "Trwale usuń klasę i wszystkie dane",
    deleteConfirm: "UWAGA: To usunie klasę, wszystkie zadania i wyniki uczniów. Tej akcji nie można cofnąć. Wprowadź nazwę klasy do potwierdzenia:",
    deleteBlocked: "Nie można usunąć klasy z ocenionymi pracami. Najpierw zarchiwizuj klasę.",
    deleteSuccess: "Klasa pomyślnie usunięta",
    edit: "Edytuj",
    save: "Zapisz",
    cancel: "Anuluj",
    saving: "Zapisywanie...",
    maxLength: "Maksymalnie 100 znaków",
    nameRequired: "Nazwa jest wymagana"
  };

  async function handleSave() {
    if (!name.trim()) {
      alert(t.nameRequired);
      return;
    }

    if (name.length > 100) {
      alert(t.maxLength);
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/classes/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          settings: {
            ...classData.settings,
            isPublic
          }
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }

      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating class:", error);
      alert(error instanceof Error ? error.message : "Failed to update class");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerateCode() {
    if (!confirm(t.regenerateConfirm)) return;

    try {
      setRegenerating(true);
      const res = await fetch(`/api/classes/${classId}/regenerate-code`, {
        method: "POST"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to regenerate");
      }

      const data = await res.json();
      setInviteCode(data.inviteCode);
      alert(t.regenerateSuccess);
      onUpdate();
    } catch (error) {
      console.error("Error regenerating code:", error);
      alert(error instanceof Error ? error.message : "Failed to regenerate code");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleArchive() {
    if (!confirm(t.archiveConfirm)) return;

    try {
      setArchiving(true);
      const res = await fetch(`/api/classes/${classId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to archive");
      }

      alert(t.archiveSuccess);
      router.push("/classes");
    } catch (error) {
      console.error("Error archiving class:", error);
      alert(error instanceof Error ? error.message : "Failed to archive class");
    } finally {
      setArchiving(false);
    }
  }

  async function handleDelete() {
    // Check if there are graded submissions
    if (classData.stats.completedAssignments > 0) {
      alert(t.deleteBlocked);
      return;
    }

    const userInput = prompt(t.deleteConfirm);
    if (userInput !== classData.name) {
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(`/api/classes/${classId}/hard-delete`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      alert(t.deleteSuccess);
      router.push("/classes");
    } catch (error) {
      console.error("Error deleting class:", error);
      alert(error instanceof Error ? error.message : "Failed to delete class");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-2xl border border-ink/10 bg-paper p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-ink text-lg">{t.basicInfo}</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors"
            >
              <PencilSimple size={16} weight="bold" />
              {t.edit}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setName(classData.name);
                  setDescription(classData.description || "");
                  setIsPublic(classData.settings.isPublic);
                }}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-2 text-sm font-semibold text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors disabled:opacity-50"
              >
                <X size={16} weight="bold" />
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader size="sm" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Check size={16} weight="bold" />
                    {t.save}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              {t.className}
            </label>
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
              />
            ) : (
              <p className="text-ink">{classData.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              {t.classDescription}
            </label>
            {editing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={t.descriptionPlaceholder}
                className="w-full rounded-xl border border-ink/20 bg-paper px-4 py-3 text-ink focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/20 resize-none"
              />
            ) : (
              <p className="text-ink/70">
                {classData.description || <span className="italic text-ink/40">{t.descriptionPlaceholder}</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className="rounded-2xl border border-ink/10 bg-paper p-6">
        <h3 className="font-bold text-ink text-lg mb-4">{t.visibility}</h3>

        <div className="space-y-3">
          <label className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
            isPublic
              ? "border-moss bg-moss/5"
              : "border-ink/10 hover:border-ink/20"
          }`}>
            <input
              type="radio"
              checked={isPublic}
              onChange={() => editing && setIsPublic(true)}
              disabled={!editing}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <Eye size={18} weight="fill" />
                {t.publicClass}
              </div>
              <p className="text-sm text-ink/60 mt-1">{t.publicDesc}</p>
            </div>
          </label>

          <label className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
            !isPublic
              ? "border-moss bg-moss/5"
              : "border-ink/10 hover:border-ink/20"
          }`}>
            <input
              type="radio"
              checked={!isPublic}
              onChange={() => editing && setIsPublic(false)}
              disabled={!editing}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <EyeSlash size={18} weight="fill" />
                {t.privateClass}
              </div>
              <p className="text-sm text-ink/60 mt-1">{t.privateDesc}</p>
            </div>
          </label>
        </div>
      </div>

      {/* Invite Code */}
      <div className="rounded-2xl border border-ink/10 bg-paper p-6">
        <h3 className="font-bold text-ink text-lg mb-4">{t.inviteCode}</h3>

        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-xl border border-moss/20 bg-moss/5 px-4 py-3 text-xl font-mono font-bold text-moss">
            {inviteCode}
          </code>
          <button
            onClick={handleRegenerateCode}
            disabled={regenerating}
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-paper px-4 py-3 text-sm font-semibold text-ink hover:bg-ink/5 transition-colors disabled:opacity-50"
          >
            {regenerating ? (
              <Loader size="sm" />
            ) : (
              <ArrowsClockwise size={18} weight="bold" />
            )}
            {t.regenerateCode}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border-2 border-terracotta/30 bg-terracotta/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Warning size={22} weight="fill" className="text-terracotta" />
          <h3 className="font-bold text-ink text-lg">{t.dangerZone}</h3>
        </div>

        <div className="space-y-3">
          {/* Archive */}
          <div className="flex items-center justify-between rounded-xl border border-ink/10 bg-paper p-4">
            <div>
              <div className="font-semibold text-ink">{t.archiveClass}</div>
              <p className="text-sm text-ink/60">{t.archiveDesc}</p>
            </div>
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors disabled:opacity-50"
            >
              {archiving ? (
                <Loader size="sm" />
              ) : (
                <Archive size={16} weight="fill" />
              )}
              {t.archiveClass}
            </button>
          </div>

          {/* Delete */}
          <div className="flex items-center justify-between rounded-xl border border-terracotta/20 bg-terracotta/5 p-4">
            <div>
              <div className="font-semibold text-ink">{t.deleteClass}</div>
              <p className="text-sm text-ink/60">{t.deleteDesc}</p>
              {classData.stats.completedAssignments > 0 && (
                <p className="text-xs text-terracotta font-semibold mt-1">
                  ⚠ {t.deleteBlocked}
                </p>
              )}
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting || classData.stats.completedAssignments > 0}
              className="inline-flex items-center gap-2 rounded-full border border-terracotta/30 bg-terracotta/10 px-4 py-2 text-sm font-semibold text-terracotta hover:bg-terracotta/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <Loader size="sm" />
              ) : (
                <TrashSimple size={16} weight="fill" />
              )}
              {t.deleteClass}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
