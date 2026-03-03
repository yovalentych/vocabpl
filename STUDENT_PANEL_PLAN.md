# Student Panel Implementation Plan

## Огляд

**Problem:** Студенти не мають централізованої панелі в Cabinet для перегляду всіх своїх класів, завдань та оцінок.

**Goal:** Додати Student Panel в Cabinet з агрегованою статистикою, списком класів, дедлайнами та оцінками.

**Current State:**
- API endpoints для студентів вже існують
- Компоненти StudentProgress, StudentOverview працюють
- У Cabinet є Teacher Section, але немає Student Section
- Студенти можуть переглядати прогрес тільки всередині кожного класу окремо

---

## Компоненти для створення

### 1. StudentDashboardCard.tsx (NEW)

**Призначення:** Основна картка в Cabinet з агрегованою статистикою

**Структура:**
```typescript
interface StudentStats {
  totalClasses: number;           // Усього класів де я студент
  activeAssignments: number;      // Не здано завдань
  upcomingDeadlines: number;      // Дедлайнів цього тижня
  averageGrade: number;           // Середня оцінка по всіх класах (%)
}

interface ClassSummary {
  _id: string;
  name: string;
  teacherName: string;
  totalAssignments: number;
  completedAssignments: number;
  myAverageGrade: number | null;  // Моя середня в цьому класі
  upcomingDeadlines: number;      // Дедлайнів в цьому класі
}

interface UpcomingDeadline {
  assignmentId: string;
  assignmentTitle: string;
  className: string;
  classId: string;
  dueAt: Date;
  status: 'not_started' | 'in_progress' | 'submitted';
  daysRemaining: number;
}

interface RecentGrade {
  assignmentId: string;
  assignmentTitle: string;
  className: string;
  classId: string;
  score: number;
  percentage: number;
  gradedAt: Date;
}
```

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 📚 Мої класи                                    │
│                                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐       │
│ │  5    │ │  12   │ │  7    │ │ 87%   │       │
│ │Класів │ │Завдань│ │Дедлайн│ │Серед. │       │
│ └───────┘ └───────┘ └───────┘ └───────┘       │
│                                                 │
│ Наближаючі дедлайни:                           │
│ ┌─────────────────────────────────────────┐   │
│ │ 📝 Grammar Test - Basic Polish (завтра) │   │
│ │ 📝 Vocabulary Quiz - Advanced (3 дні)   │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Мої класи:                                     │
│ ┌─────────────────────────────────────────┐   │
│ │ Basic Polish - Teacher: Anna Kowalska   │   │
│ │ 15/20 завдань | Середня: 92% | 3 дедл. │   │
│ │ [Перейти до класу →]                    │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ [+ Приєднатися до класу]  [Всі класи →]       │
└─────────────────────────────────────────────────┘
```

### 2. API Endpoint: /api/student/dashboard (NEW)

**GET /api/student/dashboard**

**Відповідь:**
```typescript
{
  stats: StudentStats,
  classes: ClassSummary[],
  upcomingDeadlines: UpcomingDeadline[],   // Top 10
  recentGrades: RecentGrade[]              // Last 5
}
```

**Логіка:**
1. Отримати всі класи де `user._id in classDoc.studentIds`
2. Для кожного класу:
   - Отримати всі assignments
   - Знайти submissions студента
   - Порахувати статистику
3. Агрегувати дедлайни з усіх класів
4. Отримати останні оцінки (graded submissions)

---

## Модифікації існуючих файлів

### 1. CabinetClient.tsx (MODIFY)

**Додати:**
1. State для student data:
```typescript
const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
const [studentClasses, setStudentClasses] = useState<ClassSummary[]>([]);
```

2. Функцію завантаження:
```typescript
async function loadStudentData() {
  try {
    const res = await fetch('/api/student/dashboard');
    if (!res.ok) return;
    const data = await res.json();
    setStudentStats(data.stats);
    setStudentClasses(data.classes);
  } catch (error) {
    console.error('Failed to load student data:', error);
  }
}
```

3. Секцію після Teacher Section:
```tsx
{/* Student Section */}
<div className="mb-8">
  <h2 className="mb-4 text-2xl font-bold text-stone-900">
    {t('cabinet.myClasses')}
  </h2>
  {studentStats && studentClasses.length > 0 ? (
    <StudentDashboardCard
      stats={studentStats}
      classes={studentClasses}
    />
  ) : (
    <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
      <p className="text-stone-600">{t('cabinet.noClassesYet')}</p>
      <Link href="/classes/join">
        <button className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
          {t('cabinet.joinFirstClass')}
        </button>
      </Link>
    </div>
  )}
</div>
```

### 2. i18n.ts (ADD TRANSLATIONS)

**Додати ключі:**
```typescript
cabinet: {
  // Student section
  myClasses: "Мої класи" / "Moje klasy",
  totalClasses: "Класів" / "Klas",
  activeAssignments: "Активних завдань" / "Aktywne zadania",
  upcomingDeadlines: "Наближаючих дедлайнів" / "Nadchodzące terminy",
  averageGrade: "Середня оцінка" / "Średnia ocena",
  upcomingDeadlinesTitle: "Наближаючі дедлайни" / "Nadchodzące terminy",
  recentGradesTitle: "Останні оцінки" / "Ostatnie oceny",
  myClassesList: "Мої класи" / "Moje klasy",
  noClassesYet: "Ви ще не приєдналися до жодного класу" / "Nie dołączyłeś jeszcze do żadnej klasy",
  joinFirstClass: "Приєднатися до першого класу" / "Dołącz do pierwszej klasy",
  viewClass: "Перейти до класу" / "Przejdź do klasy",
  joinClass: "Приєднатися до класу" / "Dołącz do klasy",
  allClasses: "Всі класи" / "Wszystkie klasy",
  daysRemaining: "{n} днів залишилось" / "{n} dni pozostało",
  tomorrow: "Завтра" / "Jutro",
  today: "Сьогодні" / "Dziś",
  overdue: "Прострочено" / "Po terminie",
  notStarted: "Не розпочато" / "Nie rozpoczęto",
  inProgress: "В процесі" / "W toku",
  submitted: "Здано" / "Wysłano",
  assignmentsCompleted: "{completed}/{total} завдань" / "{completed}/{total} zadań",
}
```

---

## Структура файлів

### Нові файли:
1. `/src/app/api/student/dashboard/route.ts` - API endpoint
2. `/src/components/StudentDashboardCard.tsx` - Основний компонент

### Модифіковані файли:
1. `/src/components/CabinetClient.tsx` - Додати Student Section
2. `/src/lib/i18n.ts` - Додати переклади

---

## Детальна імплементація API

### /src/app/api/student/dashboard/route.ts

```typescript
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const userId = new ObjectId(auth.id);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    // 1. Отримати всі класи де користувач студент
    const classes = await db
      .collection("classes")
      .find({
        studentIds: userId,
        archivedAt: { $exists: false },
      })
      .toArray();

    if (classes.length === 0) {
      return NextResponse.json({
        stats: {
          totalClasses: 0,
          activeAssignments: 0,
          upcomingDeadlines: 0,
          averageGrade: null,
        },
        classes: [],
        upcomingDeadlines: [],
        recentGrades: [],
      });
    }

    const classIds = classes.map((c) => c._id);

    // 2. Отримати всі assignments для цих класів
    const assignments = await db
      .collection("assignments")
      .find({
        classId: { $in: classIds },
        publishAt: { $lte: now },
      })
      .toArray();

    // 3. Отримати всі submissions студента
    const submissions = await db
      .collection("submissions")
      .find({
        studentId: userId,
        classId: { $in: classIds },
      })
      .toArray();

    // 4. Агрегувати статистику
    let totalActiveAssignments = 0;
    let totalUpcomingDeadlines = 0;
    let totalGradeSum = 0;
    let totalGradedCount = 0;

    const upcomingDeadlines: any[] = [];
    const recentGrades: any[] = [];
    const classSummaries: any[] = [];

    for (const cls of classes) {
      const classAssignments = assignments.filter((a) =>
        a.classId.toString() === cls._id.toString()
      );
      const classSubmissions = submissions.filter((s) =>
        s.classId.toString() === cls._id.toString()
      );

      let completedInClass = 0;
      let gradeSum = 0;
      let gradedCount = 0;
      let upcomingInClass = 0;

      for (const assignment of classAssignments) {
        const submission = classSubmissions.find(
          (s) => s.assignmentId.toString() === assignment._id.toString()
        );

        // Рахувати completed
        if (submission?.status === "submitted" || submission?.status === "graded") {
          completedInClass++;
        }

        // Рахувати grades
        if (submission?.status === "graded" && submission.percentage != null) {
          gradeSum += submission.percentage;
          gradedCount++;
          totalGradeSum += submission.percentage;
          totalGradedCount++;

          // Додати до recentGrades
          recentGrades.push({
            assignmentId: assignment._id.toString(),
            assignmentTitle: assignment.title,
            className: cls.name,
            classId: cls._id.toString(),
            score: submission.score || 0,
            percentage: submission.percentage,
            gradedAt: submission.feedback?.gradedAt || submission.updatedAt,
          });
        }

        // Рахувати upcoming deadlines
        if (assignment.dueAt && new Date(assignment.dueAt) <= weekFromNow) {
          const status = submission
            ? submission.status
            : "not_started";

          if (status !== "submitted" && status !== "graded") {
            upcomingInClass++;
            totalUpcomingDeadlines++;

            const daysRemaining = Math.ceil(
              (new Date(assignment.dueAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
            );

            upcomingDeadlines.push({
              assignmentId: assignment._id.toString(),
              assignmentTitle: assignment.title,
              className: cls.name,
              classId: cls._id.toString(),
              dueAt: assignment.dueAt,
              status,
              daysRemaining,
            });
          }
        }

        // Рахувати active assignments (не здано)
        if (!submission || (submission.status !== "submitted" && submission.status !== "graded")) {
          totalActiveAssignments++;
        }
      }

      classSummaries.push({
        _id: cls._id.toString(),
        name: cls.name,
        teacherName: cls.teacherName,
        totalAssignments: classAssignments.length,
        completedAssignments: completedInClass,
        myAverageGrade: gradedCount > 0 ? Math.round(gradeSum / gradedCount) : null,
        upcomingDeadlines: upcomingInClass,
      });
    }

    // 5. Сортувати та обмежити
    upcomingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);
    recentGrades.sort((a, b) =>
      new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime()
    );

    return NextResponse.json({
      stats: {
        totalClasses: classes.length,
        activeAssignments: totalActiveAssignments,
        upcomingDeadlines: totalUpcomingDeadlines,
        averageGrade: totalGradedCount > 0
          ? Math.round(totalGradeSum / totalGradedCount)
          : null,
      },
      classes: classSummaries,
      upcomingDeadlines: upcomingDeadlines.slice(0, 10),
      recentGrades: recentGrades.slice(0, 5),
    });
  } catch (error) {
    console.error("[student-dashboard] Error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
```

---

## Testing Checklist

### Функціональність:
- [ ] Студент бачить Student Section в Cabinet
- [ ] Статистика відображається правильно
- [ ] Список класів показує правильні дані
- [ ] Upcoming deadlines сортуються за датою
- [ ] Recent grades показують останні 5 оцінок
- [ ] Link "Приєднатися до класу" веде на /classes/join
- [ ] Link "Перейти до класу" веде на /classes/[id]
- [ ] Якщо немає класів - показується порожній стан

### Edge Cases:
- [ ] Студент без класів
- [ ] Студент з класами але без завдань
- [ ] Студент з завданнями але без оцінок
- [ ] Студент з прострочeними завданнями
- [ ] Студент з 0% середньою оцінкою

### Переклади:
- [ ] Українська мова працює
- [ ] Польська мова працює
- [ ] Всі ключі перекладені

---

## Success Criteria

✅ Student Panel відображається в Cabinet
✅ Агрегована статистика по всіх класах
✅ Top 10 upcoming deadlines
✅ Last 5 graded assignments
✅ Quick access до класів
✅ Порожній стан для нових студентів
✅ Білінгвальна підтримка (UK + PL)
✅ Mobile-responsive
✅ Швидке завантаження (optimized queries)

---

## Timeline

- **API Endpoint:** 1 день
- **StudentDashboardCard Component:** 1 день
- **Cabinet Integration:** 0.5 дня
- **Translations:** 0.5 дня
- **Testing:** 1 день

**Total:** 4 дні
