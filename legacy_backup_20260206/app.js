// Polish Vocab Trainer (static)
// Works when served via a local HTTP server (not file://)
const $ = (sel) => document.querySelector(sel);

const datasetSelect = $("#datasetSelect");
const modeSelect = $("#modeSelect");
const directionSelect = $("#directionSelect");

const flashcardsView = $("#flashcardsView");
const quizView = $("#quizView");
const listView = $("#listView");

const card = $("#card");
const cardInner = $("#cardInner");
const frontText = $("#frontText");
const backText = $("#backText");
const cardTag = $("#cardTag");
const cardTag2 = $("#cardTag2");
const progressChip = $("#progressChip");

const prevBtn = $("#prevBtn");
const nextBtn = $("#nextBtn");
const shuffleBtn = $("#shuffleBtn");
const knownBtn = $("#knownBtn");
const unknownBtn = $("#unknownBtn");
const resetKnownBtn = $("#resetKnownBtn");

const quizPrompt = $("#quizPrompt");
const quizSub = $("#quizSub");
const quizAnswers = $("#quizAnswers");
const quizChip = $("#quizChip");
const quizNextBtn = $("#quizNextBtn");
const quizTag = $("#quizTag");

const searchInput = $("#searchInput");
const vocabTbody = $("#vocabTbody");
const listCount = $("#listCount");

const appMain = $("#appMain");
const loginModal = $("#loginModal");
const registerModal = $("#registerModal");
const logoutBtn = $("#logoutBtn");
const loginUsername = $("#loginUsername");
const loginPassword = $("#loginPassword");
const registerUsername = $("#registerUsername");
const registerPassword = $("#registerPassword");
const loginBtn = $("#loginBtn");
const registerBtn = $("#registerBtn");
const closeLoginBtn = $("#closeLoginBtn");
const closeRegisterBtn = $("#closeRegisterBtn");
const authStatus = $("#authStatus");
const authStatus2 = $("#authStatus2");

const testView = $("#testView");
const testChip = $("#testChip");
const testStartBtn = $("#testStartBtn");
const testResetBtn = $("#testResetBtn");
const testBody = $("#testBody");
const testSummary = $("#testSummary");
const testProgressText = $("#testProgressText");
const testBarFill = $("#testBarFill");
const testTag = $("#testTag");
const testPrompt = $("#testPrompt");
const testOptions = $("#testOptions");
const testInputWrap = $("#testInputWrap");
const testInput = $("#testInput");
const testCheckTextBtn = $("#testCheckTextBtn");
const testFeedback = $("#testFeedback");
const testPrevBtn = $("#testPrevBtn");
const testNextBtn = $("#testNextBtn");
const testSkipBtn = $("#testSkipBtn");
const summaryScore = $("#summaryScore");
const summaryExtra = $("#summaryExtra");
const attemptList = $("#attemptList");
const wrongList = $("#wrongList");
const reviewWrongBtn = $("#reviewWrongBtn");

const statsView = $("#statsView");
const statsKnown = $("#statsKnown");
const statsTotal = $("#statsTotal");
const statsPercent = $("#statsPercent");
const statsTests = $("#statsTests");
const statsBest = $("#statsBest");
const statsLast = $("#statsLast");
const statsAttempts = $("#statsAttempts");
const adminView = $("#adminView");
const adminUsersBody = $("#adminUsersBody");
const adminUsersCount = $("#adminUsersCount");
const userNameText = $("#userNameText");
const userProgressChip = $("#userProgressChip");

const LEGACY_KNOWN_KEY = "pl_vocab_known_v1";
const LEGACY_TEST_KEY = "pl_test1_history_v1";
const AUTH_TOKEN_KEY = "pl_auth_token_v1";

let verbs = [];
let adverbs = [];
let all = [];

let pool = [];
let index = 0;
let known = new Set();
let direction = "pl-uk";

let testItems = [];
let testIndex = 0;
let testAnswers = {}; // qid -> {value, correct, skipped}
let testStarted = false;
let testReviewWrong = false;
let testHistory = [];
let lastWrongIds = [];
let testPool = [];
let authToken = localStorage.getItem(AUTH_TOKEN_KEY) || null;
let saveTimer = null;
let userRole = "user";
let userName = "";

let quiz = {
  current: null,
  correct: 0,
  total: 0,
};

function loadKnown() {
  known = new Set();
}

function saveKnown() {
  saveProgressDebounced();
}

function setToken(token) {
  authToken = token;
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

function setAuthed(isAuthed) {
  appMain.classList.toggle("hidden", !isAuthed);
  loginModal.classList.add("hidden");
  registerModal.classList.add("hidden");
  logoutBtn.classList.toggle("hidden", !isAuthed);
  const adminOpt = modeSelect.querySelector('option[value="admin"]');
  if (adminOpt) adminOpt.hidden = !isAuthed || userRole !== "admin";
  if (modeSelect.value === "admin" && userRole !== "admin") modeSelect.value = "flashcards";
}

function navigateTo(path) {
  if (window.location.pathname !== path) {
    history.pushState({}, "", path);
  }
}

function syncRoute(isAuthed) {
  const path = window.location.pathname;
  if (!isAuthed && path === "/dashboard") navigateTo("/");
  if (isAuthed && path !== "/dashboard") navigateTo("/dashboard");
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    const err = new Error(msg.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function saveProgressDebounced() {
  if (!authToken) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveProgress(), 400);
}

async function saveProgress() {
  if (!authToken) return;
  await apiFetch("/api/progress", {
    method: "PUT",
    body: JSON.stringify({
      knownIds: [...known],
      testHistory,
      lastWrongIds,
    }),
  });
}

function loadLegacyProgress() {
  let legacyKnown = [];
  let legacyTests = [];
  try {
    const rawKnown = localStorage.getItem(LEGACY_KNOWN_KEY);
    if (rawKnown) legacyKnown = JSON.parse(rawKnown);
  } catch {}
  try {
    const rawTests = localStorage.getItem(LEGACY_TEST_KEY);
    if (rawTests) legacyTests = JSON.parse(rawTests);
  } catch {}
  return {
    legacyKnown: Array.isArray(legacyKnown) ? legacyKnown : [],
    legacyTests: Array.isArray(legacyTests) ? legacyTests : [],
  };
}

function clearLegacyProgress() {
  localStorage.removeItem(LEGACY_KNOWN_KEY);
  localStorage.removeItem(LEGACY_TEST_KEY);
}
function pickPool() {
  const which = datasetSelect.value;
  if (which === "verbs") pool = [...verbs];
  else if (which === "adverbs") pool = [...adverbs];
  else pool = [...all];

  // keep stable order but start at first unknown if possible
  index = Math.min(index, Math.max(0, pool.length - 1));
  // move to first unknown
  const firstUnknown = pool.findIndex((x) => !known.has(x.id));
  if (firstUnknown >= 0) index = firstUnknown;
}

function showMode() {
  const mode = modeSelect.value;
  flashcardsView.classList.toggle("hidden", mode !== "flashcards");
  quizView.classList.toggle("hidden", mode !== "quiz");
  listView.classList.toggle("hidden", mode !== "list");
  testView.classList.toggle("hidden", mode !== "test");
  statsView.classList.toggle("hidden", mode !== "stats");
  adminView.classList.toggle("hidden", mode !== "admin");

  if (mode === "flashcards") renderCard();
  if (mode === "quiz") nextQuiz();
  if (mode === "list") renderList();
  if (mode === "test") renderTestHome();
  if (mode === "stats") renderStats();
  if (mode === "admin") renderAdmin();
}

function getDirectionForItem() {
  const d = directionSelect.value;
  if (d === "mix") return Math.random() < 0.5 ? "pl-uk" : "uk-pl";
  return d;
}

function currentItem() {
  return pool[index] ?? null;
}

function renderProgress() {
  const total = pool.length;
  const knownInPool = pool.filter((x) => known.has(x.id)).length;
  progressChip.textContent = `${knownInPool} / ${total} знаю`;
  const totalAll = all.length;
  const percent = totalAll ? Math.round((known.size / totalAll) * 100) : 0;
  userProgressChip.textContent = `${percent}%`;
  if (modeSelect.value === "stats") renderStats();
}

function renderCard() {
  card.classList.remove("flipped");

  const item = currentItem();
  if (!item) {
    frontText.textContent = "—";
    backText.textContent = "—";
    cardTag.textContent = "";
    cardTag2.textContent = "";
    progressChip.textContent = "0 / 0";
    return;
  }

  direction = getDirectionForItem();
  const front = direction === "pl-uk" ? item.pl : item.uk;
  const back = direction === "pl-uk" ? item.uk : item.pl;

  frontText.textContent = front;
  backText.textContent = back;
  cardTag.textContent = item.pos;
  cardTag2.textContent = direction === "pl-uk" ? "UK" : "PL";

  renderProgress();
}

function nextCard(step = 1) {
  if (!pool.length) return;
  index = (index + step + pool.length) % pool.length;
  renderCard();
}

function shufflePool() {
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  index = 0;
  renderCard();
}

function markKnown(isKnown) {
  const item = currentItem();
  if (!item) return;
  if (isKnown) known.add(item.id);
  else known.delete(item.id);
  saveKnown();
  renderProgress();
  nextCard(1);
}

function renderList() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const which = datasetSelect.value;
  let items = which === "verbs" ? verbs : which === "adverbs" ? adverbs : all;

  if (q) {
    items = items.filter((x) =>
      x.pl.toLowerCase().includes(q) ||
      x.uk.toLowerCase().includes(q) ||
      x.pos.toLowerCase().includes(q)
    );
  }

  listCount.textContent = `${items.length}`;
  vocabTbody.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (const it of items) {
    const tr = document.createElement("tr");

    const tdPl = document.createElement("td");
    tdPl.textContent = it.pl;

    const tdUk = document.createElement("td");
    tdUk.textContent = it.uk;

    const tdPos = document.createElement("td");
    tdPos.textContent = it.pos;

    const tdKnown = document.createElement("td");
    const badge = document.createElement("button");
    badge.className = "kbadge";
    badge.title = "Toggle known";
    badge.textContent = known.has(it.id) ? "✅" : "—";
    badge.addEventListener("click", () => {
      if (known.has(it.id)) known.delete(it.id);
      else known.add(it.id);
      saveKnown();
      renderList();
      renderProgress();
    });
    tdKnown.appendChild(badge);

    tr.appendChild(tdPl);
    tr.appendChild(tdUk);
    tr.appendChild(tdPos);
    tr.appendChild(tdKnown);
    frag.appendChild(tr);
  }

  vocabTbody.appendChild(frag);
}

function sampleChoices(correct, items, k=4) {
  const choices = [correct];
  while (choices.length < k) {
    const cand = items[Math.floor(Math.random() * items.length)];
    if (cand.id !== correct.id && !choices.some((c) => c.id === cand.id)) choices.push(cand);
  }
  // shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

function nextQuiz() {
  const which = datasetSelect.value;
  const items = which === "verbs" ? verbs : which === "adverbs" ? adverbs : all;
  if (!items.length) return;

  const item = items[Math.floor(Math.random() * items.length)];
  quiz.current = item;
  quiz.total += 1;

  const d = getDirectionForItem();
  const prompt = d === "pl-uk" ? item.pl : item.uk;
  const answer = d === "pl-uk" ? item.uk : item.pl;

  quizPrompt.textContent = prompt;
  quizSub.textContent = d === "pl-uk" ? "Обери переклад українською" : "Wybierz tłumaczenie po polsku";
  quizTag.textContent = item.pos + " • " + (d === "pl-uk" ? "PL→UK" : "UK→PL");

  const choices = sampleChoices(item, items, 4).map((x) => ({
    id: x.id,
    text: d === "pl-uk" ? x.uk : x.pl,
    correct: x.id === item.id
  }));

  quizAnswers.innerHTML = "";
  for (const ch of choices) {
    const btn = document.createElement("button");
    btn.className = "answerBtn";
    btn.textContent = ch.text;
    btn.addEventListener("click", () => {
      // lock
      [...quizAnswers.querySelectorAll("button")].forEach((b) => b.disabled = true);
      if (ch.correct) {
        btn.classList.add("correct");
        quiz.correct += 1;
        known.add(item.id); // nice bonus
        saveKnown();
      } else {
        btn.classList.add("wrong");
        // show correct
        for (const b of quizAnswers.querySelectorAll("button")) {
          if (b.textContent === answer) b.classList.add("correct");
        }
      }
      quizChip.textContent = `${quiz.correct} / ${quiz.total} correct`;
      renderProgress();
    });
    quizAnswers.appendChild(btn);
  }

  quizChip.textContent = `${quiz.correct} / ${quiz.total} correct`;
}

function renderStats() {
  const total = all.length;
  const knownCount = known.size;
  const percent = total ? Math.round((knownCount / total) * 100) : 0;
  const attempts = Array.isArray(testHistory) ? testHistory : [];
  const testsCount = attempts.length;
  const best = testsCount ? Math.max(...attempts.map((x) => x.percent || 0)) : 0;
  const last = testsCount ? attempts[0] : null;

  statsKnown.textContent = `${knownCount}`;
  statsTotal.textContent = `${total}`;
  statsPercent.textContent = `${percent}%`;
  statsTests.textContent = `${testsCount}`;
  statsBest.textContent = `${best}%`;
  statsLast.textContent = last ? `${last.score}/${last.total} • ${last.percent}%` : "—";

  statsAttempts.innerHTML = "";
  if (!testsCount) {
    statsAttempts.innerHTML = `<div class="attemptItem"><span class="muted">Brak prób</span><span></span></div>`;
  } else {
    for (const h of attempts.slice(0, 8)) {
      const row = document.createElement("div");
      row.className = "attemptItem";
      row.innerHTML = `<span>${new Date(h.ts).toLocaleString()}</span><span>${h.score}/${h.total} • ${h.percent}%</span>`;
      statsAttempts.appendChild(row);
    }
  }
}

async function renderAdmin() {
  if (userRole !== "admin") return;
  try {
    const res = await apiFetch("/api/admin/users");
    const users = res.users || [];
    adminUsersCount.textContent = `${users.length}`;
    adminUsersBody.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const u of users) {
      const tr = document.createElement("tr");
      const tdUser = document.createElement("td");
      const tdRole = document.createElement("td");
      const tdCreated = document.createElement("td");
      const tdLast = document.createElement("td");
      const tdKnown = document.createElement("td");
      const tdTests = document.createElement("td");

      tdUser.textContent = u.username;
      tdRole.textContent = u.role;
      tdCreated.textContent = u.createdAt ? new Date(u.createdAt).toLocaleString() : "—";
      tdLast.textContent = u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "—";
      tdKnown.textContent = `${u.knownCount}`;
      tdTests.textContent = `${u.testsCount}`;

      tr.appendChild(tdUser);
      tr.appendChild(tdRole);
      tr.appendChild(tdCreated);
      tr.appendChild(tdLast);
      tr.appendChild(tdKnown);
      tr.appendChild(tdTests);
      frag.appendChild(tr);
    }
    adminUsersBody.appendChild(frag);
  } catch (err) {
    adminUsersBody.innerHTML = `<tr><td colspan="6">Błąd: ${err.message}</td></tr>`;
  }
}

async function bootAuthed() {
  loadKnown();

  const [me, vocab, tests, progress] = await Promise.all([
    apiFetch("/api/me"),
    apiFetch("/api/vocab?dataset=all"),
    apiFetch("/api/tests"),
    apiFetch("/api/progress"),
  ]);

  userRole = me.role || "user";
  userName = me.username || "";
  userNameText.textContent = userName || "—";
  all = vocab.items || [];
  verbs = all.filter((x) => x.dataset === "verbs");
  adverbs = all.filter((x) => x.dataset === "adverbs");

  testItems = (tests.items || []).map((q) => ({
    ...q,
    // normalize type: treat questions without options as text
    type: (q.type === "mcq" && q.options && q.options.length >= 2) ? "mcq" : "text"
  }));

  known = new Set(Array.isArray(progress?.knownIds) ? progress.knownIds : []);
  testHistory = Array.isArray(progress?.testHistory) ? progress.testHistory : [];
  lastWrongIds = Array.isArray(progress?.lastWrongIds) ? progress.lastWrongIds : [];

  // One-time legacy localStorage migration if server progress is empty
  if (!known.size && !testHistory.length) {
    const { legacyKnown, legacyTests } = loadLegacyProgress();
    if (legacyKnown.length || legacyTests.length) {
      known = new Set(legacyKnown);
      testHistory = legacyTests.slice(0, 20);
      await saveProgress();
      clearLegacyProgress();
    }
  }

  pickPool();
  showMode();
  renderProgress();
  renderStats();
}

function toggleFlip() {
  card.classList.toggle("flipped");
}

async function handleAuth(endpoint) {
  const username = endpoint === "login" ? loginUsername.value.trim() : registerUsername.value.trim();
  const password = endpoint === "login" ? loginPassword.value : registerPassword.value;
  const statusEl = endpoint === "login" ? authStatus : authStatus2;
  if (!username || !password) {
    statusEl.textContent = "Wpisz username i hasło.";
    return;
  }
  if (password.length < 8) {
    statusEl.textContent = "Hasło musi mieć min. 8 znaków.";
    return;
  }
  try {
    statusEl.textContent = "Ładowanie...";
    const res = await apiFetch(`/api/auth/${endpoint}`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(res.token);
    loginPassword.value = "";
    registerPassword.value = "";
    await init();
  } catch (err) {
    statusEl.textContent = err.message || "Błąd logowania";
  }
}

closeLoginBtn.addEventListener("click", () => {
  loginModal.classList.add("hidden");
  navigateTo("/");
});
closeRegisterBtn.addEventListener("click", () => {
  registerModal.classList.add("hidden");
  navigateTo("/");
});
loginBtn.addEventListener("click", () => handleAuth("login"));
registerBtn.addEventListener("click", () => handleAuth("register"));
loginPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleAuth("login");
});
registerPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleAuth("register");
});

logoutBtn.addEventListener("click", () => {
  setToken(null);
  setAuthed(false);
  authStatus.textContent = "Wylogowano.";
  userRole = "user";
  userName = "";
  userNameText.textContent = "—";
  navigateTo("/");
});

document.querySelectorAll("[data-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.getAttribute("data-mode");
    if (!mode) return;
    modeSelect.value = mode;
    showMode();
  });
});

datasetSelect.addEventListener("change", () => {
  pickPool();
  if (modeSelect.value === "list") renderList();
  if (modeSelect.value === "quiz") nextQuiz();
  if (modeSelect.value === "flashcards") renderCard();
});

modeSelect.addEventListener("change", showMode);
directionSelect.addEventListener("change", () => {
  if (modeSelect.value === "flashcards") renderCard();
  if (modeSelect.value === "quiz") nextQuiz();
});

prevBtn.addEventListener("click", () => nextCard(-1));
nextBtn.addEventListener("click", () => nextCard(1));
shuffleBtn.addEventListener("click", () => shufflePool());
knownBtn.addEventListener("click", () => markKnown(true));
unknownBtn.addEventListener("click", () => markKnown(false));
resetKnownBtn.addEventListener("click", () => {
  known = new Set();
  saveKnown();
  renderProgress();
  if (modeSelect.value === "list") renderList();
});

card.addEventListener("click", toggleFlip);
card.addEventListener("keydown", (e) => {
  if (e.code === "Space") { e.preventDefault(); toggleFlip(); }
  if (e.code === "Enter") { e.preventDefault(); markKnown(true); }
});

quizNextBtn.addEventListener("click", nextQuiz);
searchInput.addEventListener("input", renderList);

window.addEventListener("keydown", (e) => {
  if (modeSelect.value !== "flashcards") return;
  if (e.code === "ArrowLeft") nextCard(-1);
  if (e.code === "ArrowRight") nextCard(1);
  if (e.code === "Space") { e.preventDefault(); toggleFlip(); }
  if (e.code === "Enter") { e.preventDefault(); markKnown(true); }
  if (e.key?.toLowerCase() === "s") shufflePool();
});

async function init() {
  if (!authToken) {
    setAuthed(false);
    authStatus.textContent = "Zaloguj się, aby kontynuować.";
    syncRoute(false);
    openAuthModalFromRoute();
    return;
  }
  try {
    setAuthed(true);
    authStatus.textContent = "—";
    await bootAuthed();
    setAuthed(true);
    syncRoute(true);
  } catch (err) {
    console.error(err);
    setToken(null);
    setAuthed(false);
    authStatus.textContent = "Błąd logowania. Sprawdź API i spróbuj ponownie.";
    syncRoute(false);
    openAuthModalFromRoute();
  }
}

init();

window.addEventListener("popstate", () => {
  if (!authToken) {
    setAuthed(false);
  } else {
    setAuthed(true);
  }
  syncRoute(!!authToken);
  if (!authToken) openAuthModalFromRoute();
});

function openAuthModalFromRoute() {
  const path = window.location.pathname;
  if (path === "/login") {
    loginModal.classList.remove("hidden");
    registerModal.classList.add("hidden");
    return true;
  }
  if (path === "/register") {
    registerModal.classList.remove("hidden");
    loginModal.classList.add("hidden");
    return true;
  }
  loginModal.classList.add("hidden");
  registerModal.classList.add("hidden");
  return false;
}

function normalizeText(s){
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[“”„]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .normalize("NFD").replace(/\p{Diacritic}/gu, ""); // strip diacritics for tolerant checking
}

function loadTestHistory(){
  return Array.isArray(testHistory) ? testHistory : [];
}

function saveTestHistory(arr){
  testHistory = Array.isArray(arr) ? arr.slice(0, 20) : [];
  saveProgressDebounced();
}

function renderTestHome(){
  testBody.classList.add("hidden");
  testSummary.classList.add("hidden");
  testStartBtn.classList.remove("hidden");
  testResetBtn.classList.add("hidden");

  const total = testItems.length;
  testChip.textContent = `Test • ${total} pytań`;

  // show last attempts
  const hist = loadTestHistory();
  attemptList.innerHTML = "";
  if (!hist.length){
    attemptList.innerHTML = `<div class="attemptItem"><span class="muted">Brak prób</span><span></span></div>`;
  } else {
    for (const h of hist.slice(0,6)){
      const row = document.createElement("div");
      row.className = "attemptItem";
      row.innerHTML = `<span>${new Date(h.ts).toLocaleString()}</span><span>${h.score}/${h.total} • ${h.percent}%</span>`;
      attemptList.appendChild(row);
    }
  }
}

function startTest({reviewWrong=false} = {}){
  testReviewWrong = reviewWrong;
  testStarted = true;
  testIndex = 0;
  testAnswers = {};
  testPool = buildTestPool();
  testStartBtn.classList.add("hidden");
  testResetBtn.classList.remove("hidden");

  testSummary.classList.add("hidden");
  testBody.classList.remove("hidden");

  renderTestQuestion();
}

function resetTest(){
  testStarted = false;
  testIndex = 0;
  testAnswers = {};
  testReviewWrong = false;
  testPool = [];
  renderTestHome();
}

function getTestPool(){
  // if reviewing wrong, build a filtered list from last summary stored in-memory in wrongList dataset
  return testPool.length ? testPool : testItems;
}

function buildTestPool() {
  if (testReviewWrong && lastWrongIds.length) {
    const subset = testItems.filter((x) => lastWrongIds.includes(x.id));
    if (subset.length) return subset;
  }
  return testItems;
}

function renderTestQuestion(){
  const pool = getTestPool();
  const total = pool.length;
  const q = pool[testIndex];
  if (!q){
    finishTest();
    return;
  }

  testChip.textContent = `Test • ${testIndex+1}/${total}`;
  testProgressText.textContent = `Pytanie ${q.number} (${q.type === "mcq" ? "A/B/C" : "wpisz"})`;
  testBarFill.style.width = `${Math.round(((testIndex)/total)*100)}%`;

  testTag.textContent = `Q${q.number}`;
  testPrompt.textContent = q.prompt;

  testFeedback.textContent = "";
  testOptions.innerHTML = "";
  testInputWrap.classList.toggle("hidden", q.type !== "text");
  testInput.value = "";

  // disable nav back at first
  testPrevBtn.disabled = testIndex === 0;

  if (q.type === "mcq"){
    for (const opt of q.options){
      const btn = document.createElement("button");
      btn.className = "testOptionBtn";
      btn.textContent = `${opt.id}) ${opt.text}`;
      btn.addEventListener("click", () => checkMcq(opt.id));
      testOptions.appendChild(btn);
    }
  }
}

function checkMcq(choice){
  const q = getTestPool()[testIndex];
  const correct = (q.answer || "").toString().toLowerCase() === choice.toLowerCase();
  testAnswers[q.id] = { value: choice, correct, skipped:false };

  // lock buttons + show feedback
  [...testOptions.querySelectorAll("button")].forEach((b) => b.disabled = true);
  for (const b of testOptions.querySelectorAll("button")){
    const id = b.textContent.trim().slice(0,1).toLowerCase();
    if (id === (q.answer || "").toString().toLowerCase()) b.classList.add("correct");
    if (id === choice.toLowerCase() && !correct) b.classList.add("wrong");
  }
  testFeedback.textContent = correct ? "✅ Poprawnie" : `❌ Źle. Poprawna: ${q.answer})`;
}

function checkText(){
  const q = getTestPool()[testIndex];
  const user = normalizeText(testInput.value);
  const keys = Array.isArray(q.answer) ? q.answer : [q.answer];
  const keyNorm = keys.map((x) => normalizeText(x));
  const correct = keyNorm.includes(user);

  testAnswers[q.id] = { value: testInput.value, correct, skipped:false };

  testFeedback.textContent = correct ? "✅ Poprawnie" : `❌ Źle. Przykład: ${Array.isArray(q.answer) ? q.answer[0] : q.answer}`;
}

function skipQuestion(){
  const q = getTestPool()[testIndex];
  testAnswers[q.id] = { value: null, correct:false, skipped:true };
  nextTest();
}

function nextTest(){
  // allow moving forward even if not answered
  testIndex += 1;
  if (testIndex >= getTestPool().length){
    finishTest();
    return;
  }
  renderTestQuestion();
}

function prevTest(){
  testIndex = Math.max(0, testIndex - 1);
  renderTestQuestion();
}

function finishTest(){
  const pool = getTestPool();
  const total = pool.length;
  let score = 0;
  const wrong = [];
  const skipped = [];
  for (const q of pool){
    const a = testAnswers[q.id];
    if (a?.correct) score += 1;
    else wrong.push(q);
    if (a?.skipped) skipped.push(q);
  }
  const percent = total ? Math.round((score/total)*100) : 0;
  lastWrongIds = wrong.map((q) => q.id);

  // save attempt
  const hist = loadTestHistory();
  hist.unshift({ ts: Date.now(), score, total, percent });
  saveTestHistory(hist);

  // render summary
  testBody.classList.add("hidden");
  testSummary.classList.remove("hidden");
  summaryScore.textContent = `${score}/${total}`;
  summaryExtra.textContent = `Wynik: ${percent}% • Błędy: ${wrong.length} • Pominięte: ${skipped.length}`;

  attemptList.innerHTML = "";
  for (const h of hist.slice(0,6)){
    const row = document.createElement("div");
    row.className = "attemptItem";
    row.innerHTML = `<span>${new Date(h.ts).toLocaleString()}</span><span>${h.score}/${h.total} • ${h.percent}%</span>`;
    attemptList.appendChild(row);
  }

  wrongList.innerHTML = "";
  if (!wrong.length){
    wrongList.innerHTML = `<div class="wrongItem"><div class="wrongItemTitle">🎉 Wszystko poprawnie</div></div>`;
  } else {
    for (const q of wrong.slice(0, 30)){
      const div = document.createElement("div");
      div.className = "wrongItem";
      const ua = testAnswers[q.id]?.value;
      div.innerHTML = `
        <div class="wrongItemTitle">Q${q.number}. ${q.prompt}</div>
        <div class="wrongItemMeta">Twoja: ${ua ?? "—"} • Poprawna: ${Array.isArray(q.answer) ? q.answer[0] : q.answer}</div>
      `;
      div.addEventListener("click", () => {
        // jump to this question for quick retry
        testIndex = pool.findIndex((x) => x.id === q.id);
        testBody.classList.remove("hidden");
        testSummary.classList.add("hidden");
        renderTestQuestion();
      });
      wrongList.appendChild(div);
    }
  }

  testBarFill.style.width = "100%";
  renderStats();
}

testStartBtn.addEventListener("click", () => startTest());
testResetBtn.addEventListener("click", () => resetTest());
testPrevBtn.addEventListener("click", prevTest);
testNextBtn.addEventListener("click", nextTest);
testSkipBtn.addEventListener("click", skipQuestion);
testCheckTextBtn.addEventListener("click", checkText);
testInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkText();
});
reviewWrongBtn.addEventListener("click", () => {
  if (!lastWrongIds.length) {
    testFeedback.textContent = "Brak błędów do powtórki.";
    return;
  }
  startTest({ reviewWrong: true });
});
