// backend/src/agents/AIAgent.ts
import OpenAI from 'openai';

export interface AIAgentConfig {
  title: string;
  description: string;
  dueDate: string | null; // LLM 尝试提取的日期
}

export const splitTaskWithLLM = async (prompt: string): Promise<AIAgentConfig[]> => {
  console.log(`[AIAgents] 正在 (模拟) 调用 LLM 拆分: "${prompt}"`);
  // TODO: 在这里实现真实的 API 调用
  // 1. 构造发送给 LLM 的 prompt (例如，包含 JSON schema 指示)
  // 2. 使用 fetch 或 axios 发送请求
  // 3. 解析 LLM 返回的 JSON 字符串
  // 模拟 LLM API 的延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 模拟 LLM 返回的结构化数据
  const mockResponse: AIAgentConfig[] = [
    {
      title: "任务1: 资料调研",
      description: "收集关于 'XXX' 主题的背景资料和文献",
      dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(), // 模拟明天
    },
    {
      title: "任务2: 撰写初稿",
      description: "完成报告的第一版草稿",
      dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(), // 模拟3天后
    },
    {
      title: "任务3: 审阅和修改",
      description: "复查初稿，修改语法和内容错误",
      dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(), // 模拟4天后
    },
  ];

  console.log('[AIAgents] LLM (模拟) 拆分完成');
  return mockResponse;
};

/*    
    // 使用 DeepSeek API
    this.openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }
*/