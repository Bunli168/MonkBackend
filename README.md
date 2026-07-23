# Monk Backend API

Backend API for Monk Management System - built with Node.js, Express, SQLite, and Socket.io.

## Features

- **Authentication System**
  - JWT-based authentication with access and refresh tokens
  - OTP (One-Time Password) verification via email
  - TOTP (Time-based One-Time Password) for 2FA
  - Password reset functionality
  - Role-based access control (RBAC)

- **User Management**
  - User registration and profile management
  - Role assignment (ADMIN, LEADER, MEKUDI, MONK)
  - Profile updates

- **Real-time Communication**
  - Socket.io integration for real-time features
  - User-specific and admin rooms
  - Event broadcasting

- **Security**
  - Helmet for security headers
  - Rate limiting
  - CORS configuration
  - Password hashing with bcrypt
  - Input validation

## Tech Stack

- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT, bcryptjs
- **2FA**: Speakeasy (TOTP)
- **Email**: Nodemailer
- **Real-time**: Socket.io
- **Validation**: express-validator

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3001
   NODE_ENV=development
   DB_PATH=./database/monk.db
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   CORS_ORIGIN=http://localhost:5173
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=noreply@pagoda.com
   ```

3. **Initialize database**
   ```bash
   npm run init-db
   ```
   
   This will create default users:
   - **Admin**: admin@pagoda.com / Admin123
   - **Teacher**: mekudi@pagoda.com / Mekudi123
   - **Monk**: monk@pagoda.com / Monk123

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on port 3001 (or the port specified in `.env`).

## API Endpoints

### Authentication

#### `POST /api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "admin@pagoda.com",
  "password": "Admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "admin@pagoda.com",
    "firstName": "System",
    "lastName": "Admin",
    "role": { "id": 1, "name": "ADMIN" },
    "profile": { "avatarUrl": null }
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### `POST /api/auth/verify-otp`
Verify OTP code (if TOTP is enabled).

**Request Body:**
```json
{
  "otpCode": "123456",
  "otpSessionToken": "session-token-here"
}
```

#### `POST /api/auth/resend-otp`
Resend OTP code.

**Request Body:**
```json
{
  "otpSessionToken": "session-token-here"
}
```

#### `POST /api/auth/refresh-token`
Refresh access token using refresh token (sent via cookie or body).

#### `PUT /api/auth/change-default-password/:token`
Change password after first login or password reset.

**Request Body:**
```json
{
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

#### `GET /api/auth/profile`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

#### `PUT /api/auth/profile`
Update current user profile (requires authentication).

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": "123 Temple St",
  "bio": "Buddhist monk"
}
```

### TOTP (Two-Factor Authentication)

#### `POST /api/auth/totp/setup`
Setup TOTP for user account (requires authentication).

**Response:**
```json
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "otpauth://totp/Monk%20Management%20System:admin@pagoda.com?secret=JBSWY3DPEHPK3PXP&issuer=Pagoda"
}
```

#### `POST /api/auth/totp/verify-setup`
Verify and enable TOTP (requires authentication).

**Request Body:**
```json
{
  "token": "123456",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

#### `POST /api/auth/totp/disable`
Disable TOTP (requires authentication).

**Request Body:**
```json
{
  "token": "123456"
}
```

### Password Reset

#### `POST /api/auth/forgot-password`
Request password reset link.

**Request Body:**
```json
{
  "email": "user@pagoda.com"
}
```

#### `POST /api/auth/reset-password`
Reset password using token.

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

#### `POST /api/auth/logout`
Logout user (requires authentication).

## Socket.io Events

### Client → Server

- `join_user` - Join user-specific room
- `join_admin` - Join admin room (requires admin role)
- `leave_user` - Leave user-specific room
- `leave_admin` - Leave admin room

### Server → Client

- Custom events can be emitted to:
  - Specific users: `user_{userId}`
  - All admins: `admin`
  - All connected clients: broadcast

## Database Schema

### Tables

- **roles**: User roles (ADMIN, LEADER, MEKUDI, MONK)
- **users**: User accounts with authentication data
- **user_profiles**: Extended user profile information
- **otp_sessions**: OTP session management
- **refresh_tokens**: JWT refresh token storage
- **password_reset_tokens**: Password reset token management

## Security Considerations

1. **Change default passwords** after first login
2. **Use strong JWT secrets** in production
3. **Configure SMTP** for email functionality
4. **Enable HTTPS** in production
5. **Use environment variables** for sensitive data
6. **Implement rate limiting** (already configured)
7. **Regular security updates** for dependencies

## Development

### Project Structure

```
Monkbackend/
├── config/
│   ├── database.js       # Database configuration
│   ├── socket.js          # Socket.io configuration
│   └── index.js           # General configuration
├── middleware/
│   ├── auth.js            # Authentication middleware
│   └── validate.js        # Input validation
├── models/
│   ├── User.js            # User model
│   ├── Role.js            # Role model
│   ├── OtpSession.js      # OTP session model
│   ├── RefreshToken.js    # Refresh token model
│   └── PasswordResetToken.js  # Password reset model
├── routes/
│   └── auth.js            # Authentication routes
├── scripts/
│   └── initDb.js          # Database initialization script
├── utils/
│   ├── jwt.js             # JWT utilities
│   ├── otp.js             # OTP/TOTP utilities
│   └── email.js           # Email utilities
├── server.js              # Main server entry point
├── package.json
├── .env.example
└── README.md
```

## Frontend Integration

The backend is designed to work with the Vue.js frontend in the `MonkManage` directory. Update the frontend's `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## License

ISC
