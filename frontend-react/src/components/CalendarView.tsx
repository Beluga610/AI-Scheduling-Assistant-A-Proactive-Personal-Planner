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
  contactName?: string;
  location?: string;
  vibe?: string;
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

const CustomEvent = ({ event }: { event: CalendarEvent }) => {
  return (
    <div style={{ lineHeight: '1.3', overflow: 'hidden' }}>
      <div style={{ fontWeight: 600, fontSize: '13px' }}>{event.title}</div>
      {event.location && (
        <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '2px' }}>
          📍 {event.location}
        </div>
      )}
      {event.vibe && (
        <div style={{ fontSize: '11px', marginTop: '1px', fontStyle: 'italic', opacity: 0.8 }}>
          ✨ {event.vibe}
        </div>
      )}
    </div>
  );
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
    const name = event.contactName ||extractNameFromTitle(event.title);
    const borderColor = stringToDarkColor(name);

    return {
      style: {
        backgroundColor: '#FFFFFF',
        color: '#333', 
        borderLeft: `6px solid ${borderColor}`, 
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        borderRadius: '4px',
        opacity: 0.9,
        display: 'block',
        fontSize: '13px',
        fontWeight: '500',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }
    };
  };

  const handleSelectSlot = (info: any) => {
    console.log("Blank calendar slot clicked:", info);
    setSlotInfo(info);
  };

  const handleSelectEvent = (event: any) => {
    console.log("Event selected:", event);
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
        components={{event: CustomEvent}}
      />

      {slotInfo && (
        <AddEventModal
          slotInfo={slotInfo}
          onCancel={() => setSlotInfo(null)}
          onSave={async ({ title, start, end }) => {
            try {
              await createEvent({ variables: { title, start, end } });
              setSlotInfo(null); 
            } catch (e) {
              console.error("Failed to create event:", e);
              alert("Failed to create event. Check console.");
            }
          }}
        />
      )}

      {selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onCancel={() => setSelectedEvent(null)}
          onSave={async ({ id, title, start, end, contactName, location, vibe }) => {
            await updateEvent({ 
              variables: { 
                id, 
                title, 
                start, 
                end,
                contactName,
                location,
                vibe
              } 
            });
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