#!/bin/bash
# GCP Cloud Run Deployment Script
# 
# Prerequisites:
# 1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
# 2. Authenticate: gcloud auth login
# 3. Set project: gcloud config set project YOUR_PROJECT_ID
#
# Usage:
#   ./deploy/deploy_gcp.sh

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="lumo-trade-ml"

echo "=============================================="
echo "Deploying LumoTrade ML Backend to GCP Cloud Run"
echo "=============================================="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "=============================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if project is set
if [ "$PROJECT_ID" == "your-project-id" ]; then
    echo "Error: Please set GCP_PROJECT_ID environment variable"
    echo "  export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

# Enable required APIs
echo ""
echo "Enabling required GCP APIs..."
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID

# Deploy to Cloud Run
echo ""
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --min-instances 0 \
    --max-instances 3 \
    --set-env-vars "EODHD_API_KEY=${EODHD_API_KEY},SUPABASE_URL=${SUPABASE_URL},SUPABASE_KEY=${SUPABASE_KEY},ENVIRONMENT=production" \
    --project $PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format 'value(status.url)')

echo ""
echo "=============================================="
echo "Deployment Complete!"
echo "=============================================="
echo "Service URL: $SERVICE_URL"
echo ""
echo "Test endpoints:"
echo "  curl $SERVICE_URL/health"
echo "  curl $SERVICE_URL/model/status"
echo "  curl $SERVICE_URL/predict/today"
echo ""
echo "Next steps:"
echo "  1. Run ./deploy/setup_scheduler.sh to set up daily training"
echo "  2. Trigger initial training: curl -X POST $SERVICE_URL/train/trigger"
echo "=============================================="

