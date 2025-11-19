// src/components/CalendarView.tsx
import React, { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US"; // 确保是英文

import { useMutation } from "@apollo/client";
import { CREATE_EVENT, UPDATE_EVENT, DELETE_EVENT, GET_ME_QUERY } from "../graphql/queries";

import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CalendarView.css";

// ... (interfaces 和 locales 设置保持不变) ...
interface CalendarEvent {
  id: string;
  title: string;
  start: string | number | Date;
  end: string | number | Date;
  allDay?: boolean;
}

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales,
});

// 日期解析辅助函数
const parseDate = (input: any) => {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  if (typeof input === "string" && /^\d+$/.test(input)) {
    return new Date(Number(input));
  }
  return new Date(input);
};

export default function CalendarView({ events }: { events: CalendarEvent[] }) {
  // 1. 格式化事件数据
  const formattedEvents = useMemo(() => {
    return events.map(ev => ({
      ...ev,
      start: parseDate(ev.start),
      end: parseDate(ev.end),
    }));
  }, [events]);

  // 2. CRUD Mutations
  const [createEvent] = useMutation(CREATE_EVENT, {
    refetchQueries: [{ query: GET_ME_QUERY }],
  });
  const [updateEvent] = useMutation(UPDATE_EVENT, {
    refetchQueries: [{ query: GET_ME_QUERY }],
  });
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_ME_QUERY }],
  });

  // 3. 弹窗状态
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // 调试日志：看点击是否有反应
  const handleSelectSlot = (info: any) => {
    console.log("日历空白处被点击了:", info);
    setSlotInfo(info);
  };

  const handleSelectEvent = (event: any) => {
    console.log("事件被点击了:", event);
    setSelectedEvent(event);
  };

  return (
    <div className="calendar-wrapper">
      <Calendar
        localizer={localizer}
        events={formattedEvents}
        
        // ✅ 关键属性：确保 selectable 为 true
        selectable={true}
        
        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        step={60}
        timeslots={1}
        min={new Date(2024, 1, 1, 8, 0)}
        max={new Date(2024, 1, 1, 23, 59)}
        
        // ✅ 绑定事件处理函数
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
      />

      {/* ADD EVENT MODAL - 确保 slotInfo 存在时渲染 */}
      {slotInfo && (
        <AddEventModal
          slotInfo={slotInfo}
          onCancel={() => setSlotInfo(null)}
          onSave={async ({ title, start, end }) => {
            try {
              await createEvent({ variables: { title, start, end } });
              setSlotInfo(null); // 成功后关闭
            } catch (e) {
              console.error("创建失败:", e);
              alert("Failed to create event. Check console.");
            }
          }}
        />
      )}

      {/* EDIT EVENT MODAL */}
      {selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onCancel={() => setSelectedEvent(null)}
          onSave={async ({ id, title, start, end }) => {
            await updateEvent({ variables: { id, title, start, end } });
            setSelectedEvent(null);
          }}
          onDelete={async (id) => {
            if (confirm("Are you sure you want to delete this event?")) {
              await deleteEvent({ variables: { id } });
              setSelectedEvent(null);
            }
          }}
        />
      )}
    </div>
  );
}