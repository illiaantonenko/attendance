import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Event } from '@/types';

interface Props extends PageProps {
    events: {
        data: Event[];
        links: any;
    };
}

export default function EventsIndex({ events }: Props) {
    return (
        <AuthenticatedLayout title="Події">
            <Head title="Події" />
            
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Події</h1>
                    <Link
                        href="/events/create"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Створити подію
                    </Link>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Назва</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Тип</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дата</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Реєстрації</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {events.data.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4">
                                        <Link href={`/events/${event.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                            {event.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            event.event_type === 'lecture' ? 'bg-blue-100 text-blue-700' :
                                            event.event_type === 'seminar' ? 'bg-green-100 text-green-700' :
                                            event.event_type === 'lab' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {event.event_type === 'lecture' ? 'Лекція' :
                                             event.event_type === 'seminar' ? 'Семінар' :
                                             event.event_type === 'lab' ? 'Лабораторна' : 'Іспит'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(event.start_time).toLocaleDateString('uk')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {event.registrations_count || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <Link href={`/events/${event.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-3">
                                            Редагувати
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {events.data.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <p>Подій ще немає. Створіть першу!</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

