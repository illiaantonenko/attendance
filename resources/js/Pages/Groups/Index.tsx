import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface Group {
    id: number;
    name: string;
    students_count: number;
}

interface Props extends PageProps {
    groups: Group[];
}

export default function GroupsIndex({ groups }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    return (
        <AuthenticatedLayout title="Групи">
            <Head title="Групи" />
            
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Групи</h1>
                    {isAdmin && (
                        <Link
                            href="/groups/create"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            + Створити групу
                        </Link>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                        <Link
                            key={group.id}
                            href={`/groups/${group.id}`}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 transition-colors shadow-sm"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{group.name}</h3>
                            <p className="text-sm text-gray-500">
                                {group.students_count} {group.students_count === 1 ? 'студент' : 'студентів'}
                            </p>
                        </Link>
                    ))}
                </div>
                
                {groups.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
                        <p>Груп ще немає</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

