import React, { useState } from "react";

export default function AddEventModal({ slotInfo, onCancel, onSave }) {
  const [title, setTitle] = useState("");

  const startISO = slotInfo.start.toISOString();
  const endISO = slotInfo.end.toISOString();

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>创建事件</h3>

        <label>标题：</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>开始时间：</label>
        <input type="text" value={startISO} disabled />

        <label>结束时间：</label>
        <input type="text" value={endISO} disabled />

        <div className="modal-btn-row">
          <button onClick={onCancel}>取消</button>
          <button onClick={() => onSave({ title, start: startISO, end: endISO })}>
            创建
          </button>
        </div>
      </div>
    </div>
  );
}
