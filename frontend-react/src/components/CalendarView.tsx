import React, { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import zhCN from "date-fns/locale/zh-CN";

import { useMutation } from "@apollo/client";
import { CREATE_EVENT, UPDATE_EVENT, DELETE_EVENT } from "../graphql/queries";
import { GET_ME_QUERY } from "../graphql/queries";

import AddEventModal from "./AddEventModal";
import EditEventModal from "./EditEventModal";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CalendarView.css";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

const locales = { "zh-CN": zhCN };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: zhCN }),
  getDay,
  locales,
});

export default function CalendarView({ events }) {
  const formattedEvents = useMemo(
    () =>
      events.map((ev) => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      })),
    [events]
  );

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

  // Modal states
  const [slotInfo, setSlotInfo] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

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
        max={new Date(2024, 1, 1, 22, 0)}
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
