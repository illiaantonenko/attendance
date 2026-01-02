import React, { FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface User {
    id: number;
    email: string;
    role: string;
    group_id: number | null;
    profile?: {
        firstname: string;
        lastname: string;
    };
}

interface Group {
    id: number;
    name: string;
}

interface Props extends PageProps {
    user: User;
    groups: Group[];
}

export default function UserEdit({ user, groups }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        role: user.role,
        group_id: user.group_id?.toString() || '',
        profile: {
            firstname: user.profile?.firstname || '',
            lastname: user.profile?.lastname || '',
        },
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/users/${user.id}`);
    };

    return (
        <AuthenticatedLayout title="Редагувати користувача">
            <Head title={`Редагувати: ${user.email}`} />

            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link href="/users" className="text-sm text-blue-600 hover:text-blue-800">
                        ← Назад до користувачів
                    </Link>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-xl font-semibold text-gray-900">Редагувати користувача</h1>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Profile Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ім'я
                                </label>
                                <input
                                    type="text"
                                    value={data.profile.firstname}
                                    onChange={e => setData('profile', { ...data.profile, firstname: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Прізвище
                                </label>
                                <input
                                    type="text"
                                    value={data.profile.lastname}
                                    onChange={e => setData('profile', { ...data.profile, lastname: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Роль
                            </label>
                            <select
                                value={data.role}
                                onChange={e => setData('role', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="student">Студент</option>
                                <option value="teacher">Викладач</option>
                                <option value="admin">Адміністратор</option>
                            </select>
                            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                        </div>

                        {/* Group (for students) */}
                        {data.role === 'student' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Група
                                </label>
                                <select
                                    value={data.group_id}
                                    onChange={e => setData('group_id', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Без групи</option>
                                    {groups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link
                                href="/users"
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Скасувати
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Збереження...' : 'Зберегти'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

