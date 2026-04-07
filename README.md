# RecipeWala

RecipeWala is a full-stack recipe generation app with a Vite + React frontend and an Express + MongoDB backend.

## Project Structure

- `RecipewalaFE/` - React frontend built with Vite
- `RecipewalaBE/` - Express backend API

## Local Setup

### Backend
1. Open `RecipewalaBE/`.
2. Install dependencies:
	```bash
	npm install
	```
3. Create a `.env` file with the required variables:
	```env
	NODE_ENV=development
	PORT=5000
	MONGODB_URI=mongodb://localhost:27017/recipe_generator
	JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
	JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_here_minimum_32_characters
	JWT_EXPIRE=15m
	JWT_REFRESH_EXPIRE=7d
	GEMINI_API_KEY=your_gemini_api_key_here
	FRONTEND_URL=http://localhost:5173
	```
4. Start the backend:
	```bash
	npm run dev
	```

### Frontend
1. Open `RecipewalaFE/`.
2. Install dependencies:
	```bash
	npm install
	```
3. Create a `.env` file with the API base URL:
	```env
	VITE_API_BASE_URL=http://localhost:5000/api
	```
4. Start the frontend:
	```bash
	npm run dev
	```

## Production Deployment

### Recommended stack
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

### Deploy Backend on Render
1. Push the repository to GitHub.
2. Create a new Render Web Service.
3. Set the root directory to `RecipewalaBE`.
4. Use:
	- Build command: `npm install`
	- Start command: `npm start`
5. Add these environment variables in Render:
	- `NODE_ENV=production`
	- `PORT=10000` or the Render assigned port
	- `MONGODB_URI=<MongoDB Atlas connection string>`
	- `JWT_SECRET=<strong secret>`
	- `JWT_REFRESH_SECRET=<strong secret>`
	- `JWT_EXPIRE=15m`
	- `JWT_REFRESH_EXPIRE=7d`
	- `GEMINI_API_KEY=<Gemini API key>`
	- `FRONTEND_URL=<your Vercel frontend URL>`
6. Confirm `GET /api/health` returns success after deploy.

### Deploy Frontend on Vercel
1. Import the repo into Vercel.
2. Set the root directory to `RecipewalaFE`.
3. Use:
	- Build command: `npm run build`
	- Output directory: `dist`
4. Add this environment variable in Vercel:
	- `VITE_API_BASE_URL=https://<your-render-backend-url>/api`
5. Deploy and verify login, recipe generation, collections, profile, and shopping list pages.

> Important: the deployable frontend build lives inside `RecipewalaFE/`. Use that folder as the Vercel project root.

## Pre-deploy Checklist

1. Remove any leftover dev-only scripts or empty duplicate files.
2. Ensure all README files reflect the deployed environment.
3. Verify the frontend build succeeds.
4. Verify the backend starts cleanly with production environment variables.
5. Confirm CORS allows the Vercel domain.

## Notes

- The root `package.json` is the frontend package for Vite.
- Backend deployment uses the `RecipewalaBE/` folder directly.