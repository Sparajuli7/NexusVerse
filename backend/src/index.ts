import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { connectDatabase } from '@/config/database';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { authMiddleware } from '@/middleware/auth';
import { typeDefs } from '@/graphql/schema';
import { resolvers } from '@/graphql/resolvers';

// Routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import communityRoutes from '@/routes/communities';
import eventRoutes from '@/routes/events';
import paymentRoutes from '@/routes/payments';
import webhookRoutes from '@/routes/webhooks';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/communities', authMiddleware, communityRoutes);
app.use('/api/events', authMiddleware, eventRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

// GraphQL Server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (error) => {
    logger.error('GraphQL Error:', error);
    return {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
    };
  },
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on('join-community', (communityId: string) => {
    socket.join(`community-${communityId}`);
    logger.info(`User ${socket.id} joined community ${communityId}`);
  });

  socket.on('leave-community', (communityId: string) => {
    socket.leave(`community-${communityId}`);
    logger.info(`User ${socket.id} left community ${communityId}`);
  });

  socket.on('join-event', (eventId: string) => {
    socket.join(`event-${eventId}`);
    logger.info(`User ${socket.id} joined event ${eventId}`);
  });

  socket.on('leave-event', (eventId: string) => {
    socket.leave(`event-${eventId}`);
    logger.info(`User ${socket.id} left event ${eventId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Start Apollo Server
    await apolloServer.start();
    app.use('/graphql', expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        return { token, io };
      },
    }));

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 GraphQL Playground: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

startServer(); 