import { createFileRoute } from '@tanstack/react-router';
import { consumeLastCapturedError } from '@/lib/error-capture';

export const Route = createFileRoute('/api/public/debug-ssr')({
  server: {
    handlers: {
      GET: async () => {
        const error = consumeLastCapturedError();
        
        const details = {
          timestamp: new Date().toISOString(),
          hasError: !!error,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          env: {
            isWorker: typeof (globalThis as any).WebSocketPair !== 'undefined',
            hasProcess: typeof process !== 'undefined',
            nodeEnv: process.env.NODE_ENV
          }
        };

        return new Response(JSON.stringify(details, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
});
