import React from "react";
import Navbar from "../components/Navbar";
import TaskInput from "../components/TaskInput";
import CalendarView from "../components/CalendarView";
import { useQuery } from "@apollo/client";
import { PING } from "../graphql/queries";

export default function HomePage() {
  const { data, loading, error } = useQuery(PING);

  return (
    <div className="app">
      <div className="header">
        <h1>LLM → Calendar Demo</h1>
        <div>{loading ? "checking server..." : data?.ping}</div>
      </div>

      <Navbar />

      <div style={{display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12}}>
        <div>
          <div className="card">
            <h3>Create Task</h3>
            <TaskInput />
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Calendar</h3>
            <CalendarView />
          </div>
        </div>
      </div>
    </div>
  );
}
