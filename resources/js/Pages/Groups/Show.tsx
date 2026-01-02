import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface Student {
    id: number;
    email: string;
    full_name: string;
    profile?: {
        firstname: string;
        lastname: string;
    };
}

interface Group {
    id: number;
    name: string;
    students: Student[];
}

interface Props extends PageProps {
    group: Group;
}

export default function GroupShow({ group }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.role === 'admin';

    return (
        <AuthenticatedLayout title={group.name}>
            <Head title={group.name} />

            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <Link href="/groups" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
                            ← Назад до груп
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
                        <p className="text-gray-500">{group.students.length} студентів</p>
                    </div>
                    {isAdmin && (
                        <Link
                            href={`/groups/${group.id}/edit`}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Редагувати
                        </Link>
                    )}
                </div>

                {/* Students List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Студенти групи</h2>
                    </div>
                    
                    {group.students.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {group.students.map((student) => (
                                <div key={student.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <span className="text-gray-600 font-medium">
                                                {student.profile?.firstname?.[0] || student.email[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {student.full_name || 'Без імені'}
                                            </p>
                                            <p className="text-sm text-gray-500">{student.email}</p>
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <Link
                                            href={`/users/${student.id}/edit`}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Редагувати
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            У цій групі ще немає студентів
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

