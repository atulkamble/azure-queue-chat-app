#!/bin/bash

# Azure Queue Chat App Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Azure Queue Chat App - Deployment Script${NC}"
echo "=========================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Running 'az login'...${NC}"
    az login
fi

# Get parameters
read -p "Enter resource group name (default: rg-azure-queue-chat): " RESOURCE_GROUP
RESOURCE_GROUP=${RESOURCE_GROUP:-rg-azure-queue-chat}

read -p "Enter location (default: eastus): " LOCATION
LOCATION=${LOCATION:-eastus}

read -p "Enter environment (dev/staging/prod, default: dev): " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-dev}

echo ""
echo "Deployment Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Environment: $ENVIRONMENT"
echo ""

read -p "Proceed with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Create resource group
echo -e "${YELLOW}Creating resource group...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Deploy infrastructure
echo -e "${YELLOW}Deploying Azure resources...${NC}"
DEPLOYMENT_OUTPUT=$(az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file infra/main.bicep \
    --parameters environment=$ENVIRONMENT \
    --query 'properties.outputs' \
    --output json)

echo -e "${GREEN}Infrastructure deployed successfully!${NC}"

# Extract outputs
WEB_APP_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.webAppName.value')
WEB_APP_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.webAppUrl.value')
STORAGE_ACCOUNT=$(echo $DEPLOYMENT_OUTPUT | jq -r '.storageAccountName.value')
COSMOS_ACCOUNT=$(echo $DEPLOYMENT_OUTPUT | jq -r '.cosmosAccountName.value')

echo ""
echo "Deployment Outputs:"
echo "  Web App Name: $WEB_APP_NAME"
echo "  Storage Account: $STORAGE_ACCOUNT"
echo "  Cosmos DB Account: $COSMOS_ACCOUNT"
echo "  Web App URL: $WEB_APP_URL"
echo ""

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm install
npm run build

# Deploy to App Service
echo -e "${YELLOW}Deploying to App Service...${NC}"
cd server
zip -r ../deploy.zip . -x "node_modules/*"
cd ..

az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $WEB_APP_NAME \
    --src deploy.zip

rm deploy.zip

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Application URL: $WEB_APP_URL"
echo ""
echo "To view logs, run:"
echo "  az webapp log tail --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP"
