import React, { useState } from "react";
import { createPortal } from "react-dom"; 
import { format } from "date-fns";

interface AddEventModalProps {
  slotInfo: { start: Date; end: Date };
  onCancel: () => void;
  onSave: (data: { title: string; start: string; end: string }) => void;
}

export default function AddEventModal({ slotInfo, onCancel, onSave }: AddEventModalProps) {
  const [title, setTitle] = useState("");

  // 初始化时间
  const [start, setStart] = useState(format(slotInfo.start, "yyyy-MM-dd'T'HH:mm"));
  const [end, setEnd] = useState(format(slotInfo.end, "yyyy-MM-dd'T'HH:mm"));

  const handleSave = () => {
    if (!title.trim()) return;
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
      alert("End time must be later than start time.");
      return;
    }
    onSave({
      title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });
  };


  return createPortal(
    <div className="modal-backdrop">
      <div className="modal">
        <h3 className="modal-title">Create New Event</h3>

        <div className="modal-field">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Dinner with Jack"
            autoFocus
          />
        </div>

        <div className="modal-field">
          <label>Start Time</label>
          <input
            type="datetime-local"
            lang="en-US" 
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>End Time</label>
          <input
            type="datetime-local"
            lang="en-US"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>

        <div className="modal-btn-row">
          <button className="modal-btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="modal-btn primary"
            onClick={handleSave}
            disabled={!title.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}