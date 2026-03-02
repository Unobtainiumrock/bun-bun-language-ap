import OpenAI from 'openai';
import { buildSystemPrompt, getPersona } from './personas.js';

// Initialize OpenAI client with timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20000, // 20 second timeout for API calls
});

function parseCorrections(text) {
  console.log('🔍 RAW AI RESPONSE TEXT:');
  console.log('='.repeat(80));
  console.log(text);
  console.log('='.repeat(80));
  
  const corrections = [];
  
  // Split the text into sections by numbered corrections
  const correctionSections = text.split(/(?=\d+\.\s*MISTAKE_TYPE:)/);
  
  console.log(`🔍 Found ${correctionSections.length} potential correction sections`);
  
  for (let i = 1; i < correctionSections.length; i++) { // Skip first section (intro text)
    const section = correctionSections[i];
    console.log(`📝 Processing section ${i}:`, section.substring(0, 100) + '...');
    
    try {
      // Extract the main components using individual regex patterns
      const mistakeTypeMatch = section.match(/MISTAKE_TYPE:\s*(\w+)/);
      const subcategoryMatch = section.match(/SUBCATEGORY:\s*(\w+)/);
      const severityMatch = section.match(/SEVERITY:\s*(\w+)/);
      const userInputMatch = section.match(/USER_INPUT:\s*"([^"]*)"/);
      const correctionMatch = section.match(/CORRECTION:\s*"([^"]*)"/);
      const explanationMatch = section.match(/EXPLANATION:\s*([^\n]*)/);
      const grammarRuleMatch = section.match(/GRAMMAR_RULE:\s*([^\n]*)/);
      
      // Extract examples
      const examplesSection = section.match(/EXAMPLES:([\s\S]*?)(?=\n\n|$)/);
      let examples = [];
      if (examplesSection) {
        examples = examplesSection[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.startsWith('- '))
          .map(line => line.replace(/^-\s*"?/, '').replace(/"?$/, ''));
      }
      
      if (mistakeTypeMatch && subcategoryMatch && severityMatch && userInputMatch && correctionMatch) {
        corrections.push({
          mistakeType: mistakeTypeMatch[1],
          subcategory: subcategoryMatch[1],
          severity: severityMatch[1],
          userInput: userInputMatch[1],
          correction: correctionMatch[1],
          explanation: explanationMatch ? explanationMatch[1].trim() : '',
          grammarRule: grammarRuleMatch ? grammarRuleMatch[1].trim() : '',
          examples
        });
        console.log(`✅ Successfully parsed correction ${i}`);
      } else {
        console.log(`❌ Failed to parse correction ${i} - missing required fields`);
      }
    } catch (error) {
      console.log(`❌ Error parsing section ${i}:`, error);
    }
  }
  
  console.log(`🔍 Total corrections parsed: ${corrections.length}`);
  console.log('📊 Final corrections array:', corrections);

  return corrections;
}

export async function handler(event) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const { message, conversationHistory = [], personaKey = 'frenchTutor', context = {} } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'OpenAI API key not configured',
          mode: 'configuration_error'
        }),
      };
    }

    // Get persona and build system prompt
    const persona = getPersona(personaKey);
    const systemPrompt = buildSystemPrompt(personaKey, context);

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      // Add conversation history
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      // Add current user message
      {
        role: 'user',
        content: message
      }
    ];

    console.log('🤖 Sending to OpenAI with system prompt:');
    console.log(systemPrompt.substring(0, 200) + '...');

    // Call OpenAI API with faster model and reduced tokens
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Faster and cheaper model
      messages: messages,
      max_tokens: 500, // Reduced for faster response
      temperature: 0.8,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    console.log('✅ Raw OpenAI response received');
    
    // Parse corrections from the response
    const corrections = parseCorrections(aiResponse);
    console.log('📋 Final parsed corrections count:', corrections.length);
    
    // Extract the conversation part (remove the corrections section)
    const conversation = aiResponse.split('\n\n').filter(part => 
      !part.includes('MISTAKE_TYPE:') && 
      !part.includes('USER_INPUT:') && 
      !part.includes('CORRECTION:')
    ).join('\n\n').trim();

    console.log('💬 Extracted conversation:', conversation.substring(0, 100) + '...');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        conversation,
        corrections,
        mode: 'live',
        persona: {
          name: persona.name,
          age: persona.age,
          location: persona.location
        }
      })
    };

  } catch (error) {
    console.error('Chat function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        mode: 'error'
      })
    };
  }
} 