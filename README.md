# Ubuntu Mathematics Platform - Backend

Node.js + Express + MongoDB backend API for the Ubuntu Mathematics Platform.

## Features

- User authentication with JWT
- Math computation engine (Traditional + Ubuntu methods)
- Story and module management
- Progress tracking and analytics
- Innovation challenge submissions
- Admin APIs

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- TypeScript
- JWT authentication
- CORS enabled

## Environment Variables

Create a `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-change-this
PORT=5000
NODE_ENV=production
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Seed Database

```bash
node dist/seed.js
```

## Deploy to Vercel

1. Push this repository to GitHub
2. Import project in Vercel
3. Set environment variables: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`
4. Deploy

**Note:** Vercel uses serverless functions. The main `index.ts` exports the Express app for Vercel's serverless runtime.

## API Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/stories` - Get all stories
- `GET /api/modules` - Get all math modules
- `POST /api/computation/calculate` - Perform calculations
- `GET /api/progress/:userId` - Get user progress
- And more...
