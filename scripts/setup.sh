#!/bin/bash

# LCJ Career Assessment System - Setup Script
# This script helps set up the new full-stack project structure

set -e

echo "🚀 Setting up LCJ Career Assessment System..."

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
    print_status "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.11+"
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
    
    print_success "Requirements check completed"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    if [ -f "package.json" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
        print_success "Frontend dependencies installed"
    else
        print_error "package.json not found in frontend directory"
        exit 1
    fi
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        print_status "Creating .env.local file..."
        cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=LCJ Career Assessment
EOF
        print_success ".env.local created"
    fi
    
    cd ..
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created"
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Install dependencies
    if [ -f "requirements.txt" ]; then
        print_status "Installing Python dependencies..."
        pip install -r requirements.txt
        print_success "Backend dependencies installed"
    else
        print_error "requirements.txt not found in backend directory"
        exit 1
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating .env file..."
        cat > .env << EOF
# Database
DATABASE_URL=postgresql://lcj_user:lcj_password@localhost:5432/lcj

# Redis
REDIS_URL=redis://localhost:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://lcj_user:lcj_password@localhost:5672/

# JWT
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=development
DEBUG=true
EOF
        print_success ".env file created"
    fi
    
    deactivate
    cd ..
}

# Setup infrastructure
setup_infrastructure() {
    print_status "Setting up infrastructure..."
    
    cd infra/docker
    
    # Create .env file for docker-compose if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating docker-compose .env file..."
        cat > .env << EOF
# Database
POSTGRES_DB=lcj
POSTGRES_USER=lcj_user
POSTGRES_PASSWORD=lcj_password

# RabbitMQ
RABBITMQ_DEFAULT_USER=lcj_user
RABBITMQ_DEFAULT_PASS=lcj_password

# Environment
ENVIRONMENT=development
EOF
        print_success "Docker environment file created"
    fi
    
    cd ../..
}

# Start development environment
start_dev_environment() {
    print_status "Starting development environment..."
    
    cd infra/docker
    
    # Start infrastructure services
    print_status "Starting infrastructure services..."
    docker-compose up -d postgres redis rabbitmq
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    print_success "Infrastructure services started"
    print_status "You can now start individual services:"
    echo "  - Frontend: cd frontend && npm run dev"
    echo "  - Backend services: cd backend/[service] && uvicorn app.main:app --reload --port [port]"
    
    cd ../..
}

# Display next steps
show_next_steps() {
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Start the frontend:"
    echo "   cd frontend && npm run dev"
    echo ""
    echo "2. Start backend services:"
    echo "   cd backend/auth_service && uvicorn app.main:app --reload --port 8001"
    echo "   cd backend/user-service && uvicorn app.main:app --reload --port 8002"
    echo "   # ... repeat for other services"
    echo ""
    echo "3. Or start everything with Docker:"
    echo "   cd infra/docker && docker-compose up"
    echo ""
    echo "4. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   API Gateway: http://localhost:8000"
    echo "   API Docs: http://localhost:8001/docs"
    echo ""
    echo "📚 Documentation:"
    echo "   - Frontend: ./frontend/README.md"
    echo "   - Backend: ./backend/README.md"
    echo "   - Infrastructure: ./infra/README.md"
    echo ""
}

# Main execution
main() {
    echo "🏗️  LCJ Career Assessment System - Setup"
    echo "=========================================="
    echo ""
    
    check_requirements
    setup_frontend
    setup_backend
    setup_infrastructure
    
    # Ask if user wants to start development environment
    echo ""
    read -p "Do you want to start the development environment now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_dev_environment
    fi
    
    show_next_steps
}

# Run main function
main "$@"
