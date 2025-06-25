/**
 * AI module type definitions
 * Adapted from tmp/ai/internal/types/types.ts
 */

/** AI provider instance configuration */
export interface ProviderInstanceConfig {
  name: string;
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  models: string[];
  maxTokens: number;
  temperature: number;
  topP: number;
  topK?: number;
  timeout: number;
  maxRetries: number;
  rateLimit?: string;
}

/** AI provider configuration */
export interface ProviderConfig {
  enabled: boolean;
  instances: ProviderInstanceConfig[];
}

/** AI configuration */
export interface AIConfig {
  providers: Record<string, ProviderConfig>;
  defaultProvider?: string;
}

/** Chat message */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Chat request */
export interface ChatRequest {
  model?: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}

/** Chat response choice */
export interface Choice {
  index: number;
  message: Message;
  finishReason: string;
}

/** Token usage statistics */
export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Chat response */
export interface ChatResponse {
  id: string;
  model: string;
  choices: Choice[];
  usage: Usage;
  provider: string;
}

/** Stream response delta */
export interface MessageDelta {
  role?: string;
  content?: string;
}

/** Stream response choice */
export interface StreamChoice {
  index: number;
  delta: MessageDelta;
  finishReason: string;
}

/** Stream chat response */
export interface ChatStreamResponse {
  id: string;
  model: string;
  choices: StreamChoice[];
  usage?: Usage;
  provider: string;
}

/** Provider context */
export interface ProviderContext {
  providerName: string;
  instanceName: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  topK?: number;
  timeout: number;
  maxRetries: number;
}

/** AI provider interface */
export interface Provider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream(request: ChatRequest): Promise<ReadableStream<ChatStreamResponse>>;
}

/** AI review result */
export interface AIReviewResult {
  summary: string;
  issues: AIReviewIssue[];
  suggestions: string[];
  securityConcerns: string[];
  refactoringOpportunities: string[];
}

/** AI review issue */
export interface AIReviewIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  location?: {
    file: string;
    line?: number;
    function?: string;
  };
  suggestion?: string;
}
