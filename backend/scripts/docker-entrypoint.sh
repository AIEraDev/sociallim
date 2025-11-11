#!/bin/sh

# Docker entrypoint script for Comment Sentiment Analyzer API
# Handles database migrations, health checks, and graceful startup

set -e

echo "🚀 Starting Comment Sentiment Analyzer API..."

# Function to wait for database connection
wait_for_db() {
    echo "⏳ Waiting for database connection..."
    
    # Extract database host and port from DATABASE_URL
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
        echo "⚠️  Could not parse database connection details from DATABASE_URL"
        echo "   Proceeding without connection check..."
        return 0
    fi
    
    # Wait for database to be ready
    timeout=60
    while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
        timeout=$((timeout - 1))
        if [ $timeout -eq 0 ]; then
            echo "❌ Database connection timeout after 60 seconds"
            exit 1
        fi
        echo "   Database not ready, waiting... ($timeout seconds remaining)"
        sleep 1
    done
    
    echo "✅ Database connection established"
}

# Function to wait for Redis connection
wait_for_redis() {
    if [ -z "$REDIS_URL" ]; then
        echo "⚠️  REDIS_URL not set, skipping Redis connection check"
        return 0
    fi
    
    echo "⏳ Waiting for Redis connection..."
    
    # Extract Redis host and port from REDIS_URL
    REDIS_HOST=$(echo $REDIS_URL | sed -n 's/redis:\/\/\([^:]*\):.*/\1/p')
    REDIS_PORT=$(echo $REDIS_URL | sed -n 's/.*:\([0-9]*\).*/\1/p')
    
    if [ -z "$REDIS_HOST" ] || [ -z "$REDIS_PORT" ]; then
        echo "⚠️  Could not parse Redis connection details from REDIS_URL"
        echo "   Proceeding without connection check..."
        return 0
    fi
    
    # Wait for Redis to be ready
    timeout=30
    while ! nc -z "$REDIS_HOST" "$REDIS_PORT" 2>/dev/null; do
        timeout=$((timeout - 1))
        if [ $timeout -eq 0 ]; then
            echo "❌ Redis connection timeout after 30 seconds"
            exit 1
        fi
        echo "   Redis not ready, waiting... ($timeout seconds remaining)"
        sleep 1
    done
    
    echo "✅ Redis connection established"
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    if npx prisma migrate deploy; then
        echo "✅ Database migrations completed successfully"
    else
        echo "❌ Database migrations failed"
        exit 1
    fi
}

# Function to validate environment variables
validate_environment() {
    echo "🔍 Validating environment configuration..."
    
    required_vars="DATABASE_URL JWT_SECRET"
    missing_vars=""
    
    for var in $required_vars; do
        if [ -z "$(eval echo \$$var)" ]; then
            missing_vars="$missing_vars $var"
        fi
    done
    
    if [ -n "$missing_vars" ]; then
        echo "❌ Missing required environment variables:$missing_vars"
        echo "   Please set these variables before starting the application"
        exit 1
    fi
    
    # Validate JWT_SECRET length
    if [ ${#JWT_SECRET} -lt 32 ]; then
        echo "❌ JWT_SECRET must be at least 32 characters long"
        exit 1
    fi
    
    echo "✅ Environment validation passed"
}

# Function to perform health check
health_check() {
    echo "🏥 Performing application health check..."
    
    # Start the application in background for health check
    node dist/index.js &
    APP_PID=$!
    
    # Wait for application to start
    sleep 5
    
    # Check if application is responding
    if curl -f http://localhost:$PORT/health >/dev/null 2>&1; then
        echo "✅ Application health check passed"
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
    else
        echo "❌ Application health check failed"
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
        exit 1
    fi
}

# Function to setup graceful shutdown
setup_signal_handlers() {
    # Trap SIGTERM and SIGINT for graceful shutdown
    trap 'echo "🛑 Received shutdown signal, stopping application..."; kill -TERM $APP_PID 2>/dev/null || true; wait $APP_PID 2>/dev/null || true; exit 0' TERM INT
}

# Main execution flow
main() {
    echo "🔧 Comment Sentiment Analyzer API - Docker Entrypoint"
    echo "   Node.js version: $(node --version)"
    echo "   Environment: ${NODE_ENV:-development}"
    echo "   Port: ${PORT:-3000}"
    echo ""
    
    # Validate environment
    validate_environment
    
    # Wait for dependencies
    wait_for_db
    wait_for_redis
    
    # Run database migrations in production
    if [ "$NODE_ENV" = "production" ]; then
        run_migrations
    else
        echo "⚠️  Skipping migrations in non-production environment"
    fi
    
    # Perform health check in production
    if [ "$NODE_ENV" = "production" ] && [ "$SKIP_HEALTH_CHECK" != "true" ]; then
        health_check
    else
        echo "⚠️  Skipping health check"
    fi
    
    # Setup signal handlers for graceful shutdown
    setup_signal_handlers
    
    echo "🎉 Starting application server..."
    echo ""
    
    # Start the main application
    exec node dist/index.js &
    APP_PID=$!
    
    # Wait for the application process
    wait $APP_PID
}

# Execute main function
main "$@"