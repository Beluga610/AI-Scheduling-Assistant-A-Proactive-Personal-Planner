import React, { useState } from "react";

export default function EditEventModal({ event, onCancel, onSave, onDelete }) {
  const [title, setTitle] = useState(event.title);
  const [start, setStart] = useState(event.start.toISOString());
  const [end, setEnd] = useState(event.end.toISOString());

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>编辑事件</h3>

        <label>标题：</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>开始时间：</label>
        <input value={start} onChange={(e) => setStart(e.target.value)} />

        <label>结束时间：</label>
        <input value={end} onChange={(e) => setEnd(e.target.value)} />

        <div className="modal-btn-row">
          <button onClick={() => onDelete(event.id)}>删除</button>
          <button onClick={onCancel}>取消</button>
          <button onClick={() => onSave({ id: event.id, title, start, end })}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
