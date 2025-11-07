#!/bin/bash

# Life Changing Journey - Production Deployment Script

set -e  # Exit on any error

echo "🚀 Starting Life Changing Journey deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.production to .env and configure it."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🗄️ Starting database and Redis..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database migrations..."
docker-compose run --rm auth-service alembic upgrade head
docker-compose run --rm question-service alembic upgrade head
docker-compose run --rm results-service alembic upgrade head
docker-compose run --rm contact-service alembic upgrade head

echo "🚀 Starting all services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Health checks
echo "🏥 Performing health checks..."

services=("auth-service:8001" "question-service:8002" "results-service:8003" "contact-service:8004" "frontend:3000")

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name health check failed"
    fi
done

echo "🎉 Deployment completed!"
echo ""
echo "📊 Service URLs:"
echo "   Frontend: http://localhost:3000"
echo "   API Gateway: http://localhost:8080"
echo "   Celery Flower: http://localhost:5555"
echo ""
echo "🔧 Management commands:"
echo "   View logs: docker-compose logs -f [service-name]"
echo "   Stop all: docker-compose down"
echo "   Restart: docker-compose restart [service-name]"
echo ""
echo "📈 Monitor your services and check logs for any issues."
