"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMonths, subMonths, addDays, subDays, addHours } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ChevronLeft, ChevronRight, X, Clock, AlignLeft, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const ACCENT_COLORS = [
  "bg-accent-orange",
  "bg-accent-blue",
  "bg-accent-mint",
  "bg-accent-purple",
  "bg-accent-yellow",
];

const getEventColor = (id: number | string) => {
  if (typeof id === 'string') {
    const hex = id.replace(/-/g, '');
    const segment = hex.slice(-8);
    const num = parseInt(segment, 16);
    return ACCENT_COLORS[num % ACCENT_COLORS.length];
  }
  return ACCENT_COLORS[(id || 0) % ACCENT_COLORS.length];
};

export default function CalendarDashboard() {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const fetchEvents = useCallback(async (currentDate: Date, currentView: string) => {
    setIsLoading(true);
    const startObj = currentView === Views.MONTH ? startOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) : currentDate;
    const endObj = currentView === Views.MONTH ? addDays(startObj, 42) : addDays(currentDate, 1);

    const startstamp = encodeURIComponent(format(subDays(startObj, 15), "yyyy-MM-dd HH:mm:ssXXX"));
    const endstamp = encodeURIComponent(format(addDays(endObj, 15), "yyyy-MM-dd HH:mm:ssXXX"));

    try {
      const res = await fetch(`/api/event?startstamp=${startstamp}&endstamp=${endstamp}&limit=1000`);
      if (res.ok) {
        const json = await res.json();
        const formattedEvents = (json.data || []).map((ev: any) => {
          const start = new Date(ev.start_timestamp);
          const end = ev.end_timestamp ? new Date(ev.end_timestamp) : addHours(start, 1);
          return {
            ...ev,
            uuid: ev.uuid || ev.id, // Support either uuid or id
            title: ev.title,
            start,
            end,
          };
        });
        setEvents(formattedEvents);
      }
    } catch (e) {
      console.error("Failed to fetch events", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(date, view);
  }, [date, view, fetchEvents]);

  const handlePrev = () => {
    if (view === Views.MONTH) setDate(subMonths(date, 1));
    else setDate(subDays(date, 1));
  };

  const handleNext = () => {
    if (view === Views.MONTH) setDate(addMonths(date, 1));
    else setDate(addDays(date, 1));
  };

  const CustomToolbar = (toolbar: any) => {
    return (
      <div className="flex items-center justify-between mb-8 px-4 font-display">
        <div className="flex items-center gap-4">
          <h2 className="text-4xl font-bold tracking-wide flex items-center gap-3">
            <span>{toolbar.label}</span>
          </h2>
          <div className="flex gap-1 ml-4">
            <button onClick={handlePrev} className="hover:scale-110 transition-transform cursor-pointer hover:bg-black/5 rounded-full p-1 bg-white border-2 border-black">
              <ChevronLeft size={28} className="text-black" />
            </button>
            <button onClick={handleNext} className="hover:scale-110 transition-transform cursor-pointer hover:bg-black/5 rounded-full p-1 bg-white border-2 border-black">
              <ChevronRight size={28} className="text-black" />
            </button>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => toolbar.onView("month")}
            className={`${toolbar.view === "month" ? "bg-accent-yellow" : "bg-white"} px-4 py-2 rounded-xl thick-border font-bold hover:-translate-y-1 transition-transform text-black`}
          >
            Month
          </button>
          <button
            onClick={() => toolbar.onView("day")}
            className={`${toolbar.view === "day" ? "bg-accent-yellow" : "bg-white"} px-4 py-2 rounded-xl thick-border font-bold hover:-translate-y-1 transition-transform text-black`}
          >
            Day
          </button>
        </div>
      </div>
    );
  };

  // Month view: plain text with colored dot, no border
  const MonthEvent = ({ event }: any) => {
    const bgColor = getEventColor(event.uuid);
    return (
      <div className="flex items-center gap-1.5 px-1 py-0.5 text-left overflow-hidden">
        <span className={`w-2 h-2 rounded-full shrink-0 ${bgColor} border border-black`}></span>
        <span className="font-semibold text-xs text-black truncate leading-tight">{event.title}</span>
      </div>
    );
  };

  // Day view: bordered card with accent background
  const DayEvent = ({ event }: any) => {
    const bgColor = getEventColor(event.uuid);

    // Format the time range nicely (e.g., "12:00 AM - 1:00 PM")
    const startTime = format(event.start, "h:mm a");
    const endTime = format(event.end, "h:mm a");

    return (
      <div className={`w-fit h-full rounded-lg border-2 border-black px-3 flex flex-col items-start justify-start text-left ${bgColor} text-black overflow-hidden`}>
        <span className="font-bold text-[10px] truncate leading-tight w-full py-0.5">{event.title}</span>
        <span className="text-[9px] font-semibold opacity-75 truncate w-full">{startTime} - {endTime}</span>
      </div>
    );
  };

  const handleSelectSlot = async (slotInfo: any) => {
    // When clicking a day cell in month view, navigate to that day
    if (view === Views.MONTH) {
      setDate(slotInfo.start);
      setView(Views.DAY);
      return;
    }

    // In Day view, create a new event for the selected time slot
    const title = window.prompt('New Event Name');
    if (title) {
      try {
        const res = await fetch('/api/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            start_timestamp: slotInfo.start.toISOString(),
            end_timestamp: slotInfo.end.toISOString(),
          }),
        });
        if (res.ok) {
          fetchEvents(date, view);
        } else {
          console.error("Failed to create event");
        }
      } catch (err) {
        console.error("Error creating event", err);
      }
    }
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    if (window.confirm(`Are you sure you want to delete '${selectedEvent.title}'?`)) {
      try {
        const res = await fetch(`/api/event/${selectedEvent.uuid}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setEvents(events.filter(e => e.uuid !== selectedEvent.uuid));
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        } else {
          console.error("Failed to delete event");
        }
      } catch (err) {
        console.error("Error deleting event", err);
      }
    }
  };

  return (
    <div className="flex-1 w-full bg-panel-light rounded-[3rem] thick-border-panel p-6 relative flex flex-col h-full max-h-full font-display min-h-[500px] overflow-hidden">
      <div className="flex-1 relative z-0 flex flex-col custom-calendar-wrapper min-h-0">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/50 rounded-2xl flex items-center justify-center">
            <LoadingSpinner size={48} />
          </div>
        )}
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={["month", "day"]}
          view={view}
          onView={(newView) => setView(newView)}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          selectable={true}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          components={{
            toolbar: CustomToolbar,
            event: view === Views.MONTH ? MonthEvent : DayEvent,
          }}
          className="h-full w-full cursor-pointer"
        />
      </div>

      {/* Event Details Side Modal */}
      <div
        className={`absolute top-0 right-0 h-full w-[380px] bg-white border-l-4 border-black z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${isEventModalOpen ? 'translate-x-0' : 'translate-x-full'
          } rounded-r-[3rem]`}
      >
        {selectedEvent && (
          <div className="flex flex-col h-full bg-panel-light p-6 overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center ${getEventColor(selectedEvent.uuid)}`}>
                  <CalendarIcon size={16} className="text-black" />
                </div>
                <h2 className="text-2xl font-bold font-display text-black">Event Details</h2>
              </div>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors border-2 border-transparent hover:border-black cursor-pointer"
              >
                <X size={24} className="text-black" />
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-white p-5 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xl font-bold text-black mb-4 break-words">
                  {selectedEvent.title}
                </h3>

                <div className="flex flex-col gap-4 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-black shrink-0" />
                    <div>
                      <p className="text-black">
                        {format(selectedEvent.start, "EEEE, MMMM do, yyyy")}
                      </p>
                      <p>
                        {format(selectedEvent.start, "h:mm a")} - {format(selectedEvent.end, "h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="bg-white p-5 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-3">
                    <AlignLeft size={18} className="text-black" />
                    <h4 className="font-bold text-black">Description</h4>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 whitespace-pre-wrap">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t-4 border-black border-dashed flex justify-end">
              <button
                onClick={handleDeleteEvent}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 border-2 border-red-200 hover:border-red-400 font-bold rounded-xl transition-all"
              >
                <Trash2 size={18} />
                Delete Event
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* Strip internal header/toolbar borders and only border the main grids */
        .custom-calendar-wrapper .rbc-month-view,
        .custom-calendar-wrapper .rbc-time-view {
          border: 4px solid #000;
          border-radius: 1.5rem;
          background-color: #fff;
          overflow: hidden;
          clip-path: inset(0 round 1.5rem);
        }

        /* Ensure the day view header clips properly */
        .custom-calendar-wrapper .rbc-time-header {
          overflow: hidden;
        }

        /* Remove today highlight in day/time view */
        .custom-calendar-wrapper .rbc-time-view .rbc-today {
          background-color: transparent;
        }
        
        /* Grid headers */
        .custom-calendar-wrapper .rbc-header {
          border-bottom: 4px solid #000;
          font-weight: bold;
          padding: 0.75rem 0;
          font-size: 1.125rem;
          background-color: #f9fafb;
          color: black;
        }

        .custom-calendar-wrapper .rbc-header + .rbc-header {
          border-left: 4px solid #000;
        }

        .custom-calendar-wrapper .rbc-day-bg + .rbc-day-bg {
          border-left: 4px solid #000;
        }

        .custom-calendar-wrapper .rbc-month-row + .rbc-month-row {
          border-top: 4px solid #000;
        }

        .custom-calendar-wrapper .rbc-event {
          background-color: transparent !important;
          border: none !important;
          padding: 1px;
        }

        /* Month view events: no background, just text */
        .custom-calendar-wrapper .rbc-month-view .rbc-event {
          background-color: transparent;
          border: none;
          padding: 0;
        }

        /* Day view events: let the component border show, prevent overflow */
        .custom-calendar-wrapper .rbc-time-view .rbc-event {
          background-color: transparent;
          border: none;
          padding: 2px;
          max-width: 100% !important;
          overflow: hidden !important;
        }

        /* Hide the default event time label on top of event cards, since we render it inside DayEvent */
        .custom-calendar-wrapper .rbc-event-label {
          display: none !important;
        }

        /* Constrain the event container columns */
        .custom-calendar-wrapper .rbc-day-slot .rbc-events-container {
          margin-right: 8px;
        }

        /* Make time labels black */
        .custom-calendar-wrapper .rbc-time-gutter .rbc-timeslot-group .rbc-time-slot .rbc-label {
          color: #000 !important;
        }
        .custom-calendar-wrapper .rbc-time-gutter .rbc-timeslot-group {
          color: #000;
        }
        .custom-calendar-wrapper .rbc-time-slot {
          color: #000;
        }
        .custom-calendar-wrapper .rbc-label {
          color: #000 !important;
        }

        .custom-calendar-wrapper .rbc-time-content {
          border-top: 4px solid #000;
          overflow-y: auto !important;
        }

        /* Customize scrollbar for day view */
        .custom-calendar-wrapper .rbc-time-content::-webkit-scrollbar {
          width: 8px;
        }
        .custom-calendar-wrapper .rbc-time-content::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-left: 2px solid #000;
        }
        .custom-calendar-wrapper .rbc-time-content::-webkit-scrollbar-thumb {
          background: #000; 
          border-radius: 4px;
        }

        .custom-calendar-wrapper .rbc-timeslot-group {
          border-bottom: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}
