import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Event } from '@/types';

interface DashboardProps extends PageProps {
    upcomingEvents: Event[];
    stats: {
        totalEvents: number;
        todayEvents: number;
        attendanceRate: number;
    };
}

export default function Dashboard({ auth, upcomingEvents, stats }: DashboardProps) {
    const user = auth.user;

    return (
        <AuthenticatedLayout title="Головна">
            <Head title="Головна" />

            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-2">
                            Вітаємо, {user?.full_name}! 👋
                        </h2>
                        <p className="text-blue-100">
                            {user?.role === 'student' 
                                ? 'Переглядайте свої заняття та відмічайте відвідуваність'
                                : 'Керуйте заняттями та контролюйте відвідуваність студентів'}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Всього подій"
                        value={stats?.totalEvents || 0}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                        color="blue"
                    />
                    <StatCard
                        title="Сьогодні"
                        value={stats?.todayEvents || 0}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        color="green"
                    />
                    <StatCard
                        title="Відвідуваність"
                        value={`${stats?.attendanceRate || 0}%`}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        color="purple"
                    />
                </div>

                {/* Upcoming Events */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Найближчі події
                        </h3>
                        <a href="/calendar" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                            Переглянути всі →
                        </a>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {upcomingEvents && upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event) => (
                                <EventItem key={event.id} event={event} />
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p>Найближчих подій немає</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                {user?.role !== 'student' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <QuickAction
                            href="/events/create"
                            title="Створити подію"
                            description="Додайте нове заняття або подію"
                            icon={
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        />
                        <QuickAction
                            href="/analytics"
                            title="Аналітика"
                            description="Переглянути звіти відвідуваності"
                            icon={
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            }
                        />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: 'blue' | 'green' | 'purple' }) {
    const colors = {
        blue: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
        green: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
        purple: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
}

function EventItem({ event }: { event: Event }) {
    const startTime = new Date(event.start_time);
    
    const badgeColors = {
        lecture: 'bg-blue-500 text-white',
        seminar: 'bg-emerald-500 text-white',
        lab: 'bg-amber-500 text-white',
        exam: 'bg-red-500 text-white',
    };
    
    return (
        <Link 
            href={`/events/${event.id}`}
            className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
        >
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex flex-col items-center justify-center shadow-md">
                    <span className="text-[10px] font-semibold text-blue-100 uppercase">
                        {startTime.toLocaleDateString('uk', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-white">
                        {startTime.getDate()}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {event.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {startTime.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}
                        {event.location?.room && ` • ${event.location.room}`}
                    </p>
                </div>
                <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                    badgeColors[event.event_type as keyof typeof badgeColors] || badgeColors.lecture
                }`}>
                    {event.event_type === 'lecture' ? 'Лекція' :
                     event.event_type === 'seminar' ? 'Семінар' :
                     event.event_type === 'lab' ? 'Лабораторна' : 'Іспит'}
                </div>
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </Link>
    );
}

function QuickAction({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) {
    return (
        <a href={href} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group shadow-sm">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {icon}
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
            </div>
        </a>
    );
}

