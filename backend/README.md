# Comment Sentiment Analyzer - Backend

A Node.js backend API for analyzing comment sentiment across social media platforms using AI-powered natural language processing.

## Features

- 🔐 OAuth integration with YouTube, Instagram, Twitter/X, and TikTok
- 🤖 AI-powered sentiment analysis using OpenAI GPT-4
- 📊 Comment clustering and theme extraction
- 🚀 High-performance database operations with Prisma ORM
- ⚡ Optional Prisma Accelerate support for enhanced performance
- 🔄 Redis caching for improved response times
- 🛡️ Comprehensive security middleware
- 📝 TypeScript for type safety
- 🧪 Jest testing framework

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **AI/ML**: OpenAI GPT-4
- **Authentication**: Passport.js with OAuth
- **Testing**: Jest
- **Security**: Helmet, CORS, Rate limiting

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- OpenAI API key
- OAuth credentials for social media platforms

### Installation

1. **Clone and setup**:

   ```bash
   cd backend
   npm run setup
   ```

2. **Configure environment**: Update `.env` file with your actual credentials:

   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/comment_sentiment_analyzer"

   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"

   # OAuth credentials for each platform
   YOUTUBE_CLIENT_ID="your-youtube-client-id"
   # ... etc
   ```

3. **Setup database**:

   ```bash
   npm run prisma:migrate
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## Environment Configuration

### Required Variables

| Variable         | Description                                | Example                                    |
| ---------------- | ------------------------------------------ | ------------------------------------------ |
| `DATABASE_URL`   | PostgreSQL connection string               | `postgresql://user:pass@localhost:5432/db` |
| `OPENAI_API_KEY` | OpenAI API key for sentiment analysis      | `sk-...`                                   |
| `JWT_SECRET`     | Secret for JWT token signing (32+ chars)   | `your-secret-key`                          |
| `ENCRYPTION_KEY` | Key for encrypting OAuth tokens (32 chars) | `your-32-character-encryption-key`         |

### Email Configuration

The application supports multiple email providers. Nodemailer (SMTP) is the default:

| Variable         | Description                  | Example                |
| ---------------- | ---------------------------- | ---------------------- |
| `EMAIL_PROVIDER` | Email provider to use        | `nodemailer`           |
| `SMTP_HOST`      | SMTP server hostname         | `smtp.gmail.com`       |
| `SMTP_PORT`      | SMTP server port             | `587`                  |
| `SMTP_SECURE`    | Use SSL/TLS                  | `false`                |
| `SMTP_USER`      | SMTP username/email          | `your-email@gmail.com` |
| `SMTP_PASS`      | SMTP password/app password   | `your-app-password`    |
| `FROM_EMAIL`     | Default sender email address | `noreply@echomind.ai`  |

#### Alternative Email Providers

- **Resend**: Set `EMAIL_PROVIDER=resend` and `RESEND_API_KEY`
- **Mailtrap**: Set `EMAIL_PROVIDER=mailtrap` and configure `MAILTRAP_TOKEN`, `MAILTRAP_ACCOUNT_ID`
- **Console**: Set `EMAIL_PROVIDER=console` for development (logs emails to console)

### OAuth Credentials

Configure OAuth applications for each platform:

- **YouTube**: [Google Cloud Console](https://console.cloud.google.com/)
- **Instagram**: [Meta for Developers](https://developers.facebook.com/)
- **Twitter/X**: [Twitter Developer Portal](https://developer.twitter.com/)
- **TikTok**: [TikTok for Developers](https://developers.tiktok.com/)

### Optional: Prisma Accelerate

For production deployments, enable Prisma Accelerate for enhanced performance:

1. Set up Prisma Accelerate in your Prisma Cloud account
2. Add your Accelerate URL to `.env`:
   ```bash
   ACCELERATE_URL="prisma://accelerate.prisma-data.net/?api_key=your-api-key"
   ```

## Available Scripts

| Script                    | Description              |
| ------------------------- | ------------------------ |
| `npm run setup`           | Initial project setup    |
| `npm run dev`             | Start development server |
| `npm run build`           | Build for production     |
| `npm run start`           | Start production server  |
| `npm run test`            | Run tests                |
| `npm run test:watch`      | Run tests in watch mode  |
| `npm run prisma:generate` | Generate Prisma client   |
| `npm run prisma:migrate`  | Run database migrations  |
| `npm run prisma:studio`   | Open Prisma Studio       |
| `npm run prisma:reset`    | Reset database           |

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Social Media Integration

- `GET /api/platforms/connect/:platform` - Initiate OAuth
- `GET /api/platforms/posts` - Fetch user posts
- `POST /api/analysis/start` - Start comment analysis

### Analysis Results

- `GET /api/analysis/:id/results` - Get analysis results
- `GET /api/analysis/:id/export` - Export results
- `GET /api/analysis/history` - Analysis history

## Database Schema

The application uses Prisma ORM with the following main models:

- **User**: User accounts and authentication
- **ConnectedPlatform**: OAuth connections to social media
- **Post**: Social media posts for analysis
- **Comment**: Individual comments from posts
- **AnalysisResult**: AI analysis results with sentiment data

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Testing Email Configuration

Test your email setup with the included test script:

```bash
# Test Nodemailer configuration
node test-nodemailer.js
```

This will verify your SMTP connection and send a test email. For Gmail users:

1. Enable 2-factor authentication
2. Generate an App Password: [Google App Passwords](https://support.google.com/accounts/answer/185833)
3. Use the App Password in `SMTP_PASS` instead of your regular password

### Database Operations

```bash
# Create new migration
npx prisma migrate dev --name migration-name

# Reset database (development only)
npm run prisma:reset

# View database in Prisma Studio
npm run prisma:studio
```

### Debugging

The application includes comprehensive logging:

- Development: Query logs, errors, and warnings
- Production: Error logs only
- Health check endpoint for monitoring

## Security

- JWT-based authentication
- OAuth token encryption at rest
- Rate limiting on API endpoints
- CORS configuration
- Helmet security headers
- Input validation with Joi
- SQL injection prevention via Prisma

## Performance

- Redis caching for frequently accessed data
- Database connection pooling
- Optional Prisma Accelerate for enhanced performance
- Background job processing for heavy operations
- Optimized database queries with proper indexing

## Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong JWT and encryption secrets
3. Configure production database
4. Set up Redis instance
5. Configure OAuth redirect URLs
6. Enable Prisma Accelerate (recommended)
7. Set up monitoring and logging
8. Configure reverse proxy (nginx/Apache)
9. Enable SSL/TLS

### Docker Support

```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details
