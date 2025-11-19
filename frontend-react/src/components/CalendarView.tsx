// src/components/CalendarView.tsx
import React, { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US"; 

import { useMutation } from "@apollo/client";
import { CREATE_EVENT, UPDATE_EVENT, DELETE_EVENT, GET_ME_QUERY } from "../graphql/queries";
import { extractNameFromTitle, stringToColor, stringToDarkColor } from "../utils/colorUtils";
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

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales,
});

const parseDate = (input: any) => {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  if (typeof input === "string" && /^\d+$/.test(input)) {
    return new Date(Number(input));
  }
  return new Date(input);
};

export default function CalendarView({ events }: { events: CalendarEvent[] }) {
  const formattedEvents = useMemo(() => {
    return events.map(ev => ({
      ...ev,
      start: parseDate(ev.start),
      end: parseDate(ev.end),
    }));
  }, [events]);

  const [createEvent] = useMutation(CREATE_EVENT, {
    refetchQueries: [{ query: GET_ME_QUERY }],
  });
  const [updateEvent] = useMutation(UPDATE_EVENT, {
    refetchQueries: [{ query: GET_ME_QUERY }],
  });
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_ME_QUERY }],
  });

  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const eventStyleGetter = (event: CalendarEvent) => {
    const name = extractNameFromTitle(event.title);
    const backgroundColor = stringToColor(name);
    const borderColor = stringToDarkColor(name);

    return {
      style: {
        backgroundColor: backgroundColor,
        color: '#333', // 字体颜色，深灰比纯黑柔和
        borderLeft: `4px solid ${borderColor}`, // 左侧加粗边框，增强辨识度
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        borderRadius: '4px',
        opacity: 0.9,
        display: 'block',
        fontSize: '13px',
        fontWeight: '500'
      }
    };
  };

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
        selectable={true}

        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        step={60}
        timeslots={1}
        min={new Date(2025, 1, 1, 8, 0)}
        max={new Date(2025, 1, 1, 23, 59)}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
      />

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