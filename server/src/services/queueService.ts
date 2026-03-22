import { QueueClient, QueueServiceClient } from '@azure/storage-queue';
import { DefaultAzureCredential } from '@azure/identity';

let queueClient: QueueClient;

// Lazy initialization - only create client when first needed
function initializeQueueClient(): QueueClient {
  if (!queueClient) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const queueName = process.env.QUEUE_NAME || 'chat-messages';

    if (!connectionString && !process.env.AZURE_STORAGE_ACCOUNT_NAME) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME environment variable is required');
    }

    // Initialize with connection string or passwordless authentication
    if (connectionString) {
      queueClient = new QueueClient(connectionString, queueName);
    } else {
      // Use DefaultAzureCredential for passwordless authentication
      const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
      const credential = new DefaultAzureCredential();
      const queueServiceClient = new QueueServiceClient(
        `https://${accountName}.queue.core.windows.net`,
        credential
      );
      queueClient = queueServiceClient.getQueueClient(queueName);
    }
  }
  
  return queueClient;
}

export interface QueueMessage {
  userId: string;
  roomId: string;
  message: string;
  timestamp: number;
}

export class QueueService {
  /**
   * Send a message to the Azure Queue
   */
  async sendMessage(message: QueueMessage): Promise<void> {
    const client = initializeQueueClient();
    
    try {
      const messageText = JSON.stringify(message);
      const encodedMessage = Buffer.from(messageText).toString('base64');
      
      await client.sendMessage(encodedMessage);
      console.log('Message sent to queue:', message);
    } catch (error) {
      console.error('Failed to send message to queue:', error);
      throw error;
    }
  }

  /**
   * Receive messages from the Azure Queue
   */
  async receiveMessages(maxMessages: number = 10): Promise<QueueMessage[]> {
    const client = initializeQueueClient();
    
    try {
      const response = await client.receiveMessages({
        numberOfMessages: maxMessages,
        visibilityTimeout: 30, // 30 seconds
      });

      const messages: QueueMessage[] = [];

      for (const message of response.receivedMessageItems) {
        if (message.messageText) {
          const decodedMessage = Buffer.from(message.messageText, 'base64').toString('utf-8');
          const parsedMessage = JSON.parse(decodedMessage) as QueueMessage;
          messages.push(parsedMessage);

          // Delete the message after processing
          await client.deleteMessage(message.messageId, message.popReceipt);
        }
      }

      return messages;
    } catch (error) {
      console.error('Failed to receive messages from queue:', error);
      throw error;
    }
  }

  /**
   * Initialize the queue if it doesn't exist
   */
  async initialize(): Promise<void> {
    const client = initializeQueueClient();
    
    try {
      await client.createIfNotExists();
      console.log('Queue initialized successfully');
    } catch (error) {
      console.error('Failed to initialize queue:', error);
      throw error;
    }
  }

  /**
   * Get approximate message count in the queue
   */
  async getMessageCount(): Promise<number> {
    const client = initializeQueueClient();
    
    try {
      const properties = await client.getProperties();
      return properties.approximateMessagesCount || 0;
    } catch (error) {
      console.error('Failed to get message count:', error);
      return 0;
    }
  }

  /**
   * Peek at messages in the queue without removing them
   */
  async peekMessages(maxMessages: number = 10): Promise<QueueMessage[]> {
    const client = initializeQueueClient();
    
    try {
      const response = await client.peekMessages({ numberOfMessages: maxMessages });
      const messages: QueueMessage[] = [];

      for (const message of response.peekedMessageItems) {
        if (message.messageText) {
          const decodedMessage = Buffer.from(message.messageText, 'base64').toString('utf-8');
          const parsedMessage = JSON.parse(decodedMessage) as QueueMessage;
          messages.push(parsedMessage);
        }
      }

      return messages;
    } catch (error) {
      console.error('Failed to peek messages from queue:', error);
      throw error;
    }
  }
}

export const queueService = new QueueService();
