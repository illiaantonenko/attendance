# Розгортання на Google Cloud Platform

## Архітектура

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Cloud Run   │    │  Cloud SQL   │    │ Memorystore  │  │
│  │  (Laravel)   │───▶│   (MySQL)    │    │   (Redis)    │  │
│  │  + Nginx     │    │              │    │  (optional)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                       │           │
│         └───────────────────────────────────────┘           │
│                           │                                  │
│  ┌──────────────┐    ┌────┴─────┐                           │
│  │ Cloud Build  │    │  Secret  │                           │
│  │   (CI/CD)    │    │  Manager │                           │
│  └──────────────┘    └──────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Передумови

1. Обліковий запис Google Cloud
2. Встановлений `gcloud` CLI
3. Увімкнені API:
   - Cloud Run
   - Cloud Build
   - Cloud SQL
   - Container Registry
   - Secret Manager

## Крок 1: Налаштування GCP проекту

```bash
# Авторизація
gcloud auth login

# Створення проекту
gcloud projects create attendance-system-ua --name="Attendance System"
gcloud config set project attendance-system-ua

# Увімкнення необхідних API
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    sqladmin.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com

# Встановлення регіону
gcloud config set run/region europe-west1
```

## Крок 2: Створення Cloud SQL (MySQL)

```bash
# Створення інстансу MySQL
gcloud sql instances create attendance-db \
    --database-version=MYSQL_8_0 \
    --tier=db-f1-micro \
    --region=europe-west1 \
    --storage-type=SSD \
    --storage-size=10GB

# Створення бази даних
gcloud sql databases create attendance_db --instance=attendance-db

# Створення користувача
gcloud sql users create attendance \
    --instance=attendance-db \
    --password=YOUR_SECURE_PASSWORD
```

## Крок 3: Налаштування секретів

```bash
# APP_KEY
php artisan key:generate --show
echo -n "base64:YOUR_KEY" | gcloud secrets create app-key --data-file=-

# Database password
echo -n "YOUR_SECURE_PASSWORD" | gcloud secrets create db-password --data-file=-

# JWT secret
echo -n "YOUR_JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# Надання доступу до секретів для Cloud Run
gcloud secrets add-iam-policy-binding app-key \
    --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Крок 4: Ручне розгортання

```bash
# Збірка образу
gcloud builds submit \
    --tag gcr.io/attendance-system-ua/attendance-system \
    --timeout=20m \
    -f gcp/Dockerfile.production .

# Розгортання на Cloud Run
gcloud run deploy attendance-system \
    --image gcr.io/attendance-system-ua/attendance-system \
    --platform managed \
    --region europe-west1 \
    --allow-unauthenticated \
    --add-cloudsql-instances attendance-system-ua:europe-west1:attendance-db \
    --set-env-vars "APP_ENV=production,APP_DEBUG=false,APP_URL=https://CLOUD_RUN_URL" \
    --set-secrets "APP_KEY=app-key:latest,DB_PASSWORD=db-password:latest,JWT_SECRET=jwt-secret:latest" \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10

# Отримання URL
gcloud run services describe attendance-system --format='value(status.url)'
```

## Крок 5: Міграції бази даних

```bash
# Підключення через Cloud SQL Proxy (локально)
cloud_sql_proxy -instances=attendance-system-ua:europe-west1:attendance-db=tcp:3306

# В іншому терміналі
DB_HOST=127.0.0.1 php artisan migrate --force
```

Або через Cloud Build (див. `cloudbuild.yaml`).

## Крок 6: Налаштування CI/CD

```bash
# Підключення репозиторію
gcloud source repos create attendance-system
git remote add google https://source.developers.google.com/p/attendance-system-ua/r/attendance-system
git push google main

# Створення тригера
gcloud builds triggers create cloud-source-repositories \
    --repo=attendance-system \
    --branch-pattern=^main$ \
    --build-config=gcp/cloudbuild.yaml \
    --name=deploy-on-push
```

## Крок 7: Налаштування домену (опціонально)

```bash
# Верифікація домену
gcloud domains verify attendance.example.com

# Прив'язка домену
gcloud run domain-mappings create \
    --service attendance-system \
    --domain attendance.example.com \
    --region europe-west1
```

## Моніторинг

```bash
# Логи
gcloud run services logs read attendance-system --region europe-west1

# Метрики
gcloud monitoring dashboards create --config-from-file=gcp/dashboard.json
```

## Вартість (приблизно)

| Сервіс | Конфігурація | Вартість/місяць |
|--------|--------------|-----------------|
| Cloud Run | 0-10 instances, 512MB | ~$5-20 |
| Cloud SQL | db-f1-micro | ~$8 |
| Container Registry | <1GB | ~$0.1 |
| **Всього** | | **~$15-30** |

*При низькому навантаженні може бути в межах безкоштовного рівня*

## Корисні команди

```bash
# Статус сервісу
gcloud run services describe attendance-system

# Масштабування
gcloud run services update attendance-system --max-instances=20

# Оновлення змінних середовища
gcloud run services update attendance-system --set-env-vars KEY=VALUE

# Відкат до попередньої версії
gcloud run services update-traffic attendance-system --to-revisions=REVISION_NAME=100
```

## Troubleshooting

### 502 Bad Gateway
- Перевірте логи: `gcloud run services logs read attendance-system`
- Перевірте health check: `/health` endpoint

### Database connection failed
- Перевірте Cloud SQL proxy підключення
- Перевірте права доступу сервісного акаунту

### Build failed
- Перевірте Dockerfile синтаксис
- Перевірте доступні ресурси в Cloud Build

