import type { ChatResponse } from '@/types/mistakes';

const DEBUG = import.meta.env.DEV;

function log(...args: unknown[]) {
  if (DEBUG) console.log(...args);
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  private currentMode: string = 'AI Service Ready';
  private baseUrl: string;

  constructor() {
    this.baseUrl = this.getBaseUrl();
    log('AI Service initialized, base URL:', this.baseUrl);
  }

  private getBaseUrl(): string {
    if (typeof window === 'undefined') return '';

    const { hostname, port } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocal && port === '8888') return '';
    if (isLocal) return 'http://localhost:8888';

    return '';
  }

  getCurrentMode(): string {
    return this.currentMode;
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    baseUrl: string;
    endpoint: string;
    diagnostics: {
      canReachEndpoint: boolean;
      endpointStatus?: number;
      error?: string;
      recommendations: string[];
    };
  }> {
    const endpoint = `${this.baseUrl}/.netlify/functions/chat`;
    const diagnostics = {
      canReachEndpoint: false,
      endpointStatus: undefined as number | undefined,
      error: undefined as string | undefined,
      recommendations: [] as string[],
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'health-check', personaKey: 'frenchTutor' }),
      });

      diagnostics.canReachEndpoint = true;
      diagnostics.endpointStatus = response.status;

      if (response.status === 404) {
        diagnostics.recommendations.push(
          'Netlify function not found. Make sure you\'re running "npm run netlify:dev"',
        );
      } else if (response.status === 500) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'OpenAI API key not configured') {
            diagnostics.recommendations.push(
              'OpenAI API key is missing. Set OPENAI_API_KEY in .env file',
            );
          }
        } catch {
          diagnostics.recommendations.push('Server error - check Netlify function logs');
        }
      }
    } catch (error) {
      diagnostics.canReachEndpoint = false;
      diagnostics.error = error instanceof Error ? error.message : String(error);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        diagnostics.recommendations.push(
          'Cannot reach API. Make sure Netlify dev server is running: npm run netlify:dev',
        );
      }
    }

    return {
      status: diagnostics.canReachEndpoint && diagnostics.endpointStatus === 200
        ? 'healthy'
        : 'unhealthy',
      baseUrl: this.baseUrl,
      endpoint,
      diagnostics,
    };
  }

  async sendChatMessage(
    message: string,
    personaKey: string,
    conversationHistory: ChatMessage[] = [],
  ): Promise<ChatResponse> {
    const url = `${this.baseUrl}/.netlify/functions/chat`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, personaKey, conversationHistory }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed with status ${response.status}`;

        if (response.status === 404) {
          errorMessage = 'Netlify function not found. Run "npm run netlify:dev" for function support.';
        } else if (response.status === 500) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error === 'OpenAI API key not configured'
              ? 'OpenAI API key is missing. Set OPENAI_API_KEY in your .env file.'
              : `Server error: ${errorData.error || errorData.details || errorText}`;
          } catch {
            errorMessage = `Server error: ${errorText}`;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      this.currentMode = 'Live AI - Amélie';
      return data;
    } catch (error) {
      this.currentMode = 'Error - API Unavailable';

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Cannot reach the API. Make sure Netlify dev server is running on port 8888.',
        );
      }

      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async getFeedback(userInput: string): Promise<ChatResponse> {
    return this.sendChatMessage(
      `Please provide feedback on this French text: "${userInput}"`,
      'frenchTutor',
    );
  }

  async startConversation(): Promise<ChatResponse> {
    return this.sendChatMessage(
      "Let's start a conversation in French. I'm a beginner.",
      'frenchTutor',
    );
  }

  async practiceTopic(topic: string, userLevel: string): Promise<ChatResponse> {
    return this.sendChatMessage(
      `I'd like to practice a conversation about ${topic}. I'm at ${userLevel} level.`,
      'frenchTutor',
    );
  }

  async explainWord(word: string): Promise<ChatResponse> {
    return this.sendChatMessage(
      `Can you help me understand the word "${word}" in French?`,
      'frenchTutor',
    );
  }

  async explainGrammar(grammarTopic: string): Promise<ChatResponse> {
    return this.sendChatMessage(
      `I need help understanding ${grammarTopic} in French grammar.`,
      'frenchTutor',
    );
  }
}

export const aiService = new AIService();
