import React, { useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";

interface EditEventModalProps {
  event: { 
    id: string; 
    title: string; 
    start: Date; 
    end: Date;
    contactName?: string;
    location?: string;
    vibe?: string;
  };
  onCancel: () => void;
  onSave: (data: { 
      id: string; 
      title: string; 
      start: string; 
      end: string;
      contactName: string;
      location: string;
      vibe: string;
    }) => void;
  onDelete: (id: string) => void;
}

export default function EditEventModal({ event, onCancel, onSave, onDelete }: EditEventModalProps) {
  const [title, setTitle] = useState(event.title);
  const [contactName, setContactName] = useState(event.contactName || "");
  const [location, setLocation] = useState(event.location || "");
  const [vibe, setVibe] = useState(event.vibe || "");
  const [start, setStart] = useState(format(new Date(event.start), "yyyy-MM-dd'T'HH:mm"));
  const [end, setEnd] = useState(format(new Date(event.end), "yyyy-MM-dd'T'HH:mm"));

  const handleSave = () => {
    if (!title.trim()) return;
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) {
      alert("End time must be later than start time.");
      return;
    }
    onSave({
      id: event.id,
      title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      contactName,
      location,
      vibe
    });
  };


return createPortal(
    <div className="modal-backdrop">
      <div className="modal" style={{ width: '400px' }}>
        <h3 className="modal-title">Edit Event</h3>
        <div className="modal-field">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <div className="modal-field" style={{ flex: 1 }}>
            <label>With Who?</label>
            <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Jack"
            />
            </div>
            <div className="modal-field" style={{ flex: 1 }}>
            <label>Vibe</label>
            <input
                type="text"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="e.g. Dinner"
            />
            </div>
        </div>
        <div className="modal-field">
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add a location..."
          />
        </div>
        <div className="modal-field">
          <label>Start Time</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label>End Time</label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <div className="modal-btn-row">
          <button 
            className="modal-btn secondary" 
            onClick={() => onDelete(event.id)}
            style={{ color: "#ff4f7a", background: "#fff", border: "1px solid #ff4f7a" }}
          >
            Delete
          </button>
          
          <div style={{ flex: 1 }}></div> 

          <button className="modal-btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-btn primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}