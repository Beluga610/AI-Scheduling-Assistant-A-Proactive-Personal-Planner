// Standalone script to test LLM logic independently from the server.
// Usage: ts-node src/scripts/test-deepseek.ts

import { splitTaskWithLLM } from '../agents/AIAgents';

async function testLLM() {
  console.log('--- Starting LLM Logic Test ---');
  
  const prompt = "I need to complete a market research report on 'AI in Healthcare' within a week";
  
  try {
    // Note: Ensure splitTaskWithLLM is exported in AIAgents.ts if you want to test it
    // const tasks = await splitTaskWithLLM(prompt);
    
    console.log('\nTest Prompt:', prompt);
    // console.log('\nLLM Response (Mock):');
    // console.log(JSON.stringify(tasks, null, 2));
    
  } catch (error) {
    console.error('LLM Test Failed:', error);
  }
  
  console.log('\n--- LLM Test Finished ---');
}

if (require.main === module) {
  testLLM().catch(console.error);
}