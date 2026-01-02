import React, { FormEvent, lazy, Suspense } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Event } from '@/types';

const LocationPicker = lazy(() => import('@/Components/LocationPicker'));

interface Category {
    id: number;
    name: string;
    color: string;
}

interface Group {
    id: number;
    name: string;
}

interface Props extends PageProps {
    event: Event & { groups?: Group[] };
    categories: Category[];
    groups: Group[];
}

export default function EventEdit({ event, categories, groups }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        category_id: event.category_id?.toString() || '',
        start_time: event.start_time.slice(0, 16), // Format for datetime-local
        end_time: event.end_time.slice(0, 16),
        location: {
            building: event.location?.building || '',
            room: event.location?.room || '',
            lat: event.location?.lat?.toString() || '',
            lng: event.location?.lng?.toString() || '',
        },
        allowed_radius: event.allowed_radius || 100,
        qr_enabled: event.qr_enabled ?? true,
        geolocation_required: event.geolocation_required ?? false,
        published: event.published ?? false,
        group_ids: event.groups?.map(g => g.id) || [],
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/events/${event.id}`);
    };

    const handleDelete = () => {
        if (confirm('Ви впевнені що хочете видалити цю подію?')) {
            router.delete(`/events/${event.id}`);
        }
    };

    const handleGroupToggle = (groupId: number) => {
        const newGroupIds = data.group_ids.includes(groupId)
            ? data.group_ids.filter(id => id !== groupId)
            : [...data.group_ids, groupId];
        setData('group_ids', newGroupIds);
    };

    return (
        <AuthenticatedLayout title="Редагувати подію">
            <Head title={`Редагувати: ${event.title}`} />

            <div className="max-w-3xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <Link href={`/events/${event.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                        ← Назад до події
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="text-sm text-red-600 hover:text-red-800"
                    >
                        Видалити подію
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h1 className="text-xl font-semibold text-gray-900">Редагувати подію</h1>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.published}
                                onChange={e => setData('published', e.target.checked)}
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className={`text-sm font-medium ${data.published ? 'text-green-600' : 'text-gray-500'}`}>
                                {data.published ? 'Опубліковано' : 'Чернетка'}
                            </span>
                        </label>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Назва події *
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Опис
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Тип події *
                                    </label>
                                    <select
                                        value={data.event_type}
                                        onChange={e => setData('event_type', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="lecture">Лекція</option>
                                        <option value="seminar">Семінар</option>
                                        <option value="lab">Лабораторна</option>
                                        <option value="exam">Іспит</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Категорія
                                    </label>
                                    <select
                                        value={data.category_id}
                                        onChange={e => setData('category_id', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Без категорії</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900">Дата та час</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Початок *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={data.start_time}
                                        onChange={e => setData('start_time', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Кінець *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={data.end_time}
                                        onChange={e => setData('end_time', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location with Map */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900">Місце проведення</h3>
                            <Suspense fallback={
                                <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-500">Завантаження карти...</span>
                                </div>
                            }>
                                <LocationPicker
                                    value={data.location}
                                    onChange={(location) => setData('location', location)}
                                    radius={data.allowed_radius}
                                    showRadius={data.geolocation_required}
                                />
                            </Suspense>
                        </div>

                        {/* Check-in Settings */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900">Налаштування відвідуваності</h3>
                            
                            <div className="space-y-3">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={data.qr_enabled}
                                        onChange={e => setData('qr_enabled', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Увімкнути QR-код для відмітки</span>
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={data.geolocation_required}
                                        onChange={e => setData('geolocation_required', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Вимагати геолокацію при відмітці</span>
                                </label>

                                {data.geolocation_required && (
                                    <div className="ml-7">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Допустимий радіус (метри)
                                        </label>
                                        <input
                                            type="number"
                                            value={data.allowed_radius}
                                            onChange={e => setData('allowed_radius', parseInt(e.target.value) || 100)}
                                            min={10}
                                            max={5000}
                                            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Groups */}
                        {groups.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-900">Групи студентів</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {groups.map(group => (
                                        <label
                                            key={group.id}
                                            className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                                data.group_ids.includes(group.id)
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.group_ids.includes(group.id)}
                                                onChange={() => handleGroupToggle(group.id)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{group.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <Link
                                href={`/events/${event.id}`}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Скасувати
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Збереження...' : 'Зберегти зміни'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

