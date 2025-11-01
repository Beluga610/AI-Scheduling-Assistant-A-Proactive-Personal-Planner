import mongoose, { Schema, Document } from 'mongoose';

// TODO: 定义 Mongoose User Schema
// (注意: Mongoose schema 不必与 GraphQL schema 完全一致, 
//  例如 password 字段只存在于 Mongoose)

export interface IUser extends Document {
  email: string;
  passwordHash: string; // 在数据库中存储哈希
  name?: string;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  // ... 其他字段
}, { timestamps: true });

// TODO: 实际应用中取消注释
// export const User = mongoose.model<IUser>('User', UserSchema);

// 调试用的模拟导出
export const User = {
  // 模拟 Mongoose 模型方法
  findById: (id: string) => ({
    exec: () => Promise.resolve({ id, email: 'mock@user.com', name: 'Mock User' })
  }),
  findOne: (query: any) => ({
    exec: () => Promise.resolve({ id: 'mock-user-id', email: query.email, name: 'Mock User', passwordHash: 'mockHash' })
  }),
  // 模拟 'new User()' 和 'save()'
  create: (data: any) => Promise.resolve({ ...data, id: 'new-mock-id' })
};
