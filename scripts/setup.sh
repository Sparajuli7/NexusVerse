#!/bin/bash

# NexusVerse Setup Script
# This script sets up the complete NexusVerse development environment

set -e

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
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Some features may not work."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. Some features may not work."
    fi
    
    print_success "System requirements check completed"
}

# Create environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Root .env file
    if [ ! -f .env ]; then
        cat > .env << EOF
# NexusVerse Environment Configuration

# Application
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://nexusverse:password@localhost:5432/nexusverse
MONGODB_URL=mongodb://localhost:27017/nexusverse
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# IPFS
IPFS_GATEWAY=https://ipfs.io/ipfs/

# AI/ML
AI_SERVICE_URL=http://localhost:8001
MODEL_PATH=/app/models

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring
SENTRY_DSN=your_sentry_dsn
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Development
DEBUG=true
LOG_LEVEL=debug
EOF
        print_success "Created .env file"
    else
        print_warning ".env file already exists"
    fi
    
    # Frontend .env
    if [ ! -f frontend/.env ]; then
        cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GRAPHQL_URL=http://localhost:8000/graphql
REACT_APP_BLOCKCHAIN_NETWORK=polygon
REACT_APP_IPFS_GATEWAY=https://ipfs.io/ipfs/
EOF
        print_success "Created frontend/.env file"
    fi
    
    # Backend .env
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
NODE_ENV=development
PORT=8000
DATABASE_URL=postgresql://nexusverse:password@localhost:5432/nexusverse
MONGODB_URL=mongodb://localhost:27017/nexusverse
JWT_SECRET=your-super-secret-jwt-key-change-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_key
EOF
        print_success "Created backend/.env file"
    fi
    
    # Blockchain .env
    if [ ! -f blockchain/.env ]; then
        cat > blockchain/.env << EOF
PRIVATE_KEY=your_private_key_here
POLYGON_RPC_URL=https://polygon-rpc.com
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGONSCAN_API_KEY=your_polygonscan_api_key
EOF
        print_success "Created blockchain/.env file"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    npm install
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Blockchain dependencies
    print_status "Installing blockchain dependencies..."
    cd blockchain
    npm install
    cd ..
    
    # AI dependencies
    print_status "Installing AI dependencies..."
    cd ai
    npm install
    cd ..
    
    print_success "All dependencies installed"
}

# Setup databases
setup_databases() {
    print_status "Setting up databases..."
    
    # Start Docker services
    if command -v docker-compose &> /dev/null; then
        print_status "Starting database services..."
        docker-compose up -d postgres mongodb redis
        
        # Wait for databases to be ready
        print_status "Waiting for databases to be ready..."
        sleep 10
        
        # Run database migrations
        print_status "Running database migrations..."
        cd backend
        npm run migrate
        cd ..
        
        print_success "Databases setup completed"
    else
        print_warning "Docker Compose not available. Please manually start databases."
    fi
}

# Build blockchain contracts
build_blockchain() {
    print_status "Building blockchain contracts..."
    
    cd blockchain
    
    # Compile contracts
    npm run compile
    
    # Generate TypeScript types
    npx hardhat typechain
    
    cd ..
    
    print_success "Blockchain contracts built"
}

# Setup development environment
setup_dev_environment() {
    print_status "Setting up development environment..."
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p uploads
    mkdir -p ai/models
    mkdir -p blockchain/artifacts
    mkdir -p blockchain/cache
    
    # Set up Git hooks
    if [ -d .git ]; then
        print_status "Setting up Git hooks..."
        cp scripts/pre-commit .git/hooks/
        chmod +x .git/hooks/pre-commit
    fi
    
    print_success "Development environment setup completed"
}

# Run initial tests
run_tests() {
    print_status "Running initial tests..."
    
    # Frontend tests
    print_status "Running frontend tests..."
    cd frontend
    npm test -- --watchAll=false --passWithNoTests
    cd ..
    
    # Backend tests
    print_status "Running backend tests..."
    cd backend
    npm test -- --passWithNoTests
    cd ..
    
    # Blockchain tests
    print_status "Running blockchain tests..."
    cd blockchain
    npm test
    cd ..
    
    print_success "All tests passed"
}

# Display setup completion
show_completion() {
    print_success "NexusVerse setup completed successfully!"
    
    echo
    echo "🎉 Welcome to NexusVerse!"
    echo
    echo "Next steps:"
    echo "1. Update environment variables in .env files"
    echo "2. Start the development environment: npm run dev"
    echo "3. Access the application: http://localhost:3000"
    echo "4. View API documentation: http://localhost:8000/docs"
    echo "5. Access GraphQL playground: http://localhost:8000/graphql"
    echo
    echo "Useful commands:"
    echo "  npm run dev          - Start development environment"
    echo "  npm run test         - Run all tests"
    echo "  npm run build        - Build for production"
    echo "  npm run docker:up    - Start Docker services"
    echo "  npm run blockchain:deploy - Deploy smart contracts"
    echo
    echo "Documentation:"
    echo "  - Architecture: docs/architecture.md"
    echo "  - API: docs/api.md"
    echo "  - User Guide: docs/user-guide.md"
    echo
    echo "Happy coding! 🚀"
}

# Main setup function
main() {
    echo "🚀 NexusVerse Setup Script"
    echo "=========================="
    echo
    
    check_requirements
    setup_environment
    install_dependencies
    setup_databases
    build_blockchain
    setup_dev_environment
    run_tests
    show_completion
}

# Run main function
main "$@" 