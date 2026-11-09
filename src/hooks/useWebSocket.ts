'use client';
// @ts-nocheck
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSession } from '@/hooks/useSession';

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useWebSocket(autoConnect: boolean = true, url: string = 'ws://localhost:3001') {
  const { isSignedIn } = useAuth();
  
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState((prev) => ({ ...prev, connecting: true, error: null }));
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setState({ connected: true, connecting: false, error: null });
    };

    ws.onclose = () => {
      setState({ connected: false, connecting: false, error: null });
    };

    ws.onerror = () => {
      setState((prev) => ({ ...prev, error: 'Erreur de connexion WebSocket', connecting: false }));
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    if (autoConnect && isSignedIn && !state.connected && !state.connecting) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoConnect, isSignedIn]);

  return {
    ...state,
    connect,
    disconnect: () => wsRef.current?.close(),
    send: (data: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(data));
      }
    }
  };
}