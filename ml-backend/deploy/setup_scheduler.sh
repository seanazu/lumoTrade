#!/bin/bash
# Cloud Scheduler Setup Script
#
# Sets up daily training and prediction jobs
#
# Prerequisites:
# 1. Deploy the service first: ./deploy/deploy_gcp.sh
# 2. Have the service URL
#
# Usage:
#   ./deploy/setup_scheduler.sh

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="lumo-trade-ml"
TIMEZONE="America/New_York"

echo "=============================================="
echo "Setting up Cloud Scheduler Jobs"
echo "=============================================="

# Check if project is set
if [ "$PROJECT_ID" == "your-project-id" ]; then
    echo "Error: Please set GCP_PROJECT_ID environment variable"
    exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format 'value(status.url)' 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "Error: Could not find service URL. Deploy the service first."
    exit 1
fi

echo "Service URL: $SERVICE_URL"
echo ""

# Create service account for scheduler (if not exists)
SA_NAME="scheduler-invoker"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "Setting up service account..."
gcloud iam service-accounts create $SA_NAME \
    --display-name="Cloud Scheduler Invoker" \
    --project=$PROJECT_ID 2>/dev/null || echo "Service account already exists"

# Grant invoker role
gcloud run services add-iam-policy-binding $SERVICE_NAME \
    --region=$REGION \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.invoker" \
    --project=$PROJECT_ID

# Create daily training job (6:00 AM ET, weekdays only)
echo ""
echo "Creating daily training job (6:00 AM ET, Mon-Fri)..."
gcloud scheduler jobs delete train-daily --location=$REGION --project=$PROJECT_ID --quiet 2>/dev/null || true

gcloud scheduler jobs create http train-daily \
    --location=$REGION \
    --schedule="0 6 * * 1-5" \
    --time-zone=$TIMEZONE \
    --uri="$SERVICE_URL/train/trigger" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body='{"optimize_trials": 50}' \
    --oidc-service-account-email=$SA_EMAIL \
    --oidc-token-audience=$SERVICE_URL \
    --attempt-deadline=600s \
    --project=$PROJECT_ID

# Create daily prediction job (9:00 AM ET, weekdays only)
echo ""
echo "Creating daily prediction job (9:00 AM ET, Mon-Fri)..."
gcloud scheduler jobs delete predict-daily --location=$REGION --project=$PROJECT_ID --quiet 2>/dev/null || true

gcloud scheduler jobs create http predict-daily \
    --location=$REGION \
    --schedule="0 9 * * 1-5" \
    --time-zone=$TIMEZONE \
    --uri="$SERVICE_URL/predict/today" \
    --http-method=GET \
    --oidc-service-account-email=$SA_EMAIL \
    --oidc-token-audience=$SERVICE_URL \
    --attempt-deadline=120s \
    --project=$PROJECT_ID

echo ""
echo "=============================================="
echo "Cloud Scheduler Setup Complete!"
echo "=============================================="
echo ""
echo "Jobs created:"
echo "  1. train-daily   - Runs at 6:00 AM ET (Mon-Fri)"
echo "  2. predict-daily - Runs at 9:00 AM ET (Mon-Fri)"
echo ""
echo "View jobs:"
echo "  gcloud scheduler jobs list --location=$REGION --project=$PROJECT_ID"
echo ""
echo "Trigger manually:"
echo "  gcloud scheduler jobs run train-daily --location=$REGION --project=$PROJECT_ID"
echo "  gcloud scheduler jobs run predict-daily --location=$REGION --project=$PROJECT_ID"
echo "=============================================="

