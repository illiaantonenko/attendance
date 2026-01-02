import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface User {
    id: number;
    email: string;
    role: 'admin' | 'teacher' | 'student';
    full_name: string;
    profile?: {
        firstname: string;
        lastname: string;
    };
    group?: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface Props extends PageProps {
    users: {
        data: User[];
        links: any;
        current_page: number;
        last_page: number;
    };
    filters: {
        role?: string;
        search?: string;
    };
}

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = React.useState(filters.search || '');
    const [role, setRole] = React.useState(filters.role || '');

    const handleFilter = () => {
        router.get('/users', { search, role }, { preserveState: true });
    };

    const roleLabels: Record<string, string> = {
        admin: 'Адміністратор',
        teacher: 'Викладач',
        student: 'Студент',
    };

    const roleColors: Record<string, string> = {
        admin: 'bg-red-100 text-red-700',
        teacher: 'bg-blue-100 text-blue-700',
        student: 'bg-green-100 text-green-700',
    };

    return (
        <AuthenticatedLayout title="Користувачі">
            <Head title="Користувачі" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Користувачі</h1>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleFilter()}
                                placeholder="Пошук за email або ім'ям..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Всі ролі</option>
                                <option value="admin">Адміністратори</option>
                                <option value="teacher">Викладачі</option>
                                <option value="student">Студенти</option>
                            </select>
                        </div>
                        <button
                            onClick={handleFilter}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Фільтрувати
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Користувач</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Група</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                <span className="text-gray-600 font-medium">
                                                    {user.profile?.firstname?.[0] || user.email[0].toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {user.full_name || 'Без імені'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${roleColors[user.role]}`}>
                                            {roleLabels[user.role]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {user.group?.name || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <Link 
                                            href={`/users/${user.id}/edit`} 
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Редагувати
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.data.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Користувачів не знайдено
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: users.last_page }, (_, i) => i + 1).map(page => (
                            <Link
                                key={page}
                                href={`/users?page=${page}&search=${search}&role=${role}`}
                                className={`px-3 py-1 rounded ${
                                    page === users.current_page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {page}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

