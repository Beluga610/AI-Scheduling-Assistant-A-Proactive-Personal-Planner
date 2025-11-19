import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_PREFERENCES, GET_ME_QUERY } from "../graphql/queries";

interface Props {
    initialPreferences: string[];
}

export default function PreferencePanel({ initialPreferences }: Props) {
    const [newRule, setNewRule] = useState("");
    const [updatePrefs, { loading }] = useMutation(UPDATE_PREFERENCES, {
        refetchQueries: [{ query: GET_ME_QUERY }],
        awaitRefetchQueries: true, 
        onError: (err) => alert("Failed to save rule: " + err.message)
    });

    const rules = initialPreferences || [];
    const handleAdd = async () => {
        if (!newRule.trim()) return;

        const updatedRules = [...rules, newRule];

        try {
            await updatePrefs({ variables: { preferences: updatedRules } });
            setNewRule(""); 
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (index: number) => {
        const updatedRules = rules.filter((_, i) => i !== index);
        try {
            await updatePrefs({ variables: { preferences: updatedRules } });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="sidebar-section">
            <div className="sidebar-section-title">MY PREFERENCES</div>

            <div className="sidebar-contact-list" style={{ marginBottom: '10px' }}>
                {rules.length === 0 && (
                    <p style={{ color: '#999', fontSize: '12px', fontStyle: 'italic', margin: '5px 0' }}>
                        No rules set. E.g., "No meetings on Friday evenings".
                    </p>
                )}

                {rules.map((rule, index) => (
                    <div key={index} className="contact-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #eee' }}>
                        <span style={{ fontSize: '13px', color: '#444', wordBreak: 'break-word', paddingRight: '5px' }}>
                            {rule}
                        </span>
                        <button
                            onClick={() => handleDelete(index)}
                            disabled={loading}
                            style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '14px', padding: '0 5px' }}
                            title="Remove rule"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '5px' }}>
                <input
                    className="sidebar-input"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Add a rule..."
                    disabled={loading}
                    style={{ minHeight: '32px', padding: '4px 8px', flex: 1 }}
                />
                <button
                    onClick={handleAdd}
                    disabled={loading}
                    style={{
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? "..." : "+"}
                </button>
            </div>
        </div>
    );
}