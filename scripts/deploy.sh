#!/bin/bash

# NexusVerse Deployment Script
# This script deploys the complete NexusVerse platform

set -e

echo "🚀 Starting NexusVerse deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { print_error "Docker Compose is required but not installed. Aborting."; exit 1; }
    command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
    command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }
    
    print_success "All dependencies are installed"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
            print_warning "Created .env file from template. Please update with your configuration."
        else
            print_error "No .env file found and no template available. Please create .env file manually."
            exit 1
        fi
    else
        print_success ".env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install frontend dependencies
    cd frontend
    npm install
    cd ..
    
    # Install backend dependencies
    cd backend
    npm install
    cd ..
    
    # Install blockchain dependencies
    cd blockchain
    npm install
    cd ..
    
    # Install AI service dependencies
    cd ai
    npm install
    cd ..
    
    print_success "All dependencies installed"
}

# Build applications
build_applications() {
    print_status "Building applications..."
    
    # Build frontend
    cd frontend
    npm run build
    cd ..
    
    # Build backend
    cd backend
    npm run build
    cd ..
    
    # Build blockchain contracts
    cd blockchain
    npm run compile
    cd ..
    
    print_success "All applications built"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start database services
    docker-compose up -d postgres mongodb redis
    
    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    sleep 10
    
    # Run database migrations
    print_status "Running database migrations..."
    cd backend
    npm run migrate
    cd ..
    
    # Start all services
    docker-compose up -d
    
    print_success "All services started"
}

# Deploy smart contracts
deploy_contracts() {
    print_status "Deploying smart contracts..."
    
    cd blockchain
    
    # Deploy to local network
    npm run deploy:local
    
    # If production deployment is specified
    if [ "$1" = "production" ]; then
        print_status "Deploying to production network..."
        npm run deploy:production
    fi
    
    cd ..
    
    print_success "Smart contracts deployed"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create monitoring directories
    mkdir -p monitoring
    
    # Start monitoring services
    docker-compose up -d prometheus grafana
    
    print_success "Monitoring setup complete"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Check if services are running
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        print_success "Frontend is running"
    else
        print_warning "Frontend is not responding"
    fi
    
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        print_success "Backend is running"
    else
        print_warning "Backend is not responding"
    fi
    
    if curl -f http://localhost:8001/health >/dev/null 2>&1; then
        print_success "AI service is running"
    else
        print_warning "AI service is not responding"
    fi
    
    print_success "Health check completed"
}

# Main deployment function
deploy() {
    local environment=${1:-development}
    
    print_status "Starting deployment for environment: $environment"
    
    check_dependencies
    setup_environment
    install_dependencies
    build_applications
    
    if [ "$environment" = "production" ]; then
        print_status "Production deployment detected"
        # Additional production setup
        export NODE_ENV=production
    fi
    
    start_services
    deploy_contracts "$environment"
    setup_monitoring
    health_check
    
    print_success "Deployment completed successfully!"
    print_status "Access your application at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  GraphQL: http://localhost:8000/graphql"
    echo "  AI Service: http://localhost:8001"
    echo "  Monitoring: http://localhost:3001"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    docker-compose down -v
    docker system prune -f
    
    print_success "Cleanup completed"
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND] [ENVIRONMENT]"
    echo ""
    echo "Commands:"
    echo "  deploy     Deploy the application"
    echo "  start      Start all services"
    echo "  stop       Stop all services"
    echo "  restart    Restart all services"
    echo "  logs       Show service logs"
    echo "  cleanup    Clean up all containers and volumes"
    echo "  health     Perform health check"
    echo ""
    echo "Environments:"
    echo "  development (default)"
    echo "  staging"
    echo "  production"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 deploy production"
    echo "  $0 start"
    echo "  $0 logs"
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        deploy "${2:-development}"
        ;;
    start)
        print_status "Starting services..."
        docker-compose up -d
        print_success "Services started"
        ;;
    stop)
        print_status "Stopping services..."
        docker-compose down
        print_success "Services stopped"
        ;;
    restart)
        print_status "Restarting services..."
        docker-compose restart
        print_success "Services restarted"
        ;;
    logs)
        docker-compose logs -f
        ;;
    cleanup)
        cleanup
        ;;
    health)
        health_check
        ;;
    *)
        usage
        exit 1
        ;;
esac 