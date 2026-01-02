# Laravel 11 + Inertia + React Project Initialization Script
# Run this script from the project root directory

Write-Host "🚀 Initializing Laravel 11 + Inertia + React project..." -ForegroundColor Cyan

# Step 1: Create Laravel project using composer Docker image
Write-Host "`n📦 Creating Laravel project..." -ForegroundColor Yellow
docker run --rm -v ${PWD}:/app -w /app composer:latest create-project laravel/laravel temp --prefer-dist --no-interaction

# Step 2: Move files from temp to root
Write-Host "`n📁 Moving files to project root..." -ForegroundColor Yellow
Get-ChildItem -Path ".\temp\*" -Recurse | Move-Item -Destination ".\" -Force
Remove-Item -Path ".\temp" -Recurse -Force

# Step 3: Build and start Docker containers
Write-Host "`n🐳 Building Docker containers..." -ForegroundColor Yellow
docker-compose build

Write-Host "`n🐳 Starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d

# Step 4: Wait for MySQL to be ready
Write-Host "`n⏳ Waiting for MySQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 5: Install Inertia.js
Write-Host "`n📦 Installing Inertia.js..." -ForegroundColor Yellow
docker-compose exec -T app composer require inertiajs/inertia-laravel

# Step 6: Install Laravel Sanctum for API authentication
Write-Host "`n🔐 Installing Laravel Sanctum..." -ForegroundColor Yellow
docker-compose exec -T app composer require laravel/sanctum

# Step 7: Install additional packages
Write-Host "`n📦 Installing additional PHP packages..." -ForegroundColor Yellow
docker-compose exec -T app composer require simplesoftwareio/simple-qrcode firebase/php-jwt predis/predis

# Step 8: Setup Inertia middleware
Write-Host "`n⚙️ Setting up Inertia middleware..." -ForegroundColor Yellow
docker-compose exec -T app php artisan inertia:middleware

# Step 9: Generate app key
Write-Host "`n🔑 Generating application key..." -ForegroundColor Yellow
docker-compose exec -T app php artisan key:generate

# Step 10: Install frontend dependencies
Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Yellow
docker-compose exec -T node npm install
docker-compose exec -T node npm install @inertiajs/react react react-dom
docker-compose exec -T node npm install -D @vitejs/plugin-react @types/react @types/react-dom typescript
docker-compose exec -T node npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/core
docker-compose exec -T node npm install html5-qrcode
docker-compose exec -T node npm install laravel-echo pusher-js
docker-compose exec -T node npm install -D tailwindcss postcss autoprefixer
docker-compose exec -T node npx tailwindcss init -p

Write-Host "`n✅ Project initialization complete!" -ForegroundColor Green
Write-Host "   - Laravel 11 installed"
Write-Host "   - Inertia.js + React configured"
Write-Host "   - Docker services running"
Write-Host "`n🌐 Access the application at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📊 MySQL: localhost:3306 (user: attendance, password: secret)"
Write-Host "🔴 Redis: localhost:6379"
Write-Host "🔌 Soketi WebSocket: localhost:6001"

