import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';

const HUB_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5130/api')
  .replace('/api', '') + '/hubs/operations';

export type SignalREventHandler = (data: any) => void;

interface UseSignalROptions {
  onNewOrderCreated?: SignalREventHandler;
  onOrderStatusChanged?: SignalREventHandler;
  onLowStockAlert?: SignalREventHandler;
  onNotification?: SignalREventHandler;
  onSystemActivity?: SignalREventHandler;
}

/**
 * Hook to manage a persistent SignalR connection to OperationsHub.
 * Auto-reconnects on drop, cleans up on unmount.
 */
export function useSignalR(options: UseSignalROptions = {}) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const token = useAuthStore((state) => state.token);
  const optionsRef = useRef(options);
  optionsRef.current = options; // Always keep latest handlers without re-connecting

  const connect = useCallback(async () => {
    if (!token) return;
    if (connectionRef.current) return; // Already connected

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => useAuthStore.getState().token ?? '',
        skipNegotiation: false,
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Register event handlers (use optionsRef to always use latest callbacks)
    connection.on('NewOrderCreated', (data) => optionsRef.current.onNewOrderCreated?.(data));
    connection.on('OrderStatusChanged', (data) => optionsRef.current.onOrderStatusChanged?.(data));
    connection.on('LowStockAlert', (data) => optionsRef.current.onLowStockAlert?.(data));
    connection.on('Notification', (data) => optionsRef.current.onNotification?.(data));
    connection.on('onSystemActivity', (data) => optionsRef.current.onSystemActivity?.(data));

    connection.onreconnecting(() => console.info('[SignalR] Reconnecting...'));
    connection.onreconnected(() => console.info('[SignalR] Reconnected!'));
    connection.onclose(() => {
      console.warn('[SignalR] Connection closed');
      connectionRef.current = null;
    });

    try {
      await connection.start();
      connectionRef.current = connection;
      console.info('[SignalR] Connected to OperationsHub');
    } catch (err) {
      console.warn('[SignalR] Initial connection failed:', err);
      connectionRef.current = null;
    }
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      connectionRef.current?.stop().catch(console.warn);
      connectionRef.current = null;
    };
  }, [connect]);

  return { connection: connectionRef.current };
}
