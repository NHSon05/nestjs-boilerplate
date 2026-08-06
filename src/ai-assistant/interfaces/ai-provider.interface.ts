export interface AiHistoryMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GenerateAiResponseParams {
  model: string;
  prompt: string;
  systemInstruction?: string;
  history?: AiHistoryMessage[];
}

export interface GenerateAiResponseResult {
  content: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  finishReason?: string;
  metadata?: Record<string, unknown>;
}

export interface AiProviderClient {
  generateResponse(
    params: GenerateAiResponseParams,
  ): Promise<GenerateAiResponseResult>;
}
