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
    // In development (localhost), use relative URLs
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return '';
    }
    
    // In production, use the current origin
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    
    // Fallback
    return '';
  }



  getCurrentMode(): string {
    return this.currentMode;
  }

  async sendChatMessage(message: string, personaKey: string): Promise<ChatResponse> {
    try {
      const url = `${this.baseUrl}/.netlify/functions/chat`;
      console.log('🤖 Sending message to:', url);
      console.log('📝 Message:', message);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          personaKey,
        }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Failed to get response from AI service: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Successfully received AI response:', data);
      
      // Update mode based on successful API call
      this.currentMode = 'Live AI - Amélie';
      
      return data;
    } catch (error) {
      console.error('❌ Error in AI service:', error);
      
      // Update mode and fallback to mock response
      this.currentMode = 'Mock Mode - Amélie (Offline)';
      
      // Always provide offline fallback for better UX
      console.log('🔄 Falling back to offline response');
      return this.getMockResponse(message, personaKey);
    }
  }

  private getMockResponse(_message: string, personaKey: string): ChatResponse {
    const mockResponses = {
      frenchTutor: [
        {
          conversation: "Bonjour! Je suis Amélie, votre tutrice de français. Comment puis-je vous aider aujourd'hui?",
          corrections: [],
          mode: 'mock',
          persona: {
            name: 'Amélie',
            age: 28,
            location: 'Paris'
          }
        },
        {
          conversation: "Je vois quelques erreurs dans votre texte. Voici les corrections nécessaires :",
          corrections: [
            {
              mistakeType: 'grammar',
              subcategory: 'gender_agreement',
              severity: 'moderate' as const,
              userInput: 'un pomme',
              correction: 'une pomme',
              explanation: 'En français, "pomme" est un nom féminin, donc on utilise "une" au lieu de "un".',
              grammarRule: 'Les noms de fruits sont généralement féminins en français.',
              examples: ['une pomme', 'une poire', 'une banane']
            },
            {
              mistakeType: 'grammar',
              subcategory: 'number_agreement',
              severity: 'moderate' as const,
              userInput: 'deux baguette',
              correction: 'deux baguettes',
              explanation: 'En français, les noms au pluriel prennent généralement un "s".',
              grammarRule: 'La plupart des noms français forment leur pluriel en ajoutant un "s".',
              examples: ['une baguette → des baguettes', 'un croissant → des croissants']
            },
            {
              mistakeType: 'vocabulary',
              subcategory: 'anglicisms',
              severity: 'minor' as const,
              userInput: 'shopping',
              correction: 'magasinage',
              explanation: '"Shopping" est un anglicisme. En français, on utilise "magasinage" ou "faire des courses".',
              grammarRule: 'Évitez les mots anglais quand il existe un équivalent français.',
              examples: ['faire du magasinage', 'aller faire des courses']
            }
          ],
          mode: 'mock',
          persona: {
            name: 'Amélie',
            age: 28,
            location: 'Paris'
          }
        }
      ]
    };

    const responses = mockResponses[personaKey as keyof typeof mockResponses] || mockResponses.frenchTutor;
    return responses[Math.floor(Math.random() * responses.length)];
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