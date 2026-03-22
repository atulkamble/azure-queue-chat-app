👉 **Python Chat App (UI) using Azure Queue Storage (Sender & Receiver)**
👉 Includes:

* Web UI (Chat interface)
* Sender → sends message to Azure Queue
* Receiver → reads messages from queue
* Flask backend

---

# 🚀 Project: Azure Queue Chat Application

## 📁 Project Structure

```
azure-queue-chat-app/
│
├── app.py                 # Flask backend
├── sender.py              # Send messages to queue
├── receiver.py            # Receive messages from queue
├── requirements.txt
│
├── templates/
│   └── index.html         # Chat UI
│
└── static/
    └── style.css          # UI styling
```

---

# 🔧 1. Install Dependencies

```bash
pip install flask azure-storage-queue
```

---

# 🔑 2. Azure Setup

1. Create Storage Account
2. Create Queue → `chatqueue`
3. Copy connection string

Example:

```python
AZURE_CONNECTION_STRING = "your_connection_string"
QUEUE_NAME = "chatqueue"
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
