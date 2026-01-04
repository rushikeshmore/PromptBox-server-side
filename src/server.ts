import { app } from './app';
import { config } from './config';

/**
 * Normalize port number
 */
const normalizePort = (val: number | string): number => {
  const port = typeof val === 'string' ? parseInt(val, 10) : val;

  if (isNaN(port)) {
    throw new Error(`Invalid port: ${val}`);
  }

  if (port < 0 || port > 65535) {
    throw new Error(`Port must be between 0 and 65535, got: ${port}`);
  }

  return port;
};

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    const port = normalizePort(config.server.port);
    const host = config.server.host;

    // Start listening
    app.listen(port, host, () => {
      console.log('\n🚀 Server started successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📦 App Name:     ${config.app.name}`);
      console.log(`🌍 Environment:  ${config.server.nodeEnv}`);
      console.log(`🔗 URL:          http://${host}:${port}`);
      console.log(`🏥 Health:       http://${host}:${port}/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Press CTRL+C to stop\n');
    });

    // Handle server errors
    app.server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

      switch (error.code) {
        case 'EACCES':
          console.error(`❌ ${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ ${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n\n⚠️  Received ${signal}, starting graceful shutdown...`);

  try {
    // Close server (stop accepting new connections)
    await app.close();
    console.log('✅ Server closed');

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

/**
 * Process event handlers
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

/**
 * Bootstrap the application
 */
startServer();
