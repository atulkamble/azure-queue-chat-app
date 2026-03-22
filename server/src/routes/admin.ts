import express, { Request, Response } from 'express';
import { cosmosService } from '../services/cosmosService.js';
import { queueService } from '../services/queueService.js';

const router = express.Router();

/**
 * GET /api/admin/messages - Get all messages with optional filters
 */
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const { userId, roomId, limit = '100' } = req.query;
    
    let messages;
    
    if (userId && roomId) {
      // Single partition query
      messages = await cosmosService.getMessagesByUserAndRoom(
        userId as string,
        roomId as string,
        parseInt(limit as string)
      );
    } else if (roomId) {
      // Room-based query (cross-partition)
      messages = await cosmosService.getMessagesByRoom(
        roomId as string,
        parseInt(limit as string)
      );
    } else {
      // Get all messages (cross-partition)
      messages = await cosmosService.getAllMessages(parseInt(limit as string));
    }

    res.json({ messages, count: messages.length });
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * DELETE /api/admin/messages/:id - Delete a message by ID
 */
router.delete('/messages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required for partition key' });
    }

    await cosmosService.deleteMessage(id, userId as string);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

/**
 * DELETE /api/admin/messages - Delete all messages (with optional filters)
 */
router.delete('/messages', async (req: Request, res: Response) => {
  try {
    const { userId, roomId } = req.query;
    
    let messages;
    
    if (userId && roomId) {
      messages = await cosmosService.getMessagesByUserAndRoom(
        userId as string,
        roomId as string,
        1000
      );
    } else if (roomId) {
      messages = await cosmosService.getMessagesByRoom(roomId as string, 1000);
    } else {
      messages = await cosmosService.getAllMessages(1000);
    }

    // Delete each message
    await Promise.all(
      messages.map((msg) => cosmosService.deleteMessage(msg.id, msg.userId))
    );

    res.json({ success: true, deleted: messages.length });
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).json({ error: 'Failed to delete messages' });
  }
});

/**
 * GET /api/admin/stats - Get statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const allMessages = await cosmosService.getAllMessages(10000);
    const queueCount = await queueService.getMessageCount();

    // Calculate stats
    const stats = {
      totalMessages: allMessages.length,
      queueMessages: queueCount,
      messagesByRoom: allMessages.reduce((acc, msg) => {
        acc[msg.roomId] = (acc[msg.roomId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      messagesByUser: allMessages.reduce((acc, msg) => {
        acc[msg.userId] = (acc[msg.userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      uniqueUsers: new Set(allMessages.map((m) => m.userId)).size,
      uniqueRooms: new Set(allMessages.map((m) => m.roomId)).size,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * POST /api/admin/queue/clear - Clear all messages from queue
 */
router.post('/queue/clear', async (req: Request, res: Response) => {
  try {
    let totalCleared = 0;
    let batch;

    do {
      batch = await queueService.receiveMessages(32); // Max batch size
      totalCleared += batch.length;
    } while (batch.length > 0);

    res.json({ success: true, cleared: totalCleared });
  } catch (error) {
    console.error('Error clearing queue:', error);
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

export default router;
