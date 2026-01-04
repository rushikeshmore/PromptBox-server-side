import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment Configuration Schema
 * Uses Zod to validate environment variables at startup
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  HOST: z.string().default('localhost'),

  // Database
  DATABASE_URL: z.string().url().min(1),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(8).max(15)).default('10'),

  // CORS
  ALLOWED_ORIGINS: z
    .string()
    .transform((val) => val.split(',').map((origin) => origin.trim()))
    .default('http://localhost:3000'),

  // App Configuration
  APP_NAME: z.string().default('PromptBox'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Feature Flags
  ENABLE_REGISTRATION: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  ENABLE_PUBLIC_PROMPTS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  ENABLE_COMMUNITY: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

/**
 * Validate and parse environment variables
 */
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Application Configuration
 * Centralized configuration object
 */
export const config = {
  env: parseEnv(),

  // Server
  get server() {
    return {
      nodeEnv: this.env.NODE_ENV,
      port: this.env.PORT,
      host: this.env.HOST,
      isDevelopment: this.env.NODE_ENV === 'development',
      isProduction: this.env.NODE_ENV === 'production',
      isTest: this.env.NODE_ENV === 'test',
    };
  },

  // Database
  get database() {
    return {
      url: this.env.DATABASE_URL,
    };
  },

  // Authentication
  get auth() {
    return {
      jwt: {
        secret: this.env.JWT_SECRET,
        expiresIn: this.env.JWT_EXPIRES_IN,
        refreshSecret: this.env.JWT_REFRESH_SECRET,
        refreshExpiresIn: this.env.JWT_REFRESH_EXPIRES_IN,
      },
      bcrypt: {
        rounds: this.env.BCRYPT_ROUNDS,
      },
    };
  },

  // CORS
  get cors() {
    return {
      allowedOrigins: this.env.ALLOWED_ORIGINS,
    };
  },

  // App
  get app() {
    return {
      name: this.env.APP_NAME,
      url: this.env.APP_URL,
      frontendUrl: this.env.FRONTEND_URL,
    };
  },

  // Logging
  get logging() {
    return {
      level: this.env.LOG_LEVEL,
    };
  },

  // Feature Flags
  get features() {
    return {
      registration: this.env.ENABLE_REGISTRATION,
      publicPrompts: this.env.ENABLE_PUBLIC_PROMPTS,
      community: this.env.ENABLE_COMMUNITY,
    };
  },
} as const;

export type Config = typeof config;
