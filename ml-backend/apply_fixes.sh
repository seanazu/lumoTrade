#!/bin/bash

# Script to apply OpenAI API fixes and restart ml-backend

echo "=================================================="
echo "OpenAI API & Web Search Fix - Application Script"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: Please run this script from the ml-backend directory"
    echo "   cd /path/to/ml-backend && bash apply_fixes.sh"
    exit 1
fi

echo "📦 Step 1: Updating Python dependencies..."
pip install -r requirements.txt --upgrade

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies updated successfully"
echo ""

echo "🔍 Step 2: Checking .env configuration..."
if [ ! -f ".env" ]; then
    if [ -f "config.example.env" ]; then
        echo "⚠️  No .env file found. Copying from config.example.env..."
        cp config.example.env .env
        echo "⚠️  IMPORTANT: Edit .env and add your API keys!"
        echo "   Required: OPENAI_API_KEY, POLYGON_API_KEY, FMP_API_KEY, MARKETAUX_API_KEY"
    else
        echo "⚠️  Warning: No .env file found. Please create one with your API keys."
    fi
else
    echo "✅ .env file exists"
fi
echo ""

echo "🔑 Step 3: Verifying OpenAI API key..."
if grep -q "OPENAI_API_KEY=sk-" .env 2>/dev/null; then
    if grep -q "OPENAI_API_KEY=sk-your-key-here" .env; then
        echo "⚠️  Warning: OPENAI_API_KEY is still set to placeholder value"
        echo "   Please update .env with your actual API key"
    else
        echo "✅ OPENAI_API_KEY is configured"
    fi
else
    echo "⚠️  Warning: OPENAI_API_KEY not found or not set in .env"
fi
echo ""

echo "🤖 Step 4: Model configuration..."
if grep -q "OPENAI_MODEL=" .env 2>/dev/null; then
    MODEL=$(grep "OPENAI_MODEL=" .env | cut -d= -f2)
    echo "   Using model from .env: $MODEL"
else
    echo "   Using default model: gpt-4o"
fi
echo ""

echo "=================================================="
echo "✅ Fixes applied successfully!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Verify your .env file has all required API keys"
echo "2. Start the server: uvicorn app:app --reload"
echo "3. Test the endpoint: curl -X POST http://localhost:8000/api/predict \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"symbol\": \"SPY\", \"debug\": true}'"
echo ""
echo "📚 For more details, see: OPENAI_FIX_SUMMARY.md"
echo ""

