import { Config } from './index';

export const development: Config = {
  server: {
    port: 3000,
    host: 'localhost'
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'ai_secretary_dev',
    username: 'postgres',
    password: 'password',
    ssl: false
  },
  redis: {
    host: 'localhost',
    port: 6379
  },
  cors: {
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001']
  },
  jwt: {
    secret: 'dev-secret-key',
    expiresIn: '24h'
  },
  sms: {
    provider: 'twilio',
    apiKey: process.env.TWILIO_ACCOUNT_SID || 'test_account_sid',
    apiSecret: process.env.TWILIO_AUTH_TOKEN || 'test_auth_token'
  },
  email: {
    smtp: {
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: {
        user: '',
        pass: ''
      }
    }
  },
  storage: {
    type: 'minio',
    endpoint: 'http://localhost:9000',
    bucket: 'ai-secretary-dev',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin'
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'mistral:7b'
  },
  llm: {
    enabled: process.env.LLM_ENABLED === 'true' || false
  }
};