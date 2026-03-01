"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  Check,
  CheckCircle,
  XCircle,
  Users,
  ClipboardText,
  ChatText,
  Star
} from "@phosphor-icons/react";

type AssignmentDetailProps = {
  classId: string;
  assignmentId: string;
  locale: "uk" | "pl";
};

type Submission = {
  _id: string;
  studentId: string;
  studentName: string;
  status: "not_started" | "in_progress" | "submitted" | "graded";
  score?: number;
  percentage?: number;
  passed?: boolean;
  submittedAt?: string;
  late?: boolean;
  feedback?: {
    comment?: string;
  };
};

type Assignment = {
  _id: string;
  title: string;
  type: string;
  exerciseType?: string;
  description?: string;
  instructions?: string;
  dueAt?: string;
  pointsTotal?: number;
  pointsToPass?: number;
  assignedAt: string;
  settings: {
    allowLateSubmission: boolean;
    showResultsImmediately: boolean;
  };
};

type StudentResponse = {
  assignment: Assignment;
  submission: Submission;
  role: "student";
};

type TeacherResponse = {
  assignment: Assignment;
  submissions: Submission[];
  role: "teacher";
};

type AssignmentResponse = StudentResponse | TeacherResponse;

export default function AssignmentDetail({
  classId,
  assignmentId,
  locale
}: AssignmentDetailProps) {
  const [data, setData] = useState<AssignmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(
    null
  );
  const [feedbackComment, setFeedbackComment] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  const t =
    locale === "uk"
      ? {
          backToAssignments: "Назад до завдань",
          startExercise: "Почати вправу",
          continueExercise: "Продовжити вправу",
          submitted: "Здано",
          graded: "Оцінено",
          notStarted: "Не розпочато",
          inProgress: "В процесі",
          score: "Бал",
          percentage: "Відсоток",
          passed: "Пройдено",
          failed: "Не пройдено",
          submittedAt: "Здано",
          late: "Запізнення",
          teacherFeedback: "Коментар викладача",
          totalPoints: "Макс. балів",
          passingScore: "Для проходження",
          dueDate: "Дедлайн",
          overdue: "Прострочено",
          exercise: "Вправа",
          studentsSubmitted: "Здано",
          averageScore: "Середній бал",
          studentsPassed: "Пройшли",
          studentName: "Студент",
          status: "Статус",
          actions: "Дії",
          grade: "Оцінити",
          feedbackPlaceholder: "Напишіть коментар для студента...",
          saveGrade: "Зберегти оцінку",
          saving: "Збереження...",
          noSubmissions: "Ще немає робіт",
          description: "Опис",
          instructions: "Інструкції",
          points: "балів",
          of: "з",
          loading: "Завантаження...",
          notFound: "Завдання не знайдено"
        }
      : {
          backToAssignments: "Powrot do zadan",
          startExercise: "Rozpocznij cwiczenie",
          continueExercise: "Kontynuuj cwiczenie",
          submitted: "Przeslano",
          graded: "Oceniono",
          notStarted: "Nie rozpoczeto",
          inProgress: "W trakcie",
          score: "Wynik",
          percentage: "Procent",
          passed: "Zaliczono",
          failed: "Nie zaliczono",
          submittedAt: "Przeslano",
          late: "Spoznienie",
          teacherFeedback: "Komentarz nauczyciela",
          totalPoints: "Maks. punktow",
          passingScore: "Do zaliczenia",
          dueDate: "Termin",
          overdue: "Zalegle",
          exercise: "Cwiczenie",
          studentsSubmitted: "Przeslano",
          averageScore: "Sredni wynik",
          studentsPassed: "Zaliczyli",
          studentName: "Uczen",
          status: "Status",
          actions: "Dzialania",
          grade: "Ocen",
          feedbackPlaceholder: "Napisz komentarz dla ucznia...",
          saveGrade: "Zapisz ocene",
          saving: "Zapisywanie...",
          noSubmissions: "Nie ma jeszcze prac",
          description: "Opis",
          instructions: "Instrukcje",
          points: "punktow",
          of: "z",
          loading: "Ladowanie...",
          notFound: "Nie znaleziono zadania"
        };

  const exerciseTypeLabels: Record<string, string> =
    locale === "uk"
      ? {
          sentences: "Речення",
          cloze: "Пропуски",
          match: "Співставлення",
          translate: "Переклад",
          paraphrase: "Перефразування",
          dialogue: "Діалог",
          describe: "Опис",
          story: "Історія"
        }
      : {
          sentences: "Zdania",
          cloze: "Luki",
          match: "Dopasowanie",
          translate: "Tlumaczenie",
          paraphrase: "Parafraza",
          dialogue: "Dialog",
          describe: "Opis",
          story: "Historia"
        };

  useEffect(() => {
    loadAssignment();
  }, [classId, assignmentId]);

  async function loadAssignment() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/classes/${classId}/assignments/${assignmentId}`
      );
      const json = await res.json();
      if (res.ok) {
        setData(json as AssignmentResponse);
      }
    } catch (error) {
      console.error("Failed to load assignment:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveGrade(submissionId: string) {
    try {
      setSavingGrade(true);
      const res = await fetch(
        `/api/classes/${classId}/assignments/${assignmentId}/submissions/${submissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback: { comment: feedbackComment },
            status: "graded"
          })
        }
      );
      if (res.ok) {
        setGradingSubmission(null);
        setFeedbackComment("");
        await loadAssignment();
      }
    } catch (error) {
      console.error("Failed to save grade:", error);
    } finally {
      setSavingGrade(false);
    }
  }

  function isOverdue(dueAt?: string) {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "uk" ? "uk-UA" : "pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getExerciseTypeLabel(assignment: Assignment) {
    if (assignment.exerciseType) {
      return (
        exerciseTypeLabels[assignment.exerciseType] || assignment.exerciseType
      );
    }
    return t.exercise;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "not_started":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2.5 py-1 text-xs font-semibold text-ink/60">
            {t.notStarted}
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
            <Clock size={12} weight="fill" />
            {t.inProgress}
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-moss">
            <Check size={12} weight="bold" />
            {t.submitted}
          </span>
        );
      case "graded":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-2.5 py-1 text-xs font-semibold text-moss">
            <Star size={12} weight="fill" />
            {t.graded}
          </span>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-6 py-10">
        <div className="text-center py-12 text-ink/50">{t.loading}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-6 py-10">
        <div className="text-center py-12 text-ink/50">{t.notFound}</div>
      </div>
    );
  }

  const { assignment } = data;
  const overdue = isOverdue(assignment.dueAt);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <a
          href={`/classes/${classId}?tab=assignments`}
          className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t.backToAssignments}
        </a>

        <h1 className="text-3xl font-bold text-ink mb-3">{assignment.title}</h1>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Exercise type badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
            <ClipboardText size={14} />
            {getExerciseTypeLabel(assignment)}
          </span>

          {/* Due date badge */}
          {assignment.dueAt && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                overdue
                  ? "bg-terracotta/10 text-terracotta border border-terracotta/30"
                  : "bg-gold/10 text-gold border border-gold/30"
              }`}
            >
              <Clock size={12} weight="fill" />
              {t.dueDate}: {formatDate(assignment.dueAt)}
              {overdue && (
                <span className="ml-1 font-bold">({t.overdue})</span>
              )}
            </span>
          )}
        </div>

        {/* Description */}
        {assignment.description && (
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-1">
              {t.description}
            </h3>
            <p className="text-sm text-ink/70">{assignment.description}</p>
          </div>
        )}

        {/* Instructions */}
        {assignment.instructions && (
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wide mb-1">
              {t.instructions}
            </h3>
            <p className="text-sm text-ink/70">{assignment.instructions}</p>
          </div>
        )}

        {/* Points info */}
        {assignment.pointsTotal != null && (
          <div className="flex items-center gap-4 text-sm text-ink/60 mt-4">
            <div className="flex items-center gap-1.5">
              <Star size={14} weight="fill" className="text-gold" />
              <span>
                {t.totalPoints}: {assignment.pointsTotal} {t.points}
              </span>
            </div>
            {assignment.pointsToPass != null && (
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-moss" />
                <span>
                  {t.passingScore}: {assignment.pointsToPass} {t.points}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student View */}
      {data.role === "student" && <StudentView submission={data.submission} />}

      {/* Teacher View */}
      {data.role === "teacher" && (
        <TeacherView submissions={data.submissions} />
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-ink/10 bg-paper p-6 shadow-xl mx-4">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-ink mb-1">
                  {t.grade}: {gradingSubmission.studentName}
                </h2>
                {gradingSubmission.score != null &&
                  assignment.pointsTotal != null && (
                    <p className="text-sm text-ink/60">
                      {t.score}: {gradingSubmission.score} {t.of}{" "}
                      {assignment.pointsTotal} {t.points}
                      {gradingSubmission.percentage != null && (
                        <span className="ml-2">
                          ({gradingSubmission.percentage}%)
                        </span>
                      )}
                    </p>
                  )}
              </div>
              <button
                onClick={() => {
                  setGradingSubmission(null);
                  setFeedbackComment("");
                }}
                className="rounded-full p-2 text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-ink mb-2">
                <ChatText size={16} className="inline mr-1.5" />
                {t.teacherFeedback}
              </label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder={t.feedbackPlaceholder}
                rows={4}
                className="w-full rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus:border-moss/50 focus:outline-none focus:ring-1 focus:ring-moss/30 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setGradingSubmission(null);
                  setFeedbackComment("");
                }}
                className="rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/5 transition-colors"
              >
                {locale === "uk" ? "Скасувати" : "Anuluj"}
              </button>
              <button
                onClick={() => saveGrade(gradingSubmission._id)}
                disabled={savingGrade}
                className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingGrade ? (
                  t.saving
                ) : (
                  <>
                    <Check size={16} weight="bold" />
                    {t.saveGrade}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function StudentView({ submission }: { submission: Submission }) {
    const doUrl = `/classes/${classId}/assignments/${assignmentId}/do`;

    return (
      <div className="rounded-2xl border border-ink/10 bg-paper p-6">
        {/* Not started */}
        {submission.status === "not_started" && (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-moss/10 mb-4">
              <ClipboardText size={32} className="text-moss" />
            </div>
            <p className="text-ink/60 mb-6">{t.notStarted}</p>
            <a
              href={doUrl}
              className="inline-flex items-center gap-2 rounded-full border border-moss/30 bg-moss px-6 py-3 text-sm font-semibold text-white hover:bg-moss/90 transition-colors"
            >
              {t.startExercise}
            </a>
          </div>
        )}

        {/* In progress */}
        {submission.status === "in_progress" && (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-4">
              <Clock size={32} className="text-gold" weight="fill" />
            </div>
            <p className="text-ink/60 mb-6">{t.inProgress}</p>
            <a
              href={doUrl}
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold px-6 py-3 text-sm font-semibold text-white hover:bg-gold/90 transition-colors"
            >
              {t.continueExercise}
            </a>
          </div>
        )}

        {/* Submitted or graded */}
        {(submission.status === "submitted" ||
          submission.status === "graded") && (
          <div className="space-y-5">
            {/* Status header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusBadge(submission.status)}
                {submission.passed != null &&
                  (submission.passed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-moss/10 px-2.5 py-1 text-xs font-semibold text-moss">
                      <CheckCircle size={14} weight="fill" />
                      {t.passed}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta">
                      <XCircle size={14} weight="fill" />
                      {t.failed}
                    </span>
                  ))}
                {submission.late && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold text-terracotta">
                    <Clock size={12} weight="fill" />
                    {t.late}
                  </span>
                )}
              </div>
            </div>

            {/* Score details */}
            <div className="grid gap-4 sm:grid-cols-3">
              {submission.score != null && (
                <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
                  <div className="text-xs font-semibold text-ink/50 mb-1">
                    {t.score}
                  </div>
                  <div className="text-2xl font-bold text-ink">
                    {submission.score}
                    {assignment.pointsTotal != null && (
                      <span className="text-sm font-normal text-ink/50 ml-1">
                        {t.of} {assignment.pointsTotal}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {submission.percentage != null && (
                <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
                  <div className="text-xs font-semibold text-ink/50 mb-1">
                    {t.percentage}
                  </div>
                  <div className="text-2xl font-bold text-ink">
                    {submission.percentage}%
                  </div>
                </div>
              )}
              {submission.submittedAt && (
                <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
                  <div className="text-xs font-semibold text-ink/50 mb-1">
                    {t.submittedAt}
                  </div>
                  <div className="text-sm font-semibold text-ink">
                    {formatDate(submission.submittedAt)}
                  </div>
                </div>
              )}
            </div>

            {/* Teacher feedback (only when graded) */}
            {submission.status === "graded" &&
              submission.feedback?.comment && (
                <div className="rounded-xl border border-moss/20 bg-moss/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-moss mb-2">
                    <ChatText size={16} />
                    {t.teacherFeedback}
                  </div>
                  <p className="text-sm text-ink/70">
                    {submission.feedback.comment}
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    );
  }

  function TeacherView({ submissions }: { submissions: Submission[] }) {
    const totalStudents = submissions.length;
    const submittedCount = submissions.filter(
      (s) => s.status === "submitted" || s.status === "graded"
    ).length;
    const passedCount = submissions.filter((s) => s.passed === true).length;
    const scoredSubmissions = submissions.filter(
      (s) => s.percentage != null
    );
    const averageScore =
      scoredSubmissions.length > 0
        ? Math.round(
            scoredSubmissions.reduce(
              (sum, s) => sum + (s.percentage ?? 0),
              0
            ) / scoredSubmissions.length
          )
        : 0;

    return (
      <div className="space-y-6">
        {/* Stats bar */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center gap-2 text-sm text-ink/60 mb-1">
              <Users size={16} />
              {t.studentsSubmitted}
            </div>
            <div className="text-3xl font-bold text-ink">
              {submittedCount}
              <span className="text-base font-normal text-ink/50">
                /{totalStudents}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center gap-2 text-sm text-ink/60 mb-1">
              <Star size={16} weight="fill" />
              {t.averageScore}
            </div>
            <div className="text-3xl font-bold text-gold">
              {scoredSubmissions.length > 0 ? `${averageScore}%` : "---"}
            </div>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-paper p-5">
            <div className="flex items-center gap-2 text-sm text-ink/60 mb-1">
              <CheckCircle size={16} />
              {t.studentsPassed}
            </div>
            <div className="text-3xl font-bold text-moss">{passedCount}</div>
          </div>
        </div>

        {/* Submissions table */}
        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-paper p-12 text-center">
            <Users size={48} className="mx-auto mb-4 text-ink/30" />
            <p className="text-ink/60">{t.noSubmissions}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-ink/10 bg-paper overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-ink/10 bg-ink/[0.02]">
              <div className="text-xs font-semibold text-ink/50 uppercase tracking-wide">
                {t.studentName}
              </div>
              <div className="text-xs font-semibold text-ink/50 uppercase tracking-wide w-28 text-center">
                {t.status}
              </div>
              <div className="text-xs font-semibold text-ink/50 uppercase tracking-wide w-20 text-center">
                {t.score}
              </div>
              <div className="text-xs font-semibold text-ink/50 uppercase tracking-wide w-36 text-center">
                {t.submittedAt}
              </div>
              <div className="text-xs font-semibold text-ink/50 uppercase tracking-wide w-24 text-center">
                {t.actions}
              </div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-ink/5">
              {submissions.map((sub) => (
                <div
                  key={sub._id}
                  className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 sm:gap-4 px-6 py-4 items-start sm:items-center"
                >
                  {/* Student name */}
                  <div className="font-semibold text-ink text-sm">
                    {sub.studentName}
                  </div>

                  {/* Status badge */}
                  <div className="w-28 flex justify-center">
                    {getStatusBadge(sub.status)}
                  </div>

                  {/* Score */}
                  <div className="w-20 text-center text-sm">
                    {sub.score != null ? (
                      <span className="font-semibold text-ink">
                        {sub.score}
                        {assignment.pointsTotal != null && (
                          <span className="text-ink/50 font-normal">
                            /{assignment.pointsTotal}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-ink/30">---</span>
                    )}
                  </div>

                  {/* Submitted date */}
                  <div className="w-36 text-center">
                    {sub.submittedAt ? (
                      <div className="text-xs text-ink/60">
                        {formatDate(sub.submittedAt)}
                        {sub.late && (
                          <span className="block text-terracotta font-semibold mt-0.5">
                            {t.late}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-ink/30">---</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-24 flex justify-center">
                    {(sub.status === "submitted" ||
                      sub.status === "graded") && (
                      <button
                        onClick={() => {
                          setGradingSubmission(sub);
                          setFeedbackComment(
                            sub.feedback?.comment ?? ""
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-moss/30 bg-moss/10 px-3 py-1.5 text-xs font-semibold text-moss hover:bg-moss/20 transition-colors"
                      >
                        <ChatText size={14} />
                        {t.grade}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}
