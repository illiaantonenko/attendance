import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface Stats {
    totalEvents: number;
    totalStudents: number;
    totalRegistrations: number;
    attendanceRate: number;
}

interface AttendanceByType {
    type: string;
    label: string;
    events: number;
    registrations: number;
}

interface TrendItem {
    date: string;
    count: number;
}

interface GroupStats {
    id: number;
    name: string;
    students_count: number;
    events_count: number;
    registrations: number;
    attendance_rate: number;
}

interface PastEvent {
    id: number;
    title: string;
    event_type: string;
    start_time: string;
    teacher: string | null;
    registrations_count: number;
    expected_count: number;
    attendance_rate: number;
}

interface UpcomingEvent {
    id: number;
    title: string;
    event_type: string;
    start_time: string;
    teacher: string | null;
    expected_count: number;
}

interface Props extends PageProps {
    stats: Stats;
    attendanceByType: AttendanceByType[];
    attendanceTrend: TrendItem[];
    topGroups: GroupStats[];
    pastEvents: PastEvent[];
    upcomingEvents: UpcomingEvent[];
}

export default function Statistics({ stats, attendanceByType, attendanceTrend, topGroups, pastEvents, upcomingEvents }: Props) {
    const eventTypeColors: Record<string, string> = {
        lecture: 'bg-blue-500',
        seminar: 'bg-green-500',
        lab: 'bg-amber-500',
        exam: 'bg-red-500',
    };

    const maxTrendCount = Math.max(...attendanceTrend.map(t => t.count), 1);

    return (
        <AuthenticatedLayout title="Статистика">
            <Head title="Статистика" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Статистика відвідуваності</h1>
                    <p className="text-gray-500">Аналітика та звіти по відвідуваності</p>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Всього подій"
                        value={stats.totalEvents}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }
                        color="blue"
                    />
                    <StatCard
                        title="Студентів"
                        value={stats.totalStudents}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m12 5.197v-1a6 6 0 00-3-5.197" />
                            </svg>
                        }
                        color="indigo"
                    />
                    <StatCard
                        title="Всього відміток"
                        value={stats.totalRegistrations}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        color="green"
                    />
                    <StatCard
                        title="Відвідуваність"
                        value={`${stats.attendanceRate}%`}
                        icon={
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        }
                        color="purple"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attendance by Type */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">По типах подій</h2>
                        <div className="space-y-4">
                            {attendanceByType.map((item) => (
                                <div key={item.type} className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${eventTypeColors[item.type] || 'bg-gray-500'}`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                            <span className="text-sm text-gray-500">{item.registrations} відміток</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${eventTypeColors[item.type] || 'bg-gray-500'}`}
                                                style={{ width: `${Math.min((item.registrations / (stats.totalRegistrations || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Groups */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Топ груп за відвідуваністю</h2>
                        <div className="space-y-3">
                            {topGroups.length > 0 ? (
                                topGroups.slice(0, 5).map((group, index) => (
                                    <div key={group.id} className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-100 text-gray-700' :
                                            index === 2 ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-50 text-gray-500'
                                        }`}>
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{group.name}</p>
                                            <p className="text-xs text-gray-500">{group.students_count} студентів</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">{group.attendance_rate}%</p>
                                            <p className="text-xs text-gray-500">{group.registrations} відміток</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">Немає даних</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attendance Trend */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Тренд відвідуваності (останні 30 днів)</h2>
                    {attendanceTrend.length > 0 ? (
                        <div className="h-48 flex items-end gap-1">
                            {attendanceTrend.map((item, index) => (
                                <div
                                    key={item.date}
                                    className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer group relative"
                                    style={{ height: `${(item.count / maxTrendCount) * 100}%`, minHeight: '4px' }}
                                    title={`${item.date}: ${item.count} відміток`}
                                >
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {new Date(item.date).toLocaleDateString('uk', { day: 'numeric', month: 'short' })}: {item.count}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Немає даних за останні 30 днів</p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Past Events with Attendance */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Минулі події</h2>
                            <p className="text-sm text-gray-500">Відвідуваність на завершених заняттях</p>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {pastEvents.length > 0 ? (
                                pastEvents.map((event) => (
                                    <div key={event.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${eventTypeColors[event.event_type] || 'bg-gray-500'}`} />
                                            <div>
                                                <p className="font-medium text-gray-900">{event.title}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(event.start_time).toLocaleDateString('uk', { day: 'numeric', month: 'short' })}
                                                    {event.teacher && ` • ${event.teacher}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">
                                                {event.registrations_count}/{event.expected_count}
                                            </p>
                                            <p className={`text-xs font-medium ${
                                                event.attendance_rate >= 80 ? 'text-green-600' :
                                                event.attendance_rate >= 50 ? 'text-amber-600' :
                                                'text-red-600'
                                            }`}>
                                                {event.attendance_rate}%
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-8 text-center text-gray-500">
                                    Немає минулих подій
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Заплановані події</h2>
                            <p className="text-sm text-gray-500">Очікувана кількість студентів</p>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {upcomingEvents.length > 0 ? (
                                upcomingEvents.map((event) => (
                                    <div key={event.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${eventTypeColors[event.event_type] || 'bg-gray-500'}`} />
                                            <div>
                                                <p className="font-medium text-gray-900">{event.title}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(event.start_time).toLocaleDateString('uk', { 
                                                        day: 'numeric', 
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                    {event.teacher && ` • ${event.teacher}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{event.expected_count}</p>
                                            <p className="text-xs text-gray-500">очікується</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-8 text-center text-gray-500">
                                    Немає запланованих подій
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ title, value, icon, color }: { 
    title: string; 
    value: number | string; 
    icon: React.ReactNode; 
    color: 'blue' | 'indigo' | 'green' | 'purple' 
}) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        green: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

