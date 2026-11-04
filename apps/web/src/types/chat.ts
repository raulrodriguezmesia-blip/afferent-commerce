/* Chat types */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  type?: 'message' | 'typing' | 'thought';
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  role: 'assistant';
  content: string;
  type?: 'message' | 'typing';
}