# Архітектура системи класів

## 1. Database Collections

### Collection: `classes`
```typescript
{
  _id: ObjectId,
  name: string,                    // "Польська А1 - Група 1"
  description?: string,             // "Початківці, вечірня група"
  teacherId: ObjectId,              // ID викладача (ref users)
  teacherName: string,              // Кешоване ім'я для швидкості

  // Студенти
  studentIds: ObjectId[],           // Масив ID студентів
  students: Array<{                 // Денормалізовані дані для UI
    id: ObjectId,
    username: string,
    name: string,
    joinedAt: Date
  }>,

  // Налаштування
  settings: {
    isPublic: boolean,              // Чи можуть студенти самі приєднатися
    inviteCode?: string,            // Код для приєднання (якщо isPublic)
    autoApprove: boolean,           // Автоматичне схвалення запитів
    locale: 'uk' | 'pl',           // Основна мова класу
  },

  // Метадані
  createdAt: Date,
  updatedAt: Date,
  archivedAt?: Date,                // Для архівації старих класів

  // Статистика (кешована)
  stats: {
    totalStudents: number,
    activeStudents: number,         // Активні за останні 7 днів
    totalAssignments: number,
    completedAssignments: number
  }
}
```

### Collection: `class_assignments`
```typescript
{
  _id: ObjectId,
  classId: ObjectId,                // Ref classes
  teacherId: ObjectId,              // Хто створив

  // Тип завдання
  type: 'exercise' | 'test' | 'reading' | 'custom',

  // Для exercise
  exerciseType?: 'sentences' | 'cloze' | 'match' | 'translate' | 'paraphrase' | 'dialogue' | 'describe' | 'story',
  exerciseConfig?: {                // Конфіг для AI вправ
    topic?: string,
    level?: string,
    difficulty?: string
  },

  // Для test
  testId?: ObjectId,                // Ref tests collection

  // Для reading
  readingId?: ObjectId,             // Ref reading collection

  // Для custom
  customTitle?: string,
  customDescription?: string,
  customInstructions?: string,

  // Загальні поля
  title: string,                    // "Вправа: Часи дієслів"
  description?: string,
  instructions?: string,

  // Дедлайн
  assignedAt: Date,
  dueAt?: Date,                     // Дедлайн здачі

  // Оцінювання
  pointsTotal?: number,             // Максимальна кількість балів
  passingScore?: number,            // Мінімум для зарахування

  // Налаштування
  settings: {
    allowLateSubmission: boolean,
    showResultsImmediately: boolean,
    allowRetake: boolean,
    maxAttempts?: number,
  },

  // Студенти (можна призначити не всім)
  assignedTo: 'all' | ObjectId[],   // 'all' або список ID

  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `class_submissions`
```typescript
{
  _id: ObjectId,
  assignmentId: ObjectId,           // Ref class_assignments
  classId: ObjectId,                // Ref classes
  studentId: ObjectId,              // Ref users
  studentName: string,              // Кешовано

  // Submission
  submittedAt?: Date,
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded',

  // Результати
  score?: number,                   // Набрані бали
  percentage?: number,              // Відсоток правильних
  passed?: boolean,                 // Чи пройдено

  // Дані залежно від типу
  exerciseData?: {
    attempts: number,
    timeSpent: number,              // Секунди
    answers: any[],                 // Відповіді студента
  },

  testData?: {
    testSubmissionId: ObjectId,     // Ref до існуючої системи тестів
  },

  readingData?: {
    completed: boolean,
    timeSpent: number,
    comprehensionScore?: number,
  },

  customData?: {
    content?: string,               // Текстова відповідь
    files?: string[],               // Прикріплені файли (URLs)
  },

  // Feedback від викладача
  feedback?: {
    comment?: string,
    gradedAt?: Date,
    gradedBy?: ObjectId,
  },

  // Метадані
  attemptNumber: number,            // Номер спроби (якщо дозволені retakes)
  isLate: boolean,                  // Чи здано після дедлайну

  createdAt: Date,
  updatedAt: Date
}
```

### Доповнення до `users` collection
```typescript
{
  // ... existing fields

  // Додати нові поля:
  classes?: {
    asTeacher: ObjectId[],          // Класи де я викладач
    asStudent: ObjectId[],          // Класи де я студент
  },

  // Дозволи
  permissions?: {
    canCreateClasses: boolean,      // Чи може створювати класи
    isVerifiedTeacher: boolean,     // Верифікований викладач
  }
}
```

## 2. API Routes

### Classes Management
```
POST   /api/classes                 # Створити клас (тільки викладачі)
GET    /api/classes                 # Список моїх класів
GET    /api/classes/[id]            # Деталі класу
PATCH  /api/classes/[id]            # Оновити клас
DELETE /api/classes/[id]            # Видалити/архівувати клас
```

### Students Management
```
POST   /api/classes/[id]/students         # Додати студента
DELETE /api/classes/[id]/students/[uid]   # Видалити студента
POST   /api/classes/join                  # Приєднатися до класу (за кодом)
POST   /api/classes/[id]/invite           # Згенерувати invite код
GET    /api/classes/[id]/students         # Список студентів + статистика
```

### Assignments
```
POST   /api/classes/[id]/assignments        # Створити завдання
GET    /api/classes/[id]/assignments        # Список завдань класу
GET    /api/assignments/[aid]               # Деталі завдання
PATCH  /api/assignments/[aid]               # Оновити завдання
DELETE /api/assignments/[aid]               # Видалити завдання
```

### Submissions
```
POST   /api/assignments/[aid]/submit        # Здати роботу
GET    /api/assignments/[aid]/submissions   # Всі здачі (для викладача)
GET    /api/assignments/[aid]/my-submission # Моя здача (для студента)
PATCH  /api/submissions/[sid]/grade         # Оцінити роботу (викладач)
POST   /api/submissions/[sid]/feedback      # Залишити feedback
```

### Analytics
```
GET    /api/classes/[id]/analytics          # Статистика класу
GET    /api/classes/[id]/leaderboard        # Рейтинг студентів
GET    /api/classes/[id]/progress           # Прогрес по завданнях
```

## 3. UI Components

### Для викладачів

**Головна сторінка класів** `/classes` (teacher view)
- Список моїх класів (cards з статистикою)
- Кнопка "+ Створити клас"
- Фільтри: активні / архівовані

**Деталі класу** `/classes/[id]`
- Tabs:
  - 📊 Overview (статистика, recent activity)
  - 👥 Студенти (список + прогрес кожного)
  - 📝 Завдання (список assignments)
  - 📈 Аналітика (графіки, insights)
  - ⚙️ Налаштування

**Створення завдання** `/classes/[id]/assignments/new`
- Вибір типу (Exercise / Test / Reading / Custom)
- Конфігурація (тема, складність, дедлайн)
- Вибір студентів (всі / вибрані)
- Налаштування оцінювання

**Перегляд здач** `/classes/[id]/assignments/[aid]/submissions`
- Таблиця студентів з статусами
- Можливість оцінити та залишити feedback
- Експорт в CSV

### Для студентів

**Мої класи** `/my-classes`
- Список класів де я студент
- Pending assignments (найближчі дедлайни)

**Клас студента** `/my-classes/[id]`
- Tabs:
  - 📝 Завдання (to-do / completed)
  - 📊 Мій прогрес
  - 👥 Однокласники (опціонально)

**Виконання завдання** `/my-classes/[id]/assignments/[aid]`
- Інтерфейс вправи/тесту
- Таймер (якщо є дедлайн)
- Кнопка "Здати роботу"

## 4. Permissions & Access Control

```typescript
// Middleware для класів
function canAccessClass(userId, classId, role: 'teacher' | 'student') {
  const classDoc = await db.collection('classes').findOne({ _id: classId });

  if (role === 'teacher') {
    return classDoc.teacherId.equals(userId);
  }

  if (role === 'student') {
    return classDoc.studentIds.some(id => id.equals(userId));
  }

  return false;
}

function canCreateClass(user) {
  // Опції:
  // 1. Тільки admin може
  // 2. Тільки verified teachers
  // 3. Будь-хто (з планом Pro+)
  return user.permissions?.canCreateClasses === true;
}
```

## 5. Integration з існуючими features

### Exercises
- При здачі вправи з класу → створити `class_submission`
- Зберегти результати в обох місцях (user progress + class submission)

### Tests
- Використати існуючу систему тестів
- Додати `classId` та `assignmentId` до test submissions

### Leaderboard
- Окремий leaderboard для кожного класу
- Враховувати тільки завдання класу

### AI Usage
- AI credits викладача використовуються для генерації завдань
- Студенти використовують свої credits при виконанні

## 6. Фази впровадження

### Phase 1: Core (MVP)
- ✅ Database schema
- ✅ Create/manage classes
- ✅ Add/remove students
- ✅ Basic assignments (exercise type only)
- ✅ Submissions tracking
- ✅ Simple dashboard

### Phase 2: Enhanced
- ✅ All assignment types (tests, reading, custom)
- ✅ Teacher feedback & grading
- ✅ Due dates & notifications
- ✅ Class analytics
- ✅ Invite codes & public classes

### Phase 3: Advanced
- ✅ Real-time collaboration
- ✅ Video lessons integration
- ✅ Calendar view
- ✅ Parent/guardian access
- ✅ Certificates & achievements
- ✅ Class chat/announcements

## 7. Приклади Use Cases

### Use Case 1: Викладач створює вправу
1. Викладач заходить в клас
2. Натискає "Нове завдання" → Вибирає "Exercise: Sentences"
3. Задає тему "Минулий час", рівень B1
4. Встановлює дедлайн: +7 днів
5. Призначає всім студентам
6. Студенти отримують notification

### Use Case 2: Студент виконує завдання
1. Студент заходить в "Мої класи"
2. Бачить pending assignment
3. Клікає → відкривається вправа
4. Виконує → натискає "Здати"
5. Результат записується в submissions
6. Викладач бачить в dashboard

### Use Case 3: Викладач аналізує прогрес
1. Викладач відкриває Analytics
2. Бачить графік: % completion по завданнях
3. Бачить студентів які відстають
4. Експортує звіт в CSV

## 8. Design Notes

### UI/UX Consistency
- Використати існуючу дизайн систему (moss/gold/terracotta)
- Іконки: PhosphorIcons
- Tabs для navigation в класі
- Cards для списків класів/завдань

### Mobile-friendly
- Студенти часто заходять з телефону
- Responsive tables → cards на mobile
- Touch-friendly buttons

### Localization
- Всі нові strings додати в i18n dictionary
- Підтримка uk/pl в інтерфейсі класів

### Performance
- Кешування списків студентів в class doc (denormalization)
- Pagination для списку submissions (>50 студентів)
- Indexes: classId, studentId, assignmentId, dueAt

## 9. Розширення в майбутньому

- **Live sessions**: Real-time заняття з відео
- **Homework workflows**: Multi-step завдання
- **Peer review**: Студенти перевіряють одне одного
- **Gamification**: Badges, levels для класу
- **Integration з Google Classroom / Moodle**
- **Parent portal**: Батьки бачать прогрес дітей
