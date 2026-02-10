# 📚 Аналіз та Покращення Словника (class/dict)

## 📊 Поточний стан

### ✅ Що працює добре:
- **Багатий функціонал**: фільтри, пошук, сортування, прогрес
- **Trainer**: 3 режими (MCQ, typing, flashcards)
- **Favorites & My Words**: персоналізація
- **Progress tracking**: 5-точкова система
- **External links**: conjugation/declension

### ❌ Проблеми:

#### 1. **Архітектура**
- 🔴 **Монолітний компонент**: 1112 рядків коду
- 🔴 **21 useState**: надмірна складність
- 🔴 **Trainer всередині**: має бути окрема сторінка
- 🔴 **Відсутність розділення**: немає підкомпонентів

#### 2. **UI/UX**
- 🟡 **Застарілий дизайн**: не відповідає новому стилю workbook
- 🟡 **Немає Landing page**: відразу список слів
- 🟡 **Немає статистики**: скільки слів вивчено, прогрес
- 🟡 **Trainer в модалці**: незручно для тривалої практики
- 🟡 **Progress dots неочевидні**: незрозуміло що означають

#### 3. **Функціонал**
- 🔴 **Немає AI**: відсутня генерація прикладів, пояснень
- 🔴 **Простий прогрес**: немає spaced repetition
- 🔴 **Немає gamification**: відсутні досягнення, стріки
- 🔴 **Немає інтеграції**: не показує де слово використовувалось у вправах

---

## 🎯 План покращень

### PHASE 1: Структурний рефакторинг ⭐ КРИТИЧНО

#### 1.1 Розділити на компоненти
```
src/components/dict/
├── DictLanding.tsx                 # Landing page зі статистикою
├── DictFilters.tsx                 # Фільтри та пошук
├── DictAlphabetNav.tsx            # Навігація по літерах
├── DictWordCard.tsx               # Картка слова
├── DictWordGrid.tsx               # Grid з картками
├── DictStats.tsx                  # Статистика користувача
└── trainer/
    ├── TrainerPage.tsx            # Окрема сторінка для тренажера
    ├── TrainerSetup.tsx           # Налаштування
    ├── TrainerPractice.tsx        # Практика
    └── TrainerResults.tsx         # Результати
```

#### 1.2 Створити окрему сторінку тренажера
- `/class/dict/trainer` - повноцінна сторінка з роутінгом
- Зберігає стан у URL params
- Можливість поділитися налаштуваннями

---

### PHASE 2: Landing Page та Статистика ⭐ HIGH

#### 2.1 DictLanding (як WorkbookDashboard)
```tsx
<DictLanding>
  {/* Hero Banner */}
  <section className="rounded-[32px] border bg-gradient-to-br from-moss/10 to-gold/10">
    <Sparkle /> AI-Enhanced Dictionary
    <h1>Твій особистий словник</h1>
    <p>3,847 слів доступно • 247 вивчено • 89 в обраному</p>
  </section>

  {/* Stats Grid */}
  <div className="grid gap-4 sm:grid-cols-3">
    <StatCard icon={Trophy} label="Слів вивчено" value={247} />
    <StatCard icon={Fire} label="Поточна серія" value="12 днів" />
    <StatCard icon={Target} label="Точність" value="87%" />
  </div>

  {/* Quick Actions */}
  <div className="grid gap-4 md:grid-cols-3">
    <ActionCard
      title="Переглянути словник"
      icon={BookOpen}
      href="/class/dict/browse"
    />
    <ActionCard
      title="Тренажер слів"
      icon={Lightning}
      href="/class/dict/trainer"
    />
    <ActionCard
      title="Мої слова"
      icon={Star}
      href="/class/dict/my-words"
    />
  </div>

  {/* Recent Progress */}
  <RecentWords />

  {/* Spaced Repetition Queue */}
  <DueForReview count={24} />
</DictLanding>
```

#### 2.2 User Stats API
```typescript
GET /api/user/vocabulary/stats

Response:
{
  totalWords: 3847,
  learnedWords: 247,
  favoriteWords: 89,
  customWords: 34,
  currentStreak: 12,
  longestStreak: 28,
  accuracy: 0.87,
  weeklyProgress: [12, 18, 15, 20, 25, 19, 22], // last 7 days
  categoryBreakdown: {
    verbs: { total: 1200, learned: 89 },
    adjectives: { total: 800, learned: 56 },
    // ...
  },
  dueForReview: 24,
  reviewHistory: [...],
  recentWords: [...]
}
```

---

### PHASE 3: AI Integration ⭐ HIGH

#### 3.1 AI Examples Generator
**Для кожного слова:**
```tsx
<WordCard>
  {/* Existing content */}

  <button onClick={() => generateExamples(word)}>
    <Sparkle /> Згенерувати приклади AI
  </button>

  {examples && (
    <div className="examples">
      {examples.map(ex => (
        <p>
          <strong>{ex.sentence}</strong>
          <span>{ex.translation}</span>
        </p>
      ))}
    </div>
  )}
</WordCard>
```

**AI Mode:**
```typescript
POST /api/ai/run
{
  mode: "word_examples",
  userInput: JSON.stringify({
    word: "czytać",
    level: "A2",
    count: 3
  })
}

Response:
{
  examples: [
    {
      sentence: "Lubię czytać książki przed snem.",
      translation: "Люблю читати книжки перед сном.",
      difficulty: "A2"
    },
    // ...
  ]
}
```

#### 3.2 AI Grammar Explanation
```tsx
<button onClick={() => explainGrammar(word)}>
  <Lightbulb /> Пояснення граматики
</button>

{explanation && (
  <div className="grammar-explanation">
    <h4>Граматика: {word.pl}</h4>
    <p>{explanation.type}</p>
    <p>{explanation.usage}</p>
    <p>{explanation.notes}</p>
  </div>
)}
```

#### 3.3 AI Personalized Recommendations
```tsx
<section className="ai-recommendations">
  <h3>AI рекомендує вивчити</h3>
  <p>На основі твого прогресу та інтересів</p>

  {recommendedWords.map(word => (
    <WordCard word={word} reason={word.reason} />
  ))}
</section>
```

---

### PHASE 4: Spaced Repetition ⭐ MEDIUM

#### 4.1 SRS Algorithm (SuperMemo SM-2)
```typescript
interface WordReview {
  wordId: string;
  easeFactor: number;      // 1.3 - 2.5
  interval: number;         // days
  repetitions: number;
  nextReview: Date;
  lastReview: Date;
  quality: 0 | 1 | 2 | 3 | 4 | 5;  // 0-5 rating
}

function calculateNextReview(
  currentInterval: number,
  repetitions: number,
  easeFactor: number,
  quality: number
): { interval: number, easeFactor: number, repetitions: number }
```

#### 4.2 Review Queue UI
```tsx
<ReviewQueue>
  <h2>До повторення: {dueWords.length}</h2>

  <button onClick={() => startReview()}>
    Почати повторення
  </button>

  {dueWords.map(word => (
    <DueWordCard
      word={word}
      nextReview={word.nextReview}
      difficulty={word.difficulty}
    />
  ))}
</ReviewQueue>
```

---

### PHASE 5: Gamification ⭐ MEDIUM

#### 5.1 Achievements System
```tsx
const achievements = [
  {
    id: "first_10",
    title: "Перші 10 слів",
    description: "Вивчи 10 слів",
    icon: Trophy,
    progress: 7,
    total: 10
  },
  {
    id: "week_streak",
    title: "Тижнева серія",
    description: "Вчи 7 днів поспіль",
    icon: Fire,
    completed: true
  },
  // ...
];

<AchievementsPanel achievements={achievements} />
```

#### 5.2 Streaks & Leaderboard
```tsx
<StreakCounter
  current={12}
  longest={28}
  lastActivity={new Date()}
/>

<VocabularyLeaderboard
  users={topUsers}
  currentUser={user}
/>
```

#### 5.3 XP & Levels
```tsx
<LevelProgress
  level={5}
  currentXP={1240}
  nextLevelXP={1500}
  title="Vocabulary Enthusiast"
/>
```

---

### PHASE 6: Покращення Trainer ⭐ LOW

#### 6.1 Окрема сторінка
```
/class/dict/trainer?mode=mcq&count=20&parts=verbs&direction=pluk
```

#### 6.2 Додаткові режими
- **Sentence building**: складати речення зі слів
- **Audio**: прослуховування та написання
- **Contextual**: слово в контексті речення

#### 6.3 Adaptive difficulty
- Автоматично підбирає складність на основі результатів
- Більше повторює складні слова
- Використовує SRS для планування

---

### PHASE 7: Інтеграція з Вправами ⭐ LOW

#### 7.1 Word Usage History
```tsx
<WordCard word={word}>
  {/* ... */}

  <UsageHistory>
    <h4>Де використовувалось:</h4>
    <ul>
      <li>
        <Link href="/class/workbook/sentences">
          Sentences Exercise - 3 рази
        </Link>
      </li>
      <li>
        <Link href="/class/workbook/translate">
          Translation - 1 раз
        </Link>
      </li>
    </ul>
  </UsageHistory>
</WordCard>
```

#### 7.2 Smart Collections
```tsx
<Collections>
  <Collection title="Часто помиляюсь" count={23} />
  <Collection title="З останніх вправ" count={45} />
  <Collection title="Рекомендовано AI" count={18} />
  <Collection title="Для рівня B1" count={120} />
</Collections>
```

---

## 🎨 Дизайн оновлення

### До:
```tsx
// Старий стиль
<div className="rounded-2xl border border-ink/10 bg-paper/95 p-4">
```

### Після:
```tsx
// Новий стиль (як в Workbook)
<div className="rounded-3xl border border-ink/10 bg-paper/80 p-6 shadow-soft
  transition hover:shadow-md hover:-translate-y-[1px]">
```

### Кольорова схема:
- **moss** - learned/correct words
- **gold** - favorites/starred
- **terracotta** - difficult/review needed
- **ink** - neutral/default

---

## 📱 Responsive Design

### Mobile-first approach:
```tsx
// Cards grid
<div className="grid gap-4
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4">
```

### Compact mode для mobile:
- Менше padding
- Приховати secondary info
- Swipe gestures для швидкого review

---

## 🔧 Technical Improvements

### 1. Performance
- **Virtualization** для великих списків (react-window)
- **Lazy loading** зображень та прикладів
- **Debounced search** замість onChange

### 2. Accessibility
- **ARIA labels** для всіх інтерактивних елементів
- **Keyboard navigation** (Tab, Enter, Space)
- **Screen reader** support

### 3. Error handling
- **Loading states** для всіх async операцій
- **Error boundaries** для компонентів
- **Retry mechanisms** для failed requests

---

## 📊 Success Metrics

### Після впровадження відслідковувати:
1. **Engagement**: час проведений у словнику
2. **Retention**: % користувачів що повертаються
3. **Learning**: кількість вивчених слів/день
4. **AI Usage**: скільки разів використовують AI features
5. **Trainer**: completion rate тренажера

---

## 🚀 Приоритети

### Must Have (PHASE 1-2):
1. ✅ Рефакторинг на компоненти
2. ✅ Landing page зі статистикою
3. ✅ Оновлення дизайну

### Should Have (PHASE 3-4):
4. ✅ AI приклади та пояснення
5. ✅ Spaced repetition

### Nice to Have (PHASE 5-7):
6. ⭕ Gamification
7. ⭕ Trainer як окрема сторінка
8. ⭕ Інтеграція з вправами

---

## 💡 Додаткові ідеї

### 1. Voice Practice
- Pronunciation練習
- Speech recognition для перевірки

### 2. Word Families
- Показувати споріднені слова
- Деривації та спряження

### 3. Context Learning
- Слова з реальних текстів
- Тематичні підбірки (в ресторані, на роботі, etc.)

### 4. Social Features
- Shared decks/collections
- Competition з друзями
- Study groups

### 5. Export/Import
- Anki format compatibility
- CSV export для external tools
- Backup/restore vocabulary
