// Vercel serverless function entry point
import express from "express";
import { registerRoutes } from '../server/routes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set production environment for serverless
process.env.NODE_ENV = 'production';

// Register API routes only (no Vite middleware in production)
await registerRoutes(app);

export default app;