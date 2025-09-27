# Deployment Guide

## Quick Deploy to Railway (Recommended)

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login and Initialize
```bash
railway login
railway init
```

### 3. Add PostgreSQL Database
```bash
railway add postgresql
```

### 4. Set Environment Variables
```bash
# Required
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-super-secret-jwt-key-here
railway variables set CORS_ALLOWED_ORIGINS=https://your-app.railway.app

# Optional (for full functionality)
railway variables set LLM_ENABLED=false
railway variables set SMS_PROVIDER=twilio
railway variables set SMS_API_KEY=your_twilio_sid
railway variables set SMS_API_SECRET=your_twilio_token
```

### 5. Deploy
```bash
railway up
```

### 6. Run Database Migrations
```bash
railway run npm run db:migrate
railway run npm run db:seed
railway run npm run generate-data
```

### 7. Get Your URL
```bash
railway domain
```

## Alternative: Deploy to Render

1. Connect your GitHub repo at [render.com](https://render.com)
2. Create a new Web Service
3. Add PostgreSQL database
4. Set environment variables in Render dashboard
5. Deploy automatically on git push

## Alternative: Deploy to Vercel (Frontend Only)

For static frontend deployment:
```bash
npm install -g vercel
vercel
```

## Environment Variables Reference

### Required
- `NODE_ENV=production`
- `JWT_SECRET` - Random secret key for JWT tokens
- `CORS_ALLOWED_ORIGINS` - Your domain(s), comma-separated

### Database (Auto-configured by Railway)
- `DATABASE_URL` - Full PostgreSQL connection string
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`

### Optional Features
- `LLM_ENABLED=false` - Disable LLM for testing
- `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_API_SECRET` - For SMS functionality
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - For email functionality

## Post-Deployment Testing

1. Visit your deployed URL
2. Check health endpoint: `https://your-app.railway.app/api/health`
3. Test the dashboard: `https://your-app.railway.app/dashboard.html`
4. Test API endpoints: `https://your-app.railway.app/test.html`

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure TypeScript compiles: `npm run build`

### Database Connection Issues
- Verify DATABASE_URL is set correctly
- Check if migrations ran: `railway run npm run db:migrate`

### CORS Issues
- Update `CORS_ALLOWED_ORIGINS` with your actual domain
- Include both `http://` and `https://` if needed

### 502/503 Errors
- Check health endpoint is responding
- Verify app starts correctly: `railway logs`