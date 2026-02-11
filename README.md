# Polish Vocab Studio v2.0.0 (Beta)

Платформа для вивчення польської мови з AI підтримкою, відео матеріалами та інтерактивними вправами.

## 🚀 Функціонал

### ✨ Основні можливості
- **Словник** - 10,000+ польських слів з перекладами
- **Тести** - інтерактивні тести для перевірки знань
- **Робочий зошит** - 9 типів вправ
- **Відео матеріали** - навчальний контент з транскриптами
- **AI перевірка** - детальний фідбек по перекладах
- **Промокоди** - гнучка система доступу

## 🛠 Технології

- Next.js 14, React 18, TypeScript
- Tailwind CSS
- MongoDB
- OpenAI API
- JWT Authentication

## 🚢 Deployment на Railway

### 1. Налаштуйте MongoDB Atlas
- Створіть кластер
- Whitelist IP: `0.0.0.0/0`
- Отримайте connection string

### 2. Налаштуйте Railway
Додайте environment variables:
```
MONGODB_URI=<your-mongodb-uri>
MONGODB_DB=polish_vocab
PVS_OPENAI_API_KEY=<your-openai-key>
JWT_SECRET=<random-secret>
ADMIN_BOOTSTRAP_TOKEN=<one-time-admin-token>
ADMIN_BOOTSTRAP_TTL_HOURS=2
MONO_ACQUIRING_TOKEN=<monobank-merchant-token>
MONO_PUBKEY_BASE64=<monobank-pubkey-base64>
MONO_WEBHOOK_URL=<https://your-domain/api/payments/mono/webhook>
MONO_WALLET_SECRET=<random-secret>
CRON_SECRET=<random-secret>
APP_PUBLIC_URL=<https://your-domain>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<your-email>
SMTP_PASS=<app-password>
SMTP_FROM="Polish Vocab Studio <your-email>"
```

### 3. Deploy
Railway автоматично виконає build і запустить додаток.

## 🌱 Ініціалізація бази (seed)

У репозиторії є готовий скрипт `scripts/seed.js`, який засіває базу словами, тестами, читанням та парами дієслів із папки `data/`.

### Як запустити локально
1. Переконайся, що в тебе є `.env.local` або `.env` з параметрами:
```
MONGODB_URI=<your-mongodb-uri>
MONGODB_DB=polish_vocab
```
2. Запусти seed:
```
npm run seed
```

### Що робить seed
- очищує колекції: `words`, `tests`, `reading`, `verb_pairs`
- імпортує JSON з `data/`

Якщо треба засіяти інший набір даних — просто заміни файли в `data/`.

## 📧 Contact
jovalentych@gmail.com

---
**v2.0.0 Beta** 🇵🇱
