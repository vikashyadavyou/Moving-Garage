/**
 * WebSocket manager for real-time communication.
 */
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export function createWebSocket(path, handlers = {}) {
  const url = `${WS_BASE_URL}/${path}`
  const ws = new WebSocket(url)

  ws.onopen = () => {
    console.log(`[WS] Connected: ${path}`)
    handlers.onOpen?.()
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log(`[WS] Message:`, data)

      // Route to specific handler based on message type
      const handler = handlers[data.type]
      if (handler) {
        handler(data)
      }
      handlers.onMessage?.(data)
    } catch (e) {
      console.error('[WS] Parse error:', e)
    }
  }

  ws.onclose = (event) => {
    console.log(`[WS] Disconnected: ${path}`, event.code)
    handlers.onClose?.(event)
  }

  ws.onerror = (error) => {
    console.error(`[WS] Error:`, error)
    handlers.onError?.(error)
  }

  return {
    ws,
    send: (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data))
      }
    },
    close: () => ws.close(),
  }
}
