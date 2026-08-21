import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/ui-kit')({
  server: {
    handlers: {
      GET: async () => {
        return new Response('<h1>Public UI Kit Placeholder</h1>', {
          headers: { 'Content-Type': 'text/html' }
        })
      }
    }
  }
})
