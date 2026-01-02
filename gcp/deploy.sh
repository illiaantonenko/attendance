#!/bin/bash

# Quick deployment script for Google Cloud Platform
# Usage: ./deploy.sh [PROJECT_ID]

set -e

# Configuration
PROJECT_ID="${1:-attendance-system-ua}"
REGION="europe-west1"
SERVICE_NAME="attendance-system"
SQL_INSTANCE="attendance-db"

echo "🚀 Deploying Attendance System to GCP"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first."
    exit 1
fi

# Set project
echo "📦 Setting project..."
gcloud config set project $PROJECT_ID

# Enable APIs
echo "🔧 Enabling required APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    sqladmin.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    --quiet

# Build and push image
echo "🏗️ Building Docker image..."
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
    --timeout=30m \
    -f gcp/Dockerfile.production .

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 60s \
    --set-env-vars "APP_ENV=production,APP_DEBUG=false,LOG_CHANNEL=stderr"

# Get URL
URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "🌐 URL: $URL"
echo ""
echo "⚠️ Don't forget to:"
echo "  1. Set up Cloud SQL and connect it"
echo "  2. Configure environment secrets"
echo "  3. Run database migrations"

