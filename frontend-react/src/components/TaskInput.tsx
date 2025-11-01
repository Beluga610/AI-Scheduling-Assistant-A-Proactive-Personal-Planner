import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SPLIT_TASK_MUTATION, GET_ME_QUERY } from '../graphql/queries'; // 引入查询

/**
 * 核心：LLM 任务输入框
 */
export const TaskInput: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  
  // 1. 定义 Mutation
  const [splitTask, { loading, error }] = useMutation(SPLIT_TASK_MUTATION, {
    // 2. 成功后的回调：重新获取用户信息 (包含任务)
    refetchQueries: [
      { query: GET_ME_QUERY }
    ],
    onCompleted: (data) => {
      console.log('任务拆分成功:', data.splitTask);
      setPrompt(''); // 清空输入框
    },
    onError: (err) => {
      console.error('任务拆分失败:', err);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    console.log('TaskInput: 提交拆分请求', prompt);
    
    // 3. TODO: 真实实现 - 调用 Mutation
    splitTask({ variables: { prompt } });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 'none' }}>
      <h2>输入一个复杂任务</h2>
      <p>例如: "下周完成物理实验报告"</p>
      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入你的任务..."
          rows={3}
          disabled={loading}
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? '正在拆分...' : 'AI 智能拆分'}
      </button>
      {error && <p className="error-message">拆分失败: {error.message}</p>}
    </form>
  );
};
