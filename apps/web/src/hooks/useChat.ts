/* Hook: Chat */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from '../types/afferent';

export function useChat(wsUrl: string) {
  const [chatLogs, setChatLogs] = useState<Message[]>([
    { role: 'assistant', content: 'Afferent FinOps Agent inicializado. Conectado a PayPal Orders API v2 y NVIDIA Nemotron.' }
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const connectWS = useCallback(() => {
    ws.current = new WebSocket(wsUrl);
    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => {
      setIsConnected(false);
      setTimeout(connectWS, 3000);
    };
    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.content) {
          setChatLogs(prev => [...prev, { role: 'assistant', content: data.content }]);
        }
      } catch { /* ignore */ }
    };
  }, [wsUrl]);

  const sendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).querySelector('input') as HTMLInputElement | null;
    const msg = input?.value;
    if (!msg?.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ message: msg }));
    setChatLogs(prev => [...prev, { role: 'user', content: msg }]);
    if (input) {
      input.value = '';
    }
  }, []);

  useEffect(() => {
    connectWS();
    return () => ws.current?.close();
  }, [connectWS]);

  return { chatLogs, sendMessage, isConnected };
}