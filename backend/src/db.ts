import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('错误: MONGODB_URI 未在 .env 文件中定义');
    process.exit(1);
  }

  try {
    // TODO: 实现完整的 Mongoose 连接逻辑
    // await mongoose.connect(mongoUri);
    
    // 模拟连接成功
    await new Promise(resolve => setTimeout(resolve, 100)); // 模拟异步
    console.log('MongoDB (模拟) 连接成功');

  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};