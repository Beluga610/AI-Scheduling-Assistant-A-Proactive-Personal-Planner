import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_ME_QUERY } from "../graphql/queries";
import Navbar from "../components/Navbar";
import CalendarView from "../components/CalendarView";
import AssistantPanel from "../components/AssistantPanel";
// 👇 Corrected Import Path (Singular 'PreferencePanel')
import PreferencePanel from "../components/PreferencePanel";
import { format } from "date-fns";

// --- Interfaces ---
interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
}

interface MeData {
    id: string;
    name: string;
    email: string;
    preferences: string[]; // Ensure this exists in your GraphQL query
    tasks: any[];
    calendarEvents: CalendarEvent[];
}

interface MeQueryResult {
    me: MeData;
}

// --- Helper ---
const extractNameFromTitle = (title: string): string => {
    const match = title.match(/with\s+([A-Z][a-zA-Z]*)/i);
    return match ? match[1] : "Others";
};

/**
 * Sidebar Component
 */
const Sidebar: React.FC<{ events: CalendarEvent[], preferences: string[] }> = ({ events, preferences }) => {
    const [weeklyGoal, setWeeklyGoal] = useState("Spend more time with friends this week. ✨");
    const [expandedContacts, setExpandedContacts] = useState<Record<string, boolean>>({});

    const toggleContact = (name: string) => {
        setExpandedContacts(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const contactsMap = useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {};
        events.forEach(evt => {
            const contactName = extractNameFromTitle(evt.title);
            const normalizedName = contactName.charAt(0).toUpperCase() + contactName.slice(1);
            if (!map[normalizedName]) map[normalizedName] = [];
            map[normalizedName].push(evt);
        });
        return map;
    }, [events]);

    const contactNames = Object.keys(contactsMap).sort();

    return (
        <div className="sidebar">
            {/* --- 1. PREFERENCES PANEL --- */}
            <PreferencePanel initialPreferences={preferences} />

            {/* --- 2. WEEKLY GOAL --- */}
            <div className="sidebar-section">
                <div className="sidebar-section-title">WEEKLY GOAL</div>
                <textarea
                    className="sidebar-input"
                    rows={3}
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(e.target.value)}
                    placeholder="Enter your goal for this week..."
                />
            </div>

            {/* --- 3. CONTACTS --- */}
            <div className="sidebar-section">
                <div className="sidebar-section-title">DATING CONTACTS</div>
                {contactNames.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                        No scheduled dates yet. <br />Chat with AI to arrange one!
                    </p>
                ) : (
                    <div className="sidebar-contact-list">
                        {contactNames.map(name => (
                            <div key={name} className="contact-group">
                                <div className="contact-header" onClick={() => toggleContact(name)}>
                                    <div className="contact-avatar-small">{name.charAt(0)}</div>
                                    <span className="contact-name">{name}</span>
                                    <span className="contact-count">{contactsMap[name].length}</span>
                                </div>
                                {expandedContacts[name] && (
                                    <ul className="contact-events-list">
                                        {contactsMap[name].map(evt => (
                                            <li key={evt.id} className="contact-event-item">
                                                <span className="contact-event-date">
                                                    {format(new Date(Number(evt.start) || evt.start), "EEE, HH:mm")}
                                                </span>
                                                {evt.title}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Middle Column: Week View
 */
const WeekOverview: React.FC<{ events: CalendarEvent[] }> = ({ events }) => {
    return (
        <div className="week-overview">
            <div className="week-overview-header" style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '24px', margin: 0 }}>Week Overview</h2>
            </div>

            <div className="week-overview-calendar">
                <CalendarView events={events} />
            </div>
        </div>
    );
};

/**
 * Main Page
 */
export const DashboardPage: React.FC = () => {
    const { data, loading, error } = useQuery<MeQueryResult>(GET_ME_QUERY, {
        fetchPolicy: "cache-and-network", // Ensures UI updates after mutations
    });

    if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
    if (error) return <p style={{ padding: 20, color: 'red' }}>Error: {error.message}</p>;
    if (!data || !data.me) return <p style={{ padding: 20 }}>Please login again.</p>;

    const { me } = data;

    // Safety check for calendar events
    const events = (me.calendarEvents || []).map((evt: any) => ({
        ...evt,
        start: evt.start,
        end: evt.end
    }));

    return (
        <div className="app-shell">
            <Navbar />
            <div className="app-layout">
                <aside className="layout-sidebar">
                    {/* Pass preferences to Sidebar */}
                    <Sidebar events={events} preferences={me.preferences || []} />
                </aside>
                <main className="layout-main">
                    <WeekOverview events={events} />
                </main>
                <section className="layout-assistant">
                    <AssistantPanel />
                </section>
            </div>
        </div>
    );
};