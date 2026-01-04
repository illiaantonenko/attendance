# Deployment Guide - Attendance System

Інструкція з розгортання системи контролю відвідуваності на Google Cloud Platform.

## 📋 Зміст

1. [Архітектура](#архітектура)
2. [Вимоги](#вимоги)
3. [Створення VM на GCP](#створення-vm-на-gcp)
4. [Встановлення Docker](#встановлення-docker)
5. [Розгортання проекту](#розгортання-проекту)
6. [Налаштування домену та SSL](#налаштування-домену-та-ssl)
7. [Обслуговування](#обслуговування)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Архітектура

```
┌─────────────────────────────────────────────────────────────────┐
│                     Google Cloud Platform                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Compute Engine VM                         │  │
│  │                   (e2-small, 2GB RAM)                      │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                 Docker Compose                       │  │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐ │  │  │
│  │  │  │  Nginx  │  │   PHP   │  │  MySQL  │  │ Redis  │ │  │  │
│  │  │  │  :80    │──│   App   │──│  :3306  │  │ :6379  │ │  │  │
│  │  │  │  :443   │  │  :9000  │  │         │  │        │ │  │  │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └────────┘ │  │  │
│  │  │       │                                      │      │  │  │
│  │  │       │            ┌─────────┐               │      │  │  │
│  │  │       └────────────│ Soketi  │───────────────┘      │  │  │
│  │  │                    │  :6001  │                      │  │  │
│  │  │                    └─────────┘                      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    Internet     │
                    │  Users/Clients  │
                    └─────────────────┘
```

### Контейнери Docker

| Контейнер | Image | Порт | Опис |
|-----------|-------|------|------|
| attendance-nginx | nginx:alpine | 80, 443 | Веб-сервер, SSL termination |
| attendance-app | php:8.4-fpm | 9000 | Laravel додаток |
| attendance-mysql | mysql:8.0 | 3306 | База даних |
| attendance-redis | redis:7-alpine | 6379 | Кеш, сесії |
| attendance-soketi | soketi:1.6 | 6001 | WebSocket сервер |
| attendance-node | node:20-alpine | - | Збірка frontend (тимчасовий) |

---

## ✅ Вимоги

### Google Cloud Platform
- Акаунт GCP з активованим білінгом
- Встановлений [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Проект в GCP

### Домен (опціонально, для SSL)
- Зареєстрований домен
- Доступ до DNS налаштувань

---

## 🖥️ Створення VM на GCP

### Крок 1: Авторизація в GCP

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Крок 2: Створення VM

```bash
gcloud compute instances create attendance-server \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --tags=http-server,https-server
```

**Параметри:**
- `e2-small` - 2 vCPU, 2GB RAM (~$13/місяць, покривається free tier credits)
- `ubuntu-2204-lts` - Ubuntu 22.04 LTS
- `30GB` - достатньо для Docker images та даних

### Крок 3: Налаштування Firewall

```bash
# HTTP (порт 80)
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 \
  --target-tags=http-server \
  --description="Allow HTTP traffic"

# HTTPS (порт 443)
gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 \
  --target-tags=https-server \
  --description="Allow HTTPS traffic"

# WebSocket (порт 6001) - опціонально, для Soketi
gcloud compute firewall-rules create allow-websocket \
  --allow=tcp:6001 \
  --target-tags=http-server \
  --description="Allow WebSocket traffic"
```

### Крок 4: Підключення до VM

```bash
gcloud compute ssh attendance-server --zone=us-central1-a
```

---

## 🐳 Встановлення Docker

На VM виконайте:

```bash
# Оновлення системи
sudo apt update && sudo apt upgrade -y

# Встановлення залежностей
sudo apt install -y ca-certificates curl gnupg

# Додавання Docker репозиторію
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Встановлення Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Додавання користувача в групу docker
sudo usermod -aG docker $USER
newgrp docker

# Перевірка
docker --version
docker compose version
```

---

## 📦 Розгортання проекту

### Крок 1: Завантаження проекту

**Варіант A: Через Git (рекомендовано)**
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/attendance-system.git
cd attendance-system
```

**Варіант B: Через архів**
```bash
# На локальній машині
tar -czvf attendance-system.tar.gz attendance-system/

# Завантаження на VM (з локальної машини)
gcloud compute scp attendance-system.tar.gz attendance-server:~ --zone=us-central1-a

# На VM
tar -xzvf attendance-system.tar.gz
cd attendance-system
```

### Крок 2: Налаштування .env

```bash
cp .env.example .env
nano .env
```

**Мінімальні зміни для production:**

```env
APP_NAME="Attendance System"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=attendance_db
DB_USERNAME=attendance
DB_PASSWORD=secret

CACHE_STORE=redis
SESSION_DRIVER=redis
REDIS_HOST=redis

VITE_PUSHER_HOST=your-domain.com
VITE_PUSHER_PORT=6001
VITE_PUSHER_SCHEME=https
```

### Крок 3: Запуск Docker контейнерів

```bash
docker compose up -d
```

Зачекайте 1-2 хвилини поки всі контейнери запустяться.

### Крок 4: Налаштування Laravel

```bash
# Встановити права
sudo chmod -R 777 storage bootstrap/cache

# PHP залежності
docker compose exec app composer install --no-dev --optimize-autoloader

# Генерація ключа
docker compose exec app php artisan key:generate --force

# Міграції
docker compose exec app php artisan migrate --force

# Демо-дані (опціонально)
docker compose exec app php artisan db:seed --force

# Оптимізація
docker compose exec app php artisan optimize
```

### Крок 5: Збірка Frontend

```bash
docker compose run --rm node sh -c "npm ci && npm run build"

# Видалити hot file якщо є
rm -f public/hot
```

### Крок 6: Перевірка

```bash
# Статус контейнерів
docker compose ps

# Логи
docker compose logs -f app
```

Відкрийте `http://YOUR_VM_IP` у браузері.

---

## 🔒 Налаштування домену та SSL

### Крок 1: DNS налаштування

У панелі вашого домену додайте A-запис:

| Тип | Ім'я | Значення |
|-----|------|----------|
| A | @ або subdomain | VM_IP_ADDRESS |

### Крок 2: Встановлення Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Крок 3: Налаштування Nginx для SSL

Створіть конфіг для certbot:

```bash
sudo nano /etc/nginx/sites-available/attendance
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Крок 4: Отримання SSL сертифіката

```bash
sudo certbot --nginx -d your-domain.com
```

### Крок 5: Оновлення .env

```bash
nano ~/attendance-system/.env
```

```env
APP_URL=https://your-domain.com
VITE_PUSHER_HOST=your-domain.com
VITE_PUSHER_SCHEME=https
```

### Крок 6: Перезбірка та перезапуск

```bash
docker compose run --rm node sh -c "npm run build"
docker compose exec app php artisan config:clear
docker compose exec app php artisan optimize
docker compose restart app nginx
```

---

## 🔧 Обслуговування

### Оновлення коду

```bash
cd ~/attendance-system

# Завантажити зміни
git pull origin main

# Оновити залежності (якщо змінились)
docker compose exec app composer install --no-dev --optimize-autoloader
docker compose run --rm node sh -c "npm ci && npm run build"

# Міграції (якщо є нові)
docker compose exec app php artisan migrate --force

# Очистити кеш
docker compose exec app php artisan optimize:clear
docker compose exec app php artisan optimize

# Перезапустити
docker compose restart app nginx
```

### Резервне копіювання

```bash
# Backup бази даних
docker compose exec mysql mysqldump -u attendance -psecret attendance_db > backup_$(date +%Y%m%d).sql

# Backup всього проекту
tar -czvf backup_$(date +%Y%m%d).tar.gz ~/attendance-system
```

### Логи

```bash
# Всі логи
docker compose logs -f

# Логи конкретного сервісу
docker compose logs -f app
docker compose logs -f nginx
docker compose logs -f mysql

# Laravel логи
tail -f ~/attendance-system/storage/logs/laravel.log
```

### Моніторинг ресурсів

```bash
# Використання контейнерами
docker stats

# Системні ресурси
htop
df -h
```

---

## 🚨 Troubleshooting

### Проблема: Permission denied

```bash
sudo chmod -R 777 storage bootstrap/cache
sudo chown -R $USER:$USER ~/attendance-system
```

### Проблема: MySQL connection refused

```bash
# Перевірте чи mysql запущений
docker compose ps mysql

# Перевірте логи
docker compose logs mysql

# Перестворіть користувача
docker compose exec mysql mysql -u root -proot
> CREATE USER IF NOT EXISTS 'attendance'@'%' IDENTIFIED BY 'secret';
> GRANT ALL PRIVILEGES ON attendance_db.* TO 'attendance'@'%';
> FLUSH PRIVILEGES;
```

### Проблема: 502 Bad Gateway

```bash
# Перевірте PHP-FPM
docker compose logs app

# Перезапустіть
docker compose restart app nginx
```

### Проблема: Assets не завантажуються (0.0.0.0:5173)

```bash
# Видаліть hot file
rm -f ~/attendance-system/public/hot

# Перезберіть frontend
docker compose run --rm node sh -c "npm run build"
```

### Проблема: Геолокація не працює

Геолокація вимагає HTTPS. Переконайтесь що:
1. SSL сертифікат встановлений
2. APP_URL починається з `https://`
3. VITE_PUSHER_SCHEME=https

---

## 📁 Docker файли

### docker-compose.yml

```yaml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
    container_name: attendance-app
    restart: unless-stopped
    working_dir: /var/www
    volumes:
      - ./:/var/www
      - ./docker/php/php.ini:/usr/local/etc/php/conf.d/local.ini
    networks:
      - attendance-network
    depends_on:
      - mysql
      - redis

  nginx:
    image: nginx:alpine
    container_name: attendance-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./:/var/www
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    networks:
      - attendance-network
    depends_on:
      - app

  mysql:
    image: mysql:8.0
    container_name: attendance-mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: attendance_db
      MYSQL_ROOT_PASSWORD: root
      MYSQL_USER: attendance
      MYSQL_PASSWORD: secret
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - attendance-network

  redis:
    image: redis:7-alpine
    container_name: attendance-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - attendance-network
    command: redis-server --appendonly yes

  soketi:
    image: quay.io/soketi/soketi:1.6-16-debian
    container_name: attendance-soketi
    restart: unless-stopped
    ports:
      - "6001:6001"
    environment:
      SOKETI_DEBUG: '1'
      SOKETI_DEFAULT_APP_ID: attendance-app
      SOKETI_DEFAULT_APP_KEY: attendance-key
      SOKETI_DEFAULT_APP_SECRET: attendance-secret
    networks:
      - attendance-network

  node:
    image: node:20-alpine
    container_name: attendance-node
    working_dir: /var/www
    volumes:
      - ./:/var/www
    networks:
      - attendance-network
    profiles:
      - build

networks:
  attendance-network:
    driver: bridge

volumes:
  mysql_data:
  redis_data:
```

### docker/php/Dockerfile

```dockerfile
FROM php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip opcache

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy existing application
COPY . .

# Set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
```

### docker/nginx/default.conf

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/public;
    index index.php;

    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass app:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### docker/php/php.ini

```ini
[PHP]
upload_max_filesize = 100M
post_max_size = 100M
memory_limit = 256M
max_execution_time = 60

[opcache]
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.validate_timestamps=0
opcache.revalidate_freq=0
```

---

## 📞 Контакти

**Автор:** Антоненко І.Ю.  
**Університет:** Національний університет «Полтавська політехніка імені Юрія Кондратюка»  
**Рік:** 2025

---

## 📄 Ліцензія

MIT License

