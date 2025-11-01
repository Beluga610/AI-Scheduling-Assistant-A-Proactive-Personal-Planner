import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

/**
 * (模拟) 哈希密码
 */
export const hashPassword = async (password: string): Promise<string> => {
  // TODO: 真实实现
  // const salt = await bcrypt.genSalt(10);
  // return bcrypt.hash(password, salt);
  console.log('[Auth] (模拟) 哈希密码');
  return `hashed_${password}`;
};

/**
 * (模拟) 比较密码
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  // TODO: 真实实现
  // return bcrypt.compare(password, hash);
  console.log('[Auth] (模拟) 比较密码');
  return `hashed_${password}` === hash || password === '123456'; // 允许 '123456' 调试
};

/**
 * (模拟) 创建 JWT
 */
export const createJWT = (userId: string): string => {
  // TODO: 真实实现
  console.log('[Auth] (模拟) 创建 JWT for', userId);
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' });
};

/**
 * (模拟) 验证 JWT
 */
export const verifyJWT = (token: string): string | jwt.JwtPayload => {
  // TODO: 真实实现
  try {
    console.log('[Auth] (模拟) 验证 JWT');
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.warn('[Auth] JWT 验证失败', (error as Error).message);
    return '';
  }
};
