# Authentication Service Documentation

## Overview

The Authentication Service provides comprehensive user authentication and session management for the Comment Sentiment Analyzer application. It includes user registration, login, JWT token management, and session caching with Redis.

## Features

- **User Registration**: Create new user accounts with email and password
- **User Login**: Authenticate users with email/password credentials
- **JWT Token Management**: Generate and validate JSON Web Tokens
- **Session Caching**: Redis-based session management with Prisma Accelerate
- **Password Security**: Bcrypt hashing with configurable salt rounds
- **Profile Management**: Update user profiles and change passwords
- **Rate Limiting**: Protection against brute force attacks

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isEmailVerified": false,
      "lastLoginAt": null,
      "createdAt": "2023-11-06T00:00:00.000Z",
      "updatedAt": "2023-11-06T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "data": {
    "user": {
      /* user object */
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/logout

Logout current user (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "message": "Logout successful"
}
```

#### GET /api/auth/profile

Get current user profile (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      /* user object */
    }
  }
}
```

#### PUT /api/auth/profile

Update user profile (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com"
}
```

#### PUT /api/auth/change-password

Change user password (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

#### GET /api/auth/verify

Verify token validity (requires authentication).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

## Security Features

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Rate Limiting

- Authentication endpoints: 5 attempts per 15 minutes per IP
- Automatic cleanup of expired rate limit entries

### Token Security

- JWT tokens signed with configurable secret
- Configurable expiration time (default: 7 days)
- Token validation includes cache verification
- Automatic token invalidation on logout

### Session Management

- Redis-based session caching
- Session data includes user ID, token, and creation time
- Automatic session cleanup on logout
- Session verification on each authenticated request

## Middleware

### authenticateToken

Validates JWT token and attaches user to request object.

```typescript
import { authenticateToken } from "../middleware/authMiddleware";

app.get("/protected", authenticateToken, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

### optionalAuth

Optionally validates token without blocking request.

```typescript
import { optionalAuth } from "../middleware/authMiddleware";

app.get("/public", optionalAuth, (req, res) => {
  // req.user may or may not be available
  if (req.user) {
    // User is authenticated
  }
});
```

### requireAuth

Ensures user is authenticated (use after authenticateToken).

```typescript
import { authenticateToken, requireAuth } from "../middleware/authMiddleware";

app.get("/protected", authenticateToken, requireAuth, (req, res) => {
  // Guaranteed that req.user exists
});
```

### authRateLimit

Configurable rate limiting for authentication endpoints.

```typescript
import { authRateLimit } from "../middleware/authMiddleware";

app.post("/auth/login", authRateLimit(5, 900000), (req, res) => {
  // 5 attempts per 15 minutes
});
```

## Environment Variables

Required environment variables for authentication:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/comment_sentiment_analyzer

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Encryption (for OAuth tokens)
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

## Error Handling

The authentication service provides comprehensive error handling:

- **400 Bad Request**: Validation errors, weak passwords
- **401 Unauthorized**: Invalid credentials, expired tokens
- **403 Forbidden**: Insufficient permissions
- **409 Conflict**: Email already exists
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side errors

## Usage Examples

### Frontend Integration

```typescript
// Login
const loginResponse = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    password: "password123",
  }),
});

const { data } = await loginResponse.json();
const { user, token } = data;

// Store token for future requests
localStorage.setItem("authToken", token);

// Make authenticated requests
const profileResponse = await fetch("/api/auth/profile", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Backend Service Usage

```typescript
import { AuthService } from "../services/authService";

// Register user
const result = await AuthService.register({
  email: "user@example.com",
  password: "SecurePassword123!",
  firstName: "John",
  lastName: "Doe",
});

// Verify token
const user = await AuthService.verifyToken(token);

// Update profile
const updatedUser = await AuthService.updateProfile(userId, {
  firstName: "Jane",
});
```

## Testing

The authentication service includes comprehensive tests:

- Unit tests for AuthService methods
- Integration tests for API endpoints
- Middleware tests for authentication flows
- Rate limiting tests

Run tests with:

```bash
npm test -- --testPathPattern="auth"
```

## Database Schema

The authentication system uses the following Prisma models:

```prisma
model User {
  id                String              @id @default(cuid())
  email             String              @unique
  password          String              // hashed password
  firstName         String?
  lastName          String?
  isEmailVerified   Boolean             @default(false)
  lastLoginAt       DateTime?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  // ... other relations
}
```

## Performance Considerations

- **Redis Caching**: Session data cached for fast token validation
- **Connection Pooling**: Prisma handles database connection pooling
- **Bcrypt Optimization**: Salt rounds configured for security/performance balance
- **Rate Limiting**: In-memory rate limiting with automatic cleanup

## Security Best Practices

1. **Strong Passwords**: Enforced password complexity requirements
2. **Secure Storage**: Passwords hashed with bcrypt, tokens encrypted
3. **Session Management**: Redis-based sessions with expiration
4. **Rate Limiting**: Protection against brute force attacks
5. **Input Validation**: Comprehensive request validation with Joi
6. **Error Handling**: Secure error messages that don't leak information
7. **HTTPS Only**: Ensure all authentication endpoints use HTTPS in production
