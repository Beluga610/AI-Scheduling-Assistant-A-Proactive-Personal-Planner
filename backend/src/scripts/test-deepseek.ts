// 这是一个用于在后端独立测试 LLM 逻辑的脚本
// 如何运行: ts-node src/scripts/test-deepseek.ts

import { splitTaskWithLLM } from '../agents/AIAgents';

async function testLLM() {
  console.log('--- 开始 LLM 拆分测试 ---');
  
  const prompt = "我需要在一周内完成关于 '人工智能在医疗领域应用' 的市场调研报告";
  
  try {
    const tasks = await splitTaskWithLLM(prompt);
    
    console.log('\n测试提示:', prompt);
    console.log('\nLLM (模拟) 拆分结果:');
    console.log(JSON.stringify(tasks, null, 2));
    
  } catch (error) {
    console.error('LLM 测试失败:', error);
  }
  
  console.log('\n--- LLM 拆分测试结束 ---');
}

// 如果直接运行此文件
if (require.main === module) {
  testLLM().catch(console.error);
}
