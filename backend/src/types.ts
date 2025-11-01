// (新增) 用于存放共享的 TypeScript 类型
// 这个文件在 index.ts 中被扩展了 (使用 module augmentation)

/**
 * GraphQL 解析器的上下文 (Context) 类型
 * 在 index.ts 中被定义
 */
export interface Context {
  // user: ...
}

/**
 * JWT 解码后的载荷
 * 在 index.ts 中被定义
 */
export interface DecodedToken {
  // userId: ...
}
