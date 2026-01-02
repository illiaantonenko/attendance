import React, { FormEvent } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';

interface Group {
    id: number;
    name: string;
}

interface Props extends PageProps {
    group: Group;
}

export default function GroupEdit({ group }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: group.name,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/groups/${group.id}`);
    };

    const handleDelete = () => {
        if (confirm('Ви впевнені що хочете видалити цю групу? Студенти групи не будуть видалені.')) {
            router.delete(`/groups/${group.id}`);
        }
    };

    return (
        <AuthenticatedLayout title="Редагувати групу">
            <Head title={`Редагувати: ${group.name}`} />

            <div className="max-w-lg mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <Link href={`/groups/${group.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                        ← Назад до групи
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="text-sm text-red-600 hover:text-red-800"
                    >
                        Видалити групу
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-xl font-semibold text-gray-900">Редагувати групу</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Назва групи *
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link
                                href={`/groups/${group.id}`}
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

