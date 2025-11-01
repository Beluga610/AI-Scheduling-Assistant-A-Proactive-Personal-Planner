import React from 'react';

// 模拟的日历事件类型
interface MockEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

interface CalendarViewProps {
  events: MockEvent[];
}

/**
 * (模拟) 日历视图组件
 */
export const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {

  // TODO: 真实实现
  // 1. 集成一个日历库 (例如 'react-big-calendar', 'fullcalendar')
  // 2. 将传入的 events 格式化为日历库所需的格式
  // 3. 渲染日历

  return (
    <div style={{ padding: '1rem', backgroundColor: '#2f2f2f', borderRadius: '8px', marginTop: '1rem' }}>
      <h3>日历视图 (模拟)</h3>
      {events.length === 0 ? (
        <p>暂无日历事件</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {events.map(event => (
            <li key={event.id} style={{ marginBottom: '0.5rem', background: '#3f3f3f', padding: '0.5rem' }}>
              <strong>{event.title}</strong>
              <br />
              <small>
                {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleString()}
              </small>
            </li>
          ))}
        </ul>
      )}
      {/* TODO: 在这里放置真实的日历组件 */}
    </div>
  );
};
