#!/bin/bash

# Comment Sentiment Analyzer - Production Deployment Script
# Handles complete deployment process with health checks and rollback capabilities

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_ENV="${1:-production}"
DEPLOY_VERSION="${2:-latest}"
BACKUP_ENABLED="${BACKUP_ENABLED:-true}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
handle_error() {
    log_error "Deployment failed at line $1"
    log_info "Starting rollback process..."
    rollback_deployment
    exit 1
}

trap 'handle_error $LINENO' ERR

# Deployment functions
check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    # Check required tools
    local required_tools=("docker" "docker-compose" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool '$tool' is not installed"
            exit 1
        fi
    done
    
    # Check environment file
    if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
        log_error "Environment file (.env) not found"
        log_info "Please copy .env.example to .env and configure it"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Validate environment variables
    source "$PROJECT_ROOT/.env"
    local required_vars=("DATABASE_URL" "JWT_SECRET" "REDIS_URL")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Required environment variable '$var' is not set"
            exit 1
        fi
    done
    
    log_success "Prerequisites check passed"
}

backup_database() {
    if [[ "$BACKUP_ENABLED" != "true" ]]; then
        log_warning "Database backup is disabled"
        return 0
    fi
    
    log_info "Creating database backup..."
    
    local backup_dir="$PROJECT_ROOT/backups"
    local backup_file="$backup_dir/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$backup_dir"
    
    # Create database backup
    docker-compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$backup_file"
    
    if [[ -f "$backup_file" && -s "$backup_file" ]]; then
        log_success "Database backup created: $backup_file"
        
        # Compress backup
        gzip "$backup_file"
        log_success "Backup compressed: ${backup_file}.gz"
        
        # Clean old backups (keep last 10)
        find "$backup_dir" -name "backup_*.sql.gz" -type f | sort -r | tail -n +11 | xargs rm -f
        
    else
        log_error "Database backup failed"
        exit 1
    fi
}

build_images() {
    log_info "Building Docker images..."
    
    # Build backend image
    log_info "Building backend image..."
    docker build -t "comment-analyzer/api:$DEPLOY_VERSION" "$PROJECT_ROOT/backend"
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -t "comment-analyzer/frontend:$DEPLOY_VERSION" "$PROJECT_ROOT/frontend"
    
    log_success "Docker images built successfully"
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    # Start database if not running
    docker-compose up -d db redis
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    timeout=60
    while ! docker-compose exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" &> /dev/null; do
        timeout=$((timeout - 1))
        if [[ $timeout -eq 0 ]]; then
            log_error "Database connection timeout"
            exit 1
        fi
        sleep 1
    done
    
    # Run migrations
    docker-compose run --rm api npx prisma migrate deploy
    
    log_success "Database migrations completed"
}

deploy_services() {
    log_info "Deploying services..."
    
    # Update docker-compose with new image versions
    export API_IMAGE="comment-analyzer/api:$DEPLOY_VERSION"
    export FRONTEND_IMAGE="comment-analyzer/frontend:$DEPLOY_VERSION"
    
    # Deploy services with rolling update
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        # Production deployment with zero downtime
        docker-compose up -d --no-deps --scale api=2 api
        sleep 10
        docker-compose up -d --no-deps --scale api=1 api
        docker-compose up -d --no-deps frontend
        docker-compose up -d --no-deps nginx
    else
        # Development/staging deployment
        docker-compose up -d
    fi
    
    log_success "Services deployed"
}

run_health_checks() {
    log_info "Running health checks..."
    
    local api_url="${API_BASE_URL:-http://localhost:5628}"
    local frontend_url="${FRONTEND_URL:-http://localhost:5628}"
    local timeout=$HEALTH_CHECK_TIMEOUT
    
    # Check API health
    log_info "Checking API health..."
    while [[ $timeout -gt 0 ]]; do
        if curl -f "$api_url/health" &> /dev/null; then
            log_success "API health check passed"
            break
        fi
        
        timeout=$((timeout - 5))
        if [[ $timeout -le 0 ]]; then
            log_error "API health check failed"
            return 1
        fi
        
        log_info "Waiting for API to be ready... ($timeout seconds remaining)"
        sleep 5
    done
    
    # Check Frontend health
    log_info "Checking Frontend health..."
    timeout=$HEALTH_CHECK_TIMEOUT
    while [[ $timeout -gt 0 ]]; do
        if curl -f "$frontend_url" &> /dev/null; then
            log_success "Frontend health check passed"
            break
        fi
        
        timeout=$((timeout - 5))
        if [[ $timeout -le 0 ]]; then
            log_error "Frontend health check failed"
            return 1
        fi
        
        log_info "Waiting for Frontend to be ready... ($timeout seconds remaining)"
        sleep 5
    done
    
    # Check database connectivity
    log_info "Checking database connectivity..."
    if docker-compose exec -T api node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect().then(() => {
            console.log('Database connection successful');
            process.exit(0);
        }).catch((error) => {
            console.error('Database connection failed:', error);
            process.exit(1);
        });
    "; then
        log_success "Database connectivity check passed"
    else
        log_error "Database connectivity check failed"
        return 1
    fi
    
    # Check Redis connectivity
    log_info "Checking Redis connectivity..."
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        log_success "Redis connectivity check passed"
    else
        log_error "Redis connectivity check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

run_smoke_tests() {
    log_info "Running smoke tests..."
    
    local api_url="${API_BASE_URL:-http://localhost:5628}"
    
    # Test API endpoints
    local endpoints=(
        "/health"
        "/api/v1/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log_info "Testing endpoint: $endpoint"
        if curl -f "$api_url$endpoint" &> /dev/null; then
            log_success "✓ $endpoint"
        else
            log_error "✗ $endpoint"
            return 1
        fi
    done
    
    log_success "Smoke tests passed"
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old versions (keep last 3)
    docker images "comment-analyzer/api" --format "table {{.Tag}}" | tail -n +2 | sort -V | head -n -3 | xargs -r docker rmi "comment-analyzer/api:" 2>/dev/null || true
    docker images "comment-analyzer/frontend" --format "table {{.Tag}}" | tail -n +2 | sort -V | head -n -3 | xargs -r docker rmi "comment-analyzer/frontend:" 2>/dev/null || true
    
    log_success "Cleanup completed"
}

rollback_deployment() {
    log_warning "Starting rollback process..."
    
    # Get previous version
    local previous_version=$(docker images "comment-analyzer/api" --format "table {{.Tag}}" | tail -n +2 | sort -V | tail -n 2 | head -n 1)
    
    if [[ -n "$previous_version" && "$previous_version" != "$DEPLOY_VERSION" ]]; then
        log_info "Rolling back to version: $previous_version"
        
        # Rollback services
        export API_IMAGE="comment-analyzer/api:$previous_version"
        export FRONTEND_IMAGE="comment-analyzer/frontend:$previous_version"
        
        docker-compose up -d --no-deps api frontend
        
        # Wait and check health
        sleep 10
        if run_health_checks; then
            log_success "Rollback completed successfully"
        else
            log_error "Rollback failed - manual intervention required"
        fi
    else
        log_warning "No previous version available for rollback"
    fi
}

send_deployment_notification() {
    local status="$1"
    local message="$2"
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local color="good"
        if [[ "$status" == "failed" ]]; then
            color="danger"
        elif [[ "$status" == "warning" ]]; then
            color="warning"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Deployment $status\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$DEPLOY_ENV\", \"short\": true},
                        {\"title\": \"Version\", \"value\": \"$DEPLOY_VERSION\", \"short\": true},
                        {\"title\": \"Timestamp\", \"value\": \"$(date)\", \"short\": false}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# Main deployment function
main() {
    log_info "🚀 Starting deployment process..."
    log_info "Environment: $DEPLOY_ENV"
    log_info "Version: $DEPLOY_VERSION"
    echo ""
    
    local start_time=$(date +%s)
    
    # Deployment steps
    check_prerequisites
    
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        backup_database
    fi
    
    build_images
    run_database_migrations
    deploy_services
    
    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 15
    
    run_health_checks
    run_smoke_tests
    cleanup_old_images
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "🎉 Deployment completed successfully!"
    log_info "Deployment took $duration seconds"
    
    # Send success notification
    send_deployment_notification "success" "Deployment completed successfully in $duration seconds"
    
    echo ""
    log_info "📋 Deployment Summary:"
    log_info "   Environment: $DEPLOY_ENV"
    log_info "   Version: $DEPLOY_VERSION"
    log_info "   Duration: $duration seconds"
    log_info "   API URL: ${API_BASE_URL:-http://localhost:5628}"
    log_info "   Frontend URL: ${FRONTEND_URL:-http://localhost:5628}"
    echo ""
    log_info "🔍 Monitor the deployment:"
    log_info "   Logs: docker-compose logs -f"
    log_info "   Health: curl ${API_BASE_URL:-http://localhost:5628}/health"
    echo ""
}

# Handle script arguments
case "${1:-}" in
    "production"|"staging"|"development")
        main "$@"
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health")
        run_health_checks
        ;;
    "cleanup")
        cleanup_old_images
        ;;
    *)
        echo "Usage: $0 {production|staging|development|rollback|health|cleanup} [version]"
        echo ""
        echo "Commands:"
        echo "  production   - Deploy to production environment"
        echo "  staging      - Deploy to staging environment"
        echo "  development  - Deploy to development environment"
        echo "  rollback     - Rollback to previous version"
        echo "  health       - Run health checks"
        echo "  cleanup      - Clean up old Docker images"
        echo ""
        echo "Examples:"
        echo "  $0 production v1.2.3"
        echo "  $0 staging latest"
        echo "  $0 rollback"
        exit 1
        ;;
esac