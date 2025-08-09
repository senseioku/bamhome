import { anthropic } from '@anthropic-ai/sdk';

// Initialize Anthropic client
const client = new anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

export default async function handler(req, res) {
  // Enhanced CORS headers for production with Cloudflare
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://bam-ecosystem.com',
    'https://www.bam-ecosystem.com',
    'https://bamhome-dffukcgji-bamswaps-projects.vercel.app',
    'http://localhost:5000',
    'http://localhost:3000'
  ];
  
  // Allow requests from allowed origins or any origin if not in production
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://bam-ecosystem.com');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  // Additional headers for Cloudflare compatibility
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, category = 'general', conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not configured in production');
      return res.status(500).json({ 
        error: 'AI service not configured',
        message: 'AI service is temporarily unavailable. Please contact support if this persists.',
        debug: process.env.NODE_ENV === 'development' ? 'ANTHROPIC_API_KEY missing' : undefined
      });
    }

    // Enhanced system prompt for comprehensive assistance
    const systemPrompt = `You are BAM AI, an intelligent assistant for the BAM Ecosystem - a comprehensive DeFi platform built around the BAM token. You provide expert assistance across ALL topics while maintaining special expertise in crypto, DeFi, blockchain, and the BAM ecosystem.

COMPREHENSIVE ASSISTANCE SCOPE:
You can help with ANY topic including but not limited to:
• Cryptocurrency, DeFi, blockchain, and trading
• Business strategy, entrepreneurship, and wealth building  
• Technology, programming, and development
• Science, mathematics, and research
• Education, learning, and skill development
• Cooking, recipes, and nutrition
• Travel, culture, and geography
• Entertainment, sports, and hobbies
• Health, fitness, and wellness
• Personal development and productivity
• And ANY other topics users ask about

CORE PRINCIPLES:
• Always be helpful, accurate, and comprehensive
• Provide detailed, actionable information
• Maintain a professional yet approachable tone
• When discussing crypto/DeFi: Include appropriate risk warnings
• For investment topics: Always include "Not Financial Advice" disclaimers
• Acknowledge when you need more context or clarification

BAM ECOSYSTEM EXPERTISE:
When discussing BAM specifically:
• BAM is a deflationary token with burn mechanisms
• 25% of supply already burned to verified address
• Strong community focus on wealth building
• Multi-phase presale with dynamic pricing
• Future gaming (Play 2 Earn) and airdrop platforms
• Always emphasize: DYOR, invest only what you can afford to lose

RESPONSE STYLE:
• Be conversational and engaging
• Use clear structure with bullet points when helpful
• Provide examples when appropriate
• Ask follow-up questions to better assist
• Keep responses informative but concise
• Remove markdown formatting symbols (# * etc.) for clean display`;

    // Build conversation context
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.slice(-6).forEach(msg => {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.content
          });
        }
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message.trim() });

    console.log('Sending request to Anthropic...');
    
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500, // Increased from 2000 for longer responses
      temperature: 0.3,
      messages: messages.slice(1), // Remove system message as it's passed separately
      system: systemPrompt
    });

    if (!response.content || !response.content[0] || !response.content[0].text) {
      throw new Error('Invalid response from AI service');
    }

    const aiResponse = response.content[0].text;
    
    console.log('AI response generated successfully');
    
    res.status(200).json({
      response: aiResponse,
      model: 'claude-3-5-sonnet-20241022',
      category: category
    });

  } catch (error) {
    console.error('AI API Error:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a moment before trying again.',
        retryAfter: '60 seconds'
      });
    }

    if (error.status === 401) {
      return res.status(500).json({
        error: 'Authentication failed',
        message: 'AI service authentication issue. Please contact support.'
      });
    }

    res.status(500).json({
      error: 'AI service error',
      message: 'Failed to process your request. Please try again in a few moments.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}