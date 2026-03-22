# Quick Start Guide

## 🔥 Get Started in 3 Steps

### Step 1: Install Dependencies

```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Azure credentials or deploy to Azure first.

### Step 3: Run Locally

```bash
npm run dev
```

Visit http://localhost:5173

---

## 🚀 Deploy to Azure (Recommended First)

```bash
./deploy.sh
```

This will:
1. ✅ Create all Azure resources (Cosmos DB, Queue Storage, App Service)
2. ✅ Configure managed identity and RBAC
3. ✅ Deploy your application
4. ✅ Output your app URL and connection details

---

## 📦 What's Included

### Backend (`/server`)
- Express.js REST API
- Azure Cosmos DB integration with optimized partitioning
- Azure Queue Storage integration
- TypeScript support
- Managed identity authentication

### Frontend (`/client`)
- React + TypeScript
- Modern chat UI
- Real-time message updates (polling)
- Vite for fast development

### Infrastructure (`/infra`)
- Bicep templates for Azure resources
- Cosmos DB with userId partition key
- Queue Storage
- App Service with Linux runtime
- RBAC role assignments

---

## 🎯 Key Features

✨ **Optimized Data Modeling**
- Uses `userId` as partition key for high cardinality
- Efficient single-partition queries for best performance
- Supports user-level data isolation

✨ **Secure by Default**
- Managed identity authentication (no keys in code)
- HTTPS only
- TLS 1.2+ enforced

✨ **Production Ready**
- Comprehensive error handling
- Diagnostic logging
- Health check endpoint
- Request retry logic built-in

---

## 📖 Next Steps

1. Review the [full README](README.md) for detailed documentation
2. Explore the [Cosmos DB service](server/src/services/cosmosService.ts) to see best practices
3. Check the [Bicep template](infra/main.bicep) for infrastructure details
4. Customize the UI in [App.tsx](client/src/App.tsx)

---

## 🆘 Need Help?

- **Can't connect?** Check your `.env` file and Azure credentials
- **Deployment fails?** Ensure you're logged in: `az login`
- **500 errors?** Check RBAC permissions in Azure Portal
- **High latency?** Review Cosmos DB partition key strategy

See the [Troubleshooting section](README.md#troubleshooting) in the main README.

---

**Happy coding! 🚀**
