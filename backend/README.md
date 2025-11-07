# LCJ Backend

Microservices architecture built with FastAPI for the LCJ Career Assessment System.

## 🏗️ Architecture

The backend follows a microservices architecture with the following services:

- **Auth Service** (Port 8001): Authentication and authorization
- **User Service** (Port 8002): User management and profiles
- **Test Service** (Port 8003): Test administration and questions
- **Report Service** (Port 8004): Report generation and analytics
- **Payment Service** (Port 8005): Payment processing
- **Notification Service** (Port 8006): Email and SMS notifications
- **API Gateway** (Port 8000): Request routing and load balancing

## 📁 Project Structure

```
backend/
├── auth_service/           # Authentication service
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Configuration and database
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   ├── tests/             # Test files
│   ├── migrations/        # Database migrations
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Container configuration
├── user_service/          # User management service
├── test_service/          # Test administration service
├── report_service/        # Report generation service
├── payment_service/       # Payment processing service
├── notification_service/  # Notification service
├── gateway/               # API Gateway
└── requirements.txt       # Shared dependencies
```

## 🛠️ Development

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start infrastructure services**
   ```bash
   cd ../infra/docker
   docker-compose up -d postgres redis rabbitmq
   ```

### Running Services

#### Individual Service
```bash
cd auth_service
uvicorn app.main:app --reload --port 8001
```

#### All Services (Development)
```bash
cd ../infra/docker
docker-compose up
```

#### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables

Each service uses the following environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db_name

# Redis
REDIS_URL=redis://localhost:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/

# JWT
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# External Services
USER_SERVICE_URL=http://localhost:8002
NOTIFICATION_SERVICE_URL=http://localhost:8006
```

### Database Migrations (Shared Alembic)

```bash
cd backend
alembic revision --autogenerate -m "init"
alembic upgrade head
```

## 🧪 Testing

### Running Tests
```bash
# All services
pytest

# Specific service
cd auth_service
pytest

# With coverage
pytest --cov=app --cov-report=html
```

### Test Structure
```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── fixtures/          # Test fixtures
└── conftest.py        # Test configuration
```

## 📊 API Documentation

Each service provides automatic API documentation:

- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`
- **OpenAPI JSON**: `http://localhost:8001/openapi.json`

## 🔒 Security

### Authentication
- JWT-based authentication
- Access and refresh tokens
- Password hashing with bcrypt
- Role-based access control

### Authorization
- Permission-based access control
- API key authentication for service-to-service communication
- Rate limiting and request throttling

## 📈 Monitoring

### Health Checks
Each service provides health check endpoints:
```bash
curl http://localhost:8001/health
```

### Logging
- Structured logging with structlog
- JSON format for production
- Log levels: DEBUG, INFO, WARNING, ERROR

### Metrics
- Prometheus metrics endpoint
- Custom business metrics
- Performance monitoring

## 🚀 Deployment

### Docker
```bash
# Build service
docker build -t lcj-auth_service ./auth_service

# Run service
docker run -p 8001:8001 lcj-auth_service
```

### Kubernetes
```bash
kubectl apply -f ../infra/k8s/
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security audit completed

## 🔄 CI/CD

The backend services are automatically built and deployed through GitHub Actions:

1. **Test**: Run unit and integration tests
2. **Build**: Create Docker images
3. **Push**: Push to container registry
4. **Deploy**: Deploy to Kubernetes cluster

## 🤝 Contributing

### Code Style
- **Black**: Code formatting
- **isort**: Import sorting
- **flake8**: Linting
- **mypy**: Type checking

### Pre-commit Hooks
```bash
pre-commit install
pre-commit run --all-files
```

### Pull Request Process
1. Create feature branch
2. Write tests
3. Update documentation
4. Submit pull request
5. Code review
6. Merge to main

## 📄 License

This project is part of the LCJ Career Assessment System.
