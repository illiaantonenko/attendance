import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Event } from '@/types';

interface Registration {
    id: number;
    student_id: number;
    student_name: string;
    status: string;
    check_in_time: string | null;
    student?: {
        email: string;
        profile?: {
            firstname: string;
            lastname: string;
        };
    };
}

interface StudentFromGroup {
    id: number;
    email: string;
    full_name: string;
    profile?: {
        firstname: string;
        lastname: string;
    };
    group_name: string;
}

interface Props extends PageProps {
    event: Event;
    qrCode: string | null;
    qrAvailableAt: string | null;
    allStudents: StudentFromGroup[];
    registrationsByStudent: Record<number, Registration>;
    canManualAttendance: boolean;
}

export default function EventShow({ event, qrCode, qrAvailableAt, allStudents = [], registrationsByStudent = {}, canManualAttendance = false }: Props) {
    const [registrations, setRegistrations] = useState<any[]>(event.registrations || []);
    const [isLive, setIsLive] = useState(false);
    const [showManualAttendance, setShowManualAttendance] = useState(false);
    const [attendanceChanges, setAttendanceChanges] = useState<Record<number, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Get current status for a student
    const getStudentStatus = (studentId: number): string => {
        if (attendanceChanges[studentId] !== undefined) {
            return attendanceChanges[studentId];
        }
        const reg = registrationsByStudent[studentId];
        return reg?.status || 'absent';
    };

    // Toggle student status
    const toggleStatus = (studentId: number) => {
        const currentStatus = getStudentStatus(studentId);
        const nextStatus = currentStatus === 'present' ? 'absent' : 'present';
        setAttendanceChanges(prev => ({ ...prev, [studentId]: nextStatus }));
    };

    // Set specific status
    const setStatus = (studentId: number, status: string) => {
        setAttendanceChanges(prev => ({ ...prev, [studentId]: status }));
    };

    // Save all changes
    const saveAttendance = () => {
        if (Object.keys(attendanceChanges).length === 0) return;

        setIsSaving(true);
        const attendances = Object.entries(attendanceChanges).map(([studentId, status]) => ({
            student_id: parseInt(studentId),
            status,
        }));

        router.post(`/events/${event.id}/attendance/bulk`, { attendances }, {
            preserveScroll: true,
            onSuccess: () => {
                setAttendanceChanges({});
                setIsSaving(false);
            },
            onError: () => {
                setIsSaving(false);
            },
        });
    };

    // Mark all as present
    const markAllPresent = () => {
        const changes: Record<number, string> = {};
        allStudents.forEach(student => {
            changes[student.id] = 'present';
        });
        setAttendanceChanges(changes);
    };

    // Mark all as absent
    const markAllAbsent = () => {
        const changes: Record<number, string> = {};
        allStudents.forEach(student => {
            changes[student.id] = 'absent';
        });
        setAttendanceChanges(changes);
    };

    // Sync registrations state with props when Inertia updates the page
    useEffect(() => {
        setRegistrations(event.registrations || []);
    }, [event.registrations]);

    useEffect(() => {
        // Try to subscribe to real-time updates
        if (window.Echo) {
            try {
                const channel = window.Echo.channel(`event.${event.id}`);
                
                channel.listen('.attendance.registered', (data: { registration: Registration }) => {
                    console.log('🔔 New attendance received:', data);
                    setRegistrations(prev => {
                        const newReg = {
                            id: data.registration.id,
                            student_id: data.registration.student_id,
                            status: data.registration.status,
                            check_in_time: data.registration.check_in_time,
                            student: {
                                full_name: data.registration.student_name,
                                profile: {
                                    firstname: data.registration.student_name.split(' ')[1] || '',
                                    lastname: data.registration.student_name.split(' ')[0] || '',
                                },
                            },
                        };
                        
                        // Check if already exists - update instead of skip
                        const existingIndex = prev.findIndex(r => r.student_id === data.registration.student_id);
                        if (existingIndex >= 0) {
                            console.log('📝 Updating existing registration');
                            const updated = [...prev];
                            updated[existingIndex] = newReg;
                            return updated;
                        }
                        
                        console.log('➕ Adding new registration');
                        return [...prev, newReg];
                    });
                });

                setIsLive(true);

                return () => {
                    window.Echo.leave(`event.${event.id}`);
                };
            } catch (e) {
                console.log('Echo not available for real-time updates');
            }
        }
    }, [event.id]);

    const eventTypeLabels: Record<string, string> = {
        lecture: 'Лекція',
        seminar: 'Семінар',
        lab: 'Лабораторна',
        exam: 'Іспит',
    };

    const eventTypeColors: Record<string, string> = {
        lecture: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
        seminar: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
        lab: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300',
        exam: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
    };

    return (
        <AuthenticatedLayout title={event.title}>
            <Head title={event.title} />
            
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <Link href="/events" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-2 inline-block">
                            ← Назад до подій
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{event.title}</h1>
                        <span className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full ${eventTypeColors[event.event_type] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                            {eventTypeLabels[event.event_type] || event.event_type}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <a
                            href={`/api/v1/export/event/${event.id}?format=pdf`}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm"
                            download
                        >
                            📄 PDF
                        </a>
                        <a
                            href={`/api/v1/export/event/${event.id}?format=xlsx`}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm"
                            download
                        >
                            📊 Excel
                        </a>
                        <Link
                            href={`/events/${event.id}/edit`}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                        >
                            Редагувати
                        </Link>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Event Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Деталі події</h2>
                            
                            <dl className="space-y-4">
                                <div className="flex items-start">
                                    <dt className="w-32 text-sm font-medium text-gray-600 dark:text-gray-400">Час:</dt>
                                    <dd className="text-gray-800 dark:text-gray-200">
                                        {new Date(event.start_time).toLocaleString('uk')} - {new Date(event.end_time).toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}
                                    </dd>
                                </div>
                                
                                {event.location && (
                                    <div className="flex items-start">
                                        <dt className="w-32 text-sm font-medium text-gray-600 dark:text-gray-400">Місце:</dt>
                                        <dd className="text-gray-800 dark:text-gray-200">
                                            {event.location.building && `Корпус ${event.location.building}, `}
                                            {event.location.room && `Аудиторія ${event.location.room}`}
                                            {!event.location.building && !event.location.room && 'Не вказано'}
                                        </dd>
                                    </div>
                                )}
                                
                                {event.description && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Опис:</dt>
                                        <dd className="text-gray-800 dark:text-gray-200">{event.description}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                        
                        {/* Registrations / Manual Attendance */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                        Відвідуваність ({registrations.filter((r: any) => r.status === 'present').length}/{allStudents.length})
                                    </h2>
                                    {isLive && (
                                        <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            Live
                                        </span>
                                    )}
                                </div>
                                {canManualAttendance && allStudents.length > 0 && (
                                    <button
                                        onClick={() => setShowManualAttendance(!showManualAttendance)}
                                        className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    >
                                        {showManualAttendance ? 'Приховати' : '✏️ Ручна відмітка'}
                                    </button>
                                )}
                            </div>

                            {/* Manual Attendance Mode */}
                            {showManualAttendance && canManualAttendance && (
                                <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                Оберіть статус:
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full"></span> Присутній</span>
                                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-full"></span> Запізнився</span>
                                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> Поважна</span>
                                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-400 rounded-full"></span> Відсутній</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={markAllPresent}
                                                title="Відмітити всіх студентів як присутніх"
                                                className="px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 rounded hover:bg-green-200 dark:hover:bg-green-900/70 transition-colors"
                                            >
                                                ✓ Всі присутні
                                            </button>
                                            <button
                                                onClick={markAllAbsent}
                                                title="Відмітити всіх студентів як відсутніх"
                                                className="px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 rounded hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
                                            >
                                                ✗ Всі відсутні
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {allStudents.map((student) => {
                                            const status = getStudentStatus(student.id);
                                            const hasChange = attendanceChanges[student.id] !== undefined;
                                            
                                            return (
                                                <div 
                                                    key={student.id} 
                                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                                        status === 'present' 
                                                            ? 'bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700' 
                                                            : status === 'late'
                                                            ? 'bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700'
                                                            : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                                    } ${hasChange ? 'ring-2 ring-blue-400' : ''}`}
                                                    onClick={() => toggleStatus(student.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                                            status === 'present' ? 'bg-green-500' : 
                                                            status === 'late' ? 'bg-amber-500' : 
                                                            status === 'excused' ? 'bg-blue-500' : 'bg-gray-400'
                                                        }`}>
                                                            {status === 'present' ? '✓' : 
                                                             status === 'late' ? '⏰' : 
                                                             status === 'excused' ? '📝' : '✗'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800 dark:text-white">
                                                                {student.profile?.lastname || ''} {student.profile?.firstname || student.full_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{student.group_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => setStatus(student.id, 'present')}
                                                            title="Присутній"
                                                            className={`px-2 py-1 text-xs rounded transition-colors ${status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-green-200 dark:hover:bg-green-800'}`}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            onClick={() => setStatus(student.id, 'late')}
                                                            title="Запізнився"
                                                            className={`px-2 py-1 text-xs rounded transition-colors ${status === 'late' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-amber-200 dark:hover:bg-amber-800'}`}
                                                        >
                                                            ⏰
                                                        </button>
                                                        <button
                                                            onClick={() => setStatus(student.id, 'excused')}
                                                            title="Поважна причина"
                                                            className={`px-2 py-1 text-xs rounded transition-colors ${status === 'excused' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-200 dark:hover:bg-blue-800'}`}
                                                        >
                                                            📝
                                                        </button>
                                                        <button
                                                            onClick={() => setStatus(student.id, 'absent')}
                                                            title="Відсутній"
                                                            className={`px-2 py-1 text-xs rounded transition-colors ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-red-200 dark:hover:bg-red-800'}`}
                                                        >
                                                            ✗
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {Object.keys(attendanceChanges).length > 0 && (
                                        <div className="mt-4 flex justify-end gap-2">
                                            <button
                                                onClick={() => setAttendanceChanges({})}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
                                            >
                                                Скасувати
                                            </button>
                                            <button
                                                onClick={saveAttendance}
                                                disabled={isSaving}
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {isSaving ? 'Зберігається...' : `Зберегти (${Object.keys(attendanceChanges).length})`}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Regular attendance list */}
                            {!showManualAttendance && (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {registrations.length > 0 ? (
                                        registrations.map((reg: any) => (
                                            <div key={reg.id || reg.student_id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        reg.status === 'present' ? 'bg-green-500' :
                                                        reg.status === 'late' ? 'bg-amber-500' :
                                                        reg.status === 'excused' ? 'bg-blue-500' : 'bg-gray-400'
                                                    }`} />
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-white">
                                                            {reg.student?.profile?.lastname || ''} {reg.student?.profile?.firstname || reg.student?.full_name || ''}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{reg.student?.email}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        reg.status === 'present' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                                                        reg.status === 'late' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' :
                                                        reg.status === 'excused' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 
                                                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                        {reg.status === 'present' ? 'Присутній' :
                                                         reg.status === 'late' ? 'Запізнився' :
                                                         reg.status === 'excused' ? 'Поважна' : 'Відсутній'}
                                                    </span>
                                                    {reg.check_in_time && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {new Date(reg.check_in_time).toLocaleTimeString('uk')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            <p>Ще ніхто не відмітився</p>
                                            {canManualAttendance && allStudents.length > 0 && (
                                                <button
                                                    onClick={() => setShowManualAttendance(true)}
                                                    className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Відмітити вручну
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* QR Code & Settings */}
                    <div className="space-y-6">
                        {qrCode && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">QR-код для входу</h2>
                                <div className="flex justify-center bg-white p-4 rounded-lg">
                                    <img 
                                        src={`data:image/svg+xml;base64,${qrCode}`} 
                                        alt="QR Code" 
                                        className="w-48 h-48"
                                    />
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            const modal = document.getElementById('qr-fullscreen-modal');
                                            if (modal) modal.classList.remove('hidden');
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                        Показати на весь екран
                                    </button>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        QR-код дійсний 10 хвилин
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* QR not yet available message */}
                        {!qrCode && qrAvailableAt && event.qr_enabled && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">QR-код для входу</h2>
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                        QR-код буде доступний з
                                    </p>
                                    <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
                                        {qrAvailableAt}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                        (за 2 години до початку)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Fullscreen QR Modal */}
                        {qrCode && (
                            <div 
                                id="qr-fullscreen-modal" 
                                className="hidden fixed inset-0 z-50 bg-black flex items-center justify-center"
                                onClick={(e) => {
                                    if (e.target === e.currentTarget) {
                                        e.currentTarget.classList.add('hidden');
                                    }
                                }}
                            >
                                <div className="text-center p-8">
                                    <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
                                    <p className="text-gray-400 mb-6">Скануйте QR-код для відмітки присутності</p>
                                    <div className="bg-white p-6 rounded-2xl inline-block">
                                        <img 
                                            src={`data:image/svg+xml;base64,${qrCode}`} 
                                            alt="QR Code" 
                                            className="w-72 h-72 md:w-96 md:h-96"
                                        />
                                    </div>
                                    <p className="text-gray-500 mt-4 text-sm">Натисніть будь-де для закриття</p>
                                    <button
                                        onClick={() => {
                                            const modal = document.getElementById('qr-fullscreen-modal');
                                            if (modal) modal.classList.add('hidden');
                                        }}
                                        className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Закрити
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Налаштування</h2>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <dt className="font-medium text-gray-600 dark:text-gray-400">QR-код:</dt>
                                    <dd className={event.qr_enabled ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                        {event.qr_enabled ? 'Увімкнено' : 'Вимкнено'}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="font-medium text-gray-600 dark:text-gray-400">Геолокація:</dt>
                                    <dd className={event.geolocation_required ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                        {event.geolocation_required ? 'Обов\'язкова' : 'Не потрібна'}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="font-medium text-gray-600 dark:text-gray-400">Радіус:</dt>
                                    <dd className="text-gray-800 dark:text-gray-200">{event.allowed_radius || 100} м</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
