# 🚀 Deployment Guide для Railway

## Передумови

### 1. MongoDB Atlas
1. Створіть акаунт на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Створіть новий кластер (Free tier M0 достатньо для тестування)
3. Database Access:
   - Створіть database user
   - Запам'ятайте username та password
4. Network Access:
   - Додайте IP: `0.0.0.0/0` (доступ з будь-якої IP)
5. Отримайте connection string:
   - Connect → Drivers → Copy connection string
   - Замініть `<password>` на ваш пароль

### 2. OpenAI API
1. Зареєструйтесь на [OpenAI Platform](https://platform.openai.com)
2. Додайте кредити на рахунок (мінімум $5)
3. Створіть API key: API keys → Create new secret key
4. Збережіть ключ (показується тільки раз!)

### 3. Email (SMTP)
**Для Gmail:**
1. Увійдіть в Google Account
2. Security → 2-Step Verification (увімкніть)
3. Security → App passwords
4. Створіть app password для "Mail"
5. Збережіть згенерований пароль (16 символів)

## Крок 1: Підготовка коду

### Перевірте package.json
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

### Переконайтеся що є .env.example
Файл повинен містити всі необхідні змінні без реальних значень.

## Крок 2: Railway Setup

### 1. Створіть Railway проект
1. Відкрийте [Railway](https://railway.app)
2. Sign up або Login
3. New Project → Deploy from GitHub repo
4. Авторизуйте GitHub
5. Оберіть репозиторій

### 2. Налаштуйте Environment Variables
У Railway проекті → Variables → RAW Editor:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=polish_vocab
PVS_OPENAI_API_KEY=sk-...
JWT_SECRET=your-random-secret-min-32-chars
ADMIN_BOOTSTRAP_TOKEN=one-time-admin-token
ADMIN_BOOTSTRAP_TTL_HOURS=2
MONO_ACQUIRING_TOKEN=your-monobank-merchant-token
MONO_PUBKEY_BASE64=your-monobank-pubkey-base64
MONO_WEBHOOK_URL=https://your-domain/api/payments/mono/webhook
MONO_WALLET_SECRET=random-secret
CRON_SECRET=random-secret
APP_PUBLIC_URL=https://your-domain
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="Polish Vocab Studio <your-email@gmail.com>"
```

**Важливо:**
- `JWT_SECRET` - згенеруйте випадковий string (мін. 32 символа)
- `ADMIN_BOOTSTRAP_TOKEN` - одноразовий токен для bootstrap адміна (використати при реєстрації)
- `ADMIN_BOOTSTRAP_TTL_HOURS` - TTL для резерву токена (за замовчуванням 2 години)
- `MONO_ACQUIRING_TOKEN` - токен монобанк еквайрингу
- `MONO_PUBKEY_BASE64` - публічний ключ для перевірки webhook підпису
- `MONO_WEBHOOK_URL` - URL для webhook від monobank
- `MONO_WALLET_SECRET` - секрет для стабільного walletId (автопродовження)
- `CRON_SECRET` - секрет для виклику cron-ендпоінту
- `APP_PUBLIC_URL` - базовий URL сайту (для redirect/webhook)

### 3. Deploy
1. Railway автоматично почне build
2. Дочекайтесь завершення (2-5 хвилин)
3. Відкрийте згенерований URL

## Крок 3: Перевірка після deployment

### 1. Перевірте базу даних
- Зайдіть в MongoDB Atlas → Collections
- Повинні з'явитись колекції після першого запуску

### 2. Створіть першого адміна
1. Відкрийте додаток
2. Register → передайте `adminToken` = `ADMIN_BOOTSTRAP_TOKEN` при реєстрації
3. Підтвердіть email
4. Зайдіть → перевірте доступ до `/admin`

### 3. Перевірте функціонал
- ✅ Реєстрація та логін
- ✅ Email підтвердження
- ✅ Словник
- ✅ Тести
- ✅ Робочий зошит
- ✅ AI вправи (перевірте що AI credits списуються)
- ✅ Admin панель

## Крок 4: Початкові дані

### Додайте контент в адмінці:
1. **Відео категорії**:
   - Адмін → Content → Відео менеджмент → Categories
   - Створіть категорії (наприклад: "Пізнавальний контент", "Граматика")

2. **Відео**:
   - Додайте відео з YouTube
   - Вкажіть категорію, рівень, тривалість
   - Додайте транскрипти та словники

3. **Промокоди**:
   - Адмін → Monetization → Система промокодів
   - Створіть тестові промокоди для бета-тестерів

## Troubleshooting

### Build Fails
```
Error: Cannot find module 'xyz'
```
**Fix:** `npm install` локально і commit package-lock.json

### MongoDB Connection Error
```
MongoServerError: bad auth
```
**Fix:** 
- Перевірте username/password в connection string
- Перевірте що user створений в правильному database
- Перевірте IP whitelist (має бути 0.0.0.0/0)

### OpenAI API Error
```
Error: 429 Rate limit exceeded
```
**Fix:**
- Перевірте баланс на OpenAI
- Перевірте rate limits вашого plan
- Додайте кредити

### Email не відправляються
```
Error: Invalid login
```
**Fix:**
- Для Gmail використовуйте App Password (не звичайний пароль)
- Перевірте що 2FA увімкнена
- Перевірте SMTP_PORT (465 для SSL)

### Railway Domain не працює
**Fix:**
- Settings → Networking → Generate Domain
- Дочекайтесь DNS propagation (до 5 хвилин)

## Моніторинг

### Logs
Railway → Deployments → View Logs

### Database
MongoDB Atlas → Metrics → Connections, Operations

### OpenAI Usage
OpenAI Platform → Usage → Track costs

## Безпека

### Production Checklist:
- [ ] Всі secrets в environment variables
- [ ] MongoDB IP whitelist налаштований
- [ ] HTTPS увімкнений (Railway автоматично)
- [ ] JWT_SECRET унікальний та складний
- [ ] CORS налаштований
- [ ] Rate limiting на AI endpoints
- [ ] Error handling не показує sensitive info

## Масштабування

### Якщо потрібно більше resources:
1. Railway → Settings → Change plan
2. MongoDB Atlas → Upgrade cluster tier
3. OpenAI → Перевірте limits для вашого usage tier

## Backup

### MongoDB
1. Atlas → Clusters → Backup
2. Налаштуйте automated backups
3. Або manual export: `mongodump`

### Code
- Push всі зміни в GitHub
- Railway автоматично redeploy при push

## Support

При проблемах:
1. Перевірте Railway logs
2. Перевірте MongoDB Atlas metrics
3. Перевірте OpenAI usage
4. Email: jovalentych@gmail.com

---

**Ready to deploy!** 🚀
