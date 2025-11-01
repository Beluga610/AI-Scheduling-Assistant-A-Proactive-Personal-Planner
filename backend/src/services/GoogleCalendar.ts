/**
 * (可选) 封装与 Google Calendar API 的交互
 */

interface TaskData {
  title: string;
  description?: string;
  dueDate?: string;
}

interface GoogleEventData {
    googleEventId: string;
    title: string;
    start: string;
    end: string;
}

/**
 * (模拟) 创建一个 Google Calendar 事件
 * @param task 我们的内部任务对象
 */
export const createGoogleCalendarEvent = async (task: TaskData): Promise<GoogleEventData> => {
  console.log(`[GoogleCal] (模拟) 正在为任务 "${task.title}" 创建日历事件`);
  
  // TODO: 真实实现
  // 1. 获取用户的 OAuth 2.0 凭证 (Token)
  // 2. 使用 googleapis 库
  // 3. (const { google } = require('googleapis');)
  // 4. (const calendar = google.calendar({version: 'v3', auth: oauth2Client});)
  // 5. (await calendar.events.insert({ ... }));
  
  await new Promise(resolve => setTimeout(resolve, 300)); // 模拟 API 延迟
  
  const mockEventData = {
    googleEventId: `gcal_mock_${Date.now()}`,
    title: task.title,
    start: task.dueDate || new Date().toISOString(),
    end: task.dueDate || new Date().toISOString(),
  };

  console.log('[GoogleCal] (模拟) 事件创建成功');
  return mockEventData;
};
