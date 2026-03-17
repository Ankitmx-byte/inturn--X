const axios = require('axios');

class JarvisService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'qwen2.5:latest';
    this.conversationHistory = new Map(); // Store conversation history per session
  }

  async chat(sessionId, userMessage, context = {}) {
    try {
      // Get or create conversation history
      if (!this.conversationHistory.has(sessionId)) {
        this.conversationHistory.set(sessionId, []);
      }
      
      const history = this.conversationHistory.get(sessionId);
      
      // Build system prompt for JARVIS personality
      const systemPrompt = this.buildJarvisSystemPrompt(context);
      
      // Build conversation context
      const conversationContext = this.buildConversationContext(history, userMessage);
      
      // Call Ollama
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: `${systemPrompt}\n\n${conversationContext}`,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 200, // Keep responses concise
          stop: ['\nUser:', '\nHuman:']
        }
      });

      const jarvisResponse = response.data.response.trim();
      
      // Update conversation history
      history.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });
      
      history.push({
        role: 'assistant',
        content: jarvisResponse,
        timestamp: new Date()
      });
      
      // Keep only last 10 exchanges to manage context size
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
      
      return {
        response: jarvisResponse,
        success: true
      };
      
    } catch (error) {
      console.error('JARVIS error:', error.message);
      
      // Fallback responses
      return {
        response: this.getFallbackResponse(userMessage),
        success: false,
        fallback: true
      };
    }
  }

  buildJarvisSystemPrompt(context) {
    const { personaName, interviewType, currentQuestion } = context;
    
    return `You are JARVIS, an advanced AI assistant helping with a mock interview. Your personality:
- Professional, intelligent, and supportive
- Concise and to-the-point (max 2-3 sentences)
- British accent in tone (use "Sir" occasionally)
- Helpful but not overly chatty
- Technical and knowledgeable about interviews

Current Context:
- Interviewer: ${personaName || 'AI Interviewer'}
- Interview Type: ${interviewType || 'Technical Interview'}
- Current Question: ${currentQuestion || 'Not yet started'}

Your role:
1. Help the candidate prepare and answer questions
2. Provide quick tips and guidance when asked
3. Repeat questions if requested
4. Offer encouragement and professional feedback
5. Answer questions about the interview process

Keep responses brief and professional. Address the user as "Sir" or "Candidate" occasionally.`;
  }

  buildConversationContext(history, newMessage) {
    let context = '';
    
    // Add recent conversation history
    const recentHistory = history.slice(-6); // Last 3 exchanges
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        context += `User: ${msg.content}\n`;
      } else {
        context += `JARVIS: ${msg.content}\n`;
      }
    }
    
    // Add new message
    context += `User: ${newMessage}\nJARVIS:`;
    
    return context;
  }

  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Pattern matching for common queries
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Good day, Sir. JARVIS at your service. How may I assist you with your interview preparation?";
    }
    
    if (lowerMessage.includes('help')) {
      return "Certainly, Sir. I can help you prepare answers, provide interview tips, or repeat questions. What would you like assistance with?";
    }
    
    if (lowerMessage.includes('repeat') || lowerMessage.includes('again')) {
      return "Of course, Sir. I shall repeat the current question for you.";
    }
    
    if (lowerMessage.includes('tip') || lowerMessage.includes('advice')) {
      return "My advice, Sir: Structure your answers clearly, provide specific examples, and demonstrate your thought process. Quality over quantity.";
    }
    
    if (lowerMessage.includes('ready')) {
      return "Excellent, Sir. I'm ready when you are. Please proceed with your answer at your convenience.";
    }
    
    if (lowerMessage.includes('nervous') || lowerMessage.includes('worried')) {
      return "Understandable, Sir. Take a deep breath. Remember, this is practice. Focus on demonstrating your knowledge and problem-solving approach.";
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're most welcome, Sir. I'm here to assist whenever needed.";
    }
    
    // Default response
    return "I understand, Sir. Could you please rephrase your question? I'm here to help with your interview preparation.";
  }

  clearConversation(sessionId) {
    this.conversationHistory.delete(sessionId);
  }

  async getQuickTip(category) {
    const tips = {
      technical: "Focus on explaining your thought process. Interviewers value how you approach problems, not just the final answer.",
      behavioral: "Use the STAR method: Situation, Task, Action, Result. Provide specific examples from your experience.",
      coding: "Think aloud while coding. Explain your approach, discuss trade-offs, and consider edge cases before writing code.",
      general: "Be concise but thorough. Listen carefully to questions, and don't hesitate to ask for clarification if needed."
    };
    
    return tips[category] || tips.general;
  }
}

module.exports = new JarvisService();