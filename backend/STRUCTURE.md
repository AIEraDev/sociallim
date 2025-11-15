# Backend Project Structure

```
backend/
├── src/                          # Source code
│   ├── config/                   # Configuration files
│   │   ├── database.ts          # Prisma client configuration
│   │   ├── environment.ts       # Environment validation & config
│   │   └── redis.ts             # Redis client configuration
│   ├── middleware/               # Express middleware
│   │   ├── errorHandler.ts      # Global error handling
│   │   └── notFoundHandler.ts   # 404 handler
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts             # Shared types
│   ├── utils/                    # Utility functions
│   │   └── logger.ts            # Logging utilities
│   ├── test/                     # Test configuration
│   │   └── setup.ts             # Jest setup
│   └── index.ts                 # Main application entry point
├── prisma/                       # Prisma ORM files
│   └── schema.prisma            # Database schema definition
├── scripts/                      # Utility scripts
│   ├── setup.js                 # Project setup script
│   └── validate-config.js       # Configuration validation
├── dist/                         # Compiled JavaScript (generated)
├── node_modules/                 # Dependencies (generated)
├── .env                         # Environment variables (local)
├── .env.example                 # Environment template
├── package.json                 # Node.js dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest testing configuration
├── README.md                    # Project documentation
└── STRUCTURE.md                 # This file
```

## Key Components

### Configuration (`src/config/`)

- **database.ts**: Prisma client singleton with Accelerate support
- **environment.ts**: Environment variable validation using Joi
- **redis.ts**: Redis client with connection management

### Middleware (`src/middleware/`)

- **errorHandler.ts**: Centralized error handling with proper HTTP status codes
- **notFoundHandler.ts**: 404 error handling for undefined routes

### Core Features (To be implemented)

```
src/
├── services/                     # Business logic services
│   ├── auth/                    # Authentication services
│   ├── social-media/            # Platform integration services
│   ├── ai-analysis/             # AI processing services
│   └── data-processing/         # Data management services
├── routes/                       # API route definitions
│   ├── auth.ts                  # Authentication routes
│   ├── platforms.ts             # Social media platform routes
│   ├── analysis.ts              # Analysis routes
│   └── export.ts                # Export routes
├── controllers/                  # Request handlers
├── models/                       # Data models and validation
└── jobs/                        # Background job processors
```

## Database Schema

The Prisma schema defines the following models:

- **User**: User accounts and authentication
- **ConnectedPlatform**: OAuth connections to social media platforms
- **Post**: Social media posts selected for analysis
- **Comment**: Individual comments from posts
- **AnalysisResult**: AI analysis results
- **SentimentBreakdown**: Sentiment percentages
- **Emotion**: Detected emotions with percentages
- **Theme**: Comment themes and clusters
- **Keyword**: Extracted keywords with context

## Environment Configuration

### Core Settings

- `NODE_ENV`: Environment (development/production/test)
- `PORT`: Server port (default: 5628)
- `FRONTEND_URL`: Frontend application URL

### Database

- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_DATABASE_URL`: Direct database URL for migrations
- `ACCELERATE_URL`: Prisma Accelerate URL (optional)

### External Services

- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key for sentiment analysis
- OAuth credentials for each social media platform

### Security

- `JWT_SECRET`: JWT signing secret (32+ characters)
- `ENCRYPTION_KEY`: OAuth token encryption key (32 characters)

## Scripts

- `npm run setup`: Initial project setup
- `npm run dev`: Development server with hot reload
- `npm run build`: TypeScript compilation
- `npm run test`: Run test suite
- `npm run validate`: Validate configuration
- `npm run prisma:*`: Database operations

## Development Workflow

1. **Setup**: Run `npm run setup` for initial configuration
2. **Configure**: Update `.env` with actual credentials
3. **Database**: Run `npm run prisma:migrate` to create tables
4. **Develop**: Use `npm run dev` for development
5. **Test**: Run `npm test` before committing
6. **Build**: Use `npm run build` for production builds

## Security Features

- JWT-based authentication
- OAuth token encryption at rest
- Rate limiting middleware
- CORS configuration
- Helmet security headers
- Input validation with Joi
- SQL injection prevention via Prisma ORM

## Performance Optimizations

- Prisma client singleton pattern
- Redis caching for frequently accessed data
- Optional Prisma Accelerate for enhanced performance
- Database connection pooling
- Background job processing for heavy operations
- Optimized database queries with proper indexing
