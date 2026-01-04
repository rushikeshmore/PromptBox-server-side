import http from 'http';
import { URL } from 'url';
import { config } from './config';

/**
 * Request Handler Type
 */
export type RequestHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => void | Promise<void>;

/**
 * Route Definition
 */
interface Route {
  method: string;
  path: string;
  handler: RequestHandler;
}

/**
 * Application Class
 * Core HTTP server with routing
 */
export class Application {
  private routes: Route[] = [];
  public server: http.Server;

  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
    this.setupDefaultRoutes();
  }

  /**
   * Setup default routes (health check, 404, etc.)
   */
  private setupDefaultRoutes(): void {
    // Health check endpoint
    this.get('/health', (_req, res) => {
      this.sendJson(res, 200, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.server.nodeEnv,
      });
    });

    // Root endpoint
    this.get('/', (_req, res) => {
      this.sendJson(res, 200, {
        message: 'PromptBox API',
        version: '1.0.0',
        documentation: '/api/docs',
      });
    });
  }

  /**
   * Main request handler
   */
  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Parse URL
      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
      const pathname = parsedUrl.pathname;
      const method = req.method?.toUpperCase() || 'GET';

      // Log request
      console.log(`${method} ${pathname}`);

      // Enable CORS
      this.setCorsHeaders(res);

      // Handle preflight
      if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Find matching route
      const route = this.routes.find(
        (r) => r.method === method && this.matchPath(r.path, pathname)
      );

      if (route) {
        await route.handler(req, res);
      } else {
        this.sendJson(res, 404, {
          error: 'Not Found',
          message: `Cannot ${method} ${pathname}`,
        });
      }

      // Log response time
      const duration = Date.now() - startTime;
      console.log(`${method} ${pathname} - ${res.statusCode} (${duration}ms)`);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Simple path matching
   */
  private matchPath(routePath: string, requestPath: string): boolean {
    return routePath === requestPath;
  }

  /**
   * Set CORS headers
   */
  private setCorsHeaders(res: http.ServerResponse): void {
    const allowedOrigins = config.cors.allowedOrigins;
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  /**
   * Send JSON response
   */
  private sendJson(res: http.ServerResponse, statusCode: number, data: unknown): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Error handler
   */
  private handleError(res: http.ServerResponse, error: unknown): void {
    console.error('Server Error:', error);

    const statusCode = 500;
    const message = error instanceof Error ? error.message : 'Internal Server Error';

    this.sendJson(res, statusCode, {
      error: 'Internal Server Error',
      message: config.server.isDevelopment ? message : 'Something went wrong',
    });
  }

  /**
   * Register GET route
   */
  public get(path: string, handler: RequestHandler): void {
    this.routes.push({ method: 'GET', path, handler });
  }

  /**
   * Register POST route
   */
  public post(path: string, handler: RequestHandler): void {
    this.routes.push({ method: 'POST', path, handler });
  }

  /**
   * Register PUT route
   */
  public put(path: string, handler: RequestHandler): void {
    this.routes.push({ method: 'PUT', path, handler });
  }

  /**
   * Register DELETE route
   */
  public delete(path: string, handler: RequestHandler): void {
    this.routes.push({ method: 'DELETE', path, handler });
  }

  /**
   * Register PATCH route
   */
  public patch(path: string, handler: RequestHandler): void {
    this.routes.push({ method: 'PATCH', path, handler });
  }

  /**
   * Start server
   */
  public listen(port: number, host: string, callback?: () => void): void {
    this.server.listen(port, host, callback);
  }

  /**
   * Stop server gracefully
   */
  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

/**
 * Create and export app instance
 */
export const app = new Application();
