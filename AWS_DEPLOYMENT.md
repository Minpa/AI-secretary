# AWS Deployment Guide

## Option 1: AWS App Runner (Recommended - Easiest)

AWS App Runner is the easiest way to deploy containerized applications on AWS, similar to Railway.

### Prerequisites
1. AWS Account with billing enabled
2. GitHub repository (already done ✅)
3. AWS CLI installed

### Step 1: Install AWS CLI
```bash
# macOS
brew install awscli

# Or download from: https://aws.amazon.com/cli/
```

### Step 2: Configure AWS CLI
```bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region (e.g., us-east-1)
# - Default output format: json
```

### Step 3: Create Dockerfile (if not exists)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

### Step 4: Create apprunner.yaml
```yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "Build started on `date`"
      - npm ci
      - npm run build
run:
  runtime-version: 18
  command: npm start
  network:
    port: 3000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
```

### Step 5: Deploy with App Runner
1. Go to AWS Console → App Runner
2. Click "Create service"
3. Choose "Source code repository"
4. Connect to GitHub and select your repository
5. Configure:
   - **Build settings**: Automatic
   - **Service name**: ai-secretary
   - **Port**: 3000
6. Add environment variables (see below)
7. Click "Create & deploy"

### Step 6: Add Database (RDS PostgreSQL)
1. Go to AWS Console → RDS
2. Click "Create database"
3. Choose PostgreSQL
4. Select "Free tier" template
5. Configure:
   - **DB instance identifier**: ai-secretary-db
   - **Master username**: postgres
   - **Master password**: [secure password]
   - **DB name**: ai_secretary
6. Create database
7. Get connection details and add to App Runner environment variables

---

## Option 2: AWS Elastic Beanstalk

### Step 1: Install EB CLI
```bash
pip install awsebcli
```

### Step 2: Initialize Elastic Beanstalk
```bash
eb init
# Choose:
# - Region: us-east-1 (or your preferred region)
# - Application name: ai-secretary
# - Platform: Node.js
# - Platform version: Latest
```

### Step 3: Create Environment
```bash
eb create production
```

### Step 4: Set Environment Variables
```bash
eb setenv NODE_ENV=production
eb setenv JWT_SECRET=your-super-secret-jwt-key
eb setenv PORT=3000
# Add database variables after RDS setup
```

### Step 5: Deploy
```bash
eb deploy
```

---

## Option 3: AWS ECS with Fargate (Container-based)

### Step 1: Create ECR Repository
```bash
aws ecr create-repository --repository-name ai-secretary
```

### Step 2: Build and Push Docker Image
```bash
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [account-id].dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t ai-secretary .

# Tag image
docker tag ai-secretary:latest [account-id].dkr.ecr.us-east-1.amazonaws.com/ai-secretary:latest

# Push image
docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/ai-secretary:latest
```

### Step 3: Create ECS Cluster and Service
1. Go to AWS Console → ECS
2. Create cluster (Fargate)
3. Create task definition
4. Create service

---

## Environment Variables for AWS

### Required Variables
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ALLOWED_ORIGINS=https://your-app-domain.com
```

### Database Variables (RDS PostgreSQL)
```bash
DATABASE_URL=postgresql://username:password@host:port/database
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=ai_secretary
DB_USERNAME=postgres
DB_PASSWORD=your-secure-password
DB_SSL=true
```

### Optional Features
```bash
# LLM (disable for initial deployment)
LLM_ENABLED=false

# SMS (Twilio)
SMS_PROVIDER=twilio
SMS_API_KEY=your_twilio_sid
SMS_API_SECRET=your_twilio_token

# Email (SES)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

---

## Database Setup (RDS PostgreSQL)

### Step 1: Create RDS Instance
1. Go to AWS Console → RDS
2. Click "Create database"
3. Choose PostgreSQL
4. Configuration:
   - **Template**: Free tier (for testing) or Production (for live)
   - **DB instance identifier**: ai-secretary-db
   - **Master username**: postgres
   - **Master password**: [secure password]
   - **Initial database name**: ai_secretary
   - **VPC**: Default VPC
   - **Public access**: Yes (for initial setup)
   - **VPC security group**: Create new (allow PostgreSQL port 5432)

### Step 2: Configure Security Group
1. Go to EC2 → Security Groups
2. Find your RDS security group
3. Add inbound rule:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: Your App Runner/EB security group or 0.0.0.0/0 (for testing)

### Step 3: Run Database Migrations
```bash
# Set DATABASE_URL environment variable locally
export DATABASE_URL="postgresql://postgres:password@your-rds-endpoint.amazonaws.com:5432/ai_secretary"

# Run migrations
npm run db:migrate
npm run db:seed
npm run generate-data
```

---

## Post-Deployment Steps

### 1. Test Your Deployment
- Visit your AWS URL
- Check health endpoint: `https://your-app.amazonaws.com/health`
- Test dashboard: `https://your-app.amazonaws.com/dashboard.html`
- Test API: `https://your-app.amazonaws.com/test.html`

### 2. Set Up Custom Domain (Optional)
1. Go to Route 53
2. Create hosted zone for your domain
3. Add CNAME record pointing to your App Runner/EB URL

### 3. Enable HTTPS
- App Runner: Automatic HTTPS
- Elastic Beanstalk: Configure Load Balancer with SSL certificate

### 4. Set Up Monitoring
1. CloudWatch Logs (automatic)
2. CloudWatch Metrics
3. Set up alarms for errors/high CPU

---

## Cost Estimation

### App Runner (Recommended)
- **Compute**: ~$25-50/month for small app
- **RDS PostgreSQL**: ~$15-25/month (db.t3.micro)
- **Data transfer**: ~$5-10/month
- **Total**: ~$45-85/month

### Elastic Beanstalk
- **EC2 instance**: ~$8-15/month (t3.micro)
- **Load Balancer**: ~$18/month
- **RDS**: ~$15-25/month
- **Total**: ~$41-58/month

### Free Tier Benefits (First 12 months)
- EC2: 750 hours/month free
- RDS: 750 hours/month free
- Can reduce costs significantly in first year

---

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in AWS Console
# Ensure all dependencies are in package.json
npm run build  # Test locally first
```

#### Database Connection Issues
```bash
# Test connection locally
psql "postgresql://username:password@host:port/database"

# Check security groups allow port 5432
# Verify DATABASE_URL format
```

#### Environment Variable Issues
```bash
# List current variables
aws apprunner describe-service --service-arn your-service-arn

# Update variables in AWS Console
```

#### CORS Issues
```bash
# Update CORS_ALLOWED_ORIGINS with your actual AWS domain
# Include both HTTP and HTTPS if needed
```

---

## Security Best Practices

1. **Use IAM roles** instead of access keys when possible
2. **Enable VPC** for production deployments
3. **Use AWS Secrets Manager** for sensitive data
4. **Enable CloudTrail** for audit logging
5. **Set up WAF** for web application firewall
6. **Use RDS encryption** at rest and in transit
7. **Regular security updates** for dependencies

---

## Next Steps After Deployment

1. **Set up CI/CD** with GitHub Actions → AWS
2. **Configure monitoring** and alerting
3. **Set up backup strategy** for RDS
4. **Implement auto-scaling** if needed
5. **Add CDN** (CloudFront) for better performance
6. **Set up staging environment** for testing