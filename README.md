# Comment Sentiment Analyzer

A comprehensive AI-powered platform for analyzing sentiment in social media comments across multiple platforms (YouTube, Instagram, Twitter/X, TikTok). Built with modern technologies and designed for scalability, security, and performance.

## 🚀 Features

- **Multi-Platform Integration**: Connect YouTube, Instagram, Twitter/X, and TikTok accounts
- **AI-Powered Analysis**: Advanced sentiment analysis with emotion detection and theme clustering
- **Real-Time Processing**: Background job processing with progress tracking
- **Comprehensive Insights**: Detailed sentiment breakdowns, keyword extraction, and AI-generated summaries
- **Export Capabilities**: PDF reports, CSV data, JSON exports, and visual charts
- **Comparison Tools**: Compare sentiment across multiple posts and time periods
- **Modern UI**: Responsive React frontend with dark/light mode and smooth animations
- **Enterprise Ready**: Docker deployment, monitoring, logging, and security features

## 🏗️ Architecture

### Technology Stack

**Backend:**

- Node.js with Express.js and TypeScript
- PostgreSQL with Prisma ORM
- Redis for caching and session management
- JWT authentication with OAuth integration
- OpenAI GPT and Google Gemini for AI analysis

**Frontend:**

- React 18 with Next.js 14 and TypeScript
- TanStack Query for state management
- Tailwind CSS with shadcn/ui components
- Framer Motion for animations

**Infrastructure:**

- Docker containerization
- Nginx reverse proxy
- Prometheus monitoring
- Grafana dashboards
- Automated CI/CD pipelines

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend]
        B[Mobile App]
    end

    subgraph "API Gateway"
        C[Nginx]
        D[Load Balancer]
    end

    subgraph "Application Layer"
        E[Node.js API]
        F[Background Jobs]
    end

    subgraph "Data Layer"
        G[PostgreSQL]
        H[Redis Cache]
    end

    subgraph "External Services"
        I[Social Media APIs]
        J[AI Services]
    end

    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
```

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (or use Docker)
- **Git** for version control

### Required API Keys

- **OpenAI API Key** for sentiment analysis
- **Google OAuth credentials** for YouTube integration
- **Facebook App credentials** for Instagram integration
- **Twitter API credentials** for Twitter/X integration
- **TikTok Developer credentials** for TikTok integration

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/comment-sentiment-analyzer.git
cd comment-sentiment-analyzer
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://analyzer:password@localhost:5432/comment_analyzer
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-change-this

# AI Services
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# ... (see .env.example for complete list)
```

### 3. Development Setup

#### Option A: Docker Development (Recommended)

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec api npx prisma migrate deploy

# Seed development data
docker-compose exec api npm run db:seed

# View logs
docker-compose logs -f
```

#### Option B: Local Development

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start PostgreSQL and Redis (using Docker)
docker-compose up -d db redis

# Run database migrations
cd ../backend
npx prisma migrate deploy
npm run db:seed

# Start backend (in one terminal)
npm run dev

# Start frontend (in another terminal)
cd ../frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5628
- **API**: http://localhost:5628
- **API Documentation**: http://localhost:5628/docs
- **Grafana Monitoring**: http://localhost:3002 (admin/admin)

### 5. Demo Login

Use these credentials to explore the application:

- **Email**: demo@comment-analyzer.com
- **Password**: DemoPassword123!

## 🔧 Development

### Project Structure

```
comment-sentiment-analyzer/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   ├── docs/               # API documentation
│   └── Dockerfile
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── app/           # Next.js pages (App Router)
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   └── types/         # TypeScript types
│   ├── docs/              # Component documentation
│   └── Dockerfile
├── monitoring/            # Monitoring configuration
├── scripts/              # Deployment and utility scripts
└── docker-compose.yml   # Docker services configuration
```

### Available Scripts

#### Backend Scripts

```bash
cd backend

# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed development data
npm run db:reset        # Reset database
npm run db:studio       # Open Prisma Studio

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking
```

#### Frontend Scripts

```bash
cd frontend

# Development
npm run dev             # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run Playwright tests
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking
```

### Database Management

#### Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

#### Schema Updates

```bash
# Generate Prisma client after schema changes
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

### API Documentation

The API is fully documented using OpenAPI 3.0 specification:

- **Interactive Docs**: http://localhost:5628/docs
- **OpenAPI Spec**: `backend/docs/openapi.yaml`
- **Postman Collection**: Available in `backend/docs/`

## 🚀 Production Deployment

### Docker Deployment (Recommended)

```bash
# Build and deploy
./scripts/deploy.sh production v1.0.0

# Health check
./scripts/deploy.sh health

# Rollback if needed
./scripts/deploy.sh rollback
```

### Manual Deployment

```bash
# Build applications
cd backend && npm run build
cd ../frontend && npm run build

# Set production environment
export NODE_ENV=production

# Run database migrations
npx prisma migrate deploy

# Start services
npm run start
```

### Environment Configuration

#### Production Environment Variables

```bash
# Security
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://your-domain.com

# Database (use connection pooling)
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20

# Redis (use cluster for high availability)
REDIS_URL=redis://redis-cluster:6379

# Monitoring
ENABLE_METRICS=true
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn
```

#### SSL Configuration

```bash
# Enable HTTPS
FORCE_HTTPS=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

## 📊 Monitoring

### Metrics and Dashboards

The application includes comprehensive monitoring:

- **Application Metrics**: Request rates, response times, error rates
- **Business Metrics**: User registrations, analysis completions, platform connections
- **Infrastructure Metrics**: CPU, memory, disk usage, database performance
- **Custom Dashboards**: Pre-built Grafana dashboards for all metrics

### Health Checks

```bash
# API health
curl http://localhost:5628/health

# Detailed system status
curl http://localhost:5628/health/detailed

# Database connectivity
curl http://localhost:5628/health/db

# External services
curl http://localhost:5628/health/external
```

### Logging

Structured logging with correlation IDs:

```bash
# View application logs
docker-compose logs -f api

# View specific service logs
docker-compose logs -f frontend

# Search logs by correlation ID
docker-compose logs api | grep "correlation_id=abc123"
```

## 🔒 Security

### Authentication & Authorization

- **JWT Tokens**: Secure token-based authentication
- **OAuth Integration**: Social media platform authentication
- **Session Management**: Redis-based session storage
- **Rate Limiting**: Configurable rate limits per endpoint

### Data Protection

- **Encryption**: All sensitive data encrypted at rest and in transit
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: Content Security Policy and input sanitization

### Security Headers

```javascript
// Automatically applied security headers
{
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

## 🧪 Testing

### Test Coverage

- **Unit Tests**: 90%+ coverage for business logic
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Complete user workflows
- **Performance Tests**: Load testing for scalability

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test -- --grep "AuthService"

# Run E2E tests
npm run test:e2e
```

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages

### Pull Request Guidelines

- Include comprehensive tests for new features
- Update documentation for API changes
- Ensure all CI checks pass
- Add screenshots for UI changes
- Reference related issues

## 📚 Documentation

### API Documentation

- [OpenAPI Specification](backend/docs/openapi.yaml)
- [API Documentation](backend/docs/api-documentation.md)
- [System Architecture](backend/docs/system-architecture.md)

### Frontend Documentation

- [Component Hierarchy](frontend/docs/component-hierarchy.md)
- [State Management](frontend/docs/state-management.md)
- [UI Guidelines](frontend/docs/ui-guidelines.md)

### Deployment Documentation

- [Docker Deployment](docs/deployment/docker.md)
- [Kubernetes Deployment](docs/deployment/kubernetes.md)
- [Monitoring Setup](docs/monitoring/setup.md)

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database status
docker-compose ps db

# View database logs
docker-compose logs db

# Test connection
docker-compose exec api npx prisma db pull
```

#### Redis Connection Issues

```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

#### OAuth Configuration Issues

```bash
# Verify OAuth credentials
curl -X GET "http://localhost:5628/auth/google/callback?code=test"

# Check OAuth redirect URLs in platform settings
# Ensure URLs match exactly (including http/https)
```

### Performance Issues

#### Database Performance

```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check database connections
SELECT count(*) FROM pg_stat_activity;
```

#### Memory Issues

```bash
# Check memory usage
docker stats

# Analyze memory leaks
docker-compose exec api node --inspect=0.0.0.0:9229 dist/index.js
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT API
- **Google** for Gemini API and OAuth services
- **Prisma** for excellent ORM and database tools
- **Vercel** for Next.js and deployment platform
- **Community** for open-source libraries and contributions

## 📞 Support

### Getting Help

- **Documentation**: Check the docs folder for detailed guides
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: support@comment-analyzer.com

### Commercial Support

Enterprise support and custom development available:

- **Priority Support**: 24/7 support with SLA
- **Custom Features**: Tailored development for specific needs
- **Training**: Team training and onboarding
- **Consulting**: Architecture and scaling consultation

---

**Built with ❤️ by the Comment Sentiment Analyzer Team**
