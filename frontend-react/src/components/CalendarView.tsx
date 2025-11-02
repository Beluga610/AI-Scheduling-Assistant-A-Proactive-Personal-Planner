import React from "react";
import { useQuery } from "@apollo/client";
import { GET_EVENTS, GET_TASKS } from "../graphql/queries";

export default function CalendarView(props) {
  const { data: eventsData, loading: eventsLoading } = useQuery(GET_EVENTS);
  const { data: tasksData, loading: tasksLoading } = useQuery(GET_TASKS);

  if (eventsLoading || tasksLoading) return <div>Loading...</div>;

  const events = eventsData?.events ?? [];
  const tasks = tasksData?.tasks ?? [];

  return (
    <div>
      <h4>Events</h4>
      {events.length === 0 ? <div>No events yet.</div> : (
        <ul>
          {events.map((e: any) => (
            <li key={e.id}>{e.title} — {new Date(e.start).toLocaleString()}</li>
          ))}
        </ul>
      )}

      <h4>Tasks</h4>
      {tasks.length === 0 ? <div>No tasks yet.</div> : (
        <ul>
          {tasks.map((t: any) => (
            <li key={t.id}>{t.title}</li>
          ))}
        </ul>
      )}
      <div style={{marginTop:12}}>
        <button onClick={() => { /* TODO: call splitTaskToEvents mutation for a selected task */ }}>
          Split a task into events (TODO)
        </button>
      </div>
    </div>
  );
}
