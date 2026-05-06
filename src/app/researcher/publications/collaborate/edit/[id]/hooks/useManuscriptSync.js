import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * WebSocket-based real-time manuscript synchronization hook
 * Replaces polling with instant updates for content, presence, and cursor positions
 */
export const useManuscriptSync = ({ manuscriptId, userId, enabled = true }) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const eventHandlersRef = useRef({});

  // Register event handler
  const on = useCallback((event, handler) => {
    if (!eventHandlersRef.current[event]) {
      eventHandlersRef.current[event] = [];
    }
    eventHandlersRef.current[event].push(handler);

    // Return unsubscribe function
    return () => {
      eventHandlersRef.current[event] = eventHandlersRef.current[event].filter(h => h !== handler);
    };
  }, []);

  // Emit event to registered handlers
  const emit = useCallback((event, data) => {
    const handlers = eventHandlersRef.current[event] || [];
    handlers.forEach(handler => handler(data));
  }, []);

  // Send message to server
  const send = useCallback((type, data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (!manuscriptId || !userId || !enabled) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Determine WebSocket URL (ws:// for http, wss:// for https)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/manuscripts/${manuscriptId}/sync?userId=${userId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      emit('connected', { manuscriptId, userId });

      // Send initial presence
      send('presence', {
        userId,
        manuscriptId,
        status: 'active'
      });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, data } = message;

        switch (type) {
          case 'content-update':
            emit('contentUpdate', data);
            break;
          case 'presence-update':
            setActiveUsers(data.activeUsers || []);
            emit('presenceUpdate', data);
            break;
          case 'cursor-update':
            emit('cursorUpdate', data);
            break;
          case 'title-update':
            emit('titleUpdate', data);
            break;
          case 'comment-added':
            emit('commentAdded', data);
            break;
          case 'comment-updated':
            emit('commentUpdated', data);
            break;
          case 'comment-deleted':
            emit('commentDeleted', data);
            break;
          case 'change-tracked':
            emit('changeTracked', data);
            break;
          case 'change-accepted':
            emit('changeAccepted', data);
            break;
          case 'change-rejected':
            emit('changeRejected', data);
            break;
          case 'error':
            console.error('WebSocket error:', data);
            emit('error', data);
            break;
          default:
            emit(type, data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      emit('error', error);
    };

    ws.onclose = () => {
      setIsConnected(false);
      emit('disconnected', { manuscriptId, userId });

      // Attempt reconnection with exponential backoff
      if (enabled) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
  }, [manuscriptId, userId, enabled, emit, send]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Send content update
  const sendContentUpdate = useCallback((content) => {
    send('content-update', {
      manuscriptId,
      userId,
      content,
      timestamp: Date.now()
    });
  }, [send, manuscriptId, userId]);

  // Send presence update
  const sendPresenceUpdate = useCallback((status = 'active') => {
    send('presence', {
      manuscriptId,
      userId,
      status,
      timestamp: Date.now()
    });
  }, [send, manuscriptId, userId]);

  // Send cursor position
  const sendCursorPosition = useCallback((position) => {
    send('cursor-update', {
      manuscriptId,
      userId,
      position,
      timestamp: Date.now()
    });
  }, [send, manuscriptId, userId]);

  // Send title update
  const sendTitleUpdate = useCallback((title) => {
    send('title-update', {
      manuscriptId,
      userId,
      title,
      timestamp: Date.now()
    });
  }, [send, manuscriptId, userId]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled && manuscriptId && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, manuscriptId, userId, connect, disconnect]);

  // Send heartbeat every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const heartbeatInterval = setInterval(() => {
      sendPresenceUpdate('active');
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [isConnected, sendPresenceUpdate]);

  return {
    isConnected,
    activeUsers,
    on,
    send,
    sendContentUpdate,
    sendPresenceUpdate,
    sendCursorPosition,
    sendTitleUpdate,
    disconnect
  };
};
