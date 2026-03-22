import express, { Request, Response } from 'express';
import { cosmosService, ChatMessage } from '../services/cosmosService.js';
import { queueService } from '../services/queueService.js';

const router = express.Router();

/**
 * POST /api/messages - Send a new chat message
 */
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const { userId, roomId, message } = req.body;

    if (!userId || !roomId || !message) {
      return res.status(400).json({ error: 'userId, roomId, and message are required' });
    }

    const chatMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      roomId,
      message,
      timestamp: Date.now(),
    };

    // Send to queue for async processing
    await queueService.sendMessage(chatMessage);

    // Also save directly to Cosmos DB for immediate retrieval
    const savedMessage = await cosmosService.createMessage(chatMessage);

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

/**
 * GET /api/messages/:userId/:roomId - Get messages for a user in a room
 */
router.get('/messages/:userId/:roomId', async (req: Request, res: Response) => {
  try {
    const { userId, roomId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await cosmosService.getMessagesByUserAndRoom(userId, roomId, limit);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * GET /api/rooms/:roomId/messages - Get all messages in a room (cross-partition)
 */
router.get('/rooms/:roomId/messages', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await cosmosService.getMessagesByRoom(roomId, limit);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({ error: 'Failed to fetch room messages' });
  }
});

/**
 * GET /api/queue/status - Get queue status
 */
router.get('/queue/status', async (req: Request, res: Response) => {
  try {
    const count = await queueService.getMessageCount();
    res.json({ messageCount: count });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({ error: 'Failed to fetch queue status' });
  }
});

/**
 * GET /api/queue/peek - Peek at queue messages without removing them
 */
router.get('/queue/peek', async (req: Request, res: Response) => {
  try {
    const maxMessages = parseInt(req.query.limit as string) || 10;
    const messages = await queueService.peekMessages(maxMessages);
    res.json({ messages });
  } catch (error) {
    console.error('Error peeking queue messages:', error);
    res.status(500).json({ error: 'Failed to peek queue messages' });
  }
});

/**
 * POST /api/queue/process - Process messages from queue (for testing)
 */
router.post('/queue/process', async (req: Request, res: Response) => {
  try {
    const messages = await queueService.receiveMessages(10);
    
    // Process each message using upsert to avoid duplicate conflicts
    const results = await Promise.all(
      messages.map((msg) =>
        cosmosService.upsertMessage({
          ...msg,
        })
      )
    );

    res.json({ processed: results.length, messages: results });
  } catch (error) {
    console.error('Error processing queue messages:', error);
    res.status(500).json({ error: 'Failed to process queue messages' });
  }
});

export default router;
