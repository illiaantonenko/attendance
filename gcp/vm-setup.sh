#!/bin/bash

# Alternative: Deploy on a single Compute Engine VM with Docker Compose
# This is simpler and cheaper for low-traffic applications

set -e

echo "🖥️ Setting up Attendance System on Compute Engine VM"

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository (or copy files)
# git clone https://github.com/YOUR_REPO/attendance-system.git
# cd attendance-system

# Create production docker-compose
cat > docker-compose.prod.yml << 'EOF'
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
    container_name: attendance-app
    restart: always
    working_dir: /var/www
    volumes:
      - ./:/var/www
      - ./docker/php/php.ini:/usr/local/etc/php/conf.d/local.ini
    networks:
      - attendance-network
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - APP_ENV=production

  nginx:
    image: nginx:alpine
    container_name: attendance-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./:/var/www
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - attendance-network
    depends_on:
      - app

  mysql:
    image: mysql:8.0
    container_name: attendance-mysql
    restart: always
    environment:
      MYSQL_DATABASE: ${DB_DATABASE}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - attendance-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: attendance-redis
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - attendance-network
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  soketi:
    image: quay.io/soketi/soketi:1.6-16-debian
    container_name: attendance-soketi
    restart: always
    ports:
      - "6001:6001"
    environment:
      SOKETI_DEBUG: '0'
      SOKETI_DEFAULT_APP_ID: ${PUSHER_APP_ID}
      SOKETI_DEFAULT_APP_KEY: ${PUSHER_APP_KEY}
      SOKETI_DEFAULT_APP_SECRET: ${PUSHER_APP_SECRET}
    networks:
      - attendance-network

networks:
  attendance-network:
    driver: bridge

volumes:
  mysql_data:
  redis_data:
EOF

# Create .env for production
cp .env.example .env
# Edit .env with production values

# Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec app php artisan migrate --force
docker-compose -f docker-compose.prod.yml exec app php artisan config:cache
docker-compose -f docker-compose.prod.yml exec app php artisan route:cache
docker-compose -f docker-compose.prod.yml exec app php artisan view:cache

echo "✅ Setup complete!"
echo ""
echo "To set up SSL with Let's Encrypt:"
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d yourdomain.com"

