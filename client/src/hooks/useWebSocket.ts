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
  const retryCountRef = useRef(0)
  const maxRetries = 5

  const connect = () => {
    try {
      // Convert http(s) URL to ws(s)
      const wsUrl = url.replace(/^http/, 'ws')
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        retryCountRef.current = 0 // Reset retry count on successful connection
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

      ws.onclose = (event) => {
        // Only log if it's not a normal closure
        if (event.code !== 1000) {
          console.log('WebSocket disconnected with code:', event.code)
        }
        setIsConnected(false)
        onDisconnect?.()
        wsRef.current = null

        // Attempt to reconnect if should reconnect and not a normal closure
        if (shouldReconnectRef.current && event.code !== 1000) {
          retryCountRef.current++
          
          if (retryCountRef.current <= maxRetries) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(`Attempting to reconnect WebSocket (${retryCountRef.current}/${maxRetries})...`)
              connect()
            }, reconnectInterval)
          } else {
            console.warn('Max WebSocket reconnection attempts reached. Stopping reconnection.')
          }
        }
      }

      ws.onerror = (error) => {
        // Silently handle error - onclose will be called next
        // This prevents duplicate error logging
        console.warn('WebSocket error occurred, will attempt reconnect if needed')
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      
      // Retry connection with exponential backoff
      if (shouldReconnectRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval * 2)
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
