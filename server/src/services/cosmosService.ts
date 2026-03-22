import { CosmosClient, Database, Container } from '@azure/cosmos';

let cosmosClient: CosmosClient;
let database: Database;
let container: Container;

// Lazy initialization - only create client when first needed
function initializeCosmosClient() {
  if (!cosmosClient) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseName = process.env.COSMOS_DATABASE_NAME || 'chatdb';
    const containerName = process.env.COSMOS_CONTAINER_NAME || 'messages';

    if (!endpoint) {
      throw new Error('COSMOS_ENDPOINT environment variable is required');
    }

    // Use key-based authentication for local development
    cosmosClient = key 
      ? new CosmosClient({ endpoint, key })
      : new CosmosClient({ endpoint }); // Falls back to DefaultAzureCredential

    database = cosmosClient.database(databaseName);
    container = database.container(containerName);
  }
  
  return { cosmosClient, database, container };
}

export interface ChatMessage {
  id: string;
  userId: string;
  roomId: string;
  message: string;
  timestamp: number;
  _partitionKey?: string;
}

export class CosmosService {
  /**
   * Create a new chat message in Cosmos DB
   * Using userId as partition key for user-level isolation
   */
  async createMessage(message: ChatMessage): Promise<ChatMessage> {
    const { container } = initializeCosmosClient();
    
    // Set partition key to userId for efficient queries per user
    const item = {
      ...message,
      _partitionKey: message.userId,
    };

    const { resource } = await container.items.create(item);

    return resource as ChatMessage;
  }

  /**
   * Upsert a chat message (create or replace if exists)
   * Using userId as partition key for user-level isolation
   */
  async upsertMessage(message: ChatMessage): Promise<ChatMessage> {
    const { container } = initializeCosmosClient();
    
    // Set partition key to userId for efficient queries per user
    const item = {
      ...message,
      _partitionKey: message.userId,
    };

    const { resource } = await container.items.upsert(item);

    return resource as ChatMessage;
  }

  /**
   * Get messages for a specific user and room
   * Optimized query within a single partition
   */
  async getMessagesByUserAndRoom(
    userId: string,
    roomId: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    const { container } = initializeCosmosClient();
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.roomId = @roomId ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@roomId', value: roomId },
        { name: '@limit', value: limit },
      ],
    };

    const { resources } = await container.items
      .query<ChatMessage>(querySpec, {
        partitionKey: userId,
      })
      .fetchAll();

    return resources;
  }

  /**
   * Get recent messages for a room (cross-partition query)
   * Use sparingly - prefer user-scoped queries
   */
  async getMessagesByRoom(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    const { container } = initializeCosmosClient();
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.roomId = @roomId ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit',
      parameters: [
        { name: '@roomId', value: roomId },
        { name: '@limit', value: limit },
      ],
    };

    const { resources, diagnostics } = await container.items
      .query<ChatMessage>(querySpec)
      .fetchAll();

    // Cross-partition queries may have higher RU costs
    if (diagnostics) {
      console.log('Cross-partition query diagnostics:', diagnostics);
    }

    return resources;
  }

  /**
   * Initialize database and container if they don't exist
   */
  async initialize(): Promise<void> {
    const { cosmosClient, database } = initializeCosmosClient();
    const databaseName = process.env.COSMOS_DATABASE_NAME || 'chatdb';
    const containerName = process.env.COSMOS_CONTAINER_NAME || 'messages';
    
    try {
      await cosmosClient.databases.createIfNotExists({ id: databaseName });
      
      // Create container with userId as partition key
      // Supports high cardinality and user-level isolation
      await database.containers.createIfNotExists({
        id: containerName,
        partitionKey: {
          paths: ['/userId'],
          version: 2, // Use V2 for better performance
        },
        indexingPolicy: {
          automatic: true,
          indexingMode: 'consistent',
          includedPaths: [
            { path: '/*' }
          ],
          excludedPaths: [
            { path: '/_etag/?' }
          ]
        }
      });

      console.log('Cosmos DB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Cosmos DB:', error);
      throw error;
    }
  }

  /**
   * Get all messages (cross-partition query)
   * WARNING: Expensive operation - use with caution
   */
  async getAllMessages(limit: number = 100): Promise<ChatMessage[]> {
    const { container } = initializeCosmosClient();
    
    const querySpec = {
      query: 'SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit',
      parameters: [
        { name: '@limit', value: limit },
      ],
    };

    const { resources, diagnostics } = await container.items
      .query<ChatMessage>(querySpec)
      .fetchAll();

    if (diagnostics) {
      console.log('getAllMessages diagnostics:', diagnostics);
    }

    return resources;
  }

  /**
   * Delete a message by ID and partition key
   */
  async deleteMessage(id: string, userId: string): Promise<void> {
    const { container } = initializeCosmosClient();
    
    await container.item(id, userId).delete();
    console.log(`Message ${id} deleted for user ${userId}`);
  }
}

export const cosmosService = new CosmosService();
