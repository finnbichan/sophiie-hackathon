// Interaction Service - Handles user interactions in the Interaction Window
// Uses Groq API for conversational AI

import Groq from 'groq-sdk';

/**
 * GroqService handles conversational interactions with Groq
 * Designed for the Interaction Window - user messages and agent responses
 */
class GroqService {
  private client: Groq;
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 500; // Rate limiting: 500ms between requests

  constructor() {
    const apiKey = process.env.REACT_APP_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Groq API key is required, but not found in environment variables.');
    }
    this.client = new Groq({ 
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  /**
   * Send a message and get a conversational response from Groq
   */
  async chat(userMessage: string): Promise<string> {
    // Enforce rate limiting
    await this.enforceRateLimit();

    const systemPrompt = `You are a helpful AI meeting assistant supporting users during video calls. 
You can help with:
- Answering questions about meeting content
- Providing information and explanations
- Assisting with task management and reminders
- Offering suggestions and insights

Keep responses concise, friendly, and actionable.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      const textContent = response.choices[0]?.message?.content;
      if (!textContent) {
        throw new Error('No text response from Groq API');
      }

      return textContent;
    } catch (error) {
      console.error('Error in chat:', error);
      throw error; // Let caller handle the error
    }
  }

  /**
   * Clear rate limit state if needed
   */
  clearHistory(): void {
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting to avoid hitting API quotas
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delayNeeded = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    this.lastRequestTime = Date.now();
  }
}

export default GroqService;
