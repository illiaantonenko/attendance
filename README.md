# Attendance System

Веб-система контролю відвідуваності студентів з використанням QR-кодів, геолокації та аналітики в реальному часі.

## 🚀 Технології

- **Backend:** Laravel 12, PHP 8.4
- **Frontend:** React 18, Inertia.js, TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** MySQL 8
- **Cache/Session:** Redis 7
- **WebSocket:** Soketi (Pusher-compatible)
- **Containerization:** Docker, Docker Compose

## 📋 Функціонал

### Реалізовано

- ✅ Автентифікація та авторизація (Laravel Sanctum)
- ✅ Role-based access control (admin, teacher, student)
- ✅ CRUD подій з календарем (FullCalendar)
- ✅ QR-коди з JWT + one-time nonce + TTL
- ✅ Геолокаційна верифікація (Haversine formula)
- ✅ Real-time оновлення через WebSocket (Soketi)
- ✅ Експорт звітів (PDF, Excel)
- ✅ Статистика та аналітика
- ✅ "Мої заняття" для студентів
- ✅ API для мобільного додатку

### Ролі користувачів

| Роль | Можливості |
|------|------------|
| **Admin** | Повний доступ: користувачі, групи, події, статистика |
| **Teacher** | Створення подій, генерація QR, перегляд відвідуваності, експорт |
| **Student** | Сканування QR, перегляд своїх занять та статистики |

## 🐳 Встановлення та запуск

### Вимоги

- Docker Desktop
- Git

### Крок 1: Клонування

```bash
git clone <repository-url>
cd attendance-system
```

### Крок 2: Запуск контейнерів

```bash
docker-compose up -d
```

Зачекайте ~30 секунд, поки всі сервіси стартують.

### Крок 3: Встановлення залежностей

```bash
# PHP залежності
docker-compose exec app composer install

# Node залежності
docker-compose exec node npm install
```

### Крок 4: Налаштування Laravel

```bash
# Генерація ключа (якщо потрібно)
docker-compose exec app php artisan key:generate

# Міграції та демо-дані
docker-compose exec app php artisan migrate --seed

# Оптимізація
docker-compose exec app php artisan optimize
```

### Крок 5: Збірка frontend

```bash
# Production build
docker-compose exec node npm run build

# АБО dev server (для розробки)
docker-compose start node
```

### Готово!

Відкрийте http://localhost:8000

## 👤 Демо облікові записи

| Email | Password | Роль |
|-------|----------|------|
| admin@attendance.local | password | Адміністратор |
| teacher1@attendance.local | password | Викладач |
| student@attendance.local | password | Студент |

## 🌐 Доступні сервіси

| Сервіс | URL | Опис |
|--------|-----|------|
| Web App | http://localhost:8000 | Основний додаток |
| Soketi | http://localhost:9601 | WebSocket dashboard |
| MySQL | localhost:3307 | База даних |
| Redis | localhost:6379 | Кеш та сесії |

## 📁 Структура проекту

```
attendance-system/
├── app/
│   ├── Events/                 # Broadcasting events
│   │   └── AttendanceRegistered.php
│   ├── Exports/                # Excel exports
│   │   ├── EventAttendanceExport.php
│   │   └── GroupStatisticsExport.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/            # API controllers
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── CheckInController.php
│   │   │   │   ├── ExportController.php
│   │   │   │   └── QrController.php
│   │   │   ├── CalendarController.php
│   │   │   ├── DashboardController.php
│   │   │   ├── EventController.php
│   │   │   ├── GroupController.php
│   │   │   ├── MyEventsController.php
│   │   │   ├── StatisticsController.php
│   │   │   └── UserController.php
│   │   └── Middleware/
│   │       └── CheckRole.php
│   ├── Models/
│   │   ├── Event.php
│   │   ├── EventCategory.php
│   │   ├── EventRegistration.php
│   │   ├── Group.php
│   │   ├── Profile.php
│   │   ├── QrToken.php
│   │   └── User.php
│   ├── Policies/
│   │   └── EventPolicy.php
│   └── Services/
│       ├── ExportService.php
│       ├── GeolocationService.php
│       └── QrService.php
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
│       └── DemoSeeder.php
├── docker/
│   ├── nginx/
│   │   └── default.conf
│   └── php/
│       └── Dockerfile
├── resources/
│   ├── css/
│   │   └── app.css
│   ├── js/
│   │   ├── Components/
│   │   │   └── QrScanner.tsx
│   │   ├── Layouts/
│   │   │   ├── AuthenticatedLayout.tsx
│   │   │   └── GuestLayout.tsx
│   │   ├── Pages/
│   │   │   ├── Auth/
│   │   │   ├── Events/
│   │   │   │   ├── Create.tsx
│   │   │   │   ├── Edit.tsx
│   │   │   │   ├── Index.tsx
│   │   │   │   ├── MyEvents.tsx
│   │   │   │   └── Show.tsx
│   │   │   ├── Groups/
│   │   │   ├── Users/
│   │   │   ├── Calendar.tsx
│   │   │   ├── CheckIn.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Statistics.tsx
│   │   ├── echo.ts
│   │   └── app.tsx
│   └── views/
│       ├── app.blade.php
│       └── exports/
│           ├── event-attendance.blade.php
│           └── group-statistics.blade.php
├── routes/
│   ├── api.php
│   └── web.php
├── tests/
│   ├── Feature/
│   │   ├── AuthenticationTest.php
│   │   ├── EventManagementTest.php
│   │   ├── QrCheckInTest.php
│   │   └── RoleAccessTest.php
│   └── Unit/
│       └── GeolocationServiceTest.php
├── docker-compose.yml
└── README.md
```

## 🔒 Безпека

| Механізм | Опис |
|----------|------|
| JWT токени | Підписані QR-коди |
| One-time nonce | Захист від повторного використання |
| TTL 10 хвилин | Автоматичне закінчення QR |
| Геолокація | Перевірка радіусу (Haversine) |
| CSRF | Laravel middleware |
| Role-based | CheckRole middleware |

## 🧪 Тестування

```bash
# Всі тести
docker-compose exec app php artisan test

# Unit тести
docker-compose exec app php artisan test --testsuite=Unit

# Feature тести
docker-compose exec app php artisan test --testsuite=Feature

# Конкретний тест
docker-compose exec app php artisan test --filter=GeolocationServiceTest
```

## 📡 API Endpoints

### Автентифікація
```
POST /api/v1/auth/login      - Вхід
POST /api/v1/auth/register   - Реєстрація
POST /api/v1/auth/logout     - Вихід
```

### Події
```
GET    /api/v1/events        - Список подій
POST   /api/v1/events        - Створення
GET    /api/v1/events/{id}   - Деталі
PUT    /api/v1/events/{id}   - Оновлення
DELETE /api/v1/events/{id}   - Видалення
```

### QR та Check-in
```
POST /api/v1/events/{id}/qr/generate  - Генерація QR
POST /api/v1/events/check-in          - Відмітка
```

### Експорт
```
GET /api/v1/export/event/{id}?format=pdf|xlsx   - Експорт події
GET /api/v1/export/group/{id}?format=pdf|xlsx   - Експорт групи
```

## 🔧 Конфігурація (.env)

```env
# Application
APP_NAME="Attendance System"
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=attendance_db
DB_USERNAME=attendance
DB_PASSWORD=secret

# Cache & Session
CACHE_STORE=redis
SESSION_DRIVER=redis
REDIS_HOST=redis

# Broadcasting (Soketi)
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=attendance-app
PUSHER_APP_KEY=attendance-key
PUSHER_APP_SECRET=attendance-secret
PUSHER_HOST=soketi
PUSHER_PORT=6001

# QR Code
QR_SECRET=your-secret-key
QR_TTL_MINUTES=10
```

## 🔄 Запуск після встановлення

Після першого встановлення (коли вже виконано `npm run build`), для повторного запуску:

### Запуск системи

```bash
# Перейти в папку проекту
cd attendance-system

# Запустити контейнери
docker-compose up -d

# Перевірити статус
docker-compose ps
```

Система буде доступна на http://localhost:8000

### Зупинка системи

```bash
# Зупинити контейнери (дані зберігаються)
docker-compose stop

# АБО зупинити та видалити контейнери (дані в volumes зберігаються)
docker-compose down

# Видалити все включно з volumes (⚠️ ВИДАЛИТЬ БАЗУ ДАНИХ)
docker-compose down -v
```

### Перезапуск

```bash
# Перезапуск всіх контейнерів
docker-compose restart

# Перезапуск конкретного сервісу
docker-compose restart app
docker-compose restart nginx
```

## 🛠️ Корисні команди

```bash
# Статус контейнерів
docker-compose ps

# Перегляд логів (всі)
docker-compose logs -f

# Логи конкретного сервісу
docker-compose logs -f app
docker-compose logs -f nginx

# Очистка кешу Laravel
docker-compose exec app php artisan optimize:clear

# Оптимізація Laravel
docker-compose exec app php artisan optimize

# Оновлення autoload
docker-compose exec app composer dump-autoload

# Rebuild frontend
docker-compose start node
docker-compose exec node npm run build
docker-compose stop node

# Вхід в контейнер
docker-compose exec app bash
docker-compose exec mysql mysql -u attendance -psecret attendance_db
```

## 📚 Документація

- **Технічна документація:** [PROJECT_CURRENT_STATE.md](../PROJECT_CURRENT_STATE.md)
- **Інструкція з розгортання:** [DEPLOYMENT.md](./DEPLOYMENT.md)

### Швидкий старт (GCP)

```bash
# 1. Створити VM
gcloud compute instances create attendance-server \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=http-server,https-server

# 2. Підключитись та встановити Docker
gcloud compute ssh attendance-server --zone=us-central1-a

# 3. Розгорнути (детальніше в DEPLOYMENT.md)
git clone <repo> && cd attendance-system
docker compose up -d
docker compose exec app php artisan migrate --seed
docker compose run --rm node sh -c "npm ci && npm run build"
```

## 👨‍💻 Автор

**Антоненко І.Ю.**  
Магістерська робота  
Національний університет «Полтавська політехніка імені Юрія Кондратюка»  
2025

## 📄 Ліцензія

MIT License