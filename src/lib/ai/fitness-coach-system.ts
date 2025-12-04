import { supabase } from '@/lib/supabase/client';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// =====================================================
// CONFIGURATION
// =====================================================

const COACH_SYSTEM_PROMPT = `You are an elite personal fitness coach.
Personality: Motivating, Direct, Science-Based.
Your goal is to help the user achieve their fitness goals safely and efficiently.
Keep responses concise (under 3 sentences) unless asked for a detailed explanation.
Use emojis sparingly to keep it friendly.`;

// =====================================================
// THE COACH CLASS
// =====================================================

export class AIFitnessCoachSystem {
  private conversationContext: ChatMessage[] = [];

  constructor() {
    // Initialize with system prompt
    this.conversationContext = [{ role: 'system', content: COACH_SYSTEM_PROMPT }];
  }

  /**
   * Main Chat Function
   */
  async chat(message: string): Promise<string> {
    // 1. Add user message to history
    this.conversationContext.push({ role: 'user', content: message });

    // 2. Call AI
    const response = await this.callGroq(this.conversationContext);

    // 3. Add AI response to history
    this.conversationContext.push({ role: 'assistant', content: response });

    return response;
  }

  /**
   * Reset Conversation
   */
  reset() {
    this.conversationContext = [{ role: 'system', content: COACH_SYSTEM_PROMPT }];
  }

  /**
   * Private: Call the Groq API
   */
  private async callGroq(messages: ChatMessage[]): Promise<string> {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      return "⚠️ System Error: Coach Brain Missing (API Key not found).";
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('AI Error:', err);
        return "I'm having trouble thinking right now. Please try again.";
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('Network Error:', error);
      return "Network connection issue. Are you offline?";
    }
  }
}

// Singleton Instance
export const aiCoach = new AIFitnessCoachSystem();