import { development } from './development';
import { production } from './production';
import { test } from './test';

const env = process.env.NODE_ENV || 'development';

const configs = {
  development,
  production,
  test
};

export const config = configs[env as keyof typeof configs];

export interface Config {
  server: {
    port: number;
    host: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  cors: {
    allowedOrigins: string[];
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  sms: {
    provider: 'twilio' | 'toast' | 'aligo';
    apiKey: string;
    apiSecret: string;
  };
  email: {
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  storage: {
    type: 's3' | 'minio';
    endpoint?: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
  };
  ollama: {
    baseUrl: string;
    model: string;
  };
  llm: {
    enabled: boolean;
  };
}