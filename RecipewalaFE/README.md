# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Recipe Wala Frontend

React + Vite frontend for Recipe Wala.

## Production Deployment

### Recommended stack
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

### Deploy to Vercel
1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Set the root directory to `RecipewalaFE`.
4. Use these build settings:
	- Build command: `npm run build`
	- Output directory: `dist`
5. Add this environment variable in Vercel:
	- `VITE_API_BASE_URL=https://<your-render-backend-url>/api`
6. Deploy and verify the app can sign in, fetch recipes, and generate recipes.

### Pre-deploy checklist
1. Make sure the backend is already deployed on Render.
2. Make sure `VITE_API_BASE_URL` points to the Render API URL.
3. Confirm the frontend domain is allowed in backend CORS.
4. Test login, recipe generation, collections, and profile pages after deployment.

## Local Development

```bash
npm install
npm run dev
```
