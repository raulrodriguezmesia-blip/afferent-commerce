import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FloatingChatProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'message' | 'typing' | 'thought';
}

export default function FloatingChat({ isOpen, onToggle }: FloatingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const connectWS = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8010/ws/finops-assistant');
    ws.current = socket;

    socket.onopen = () => {
      setConnected(true);
      // Send welcome message from server side is handled by the backend
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'typing') {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 800);
          return;
        }
        setIsTyping(false);
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content, type: 'message' }]);
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      reconnectTimeout.current = setTimeout(connectWS, 3000);
    };

    socket.onerror = () => {
      setConnected(false);
      socket.close();
    };
  };

  useEffect(() => {
    if (isOpen && !ws.current) {
      connectWS();
    }
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (e?: React.FormEvent, quickText?: string) => {
    if (e) e.preventDefault();
    const text = quickText ?? input;
    if (!text.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    ws.current.send(JSON.stringify({ message: text }));
    if (!quickText) setInput('');
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-600/30 flex items-center justify-center z-50"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50"
          >
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">FinOps AI Assistant</p>
                <p className="text-xs text-blue-100 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {connected ? 'En lÃ­nea' : 'Reconectando...'}
                </p>
              </div>
              <Sparkles size={18} className="text-yellow-300" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((message, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.role === 'user' ? 'bg-slate-200' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                  }`}>
                    {message.role === 'user' ? <User size={16} className="text-slate-600" /> : <Bot size={16} className="text-white" />}
                  </div>
                  <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 pt-3">
              <button
                type="button"
                onClick={() => sendMessage(undefined, 'Â¿CuÃ¡l es la visiÃ³n de producto de Afferent Commerce?')}
                disabled={!connected}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                💡 Product Vision (Product Founder)
              </button>
            </div>
            <div className="border-t border-slate-200 p-4 bg-white">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta sobre fondos retenidos, pagos o riesgo..."
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={!connected}
                />
                <button
                  type="submit"
                  disabled={!connected || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
