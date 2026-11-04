/* ChatInput component */
import { Send } from 'lucide-react';

interface ChatInputProps {
  send: (event: React.FormEvent<HTMLFormElement>) => void;
  isConnected: boolean;
}

export function ChatInput({ send, isConnected }: ChatInputProps) {
  return (
    <form onSubmit={send} className="flex gap-2">
      <input
        type="text"
        name="message"
        placeholder="Pregunta sobre pagos, calidad o riesgo…"
        className="flex-1 rounded-xl border border-slate-700 bg-[#0a0a0f] pl-3 pr-4 py-2.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
        disabled={!isConnected}
      />
      <button
        type="submit"
        disabled={!isConnected}
        className="rounded-xl bg-blue-600 px-3 py-2.5 text-white text-xs transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}