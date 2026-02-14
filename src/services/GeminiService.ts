// Initialize the Gemini API with your API key
// You'll need to set the REACT_APP_GEMINI_API_KEY environment variable or pass it as a parameter

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: {
    text: string;
  }[];
}

class GeminiService {
  private apiKey: string;
  private conversationHistory: GeminiMessage[] = [];
  private transcriptContext: string = '';
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 1000; // Minimum 1 second between requests

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn(
        'Gemini API key not set. Set GEMINI_API_KEY environment variable.'
      );
    }
  }

  private async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delayNeeded = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    this.lastRequestTime = Date.now();
  }

  setTranscriptContext(transcript: string) {
    this.transcriptContext = transcript;
  }

  async generateSuggestions(transcript: string) {
    const prompt = `Based on this meeting transcript, suggest 2-3 relevant questions or action items the user should consider:

Transcript:
${transcript}

Respond with a JSON array of suggestions, each with a "title" and optional "description". Format:
[{"title": "...", "description": "...", "type": "question|reminder|context"}]`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseSuggestions(response);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  async chat(userMessage: string): Promise<string> {
    // Add user message to conversation history
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    // Enforce rate limiting
    await this.enforceRateLimit();

    const systemPrompt = `You are an AI meeting assistant helping the user during a Google Meet call. 
You have access to the meeting transcript and can help with:
- Answering questions about the meeting content
- Taking notes and setting reminders
- Suggesting follow-up actions
- Providing relevant context

Keep responses concise and actionable. Current transcript context: ${this.transcriptContext}`;

    try {
        console.log("Sending message to Gemini API");
      const response = await this.callGeminiAPI(userMessage, systemPrompt);

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'model',
        parts: [{ text: response }],
      });

      return response;
    } catch (error) {
      console.error('Error in chat:', error);
      return 'Sorry, I encountered an error processing your request.';
    }
  }

  async generateMeetingSummary(transcript: string): Promise<string> {
    const prompt = `Please provide a concise summary of this meeting, highlighting key discussions, decisions made, and action items:

${transcript}

Format the response as:
## Summary
[Summary text]

## Key Decisions
- [Decision 1]
- [Decision 2]

## Action Items
- [Action 1]
- [Action 2]`;

    try {
      return await this.callGeminiAPI(prompt);
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Unable to generate summary at this time.';
    }
  }

  private async callGeminiAPI(
    prompt: string,
    systemContext?: string
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: systemContext
                ? `${systemContext}\n\nUser: ${prompt}`
                : prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    };

    const response = await fetch(
      `${GEMINI_API_URL}?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('No response text from Gemini API');
    }

    return textContent;
  }

  private parseSuggestions(response: string) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing suggestions:', error);
    }
    return [];
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export default GeminiService;
