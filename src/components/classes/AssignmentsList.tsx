"use client";

import { useState, useEffect } from "react";
import { Clock, Users, CheckCircle, XCircle, Calendar, CheckSquare, Square } from "@phosphor-icons/react";
import BulkActionToolbar from "./BulkActionToolbar";
import SelectClassModal from "./SelectClassModal";
import UpdateDeadlineModal from "./UpdateDeadlineModal";

type Assignment = {
  _id: string;
  type: string;
  title: string;
  description?: string;
  exerciseType?: string;
  publishAt?: string;
  dueAt?: string;
  pointsTotal?: number;
  assignedAt: string;
  settings: {
    allowLateSubmission: boolean;
    showResultsImmediately: boolean;
  };
};

type AssignmentsListProps = {
  classId: string;
  isTeacher: boolean;
  locale: 'uk' | 'pl';
};

export default function AssignmentsList({ classId, isTeacher, locale }: AssignmentsListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSelectClassModal, setShowSelectClassModal] = useState(false);
  const [showUpdateDeadlineModal, setShowUpdateDeadlineModal] = useState(false);

  const t = locale === 'uk' ? {
    loading: "Завантаження...",
    noAssignments: "Завдань ще немає",
    noAssignmentsDesc: "Створіть перше завдання для класу",
    exercise: "Вправа",
    test: "Тест",
    reading: "Читання",
    custom: "Власне",
    dueDate: "Дедлайн",
    points: "балів",
    assignedOn: "Призначено",
    students: "студентів",
    completed: "виконали",
    pending: "в очікуванні",
    overdue: "прострочено",
    scheduled: "Заплановано",
    active: "Активне",
    past: "Завершено",
    sentences: "Речення",
    cloze: "Пропуски",
    match: "Співставлення",
    translate: "Переклад",
    paraphrase: "Перефразування",
    dialogue: "Діалог",
    describe: "Опис",
    story: "Історія",
    select: "Вибрати",
    cancel: "Скасувати",
    selected: "Вибрано",
    selectAll: "Вибрати всі",
    deselectAll: "Зняти вибір",
    bulkActions: "Масові дії",
    copyTo: "Копіювати в клас",
    archive: "Архівувати",
    delete: "Видалити",
    updateDeadline: "Змінити дедлайн"
  } : {
    loading: "Ładowanie...",
    noAssignments: "Nie ma jeszcze zadań",
    noAssignmentsDesc: "Utwórz pierwsze zadanie dla klasy",
    exercise: "Ćwiczenie",
    test: "Test",
    reading: "Czytanie",
    custom: "Własne",
    dueDate: "Termin",
    points: "punktów",
    assignedOn: "Przypisano",
    students: "uczniów",
    completed: "ukończyli",
    pending: "oczekujące",
    overdue: "zaległe",
    scheduled: "Zaplanowane",
    active: "Aktywne",
    past: "Zakończone",
    sentences: "Zdania",
    cloze: "Luki",
    match: "Dopasowanie",
    translate: "Tłumaczenie",
    paraphrase: "Parafraza",
    dialogue: "Dialog",
    describe: "Opis",
    story: "Historia",
    select: "Wybierz",
    cancel: "Anuluj",
    selected: "Wybrano",
    selectAll: "Wybierz wszystkie",
    deselectAll: "Odznacz wszystkie",
    bulkActions: "Akcje masowe",
    copyTo: "Kopiuj do klasy",
    archive: "Archiwizuj",
    delete: "Usuń",
    updateDeadline: "Zmień termin"
  };

  const exerciseTypeLabels: Record<string, string> = {
    sentences: t.sentences,
    cloze: t.cloze,
    match: t.match,
    translate: t.translate,
    paraphrase: t.paraphrase,
    dialogue: t.dialogue,
    describe: t.describe,
    story: t.story
  };

  function getAssignmentStatus(assignment: Assignment): 'scheduled' | 'active' | 'past' {
    const now = new Date();

    // Якщо publishAt в майбутньому - scheduled
    if (assignment.publishAt && new Date(assignment.publishAt) > now) {
      return 'scheduled';
    }

    // Якщо dueAt в минулому - past
    if (assignment.dueAt && new Date(assignment.dueAt) < now) {
      return 'past';
    }

    // Інакше - active
    return 'active';
  }

  useEffect(() => {
    loadAssignments();
  }, [classId]);

  async function loadAssignments() {
    try {
      setLoading(true);
      const res = await fetch(`/api/classes/${classId}/assignments`);
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelectMode() {
    setSelectMode(!selectMode);
    setSelectedIds(new Set());
  }

  function toggleSelectAssignment(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function selectAll() {
    setSelectedIds(new Set(assignments.map(a => a._id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function handleBulkCopy() {
    setShowSelectClassModal(true);
  }

  async function performBulkCopy(targetClassId: string) {
    try {
      const res = await fetch("/api/classes/assignments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "copy",
          assignmentIds: Array.from(selectedIds),
          classId: classId,
          targetClassId: targetClassId
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to copy");
      }

      const data = await res.json();
      alert(data.message || "Завдання скопійовано!");
      setShowSelectClassModal(false);
      toggleSelectMode();
    } catch (error) {
      console.error("Bulk copy failed:", error);
      alert("Помилка копіювання завдань");
    }
  }

  async function handleBulkArchive() {
    if (!confirm(`Архівувати ${selectedIds.size} завдань?`)) return;

    try {
      const res = await fetch("/api/classes/assignments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "archive",
          assignmentIds: Array.from(selectedIds),
          classId: classId
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to archive");
      }

      const data = await res.json();
      alert(data.message || "Завдання архівовано!");
      loadAssignments();
      toggleSelectMode();
    } catch (error) {
      console.error("Bulk archive failed:", error);
      alert("Помилка архівації завдань");
    }
  }

  async function handleBulkDelete() {
    const count = selectedIds.size;
    const confirmation = prompt(`УВАГА: Це видалить ${count} завдань та всі submissions. Введіть "${count}" для підтвердження:`);

    if (confirmation !== count.toString()) return;

    try {
      const res = await fetch("/api/classes/assignments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "delete",
          assignmentIds: Array.from(selectedIds),
          classId: classId
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      const data = await res.json();
      alert(data.message || "Завдання видалено!");
      loadAssignments();
      toggleSelectMode();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("Помилка видалення завдань");
    }
  }

  async function handleBulkUpdateDeadline() {
    setShowUpdateDeadlineModal(true);
  }

  async function performBulkUpdateDeadline(dueAt: string | null, publishAt: string | null) {
    try {
      const updates: any = {};
      if (dueAt) updates.dueAt = dueAt;
      if (publishAt) updates.publishAt = publishAt;

      const res = await fetch("/api/classes/assignments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "update",
          assignmentIds: Array.from(selectedIds),
          classId: classId,
          updates: updates
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update");
      }

      const data = await res.json();
      alert(data.message || "Дати оновлено!");
      setShowUpdateDeadlineModal(false);
      loadAssignments();
      toggleSelectMode();
    } catch (error) {
      console.error("Bulk update failed:", error);
      alert("Помилка оновлення дат");
    }
  }

  function getTypeLabel(assignment: Assignment) {
    if (assignment.type === 'exercise' && assignment.exerciseType) {
      return exerciseTypeLabels[assignment.exerciseType] || assignment.exerciseType;
    }
    const typeLabels: Record<string, string> = {
      exercise: t.exercise,
      test: t.test,
      reading: t.reading,
      custom: t.custom
    };
    return typeLabels[assignment.type] || assignment.type;
  }

  function getTypeIcon(assignment: Assignment) {
    if (assignment.type === 'exercise' && assignment.exerciseType) {
      const icons: Record<string, string> = {
        sentences: '📝',
        cloze: '🔤',
        match: '🔗',
        translate: '🌐',
        paraphrase: '💬',
        dialogue: '🗣️',
        describe: '🖼️',
        story: '📖'
      };
      return icons[assignment.exerciseType] || '📝';
    }
    const typeIcons: Record<string, string> = {
      exercise: '📝',
      test: '✅',
      reading: '📚',
      custom: '✏️'
    };
    return typeIcons[assignment.type] || '📝';
  }

  function isOverdue(dueAt?: string) {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-ink/50">
        {t.loading}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-paper p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink/5 mb-4">
          <span className="text-3xl">📝</span>
        </div>
        <h3 className="font-bold text-ink mb-2">{t.noAssignments}</h3>
        <p className="text-sm text-ink/60">{t.noAssignmentsDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Select Mode Toggle */}
      {isTeacher && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {selectMode && (
              <>
                <button
                  onClick={selectAll}
                  className="text-xs font-semibold text-moss hover:underline"
                >
                  {t.selectAll}
                </button>
                <span className="text-ink/20">•</span>
                <button
                  onClick={deselectAll}
                  className="text-xs font-semibold text-ink/60 hover:underline"
                >
                  {t.deselectAll}
                </button>
              </>
            )}
          </div>
          <button
            onClick={toggleSelectMode}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              selectMode
                ? 'border border-ink/20 bg-paper text-ink hover:bg-ink/5'
                : 'border border-moss/30 bg-moss/10 text-moss hover:bg-moss/20'
            }`}
          >
            {selectMode ? (
              <>
                <XCircle size={16} weight="fill" />
                {t.cancel}
              </>
            ) : (
              <>
                <CheckSquare size={16} />
                {t.select}
              </>
            )}
          </button>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectMode && selectedIds.size > 0 && (
        <BulkActionToolbar
          selectedCount={selectedIds.size}
          onCopy={handleBulkCopy}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
          onUpdateDeadline={handleBulkUpdateDeadline}
          onCancel={toggleSelectMode}
          locale={locale}
        />
      )}

      {/* Assignments List */}
      {assignments.map((assignment) => {
        const isDue = isOverdue(assignment.dueAt);
        const status = getAssignmentStatus(assignment);
        const isSelected = selectedIds.has(assignment._id);

        return (
          <div
            key={assignment._id}
            className={`relative rounded-2xl border bg-paper p-6 transition-all ${
              selectMode
                ? isSelected
                  ? 'border-moss/50 bg-moss/5 shadow-lg'
                  : 'border-ink/10 hover:border-moss/30 cursor-pointer'
                : 'border-ink/10 hover:border-moss/30 hover:shadow-lg'
            }`}
            onClick={selectMode ? () => toggleSelectAssignment(assignment._id) : undefined}
          >
            {/* Checkbox for Select Mode */}
            {selectMode && (
              <div className="absolute top-6 left-6 z-10">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all ${
                    isSelected
                      ? 'bg-moss border-moss'
                      : 'bg-paper border-ink/30 hover:border-moss/50'
                  }`}
                >
                  {isSelected ? (
                    <CheckCircle size={20} weight="fill" className="text-white" />
                  ) : (
                    <Square size={20} weight="regular" className="text-ink/30" />
                  )}
                </div>
              </div>
            )}

            {/* Assignment Card Content */}
            <a
              href={selectMode ? undefined : `/classes/${classId}/assignments/${assignment._id}`}
              className={`block ${selectMode ? 'pl-10' : ''}`}
              onClick={(e) => selectMode && e.preventDefault()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                {/* Icon */}
                <div className="text-3xl">{getTypeIcon(assignment)}</div>

                {/* Title & Type */}
                <div className="flex-1">
                  <h3 className="font-bold text-ink mb-1 group-hover:text-moss transition-colors">
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-ink/50">
                    <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-2 py-0.5 text-moss font-semibold">
                      {getTypeLabel(assignment)}
                    </span>
                    {isTeacher && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                        status === 'scheduled' ? 'bg-gold/10 text-gold' :
                        status === 'past' ? 'bg-ink/10 text-ink/60' :
                        'bg-moss/10 text-moss'
                      }`}>
                        {status === 'scheduled' && '⏰ '}
                        {status === 'past' && '✓ '}
                        {t[status]}
                      </span>
                    )}
                    {assignment.pointsTotal && (
                      <span>• {assignment.pointsTotal} {t.points}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Due Date Badge */}
              {assignment.dueAt && (
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  isDue
                    ? 'bg-terracotta/10 text-terracotta border border-terracotta/30'
                    : 'bg-gold/10 text-gold border border-gold/30'
                }`}>
                  <Clock size={12} weight="fill" />
                  {formatDate(assignment.dueAt)}
                  {isDue && <span className="ml-1">⚠️</span>}
                </div>
              )}
            </div>

            {/* Description */}
            {assignment.description && (
              <p className="text-sm text-ink/70 mb-4 line-clamp-2">
                {assignment.description}
              </p>
            )}

            {/* Footer Stats */}
            <div className="flex items-center gap-4 text-xs text-ink/50 pt-3 border-t border-ink/5">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                {t.assignedOn}: {formatDate(assignment.assignedAt)}
              </div>

              {/* TODO: Додати статистику submissions */}
              {isTeacher && (
                <div className="flex items-center gap-1 ml-auto">
                  <Users size={12} />
                  <span>0/0 {t.completed}</span>
                </div>
              )}
            </div>
            </a>
          </div>
        );
      })}

      {/* Modals */}
      {showSelectClassModal && (
        <SelectClassModal
          onSelect={performBulkCopy}
          onClose={() => setShowSelectClassModal(false)}
          locale={locale}
          excludeClassId={classId}
        />
      )}

      {showUpdateDeadlineModal && (
        <UpdateDeadlineModal
          selectedCount={selectedIds.size}
          onUpdate={performBulkUpdateDeadline}
          onClose={() => setShowUpdateDeadlineModal(false)}
          locale={locale}
        />
      )}
    </div>
  );
}
