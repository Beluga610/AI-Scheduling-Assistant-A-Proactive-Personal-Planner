// CalendarView.tsx
import React, { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import zhCN from "date-fns/locale/zh-CN";

import { useMutation } from "@apollo/client";
import { CREATE_EVENT, UPDATE_EVENT, DELETE_EVENT, GET_ME_QUERY } from "../graphql/queries";

import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CalendarView.css";


interface CalendarEvent {
  id: string;
  title: string;
  start: string | number | Date;
  end: string | number | Date;
  allDay?: boolean;
}

const locales = { "zh-CN": zhCN };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: zhCN }),
  getDay,
  locales,
});

/** 关键：兼容 ISO 字符串 & 时间戳字符串 */
const parseDate = (input: any) => {
  if (!input) return new Date();

  // 已经是 Date
  if (input instanceof Date) return input;

  // 数字字符串
  if (typeof input === "string" && /^\d+$/.test(input)) {
    return new Date(Number(input));
  }

  // 普通 ISO 字符串
  return new Date(input);
};

export default function CalendarView({ events }: { events: CalendarEvent[] }) {
  /** 关键：这里修复了传入的事件格式 */
  const formattedEvents = useMemo(() => {
    return events.map(ev => ({
      ...ev,
      start: parseDate(ev.start),
      end: parseDate(ev.end),
    }));
  }, [events]);


  // CRUD Mutations
  const [createEvent] = useMutation(CREATE_EVENT, {
    refetchQueries: [{ query: GET_ME_QUERY }],
  });

  const [updateEvent] = useMutation(UPDATE_EVENT, {
    refetchQueries: [{ query: GET_ME_QUERY }],
  });

  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_ME_QUERY }],
  });


  // Modal state
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  return (
    <div className="calendar-wrapper">
      <Calendar
        localizer={localizer}
        events={formattedEvents}
        selectable={true}
        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        step={60}
        timeslots={1}
        min={new Date(2024, 1, 1, 9, 0)}
        max={new Date(2024, 1, 1, 23, 59)}
        onSelectSlot={(info) => setSlotInfo(info)}
        onSelectEvent={(event) => setSelectedEvent(event)}
      />

      {/* ADD EVENT MODAL */}
      {slotInfo && (
        <AddEventModal
          slotInfo={slotInfo}
          onCancel={() => setSlotInfo(null)}
          onSave={async ({ title, start, end }) => {
            await createEvent({ variables: { title, start, end } });
            setSlotInfo(null);
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
            await deleteEvent({ variables: { id } });
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
