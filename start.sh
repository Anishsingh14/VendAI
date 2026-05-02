#!/bin/bash
# VendAI — Start Backend Server
# Run this from Terminal: bash start.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/backend"

# Activate virtualenv
if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
else
  echo "⚙️  Creating virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt --prefer-binary --quiet
fi

# Check for .env
if [ ! -f .env ]; then
  echo "⚠️  No .env file found at backend/.env"
  echo "   Run: cp .env.example backend/.env  then fill in your keys."
  exit 1
fi

echo ""
echo "⚡ VendAI backend starting..."
echo "   URL: http://localhost:5000"
echo "   Press Ctrl+C to stop."
echo ""

python app.py
