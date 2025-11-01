// backend/test-deepseek.ts
// 独立测试 DeepSeek API 的脚本

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载根目录的 .env 文件
const rootEnvPath = join(__dirname, '..', '.env');
dotenv.config({ path: rootEnvPath });

// 也尝试加载当前目录的 .env
dotenv.config();

async function testDeepSeek() {
  console.log('🚀 开始测试 DeepSeek API...\n');

  // 检查 API Key
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ 错误: 找不到 DEEPSEEK_API_KEY 环境变量');
    console.log('💡 请在 .env 文件中设置 DEEPSEEK_API_KEY');
    process.exit(1);
  }

  console.log('✅ 找到 API Key:', process.env.DEEPSEEK_API_KEY.substring(0, 10) + '...');

  try {
    // 创建 OpenAI 客户端（指向 DeepSeek）
    const openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });

    console.log('🔗 连接到: https://api.deepseek.com');
    console.log('📡 发送测试请求...\n');

    // 测试 1: 简单对话
    console.log('测试 1: 简单对话');
    console.log('-'.repeat(50));
    const completion1 = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个友好的助手' },
        { role: 'user', content: '你好！请用一句话介绍你自己。' },
      ],
      max_tokens: 100,
    });

    console.log('AI 回复:', completion1.choices[0].message.content);
    console.log('✅ 测试 1 通过\n');

    // 测试 2: 角色扮演（游戏场景）
    console.log('测试 2: 游戏角色扮演');
    console.log('-'.repeat(50));
    const completion2 = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是 Alex，一个逻辑思维很强的人。你在玩"谁是人类"游戏，要假装是真人。回复简短自然。',
        },
        { role: 'user', content: '大家好！有人怀疑我是 AI，我要怎么证明自己？' },
      ],
      temperature: 0.9,
      max_tokens: 50,
    });

    console.log('Alex 回复:', completion2.choices[0].message.content);
    console.log('✅ 测试 2 通过\n');

    // 测试 3: 多轮对话
    console.log('测试 3: 多轮对话');
    console.log('-'.repeat(50));
    const completion3 = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个参与社交游戏的玩家' },
        { role: 'user', content: '玩家A: 大家好，我是真人！' },
        { role: 'assistant', content: '玩家B: 我也是真人，你好！' },
        { role: 'user', content: '玩家A: 你觉得谁可能是 AI？' },
      ],
      temperature: 0.8,
      max_tokens: 50,
    });

    console.log('玩家B 回复:', completion3.choices[0].message.content);
    console.log('✅ 测试 3 通过\n');

    // 显示统计信息
    console.log('📊 统计信息');
    console.log('-'.repeat(50));
    console.log('模型:', 'deepseek-chat');
    console.log('总请求数:', 3);
    console.log('Token 使用:');
    console.log('  - 测试 1:', completion1.usage?.total_tokens || 'N/A');
    console.log('  - 测试 2:', completion2.usage?.total_tokens || 'N/A');
    console.log('  - 测试 3:', completion3.usage?.total_tokens || 'N/A');

    console.log('\n🎉 所有测试通过！DeepSeek API 工作正常！');
    console.log('💡 你现在可以启动服务器: npm run dev\n');
  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    
    if (error.message.includes('401')) {
      console.error('💡 提示: API Key 无效，请检查 DEEPSEEK_API_KEY');
    } else if (error.message.includes('timeout')) {
      console.error('💡 提示: 连接超时，请检查网络');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 提示: 无法连接到 DeepSeek 服务器');
    }
    
    console.error('\n完整错误信息:');
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
testDeepSeek();