# Azure Queue Chat App

A real-time chat application built with Node.js, React, Azure Queue Storage, and Azure Cosmos DB. This application demonstrates how to build a scalable chat system using Azure services with best practices for data modeling and partitioning.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Queue**: Azure Queue Storage for message queuing
- **Database**: Azure Cosmos DB (NoSQL) for persistent storage
- **Hosting**: Azure App Service

## ✨ Features

- Real-time chat messaging
- Multiple users and chat rooms
- Message queuing with Azure Queue Storage
- Persistent storage with Azure Cosmos DB
- Optimized partitioning strategy (userId as partition key)
- Managed identity authentication (passwordless)
- Modern React UI with TypeScript

## 📋 Prerequisites

- Node.js 20+ and npm
- Azure subscription
- Azure CLI (for deployment)
- Git

## 🚀 Getting Started

### 1. Clone the Repository

```bash
cd azure-queue-chat-app
```

### 2. Set Up Azure Resources

You have two options:

#### Option A: Automated Deployment (Recommended)

```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Create Azure resource group
- Deploy Cosmos DB with proper partitioning
- Deploy Storage Account with Queue
- Deploy App Service with managed identity
- Configure RBAC permissions

#### Option B: Manual Deployment

```bash
# Create resource group
az group create --name rg-azure-queue-chat --location eastus

# Deploy infrastructure
az deployment group create \
  --resource-group rg-azure-queue-chat \
  --template-file infra/main.bicep \
  --parameters environment=dev
```

### 3. Local Development

#### Set Up Environment Variables

Copy the example environment file and fill in your Azure credentials:

```bash
cp .env.example .env
```

Update `.env` with your Azure resource endpoints:

```env
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_DATABASE_NAME=chatdb
COSMOS_CONTAINER_NAME=messages
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string
QUEUE_NAME=chat-messages
PORT=3000
```

#### Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

#### Run the Application

Start both frontend and backend:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🗄️ Database Design

### Cosmos DB Partitioning Strategy

This application uses **userId as the partition key** for optimal performance:

**Benefits:**
- ✅ High cardinality (many unique users)
- ✅ User-level data isolation
- ✅ Efficient single-partition queries for user's messages
- ✅ Even distribution of data and throughput
- ✅ Supports hierarchical partition keys for future scaling

**Data Model:**

```typescript
{
  id: string,              // Unique message ID
  userId: string,          // Partition key
  roomId: string,          // Chat room identifier
  message: string,         // Message content
  timestamp: number,       // Unix timestamp
  _partitionKey: string    // Same as userId
}
```

### Query Patterns

1. **Get user's messages in a room** (Single-partition query):
   ```sql
   SELECT * FROM c 
   WHERE c.userId = @userId 
   AND c.roomId = @roomId 
   ORDER BY c.timestamp DESC
   ```

2. **Get all room messages** (Cross-partition query):
   ```sql
   SELECT * FROM c 
   WHERE c.roomId = @roomId 
   ORDER BY c.timestamp DESC
   ```

## 📡 API Endpoints

### Messages

- `POST /api/messages` - Send a new message
  ```json
  {
    "userId": "user1",
    "roomId": "general",
    "message": "Hello, world!"
  }
  ```

- `GET /api/messages/:userId/:roomId` - Get messages for a user in a room
  - Query params: `?limit=50`

- `GET /api/rooms/:roomId/messages` - Get all messages in a room (cross-partition)
  - Query params: `?limit=50`

### Queue Management

- `GET /api/queue/status` - Get queue message count
- `POST /api/queue/process` - Process queued messages (for testing)

### Health Check

- `GET /health` - Service health check

## 🔐 Authentication

The application uses **Managed Identity** for Azure service authentication:

- ✅ No connection strings or keys in code
- ✅ Azure RBAC for access control
- ✅ Automatic credential rotation
- ✅ Works with both user-assigned and system-assigned identities

Required RBAC roles:
- **Cosmos DB Data Contributor** for Cosmos DB access
- **Storage Queue Data Contributor** for Queue Storage access

## 🏗️ Project Structure

```
azure-queue-chat-app/
├── client/                    # React frontend
│   ├── src/
│   │   ├── App.tsx           # Main app component
│   │   ├── App.css           # Styles
│   │   └── main.tsx          # Entry point
│   └── package.json
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── services/
│   │   │   ├── cosmosService.ts   # Cosmos DB operations
│   │   │   └── queueService.ts    # Queue operations
│   │   ├── routes/
│   │   │   └── chat.ts            # API routes
│   │   └── index.ts               # Server entry point
│   └── package.json
├── infra/                     # Azure infrastructure
│   ├── main.bicep            # Bicep template
│   └── main.parameters.json  # Parameters
├── deploy.sh                 # Deployment script
├── .env.example              # Environment template
└── README.md
```

## 🧪 Testing

```bash
# Run server in development mode
npm run dev:server

# Test API endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/queue/status

# Send a test message
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","roomId":"general","message":"Test message"}'
```

## 📊 Monitoring

### Application Insights

The application is configured for Azure Application Insights integration. Add the connection string to your environment:

```env
APPLICATIONINSIGHTS_CONNECTION_STRING=your-app-insights-connection-string
```

### Cosmos DB Diagnostics

The application logs diagnostic information when:
- Request latency exceeds 100ms
- Cross-partition queries are executed
- Unexpected status codes are returned

Check server logs for diagnostic details.

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Azure

```bash
./deploy.sh
```

Or manually:

```bash
# Build
npm run build

# Create deployment package
cd server
zip -r ../deploy.zip . -x "node_modules/*"
cd ..

# Deploy to App Service
az webapp deployment source config-zip \
  --resource-group rg-azure-queue-chat \
  --name your-web-app-name \
  --src deploy.zip
```

## 📚 Learn More

- [Azure Cosmos DB Best Practices](https://learn.microsoft.com/azure/cosmos-db/nosql/best-practices)
- [Azure Queue Storage](https://learn.microsoft.com/azure/storage/queues/storage-queues-introduction)
- [Azure Managed Identity](https://learn.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Local Development Issues

**Issue**: Cannot connect to Cosmos DB
- Ensure your `.env` file has the correct `COSMOS_ENDPOINT`
- Check your Azure credentials with `az login`
- Verify network connectivity to Azure

**Issue**: Queue messages not appearing
- Check the storage account connection string
- Verify queue name matches in configuration
- Check RBAC permissions if using managed identity

### Production Issues

**Issue**: 500 errors from API
- Check App Service logs: `az webapp log tail --name <app-name> --resource-group <rg-name>`
- Verify all environment variables are set in App Service configuration
- Check managed identity has correct RBAC roles

**Issue**: High latency
- Review Cosmos DB diagnostics in logs
- Consider adding more Request Units (RUs)
- Check if queries are properly partitioned

## 💡 Tips

1. **Use single-partition queries** whenever possible for best performance
2. **Monitor RU consumption** in Cosmos DB metrics
3. **Enable Application Insights** for production monitoring
4. **Use managed identity** instead of connection strings for better security
5. **Implement retry logic** for transient failures (already included in SDK)

---

Built with ❤️ using Azure, Node.js, and React
```

---

# 🧠 3. sender.py (Send Message)

```python
from azure.storage.queue import QueueClient

connection_string = "your_connection_string"
queue_name = "chatqueue"

def send_message(message):
    queue_client = QueueClient.from_connection_string(connection_string, queue_name)
    queue_client.send_message(message)

if __name__ == "__main__":
    msg = input("Enter message: ")
    send_message(msg)
    print("Message sent!")
```

---

# 📥 4. receiver.py (Receive Message)

```python
from azure.storage.queue import QueueClient

connection_string = "your_connection_string"
queue_name = "chatqueue"

def receive_messages():
    queue_client = QueueClient.from_connection_string(connection_string, queue_name)

    messages = queue_client.receive_messages(messages_per_page=10)

    for msg_batch in messages.by_page():
        for msg in msg_batch:
            print("Received:", msg.content)
            queue_client.delete_message(msg)

if __name__ == "__main__":
    receive_messages()
```

---

# 🌐 5. Flask App (Backend + API)

## app.py

```python
from flask import Flask, render_template, request, jsonify
from azure.storage.queue import QueueClient

app = Flask(__name__)

connection_string = "your_connection_string"
queue_name = "chatqueue"

queue_client = QueueClient.from_connection_string(connection_string, queue_name)

# Store messages in memory (demo purpose)
messages = []

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/send", methods=["POST"])
def send():
    data = request.json
    message = data.get("message")

    queue_client.send_message(message)
    messages.append({"sender": "You", "text": message})

    return jsonify({"status": "sent"})

@app.route("/receive", methods=["GET"])
def receive():
    received_msgs = []

    msgs = queue_client.receive_messages(messages_per_page=5)

    for msg_batch in msgs.by_page():
        for msg in msg_batch:
            received_msgs.append(msg.content)
            queue_client.delete_message(msg)

    for m in received_msgs:
        messages.append({"sender": "Bot", "text": m})

    return jsonify(messages)

if __name__ == "__main__":
    app.run(debug=True)
```

---

# 🎨 6. UI – templates/index.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Azure Queue Chat</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>

<div class="chat-container">
    <h2>Azure Queue Chat</h2>

    <div id="chat-box"></div>

    <input type="text" id="message" placeholder="Type message...">
    <button onclick="sendMessage()">Send</button>
</div>

<script>
async function sendMessage() {
    const msg = document.getElementById("message").value;

    await fetch("/send", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message: msg})
    });

    document.getElementById("message").value = "";
    loadMessages();
}

async function loadMessages() {
    const res = await fetch("/receive");
    const data = await res.json();

    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";

    data.forEach(msg => {
        const div = document.createElement("div");
        div.innerHTML = `<b>${msg.sender}:</b> ${msg.text}`;
        chatBox.appendChild(div);
    });
}

setInterval(loadMessages, 2000);
</script>

</body>
</html>
```

---

# 🎨 7. CSS – static/style.css

```css
body {
    font-family: Arial;
    background: #f4f4f4;
}

.chat-container {
    width: 400px;
    margin: 50px auto;
    background: white;
    padding: 20px;
    border-radius: 10px;
}

#chat-box {
    height: 300px;
    overflow-y: scroll;
    border: 1px solid #ccc;
    margin-bottom: 10px;
    padding: 10px;
}

input {
    width: 70%;
    padding: 10px;
}

button {
    padding: 10px;
}
```

---

# ▶️ 8. Run Application

```bash
python app.py
```

Open:

```
http://127.0.0.1:5000
```

---

# 🧪 How It Works

### Flow:

```
User → UI → Flask → Azure Queue → Receiver → UI
```

✔ Sender sends message to queue
✔ Receiver reads from queue
✔ UI updates every 2 sec

---

# 💡 Real Use Case

* Microservices communication
* Chat systems (decoupled)
* Event-driven architecture
* DevOps queue processing demo (AZ-204 / AZ-400)

---
