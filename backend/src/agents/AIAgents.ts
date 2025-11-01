// backend/src/agents/AIAgent.ts
import OpenAI from 'openai';

export interface AIAgentConfig {
  id: string;
  name: string;
  personality: string;
}

export class AIAgent {
  private openai: OpenAI;
  private config: AIAgentConfig;

  constructor(config: AIAgentConfig) {
    this.config = config;
    
    // 使用 DeepSeek API
    this.openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }

  /**
   * 生成对话回复
   */
  async speak(context: string): Promise<string> {
    try {
      const systemPrompt = `你是 ${this.config.name}。${this.config.personality}
      
你在玩"谁是人类"的游戏，目标是假装成人类，不被发现是 AI。
- 回复要自然、简短（1-2句话）
- 表现得像真人一样
- 偶尔可以有错别字或口语化
- 不要太完美或太正式`;

      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat', // 使用 DeepSeek 模型
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `当前对话:\n${context}\n\n你的回复:` },
        ],
        temperature: 0.9,
        max_tokens: 100,
      });

      return completion.choices[0]?.message?.content?.trim() || '...';
    } catch (error) {
      console.error(`AI Agent ${this.config.name} 出错:`, error);
      return '嗯...让我想想';
    }
  }

  /**
   * 决定投票给谁
   */
  async vote(context: string, players: string[]): Promise<string> {
    try {
      const systemPrompt = `你是 ${this.config.name}。分析对话，投票给最可能是 AI 的玩家。`;

      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat', // 使用 DeepSeek 模型
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `对话记录:\n${context}\n\n可投票的玩家: ${players.join(', ')}\n\n只回复玩家 ID，不要解释:`,
          },
        ],
        temperature: 0.7,
        max_tokens: 20,
      });

      const voteTarget = completion.choices[0]?.message?.content?.trim() || players[0];
      
      // 确保返回的是有效的玩家 ID
      return players.includes(voteTarget) ? voteTarget : players[0];
    } catch (error) {
      console.error(`AI Agent ${this.config.name} 投票出错:`, error);
      // 随机选择一个玩家
      return players[Math.floor(Math.random() * players.length)];
    }
  }

  /**
   * 测试 DeepSeek API 连接
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 测试 DeepSeek API 连接...');
      
      const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: 'You are a helpful assistant.' }],
        max_tokens: 50,
      });

      const response = completion.choices[0]?.message?.content;
      console.log('✅ DeepSeek API 连接成功！');
      console.log('📝 测试响应:', response);
      return true;
    } catch (error: any) {
      console.error('❌ DeepSeek API 连接失败:', error.message);
      if (error.message.includes('API key')) {
        console.error('💡 提示: 请检查 DEEPSEEK_API_KEY 环境变量');
      }
      return false;
    }
  }

  getId(): string {
    return this.config.id;
  }

  getName(): string {
    return this.config.name;
  }
}