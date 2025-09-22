import { Config } from './index';

export const test: Config = {
  server: {
    port: 3001,
    host: 'localhost'
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'ai_secretary_test',
    username: 'postgres',
    password: 'password',
    ssl: false
  },
  redis: {
    host: 'localhost',
    port: 6379
  },
  cors: {
    allowedOrigins: ['http://localhost:3001']
  },
  jwt: {
    secret: 'test-secret-key',
    expiresIn: '1h'
  },
  sms: {
    provider: 'twilio',
    apiKey: 'test-key',
    apiSecret: 'test-secret'
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
    bucket: 'ai-secretary-test',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin'
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'mistral:7b'
  },
  llm: {
    enabled: false // Disabled in tests by default
  }
};