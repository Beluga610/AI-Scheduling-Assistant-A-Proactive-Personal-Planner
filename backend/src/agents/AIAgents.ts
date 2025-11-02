// 模拟 LLM agent：给定 taskId 或 task 内容，返回要写入日历的事件数组
export async function splitTaskUsingLLM(taskIdOrTask: string): Promise<Array<any>> {
  // TODO: 接入真实 LLM（OpenAI 等），现在返回模拟值以便联通调试
  // 如果传入 taskId，可以从 DB 拉取 task 内容（这里简化）
  return [
    {
      title: "Plan: 初步拆解",
      start: "2025-11-04T09:00:00+08:00",
      end: "2025-11-04T10:00:00+08:00",
      providerId: `sim-${taskIdOrTask}-1`
    },
    {
      title: "Do: 实施任务 A",
      start: "2025-11-05T14:00:00+08:00",
      end: "2025-11-05T15:30:00+08:00",
      providerId: `sim-${taskIdOrTask}-2`
    }
  ];
}
