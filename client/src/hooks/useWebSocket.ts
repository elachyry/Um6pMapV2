import { useEffect, useState, useRef } from 'react'

interface UseWebSocketOptions {
  url: string
  onConnect?: () => void
  onDisconnect?: () => void
  onMessage?: (data: any) => void
  reconnectInterval?: number
}

export function useWebSocket({
  url,
  onConnect,
  onDisconnect,
  onMessage,
  reconnectInterval = 3000,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const shouldReconnectRef = useRef(true)

  const connect = () => {
    try {
      // Convert http(s) URL to ws(s)
      const wsUrl = url.replace(/^http/, 'ws')
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        onConnect?.()
        
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          onMessage?.(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        onDisconnect?.()
        wsRef.current = null

        // Attempt to reconnect if should reconnect
        if (shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...')
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        ws.close()
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      
      // Retry connection
      if (shouldReconnectRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
      }
    }
  }

  const disconnect = () => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const sendMessage = (data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  useEffect(() => {
    shouldReconnectRef.current = true
    connect()

    return () => {
      disconnect()
    }
  }, [url])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
  }
}
