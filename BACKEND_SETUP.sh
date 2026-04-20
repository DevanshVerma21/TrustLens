#!/bin/bash
# TrustLens Backend - Installation & Setup Guide

echo "🔧 TrustLens Backend Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
cd /server || exit
npm install
npm install express-validator express-rate-limit

# Step 2: Environment setup
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp ../.env.example .env
    echo "✅ .env created (update with your MongoDB URI)"
else
    echo "✅ .env already exists"
fi

# Step 3: Database check
echo "🗄️  Checking MongoDB..."
# This assumes MongoDB is running locally
if mongosh --eval "db.version()" &>/dev/null; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  MongoDB not running locally. Make sure it's accessible via MONGODB_URI"
fi

# Step 4: Start server
echo "🚀 Starting server..."
npm run dev

echo "✅ Backend setup complete!"
echo "📡 Server running on http://localhost:5000"
