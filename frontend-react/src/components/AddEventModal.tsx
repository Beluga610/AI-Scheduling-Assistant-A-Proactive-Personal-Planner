import React, { useState } from "react";


function convertUTCToLocalInputString(dateStr: string | Date): string {
    const date = new Date(dateStr);

    const pad = (num: number)=> num.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // 0-11
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    // Returns "YYYY-MM-DDTHH:MM" format for the input
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


export default function AddEventModal({ slotInfo, onCancel, onSave }) {
    const [title, setTitle] = useState("");

    
    const [startLocal, setStartLocal] = useState(
        convertUTCToLocalInputString(slotInfo.start)
    );
    const [endLocal, setEndLocal] = useState(
        convertUTCToLocalInputString(slotInfo.end)
    );

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h3>创建事件</h3>

                <label>标题：</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} />

                <label>开始时间：</label>              
                <input
                    type="datetime-local"
                    value={startLocal}
                    onChange={(e) => setStartLocal(e.target.value)}
                />

                <label>结束时间：</label>
                <input
                    type="datetime-local"
                    value={endLocal}
                    onChange={(e) => setEndLocal(e.target.value)}
                />

                <div className="modal-btn-row">
                    <button onClick={onCancel}>取消</button>
                    <button
                        onClick={() =>
                            onSave({
                                title,
                                start: new Date(startLocal).toISOString(),
                                end: new Date(endLocal).toISOString(),     // Convert back to ISO on save
                            })
                        }
                    >
                        创建
                    </button>
                </div>
            </div>
        </div>
    );
}