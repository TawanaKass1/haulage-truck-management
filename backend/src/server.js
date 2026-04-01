import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { pool, initDatabase } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import truckRoutes from './routes/truckRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import jobRoutes from './routes/jobRoutes.js';

import assignmentRoutes from './routes/assignments.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());

// Routes - IMPORTANT: Make sure this line exists
app.use('/api/auth', authRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/assignments', assignmentRoutes); // THIS LINE MUST BE HERE

// Debug route to check all registered routes
app.get('/api/debug-routes', (req, res) => {
    const routes = [];
    const extractRoutes = (stack, basePath = '') => {
        stack.forEach(layer => {
            if (layer.route) {
                const path = basePath + layer.route.path;
                const methods = Object.keys(layer.route.methods).join(', ');
                routes.push({ path, methods });
            } else if (layer.name === 'router' && layer.handle.stack) {
                const routerPath = layer.regexp.source
                    .replace('\\/?(?=\\/|$)', '')
                    .replace(/\\\//g, '/')
                    .replace(/\\\?/g, '?')
                    .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ':param');
                extractRoutes(layer.handle.stack, basePath + routerPath);
            }
        });
    };
    extractRoutes(app._router.stack);
    res.json(routes);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorMiddleware);

// Initialize database and start server
console.log('Starting server...');

initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Backend listening on port ${PORT}`);
        console.log(`📡 API available at http://localhost:${PORT}/api`);
        logger.info(`Server started on port ${PORT}`);
    });
}).catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
});

export { app };