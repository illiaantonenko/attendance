import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import QrScanner from '@/Components/QrScanner';

interface CheckInResult {
    success: boolean;
    message: string;
    event?: {
        title: string;
        check_in_time: string;
    };
}

export default function CheckIn() {
    const [result, setResult] = useState<CheckInResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showScanner, setShowScanner] = useState(true);

    const handleScan = async (token: string, location?: GeolocationPosition) => {
        setIsProcessing(true);

        const payload: Record<string, unknown> = { token };
        
        if (location) {
            payload.location = {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            };
        }

        try {
            const response = await fetch('/api/v1/events/check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: 'Відмітка успішно збережена!',
                    event: {
                        title: data.registration?.event_title,
                        check_in_time: data.registration?.check_in_time,
                    },
                });
            } else {
                setResult({
                    success: false,
                    message: data.message || 'Помилка при відмітці',
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message: 'Помилка з\'єднання. Спробуйте знову.',
            });
        }

        setIsProcessing(false);
        setShowScanner(false);
    };

    const resetScanner = () => {
        setResult(null);
        setShowScanner(true);
    };

    return (
        <AuthenticatedLayout title="QR Сканер">
            <Head title="QR Сканер" />

            <div className="max-w-2xl mx-auto">
                <div className="card">
                    <div className="card-header text-center">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Відмітка відвідуваності
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Скануйте QR-код для відмітки присутності
                        </p>
                    </div>

                    <div className="card-body">
                        {isProcessing && (
                            <div className="p-8 text-center">
                                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-slate-500">Обробка...</p>
                            </div>
                        )}

                        {!isProcessing && result && (
                            <div className="p-6 text-center">
                                {result.success ? (
                                    <>
                                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-fade-in">
                                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                            {result.message}
                                        </h3>
                                        {result.event && (
                                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {result.event.title}
                                                </p>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    Час відмітки: {new Date(result.event.check_in_time).toLocaleString('uk')}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-fade-in">
                                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                            Помилка
                                        </h3>
                                        <p className="text-slate-500">{result.message}</p>
                                    </>
                                )}

                                <button
                                    onClick={resetScanner}
                                    className="btn btn-primary mt-6"
                                >
                                    Сканувати знову
                                </button>
                            </div>
                        )}

                        {!isProcessing && !result && showScanner && (
                            <QrScanner
                                onScan={handleScan}
                                requireLocation={true}
                            />
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                        Інструкція:
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        <li>Дозвольте доступ до камери та геолокації</li>
                        <li>Наведіть камеру на QR-код викладача</li>
                        <li>Дочекайтесь підтвердження</li>
                    </ol>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

