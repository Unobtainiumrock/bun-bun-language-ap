#!/usr/bin/env node
/**
 * Quick script to check if environment variables are properly configured
 * Run: node check-env.js
 */

import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

console.log('🔍 Environment Variable Check\n');
console.log('='.repeat(50));

// Check if .env file exists
if (!existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('   Create it with: touch .env');
  console.log('   Add: OPENAI_API_KEY=sk-your-key-here');
  process.exit(1);
}

console.log('✅ .env file exists');

// Read and parse .env file
try {
  const envContent = readFileSync(envPath, 'utf-8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  let hasOpenAIKey = false;
  let openAIKeyValue = '';

  for (const line of envLines) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();

    if (key.trim() === 'OPENAI_API_KEY') {
      hasOpenAIKey = true;
      openAIKeyValue = value;
      break;
    }
  }

  if (!hasOpenAIKey) {
    console.log('❌ OPENAI_API_KEY not found in .env file');
    console.log('   Add this line to .env:');
    console.log('   OPENAI_API_KEY=sk-your-actual-openai-api-key-here');
    process.exit(1);
  }

  console.log('✅ OPENAI_API_KEY found in .env');

  // Validate key format
  if (!openAIKeyValue.startsWith('sk-')) {
    console.log('⚠️  Warning: OPENAI_API_KEY should start with "sk-"');
    console.log('   Current value starts with:', openAIKeyValue.substring(0, 5) + '...');
  } else {
    console.log('✅ OPENAI_API_KEY format looks correct (starts with "sk-")');
  }

  if (openAIKeyValue.length < 20) {
    console.log('⚠️  Warning: OPENAI_API_KEY seems too short');
    console.log('   Length:', openAIKeyValue.length);
  } else {
    console.log('✅ OPENAI_API_KEY length looks reasonable');
  }

  // Check for common issues
  if (openAIKeyValue.includes('"') || openAIKeyValue.includes("'")) {
    console.log('⚠️  Warning: OPENAI_API_KEY contains quotes');
    console.log('   Remove quotes from the value in .env');
  }

  if (openAIKeyValue.includes(' ')) {
    console.log('⚠️  Warning: OPENAI_API_KEY contains spaces');
    console.log('   Remove spaces from the value');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Environment variables look good!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: npm run netlify:dev');
  console.log('   2. Visit: http://localhost:8888/practice');
  console.log('   3. Test the chat feature');

} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  process.exit(1);
}
