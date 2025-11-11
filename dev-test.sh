#!/bin/bash

# Development Testing Script for Comment Sentiment Analyzer

echo "🚀 Starting Development Testing Environment"

# Function to check if a service is running
check_service() {
    if curl -s "$1" > /dev/null; then
        echo "✅ $2 is running"
        return 0
    else
        echo "❌ $2 is not running"
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo "📦 Starting Backend..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend..."
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    cd ..
}

# Function to run tests
run_tests() {
    echo "🧪 Running Backend Tests..."
    cd backend
    npm test
    cd ..
    
    echo "🧪 Running Frontend Linting..."
    cd frontend
    npm run lint
    cd ..
}

# Function to setup database
setup_database() {
    echo "🗄️ Setting up Database..."
    cd backend
    npm run prisma:generate
    npm run prisma:migrate
    npm run prisma:seed
    cd ..
}

# Main execution
case "$1" in
    "start")
        start_backend
        sleep 5
        start_frontend
        echo "🎉 Development servers started!"
        echo "Backend: http://localhost:3001"
        echo "Frontend: http://localhost:3000"
        ;;
    "test")
        run_tests
        ;;
    "setup")
        setup_database
        ;;
    "check")
        check_service "http://localhost:3001/health" "Backend API"
        check_service "http://localhost:3000" "Frontend App"
        ;;
    *)
        echo "Usage: $0 {start|test|setup|check}"
        echo "  start  - Start both backend and frontend servers"
        echo "  test   - Run all tests"
        echo "  setup  - Setup database and dependencies"
        echo "  check  - Check if services are running"
        ;;
esac