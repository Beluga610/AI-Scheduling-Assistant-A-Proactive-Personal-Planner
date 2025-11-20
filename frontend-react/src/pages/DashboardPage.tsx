import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_ME_QUERY } from "../graphql/queries";
import Navbar from "../components/Navbar";
import CalendarView from "../components/CalendarView";
import AssistantPanel from "../components/AssistantPanel";
import PreferencePanel from "../components/PreferencePanel";
import { extractNameFromTitle, stringToColor, stringToDarkColor } from "../utils/colorUtils";
import { format, differenceInCalendarDays, isBefore, isAfter } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  contactName?: string;
  location?: string;
  vibe?: string;
}

interface MeData {
    id: string;
    name: string;
    email: string;
    preferences: string[];
    tasks: any[];
    calendarEvents: CalendarEvent[];
}

interface MeQueryResult {
    me: MeData;
}

const Sidebar: React.FC<{ events: CalendarEvent[]; preferences: string[] }> = ({ events, preferences }) => {
  const [expandedContacts, setExpandedContacts] = useState<Record<string, boolean>>({});

  const toggleContact = (name: string) => {
      setExpandedContacts(prev => ({ ...prev, [name]: !prev[name] }));
  };
  const contactsMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(evt => {
      let rawName = evt.contactName;
      if (!rawName) {
        rawName = extractNameFromTitle(evt.title);
      }
      const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      if (!map[normalizedName]) map[normalizedName] = [];
      map[normalizedName].push(evt);
    });
    return map;
  }, [events]);

  const contactNames = Object.keys(contactsMap).sort();
  const getRelationshipStats = (contactEvents: CalendarEvent[]) => {
    const now = new Date();
    const pastEvents = contactEvents
      .filter(e => isBefore(new Date(Number(e.end) || e.end), now))
      .sort((a, b) => new Date(Number(b.end) || b.end).getTime() - new Date(Number(a.end) || a.end).getTime());
    const futureEvents = contactEvents
      .filter(e => isAfter(new Date(Number(e.start) || e.start), now))
      .sort((a, b) => new Date(Number(a.start) || a.start).getTime() - new Date(Number(b.start) || b.start).getTime());
    const lastEvent = pastEvents[0];
    const nextEvent = futureEvents[0];
    let lastText = "None";
    let nextText = "None";
    let alertLevel = 0; 
    if (lastEvent) {
      const daysAgo = differenceInCalendarDays(now, new Date(Number(lastEvent.end) || lastEvent.end));
      lastText = daysAgo === 0 ? "Today" : `${daysAgo}d ago`;
      if (daysAgo > 14) alertLevel = 1; 
    }
    if (nextEvent) {
      const nextDate = new Date(Number(nextEvent.start) || nextEvent.start);
      const diff = differenceInCalendarDays(nextDate, now);
      nextText = diff < 7 ? format(nextDate, "EEE") : format(nextDate, "MMM d");
    }
    return { lastText, nextText, alertLevel };
  };

  return (
    <div className="sidebar">
      <PreferencePanel initialPreferences={preferences} />
      
      <div className="sidebar-section">
        <div className="sidebar-section-title">DATING CONTACTS</div>
        {contactNames.length === 0 ? (
          <p style={{color: '#999', fontSize: '13px', fontStyle: 'italic'}}>
            No scheduled dates yet. <br/>Chat with AI to arrange one!
          </p>
        ) : (
          <div className="sidebar-contact-list">
            {contactNames.map(name => {
              const bgColor = stringToColor(name);
              const textColor = stringToDarkColor(name);
              const contactEvents = contactsMap[name];
              const { lastText, nextText, alertLevel } = getRelationshipStats(contactEvents);

              return (
                <div key={name} className="contact-group">
                  <div className="contact-header" onClick={() => toggleContact(name)} style={{ alignItems: 'flex-start' }}>
                    <div 
                      className="contact-avatar-small"
                      style={{ backgroundColor: bgColor, color: textColor, marginTop: '2px' }}
                    >
                      {name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="contact-name" style={{ fontWeight: 600 }}>{name}</span>
                        <span className="contact-count">{contactEvents.length}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#888', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span style={{ color: alertLevel > 0 ? '#e57373' : '#888' }}>
                          Last: <b>{lastText}</b>
                        </span>
                        <span>
                           Next: <b style={{ color: nextText !== 'None' ? '#4caf50' : '#ccc' }}>{nextText}</b>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {expandedContacts[name] && (
                    <ul className="contact-events-list">
                      {contactEvents.map(evt => (
                        <li key={evt.id} className="contact-event-item">
                          <span 
                            className="contact-event-date"
                            style={{ color: textColor }}
                          >
                            {format(new Date(Number(evt.start) || evt.start), "EEE, HH:mm")}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>{evt.title}</span>
                            {evt.location && (
                               <span style={{ fontSize: '10px', color: '#999' }}>
                                 📍 {evt.location}
                               </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
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

export const DashboardPage: React.FC = () => {
    const { data, loading, error } = useQuery<MeQueryResult>(GET_ME_QUERY, {
        fetchPolicy: "cache-and-network", 
    });

    if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
    if (error) return <p style={{ padding: 20, color: 'red' }}>Error: {error.message}</p>;
    if (!data || !data.me) return <p style={{ padding: 20 }}>Please login again.</p>;

    const { me } = data;

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