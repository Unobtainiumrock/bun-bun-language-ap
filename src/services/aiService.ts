// AI Service - handles all AI-related API calls via Netlify Functions
import type { ChatResponse } from '@/types/mistakes';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  private currentMode: string = 'AI Service Ready';
  private baseUrl: string;

  constructor() {
    // Determine the correct base URL for API calls
    this.baseUrl = this.getBaseUrl();
    console.log('🌐 AI Service initialized with base URL:', this.baseUrl);
  }

  private getBaseUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // In development, check if we're on Netlify dev server (port 8888)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // If port is 8888, we're on Netlify dev - use relative URLs
      if (port === '8888' || port === '') {
        return '';
      }
      // If port is 5173, we're on Vite dev - need to use Netlify dev port
      if (port === '5173') {
        console.warn('⚠️ Running on Vite dev server (port 5173). Netlify functions may not be available.');
        console.warn('💡 Tip: Use "npm run netlify:dev" to run with functions support on port 8888');
        // Try to use Netlify dev port
        return 'http://localhost:8888';
      }
    }
    
    // In production, use the current origin
    return window.location.origin;
  }



  getCurrentMode(): string {
    return this.currentMode;
  }

  /**
   * Health check to verify API connectivity and configuration
   * Returns diagnostic information about the API setup
   */
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

    // Check if we can reach the endpoint
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
          'Netlify function not found. Make sure you\'re running "npm run netlify:dev"'
        );
      } else if (response.status === 500) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'OpenAI API key not configured') {
            diagnostics.recommendations.push(
              'OpenAI API key is missing. Set OPENAI_API_KEY in .env file'
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
          'Cannot reach API endpoint. Make sure Netlify dev server is running on port 8888'
        );
        diagnostics.recommendations.push(
          'Use "npm run netlify:dev" instead of "npm run dev" to enable functions'
        );
      }
    }

    // Check current setup
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      if (port === '5173') {
        diagnostics.recommendations.push(
          'You\'re on Vite dev server (port 5173). Switch to Netlify dev (port 8888) for API access'
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
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const url = `${this.baseUrl}/.netlify/functions/chat`;
    
    // Diagnostic logging
    console.log('🔍 API Call Diagnostics:');
    console.log('  - URL:', url);
    console.log('  - Base URL:', this.baseUrl);
    console.log('  - Current location:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    console.log('  - Port:', typeof window !== 'undefined' ? window.location.port : 'N/A');
    console.log('  - Message:', message);
    console.log('  - Conversation history length:', conversationHistory.length);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          personaKey,
          conversationHistory,
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        
        let errorMessage = `API request failed with status ${response.status}`;
        
        // Provide specific guidance based on error
        if (response.status === 404) {
          errorMessage = `Netlify function not found. Are you running "npm run netlify:dev"? ` +
                        `The endpoint ${url} is not available. ` +
                        `Make sure Netlify dev server is running on port 8888.`;
        } else if (response.status === 500) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error === 'OpenAI API key not configured') {
              errorMessage = `OpenAI API key is missing. ` +
                           `Please set OPENAI_API_KEY in your .env file or Netlify environment variables. ` +
                           `See README-SETUP.md for instructions.`;
            } else {
              errorMessage = `Server error: ${errorData.error || errorData.details || errorText}`;
            }
          } catch {
            errorMessage = `Server error: ${errorText}`;
          }
        } else if (response.status === 0) {
          errorMessage = `Network error: Unable to reach the server. ` +
                        `This usually means: ` +
                        `1) Netlify dev server is not running (use "npm run netlify:dev"), ` +
                        `2) CORS issue, or ` +
                        `3) Network connectivity problem.`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Successfully received AI response:', data);
      
      // Update mode based on successful API call
      this.currentMode = 'Live AI - Amélie';
      
      return data;
    } catch (error) {
      console.error('❌ Error in AI service:', error);
      
      // Update mode to indicate error
      this.currentMode = 'Error - API Unavailable';
      
      // Provide detailed error information
      let errorMessage = 'Unable to connect to the AI service.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = `Network error: Cannot reach the API endpoint. ` +
                      `Possible causes:\n` +
                      `1. Netlify dev server is not running - use "npm run netlify:dev" instead of "npm run dev"\n` +
                      `2. Wrong port - make sure you're accessing the app on port 8888\n` +
                      `3. Functions not available - check that netlify/functions/chat.js exists\n` +
                      `4. Network connectivity issue\n\n` +
                      `Current URL: ${url}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = `Unknown error: ${String(error)}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  async getFeedback(userInput: string): Promise<ChatResponse> {
    const feedbackPrompt = `Please provide feedback on this French text: "${userInput}"`;
    return await this.sendChatMessage(feedbackPrompt, 'frenchTutor');
  }

  async startConversation(): Promise<ChatResponse> {
    const starterPrompt = "Let's start a conversation in French. I'm a beginner.";
    return await this.sendChatMessage(starterPrompt, 'frenchTutor');
  }

  async practiceTopic(topic: string, userLevel: string): Promise<ChatResponse> {
    const initialMessage = `I'd like to practice a conversation about ${topic}. I'm at ${userLevel} level.`;
    return this.sendChatMessage(initialMessage, 'frenchTutor');
  }

  async explainWord(word: string): Promise<ChatResponse> {
    const message = `Can you help me understand the word "${word}" in French?`;
    return this.sendChatMessage(message, 'frenchTutor');
  }

  async explainGrammar(grammarTopic: string): Promise<ChatResponse> {
    const message = `I need help understanding ${grammarTopic} in French grammar.`;
    return this.sendChatMessage(message, 'frenchTutor');
  }
}

// Export singleton instance
export const aiService = new AIService(); 