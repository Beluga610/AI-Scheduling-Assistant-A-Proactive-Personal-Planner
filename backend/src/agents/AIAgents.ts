// src/agents/AIAgents.ts
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 确保环境变量被加载 (双重保险)
dotenv.config(); 

// 1. 获取 Key
const apiKey = process.env.DEEPSEEK_API_KEY;

// 🔍 调试日志：启动时检查 Key 是否存在
// (只会打印前几位，不会泄露完整 Key)
if (!apiKey) {
  console.error("❌ 严重错误: 未找到 DEEPSEEK_API_KEY！请检查 backend/.env 文件");
} else {
  console.log(`✅ DeepSeek API Key 已加载: ${apiKey.substring(0, 5)}...`);
}

// 2. 初始化客户端 (指定 DeepSeek BaseURL)
const client = new OpenAI({
  baseURL: 'https://api.deepseek.com', // 👈 关键！必须指向 DeepSeek
  apiKey: apiKey || 'sk-invalid-key',  // 如果没读到，给个假值防止报错崩溃，让后面 API 报 401
});

interface AgentResult {
  intent: 'chat' | 'create_event';
  replyMessage: string;
  eventData?: {
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
  };
}

export async function processUserMessage(prompt: string): Promise<AgentResult> {
  console.log("🤖 AI 收到指令:", prompt);
  const now = new Date();

  const systemPrompt = `
    你是一个智能日程助手。当前时间是: ${now.toISOString()} (周${now.getDay()})。
    请严格按照以下 JSON 格式返回结果（不要使用 markdown）：
    {
      "intent": "chat" | "create_event",
      "replyMessage": "回复内容",
      "eventData": {
        "title": "标题",
        "start": "ISO8601时间",
        "end": "ISO8601时间",
        "allDay": boolean
      }
    }
  `;

  try {
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: "deepseek-chat", // DeepSeek 的模型名
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Empty response");
    
    const result = JSON.parse(content);

    if (result.intent === 'create_event' && result.eventData) {
      return {
        intent: 'create_event',
        replyMessage: result.replyMessage,
        eventData: {
          title: result.eventData.title,
          start: new Date(result.eventData.start),
          end: new Date(result.eventData.end),
          allDay: result.eventData.allDay || false
        }
      };
    }

    return {
      intent: 'chat',
      replyMessage: result.replyMessage
    };

  } catch (error) {
    console.error("❌ LLM 调用失败:", error);
    return {
      intent: 'chat',
      replyMessage: "抱歉，我连接大脑时出错了，请检查后端日志。"
    };
  }
}

// 保留旧接口兼容
export async function splitTaskUsingLLM(task: string) { return []; }