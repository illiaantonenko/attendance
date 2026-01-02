import React, { useState, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import { PageProps, Event } from '@/types';

interface CalendarProps extends PageProps {
    events: Event[];
}

const eventTypeColors: Record<string, { bg: string; border: string; text: string }> = {
    lecture: { bg: '#3B82F6', border: '#2563EB', text: '#ffffff' },
    seminar: { bg: '#10B981', border: '#059669', text: '#ffffff' },
    lab: { bg: '#F59E0B', border: '#D97706', text: '#ffffff' },
    exam: { bg: '#EF4444', border: '#DC2626', text: '#ffffff' },
};

export default function Calendar({ auth, events }: CalendarProps) {
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

    // Transform events for FullCalendar
    const calendarEvents: EventInput[] = events.map((event) => ({
        id: String(event.id),
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        backgroundColor: eventTypeColors[event.event_type]?.bg || '#6B7280',
        borderColor: eventTypeColors[event.event_type]?.border || '#4B5563',
        textColor: eventTypeColors[event.event_type]?.text || '#ffffff',
        extendedProps: event,
    }));

    const handleEventClick = useCallback((clickInfo: EventClickArg) => {
        const event = clickInfo.event.extendedProps as Event;
        setSelectedEvent(event);
    }, []);

    const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
        if (auth.user?.role !== 'student') {
            // Redirect to create event with pre-filled dates
            window.location.href = `/events/create?start=${selectInfo.startStr}&end=${selectInfo.endStr}`;
        }
    }, [auth.user]);

    const closeModal = () => setSelectedEvent(null);

    return (
        <AuthenticatedLayout title="Календар">
            <Head title="Календар" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay',
                            }}
                            locale="uk"
                            firstDay={1}
                            events={calendarEvents}
                            eventClick={handleEventClick}
                            selectable={auth.user?.role !== 'student'}
                            select={handleDateSelect}
                            editable={false}
                            dayMaxEvents={3}
                            height="auto"
                            buttonText={{
                                today: 'Сьогодні',
                                month: 'Місяць',
                                week: 'Тиждень',
                                day: 'День',
                            }}
                        />
                    </div>
                </div>

                {/* Sidebar - Legend & Upcoming */}
                <div className="space-y-6">
                    {/* Legend */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Типи подій</h3>
                        <div className="space-y-2">
                            {Object.entries(eventTypeColors).map(([type, colors]) => (
                                <div key={type} className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{ backgroundColor: colors.bg }}
                                    />
                                    <span className="text-sm text-gray-600 capitalize">
                                        {type === 'lecture' ? 'Лекція' :
                                         type === 'seminar' ? 'Семінар' :
                                         type === 'lab' ? 'Лабораторна' : 'Іспит'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Today's Events */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Сьогодні</h3>
                        <div className="space-y-2">
                            {events
                                .filter((e) => {
                                    const today = new Date().toDateString();
                                    return new Date(e.start_time).toDateString() === today;
                                })
                                .map((event) => (
                                    <button
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <p className="font-medium text-sm text-gray-900 truncate">
                                            {event.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(event.start_time).toLocaleTimeString('uk', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </button>
                                ))}
                            {events.filter((e) => {
                                const today = new Date().toDateString();
                                return new Date(e.start_time).toDateString() === today;
                            }).length === 0 && (
                                <p className="text-sm text-gray-500">Подій немає</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                            <div>
                                <span
                                    className="inline-block mb-2 px-2 py-0.5 rounded text-xs font-medium"
                                    style={{
                                        backgroundColor: eventTypeColors[selectedEvent.event_type]?.bg,
                                        color: eventTypeColors[selectedEvent.event_type]?.text,
                                    }}
                                >
                                    {selectedEvent.event_type === 'lecture' ? 'Лекція' :
                                     selectedEvent.event_type === 'seminar' ? 'Семінар' :
                                     selectedEvent.event_type === 'lab' ? 'Лабораторна' : 'Іспит'}
                                </span>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {selectedEvent.title}
                                </h3>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                    {new Date(selectedEvent.start_time).toLocaleString('uk', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            
                            {selectedEvent.location?.room && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <span>
                                        {selectedEvent.location.building && `Корпус ${selectedEvent.location.building}, `}
                                        {selectedEvent.location.room}
                                    </span>
                                </div>
                            )}

                            {selectedEvent.teacher && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>{selectedEvent.teacher.full_name}</span>
                                </div>
                            )}

                            {selectedEvent.description && (
                                <p className="text-gray-600">
                                    {selectedEvent.description}
                                </p>
                            )}

                            <div className="flex gap-2 pt-4 border-t border-gray-200">
                                <a
                                    href={`/events/${selectedEvent.id}`}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Детальніше
                                </a>
                                {auth.user?.role === 'student' && selectedEvent.qr_enabled && (
                                    <a href="/check-in" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                        QR Сканер
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

