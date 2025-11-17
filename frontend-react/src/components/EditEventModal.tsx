import React, { useState } from "react";


function convertUTCToLocalInputString(dateStr: string | Date): string {
    
    if (!dateStr) return "";
    const date = new Date(dateStr);

    const pad = (num: number) => num.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // 0-11
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

   
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


export default function EditEventModal({ event, onCancel, onSave, onDelete }) {
    const [title, setTitle] = useState(event.title);

    
    const [start, setStart] = useState(
        convertUTCToLocalInputString(event.start) 
    );
    const [end, setEnd] = useState(
        convertUTCToLocalInputString(event.end)   
    );

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h3>编辑事件</h3>

                <label>标题：</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />

                <label>开始时间：</label>
               
                <input
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                />

                <label>结束时间：</label>
                
                <input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                />

                <div className="modal-btn-row">
                    <button onClick={() => onDelete(event.id)}>删除</button>
                    <button onClick={onCancel}>取消</button>
                    <button
                        onClick={() =>
                           
                            onSave({
                                id: event.id,
                                title,
                                start: new Date(start).toISOString(),
                                end: new Date(end).toISOString(),
                            })
                        }
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}