import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface EventItem {
    id: number;
    title: string;
    description: string | null;
    event_type: string;
    start_time: string;
    end_time: string;
    location: {
        building?: string;
        room?: string;
    } | null;
    teacher: string | null;
    category: {
        name: string;
        color: string;
        textColor: string;
    } | null;
    is_checked_in: boolean;
    check_in_time: string | null;
}

interface Stats {
    total: number;
    attended: number;
    missed: number;
    rate: number;
}

interface Props extends PageProps {
    upcoming: EventItem[];
    today: EventItem[];
    past: EventItem[];
    stats: Stats;
}

const eventTypeLabels: Record<string, string> = {
    lecture: 'Лекція',
    seminar: 'Семінар',
    lab: 'Лабораторна',
    exam: 'Іспит',
};

const eventTypeColors: Record<string, string> = {
    lecture: 'bg-blue-100 text-blue-800',
    seminar: 'bg-green-100 text-green-800',
    lab: 'bg-amber-100 text-amber-800',
    exam: 'bg-red-100 text-red-800',
};

function EventCard({ event, showStatus = false }: { event: EventItem; showStatus?: boolean }) {
    const startDate = new Date(event.start_time);
    const isUpcoming = startDate > new Date();
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors shadow-sm">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                            {eventTypeLabels[event.event_type] || event.event_type}
                        </span>
                        {showStatus && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${event.is_checked_in ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                {event.is_checked_in ? '✓ Відмічено' : 'Не відмічено'}
                            </span>
                        )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                        {startDate.toLocaleDateString('uk', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' • '}
                        {startDate.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(event.end_time).toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                
                {event.location && (event.location.building || event.location.room) && (
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>
                            {event.location.building && `Корпус ${event.location.building}`}
                            {event.location.building && event.location.room && ', '}
                            {event.location.room && `Ауд. ${event.location.room}`}
                        </span>
                    </div>
                )}
                
                {event.teacher && (
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{event.teacher}</span>
                    </div>
                )}

                {event.is_checked_in && event.check_in_time && (
                    <div className="flex items-center gap-2 text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                            Відмітка: {new Date(event.check_in_time).toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                )}
            </div>
            
            {isUpcoming && !event.is_checked_in && (
                <div className="mt-4">
                    <Link
                        href="/check-in"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Сканувати QR
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function MyEvents({ upcoming, today, past, stats }: Props) {
    return (
        <AuthenticatedLayout title="Мої заняття">
            <Head title="Мої заняття" />
            
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Всього занять</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Відвідано</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.attended}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Пропущено</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.missed}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Відвідуваність</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.rate}%</p>
                    </div>
                </div>

                {/* Today's Events */}
                {today.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            Сьогодні
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {today.map(event => (
                                <EventCard key={event.id} event={event} showStatus />
                            ))}
                        </div>
                    </div>
                )}

                {/* Upcoming Events */}
                {upcoming.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Найближчі заняття</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcoming.slice(0, 6).map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                        {upcoming.length > 6 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                                І ще {upcoming.length - 6} занять...
                            </p>
                        )}
                    </div>
                )}

                {/* Past Events */}
                {past.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Історія</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дата</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Заняття</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Тип</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Статус</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {past.map(event => (
                                        <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(event.start_time).toLocaleDateString('uk', { day: 'numeric', month: 'short' })}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{event.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                                                    {eventTypeLabels[event.event_type] || event.event_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {event.is_checked_in ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Присутній
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 text-sm">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                        Пропущено
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {upcoming.length === 0 && today.length === 0 && past.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Немає занять</h3>
                        <p className="text-gray-500 dark:text-gray-400">Ви ще не належите до жодної групи або для вашої групи ще не створено занять.</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
