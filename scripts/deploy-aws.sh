#!/bin/bash

# AI Secretary AWS Deployment Script
echo "🚀 AI Secretary AWS Deployment Helper"
echo "======================================"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   brew install awscli"
    echo "   or visit: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run:"
    echo "   aws configure"
    echo "   Enter your AWS Access Key ID, Secret Access Key, and region"
    exit 1
fi

echo "✅ AWS CLI is installed and configured"

# Get AWS account info
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)

echo "📋 AWS Account: $AWS_ACCOUNT_ID"
echo "📍 Region: $AWS_REGION"
echo ""

# Menu for deployment options
echo "Choose deployment method:"
echo "1) AWS App Runner (Recommended - Easiest)"
echo "2) AWS Elastic Beanstalk"
echo "3) Manual setup instructions"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🎯 AWS App Runner Deployment"
        echo "============================"
        echo ""
        echo "📝 Steps to deploy with App Runner:"
        echo ""
        echo "1. Go to AWS Console → App Runner"
        echo "2. Click 'Create service'"
        echo "3. Choose 'Source code repository'"
        echo "4. Connect to GitHub and select your AI-secretary repository"
        echo "5. Configure build settings:"
        echo "   - Build command: npm run build"
        echo "   - Start command: npm start"
        echo "   - Port: 3000"
        echo "6. Add environment variables:"
        echo "   NODE_ENV=production"
        echo "   JWT_SECRET=your-super-secret-jwt-key"
        echo "   PORT=3000"
        echo "7. Click 'Create & deploy'"
        echo ""
        echo "💾 Don't forget to set up PostgreSQL database!"
        echo "   Go to RDS → Create database → PostgreSQL"
        echo ""
        ;;
    2)
        echo ""
        echo "🎯 AWS Elastic Beanstalk Deployment"
        echo "==================================="
        echo ""
        echo "📦 Installing EB CLI..."
        if command -v pip3 &> /dev/null; then
            pip3 install awsebcli
        elif command -v pip &> /dev/null; then
            pip install awsebcli
        else
            echo "❌ pip not found. Please install Python and pip first"
            exit 1
        fi
        
        echo "🚀 Initializing Elastic Beanstalk..."
        eb init --platform node.js --region $AWS_REGION
        
        echo "🌍 Creating environment..."
        eb create production
        
        echo "⚙️  Setting environment variables..."
        eb setenv NODE_ENV=production
        eb setenv PORT=3000
        eb setenv JWT_SECRET=your-super-secret-jwt-key-here
        
        echo "🚀 Deploying..."
        eb deploy
        
        echo "✅ Deployment complete!"
        eb open
        ;;
    3)
        echo ""
        echo "📖 Manual Setup Instructions"
        echo "============================"
        echo ""
        echo "Please follow the detailed guide in AWS_DEPLOYMENT.md"
        echo ""
        echo "Quick summary:"
        echo "1. Set up RDS PostgreSQL database"
        echo "2. Choose deployment method (App Runner/EB/ECS)"
        echo "3. Configure environment variables"
        echo "4. Deploy application"
        echo "5. Run database migrations"
        echo ""
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "📚 For detailed instructions, see: AWS_DEPLOYMENT.md"
echo "🔗 GitHub repository: https://github.com/Minpa/AI-secretary"
echo ""
echo "🎉 Happy deploying!"