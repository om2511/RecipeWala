# Recipe Wala Backend

A robust Node.js backend API for the Recipe Wala application that generates AI-powered recipes using Google's Gemini API.

## Features

- 🤖 **AI Recipe Generation** - Powered by Google Gemini API
- 🔐 **Secure Authentication** - JWT-based auth with refresh tokens
- 👤 **User Management** - Registration, login, profile management
- 📖 **Recipe Management** - CRUD operations for recipes
- 🔍 **Search Functionality** - Full-text search through recipes
- 🛡️ **Security** - Rate limiting, input validation, sanitization
- 📊 **Logging** - Comprehensive logging with Winston
- 🚀 **Production Ready** - Error handling, security headers, CORS

## Tech Stack

- **Node.js** & **Express.js** - Backend framework
- **MongoDB** & **Mongoose** - Database
- **Google Gemini API** - AI recipe generation
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting

## Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- Google Gemini API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RecipewalaBE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your values:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/recipe_generator
   JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
   JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here_minimum_32_characters
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get user profile

### Recipes
- `POST /api/recipes/generate` - Generate new recipe using AI
- `GET /api/recipes` - Get user's recipes (paginated)
- `GET /api/recipes/:id` - Get specific recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `GET /api/recipes/search?query=...` - Search recipes

### Users
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard-stats` - Get dashboard statistics
- `PUT /api/users/change-password` - Change password
- `DELETE /api/users/account` - Delete user account

### Health Check
- `GET /api/health` - Server health check

## Project Structure

```
src/
├── config/
│   ├── database.js      # MongoDB connection
│   ├── gemini.js        # Gemini AI configuration
│   └── env.js           # Environment validation
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── recipeController.js  # Recipe operations
│   └── userController.js    # User management
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Input validation
│   ├── errorHandler.js      # Global error handling
│   └── rateLimit.js         # Rate limiting
├── models/
│   ├── User.js              # User schema
│   └── Recipe.js            # Recipe schema
├── routes/
│   ├── auth.js              # Auth routes
│   ├── recipes.js           # Recipe routes
│   └── users.js             # User routes
├── services/
│   ├── authService.js       # Auth business logic
│   ├── geminiService.js     # Gemini AI service
│   └── emailService.js      # Email service (future)
└── utils/
    ├── logger.js            # Winston logger
    ├── responseHandler.js   # Response formatting
    └── validators.js        # Validation utilities
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 5000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT secret key (min 32 chars) | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh secret key (min 32 chars) | Yes |
| `JWT_EXPIRE` | Access token expiry | No (default: 15m) |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | No (default: 7d) |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:3000) |

## Security Features

- **Rate Limiting**: Different limits for auth and recipe generation
- **Input Validation**: Comprehensive validation using express-validator
- **Data Sanitization**: MongoDB injection prevention
- **Secure Headers**: Helmet.js for security headers
- **Password Security**: bcrypt hashing with salt rounds
- **JWT Security**: Secure token generation with refresh mechanism
- **CORS**: Configured for frontend integration

## Error Handling

The application includes comprehensive error handling:
- Global error handler middleware
- Mongoose error transformation
- JWT error handling
- Validation error formatting
- Logging of all errors

## Logging

Winston logger configuration:
- Console logging in development
- File logging (error.log, combined.log)
- Log rotation and size limits
- Structured JSON logging

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **Recipe Generation**: 3 requests per minute

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# View logs
tail -f logs/combined.log
```

## Production Deployment

### Recommended stack
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

### Backend deployment on Render
1. Push the backend to GitHub.
2. Create a new Render Web Service and connect the repo.
3. Set the root directory to `RecipewalaBE`.
4. Use the build/start commands:
   - Build: `npm install`
   - Start: `npm start`
5. Add these environment variables in Render:
   - `NODE_ENV=production`
   - `PORT=10000` or let Render assign the port
   - `MONGODB_URI=<your MongoDB Atlas connection string>`
   - `JWT_SECRET=<strong secret>`
   - `JWT_REFRESH_SECRET=<strong secret>`
   - `JWT_EXPIRE=15m`
   - `JWT_REFRESH_EXPIRE=7d`
   - `GEMINI_API_KEY=<your Gemini key>`
   - `FRONTEND_URL=<your Vercel frontend URL>`
6. Deploy and verify `GET /api/health` returns success.

### Pre-deploy checklist
1. Make sure `MONGODB_URI` points to MongoDB Atlas.
2. Make sure the frontend API base URL points to the deployed backend.
3. Confirm Gemini and JWT secrets are set in Render.
4. Verify the backend accepts your Vercel domain in CORS.

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests if applicable
5. Submit pull request

## License

MIT License - see LICENSE file for details
