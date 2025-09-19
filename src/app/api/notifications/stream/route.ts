import { NextRequest } from 'next/server';
import { getRedis } from '@/redis/redis';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return new Response('User ID is required', { status: 400 });
  }

  const redis = getRedis();
  if (!redis) {
    return new Response('Redis not available', { status: 500 });
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to notifications',
        timestamp: new Date().toISOString()
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialMessage));

      // Subscribe to user-specific notifications
      const subscriber = redis.duplicate();
      subscriber.subscribe(`notifications:${userId}`, (err) => {
        if (err) {
          console.error('Redis subscription error:', err);
          controller.close();
        }
      });

      subscriber.on('message', (channel, message) => {
        try {
          const notification = JSON.parse(message);
          const sseMessage = `data: ${JSON.stringify(notification)}\n\n`;
          controller.enqueue(new TextEncoder().encode(sseMessage));
        } catch (error) {
          console.error('Error parsing notification message:', error);
        }
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        subscriber.unsubscribe();
        subscriber.disconnect();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
